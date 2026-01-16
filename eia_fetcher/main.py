#!/usr/bin/env python3
"""
EIA Real-Time Data Fetcher - Main Entry Point

A daemon service that fetches EIA Weekly Petroleum Status Report (WPSR)
and Petroleum Supply Monthly (PSM) data as soon as it's published.

Usage:
    python -m eia_fetcher.main [OPTIONS]

Options:
    --once          Run once and exit (don't loop)
    --wpsr          Fetch WPSR data only
    --psm           Fetch PSM data only
    --force         Fetch data immediately without waiting for release window
    --verbose       Enable verbose logging
"""

import argparse
import logging
import signal
import sys
import time
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional

import pytz

from .api_client import EIAAPIClient
from .config import Config, get_config
from .detector import ReleaseDetector
from .fetcher import DataFetcher, FetchResult
from .notifier import Notifier
from .schedule import ReleaseSchedule, ReportType
from .storage import DataStorage

logger = logging.getLogger(__name__)


class EIAFetcher:
    """Main EIA data fetcher daemon."""

    def __init__(self, config: Optional[Config] = None):
        self.config = config or get_config()
        self.schedule = ReleaseSchedule()
        self.detector = ReleaseDetector(self.config)
        self.fetcher = DataFetcher(self.config)
        self.api_client = EIAAPIClient(self.config)
        self.storage = DataStorage(self.config)
        self.notifier = Notifier(self.config)

        self._running = False
        self._setup_logging()

    def _setup_logging(self):
        """Configure logging."""
        log_level = getattr(logging, self.config.log_level.upper(), logging.INFO)

        # Configure root logger
        logging.basicConfig(
            level=log_level,
            format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

        # Add file handler if configured
        if self.config.log_file:
            file_handler = logging.FileHandler(self.config.log_file)
            file_handler.setFormatter(logging.Formatter(
                "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            ))
            logging.getLogger().addHandler(file_handler)

    def _handle_signal(self, signum, frame):
        """Handle shutdown signals."""
        logger.info(f"Received signal {signum}, shutting down...")
        self._running = False

    def fetch_wpsr(self, force: bool = False) -> Dict[str, FetchResult]:
        """
        Fetch WPSR data.

        Args:
            force: If True, fetch immediately without checking for new data

        Returns:
            Dict of fetch results
        """
        logger.info("Starting WPSR fetch...")

        # Check if new data is available (unless forced)
        if not force:
            if not self.detector.detect_wpsr_release():
                logger.info("No new WPSR data detected")
                return {}

        # Fetch all tables
        results = self.fetcher.fetch_all_wpsr_tables(include_excel=False)

        # Save results
        storage_results = self.storage.save_fetch_results(results, "wpsr")

        # Log fetch to database
        for name, result in results.items():
            storage_result = storage_results.get(name)
            self.storage.log_fetch(
                report_type="wpsr",
                table_name=name,
                success=result.success,
                file_path=storage_result.file_path if storage_result else None,
                records=len(result.dataframe) if result.dataframe is not None else 0,
                error=result.error,
            )

        # Update detector metadata for successfully fetched files
        for name, result in results.items():
            if result.success:
                url = f"{self.config.wpsr_base_url}/{result.filename}"
                self.detector.update_metadata(url)

        # Build summary for notification
        summary = self._build_wpsr_summary(results)

        # Send notifications
        if summary:
            files_fetched = [r.filename for r in results.values() if r.success]
            self.notifier.notify_release(ReportType.WPSR, summary, files_fetched)

        successful = sum(1 for r in results.values() if r.success)
        logger.info(f"WPSR fetch complete: {successful}/{len(results)} files")

        return results

    def fetch_psm(self, force: bool = False) -> Dict[str, FetchResult]:
        """
        Fetch PSM data.

        Args:
            force: If True, fetch immediately without checking for new data

        Returns:
            Dict of fetch results
        """
        logger.info("Starting PSM fetch...")

        # Check if new data is available via API (unless forced)
        if not force:
            if not self.api_client.has_new_monthly_data():
                logger.info("No new PSM data detected")
                return {}

        # Fetch PSM data
        results = self.fetcher.fetch_psm_data()

        # Also fetch via API for structured data
        api_results = self.api_client.query(
            endpoint="/petroleum/sum/snd/data",
            frequency="monthly",
            limit=50,
        )

        if api_results.success and api_results.dataframe is not None:
            self.storage.save_dataframe(
                api_results.dataframe,
                "psm_api_data",
                subdir="psm",
            )

        # Save direct fetch results
        storage_results = self.storage.save_fetch_results(results, "psm")

        # Log fetch to database
        for name, result in results.items():
            storage_result = storage_results.get(name)
            self.storage.log_fetch(
                report_type="psm",
                table_name=name,
                success=result.success,
                file_path=storage_result.file_path if storage_result else None,
                records=len(result.dataframe) if result.dataframe is not None else 0,
                error=result.error,
            )

        # Build summary
        summary = {}
        if api_results.success:
            summary["records"] = api_results.total_records
            if api_results.dataframe is not None and len(api_results.dataframe) > 0:
                summary["latest_period"] = api_results.dataframe["period"].max()

        # Send notifications
        if summary:
            files_fetched = [r.filename for r in results.values() if r.success]
            self.notifier.notify_release(ReportType.PSM, summary, files_fetched)

        successful = sum(1 for r in results.values() if r.success)
        logger.info(f"PSM fetch complete: {successful}/{len(results)} files")

        return results

    def _build_wpsr_summary(self, results: Dict[str, FetchResult]) -> Dict[str, any]:
        """Build summary from WPSR fetch results."""
        summary = {}

        # Try to extract key metrics from table1 (balance sheet)
        table1 = results.get("table1")
        if table1 and table1.dataframe is not None:
            df = table1.dataframe
            summary["rows"] = len(df)
            summary["columns"] = len(df.columns)

            # Try to get the latest period
            period = self.fetcher.get_latest_period(df)
            if period:
                summary["latest_period"] = period

        # Count successful fetches
        summary["files_fetched"] = sum(1 for r in results.values() if r.success)
        summary["files_failed"] = sum(1 for r in results.values() if not r.success)

        return summary

    def poll_for_wpsr(self, timeout_minutes: int = 30) -> bool:
        """
        Poll for new WPSR data during release window.

        Args:
            timeout_minutes: Maximum time to poll

        Returns:
            bool: True if new data was detected and fetched
        """
        logger.info(f"Starting WPSR polling (timeout: {timeout_minutes} minutes)...")

        start_time = datetime.now(timezone.utc)
        timeout = timedelta(minutes=timeout_minutes)
        poll_count = 0

        while datetime.now(timezone.utc) - start_time < timeout:
            if not self._running:
                logger.info("Polling stopped due to shutdown signal")
                return False

            poll_count += 1
            logger.debug(f"Poll attempt {poll_count}...")

            if self.detector.detect_wpsr_release():
                logger.info(f"New WPSR data detected on poll {poll_count}")
                self.fetch_wpsr(force=True)
                return True

            time.sleep(self.config.poll_interval_seconds)

        logger.warning(f"WPSR polling timed out after {timeout_minutes} minutes")
        return False

    def poll_for_psm(self, timeout_minutes: int = 60) -> bool:
        """
        Poll for new PSM data during release window.

        Args:
            timeout_minutes: Maximum time to poll

        Returns:
            bool: True if new data was detected and fetched
        """
        logger.info(f"Starting PSM polling (timeout: {timeout_minutes} minutes)...")

        start_time = datetime.now(timezone.utc)
        timeout = timedelta(minutes=timeout_minutes)
        poll_count = 0

        while datetime.now(timezone.utc) - start_time < timeout:
            if not self._running:
                logger.info("Polling stopped due to shutdown signal")
                return False

            poll_count += 1
            logger.debug(f"Poll attempt {poll_count}...")

            if self.api_client.has_new_monthly_data():
                logger.info(f"New PSM data detected on poll {poll_count}")
                self.fetch_psm(force=True)
                return True

            # Poll less frequently for monthly data
            time.sleep(self.config.poll_interval_seconds * 6)  # 30 seconds

        logger.warning(f"PSM polling timed out after {timeout_minutes} minutes")
        return False

    def run_daemon(
        self,
        fetch_wpsr: bool = True,
        fetch_psm: bool = True,
    ):
        """
        Run as a daemon, continuously monitoring for new releases.

        Args:
            fetch_wpsr: Whether to fetch WPSR data
            fetch_psm: Whether to fetch PSM data
        """
        self._running = True

        # Setup signal handlers
        signal.signal(signal.SIGINT, self._handle_signal)
        signal.signal(signal.SIGTERM, self._handle_signal)

        eastern_tz = pytz.timezone("America/New_York")

        logger.info("EIA Fetcher daemon started")
        logger.info(f"Data directory: {self.config.data_dir}")

        if fetch_wpsr:
            logger.info(self.schedule.format_release_info(ReportType.WPSR))
        if fetch_psm:
            logger.info(self.schedule.format_release_info(ReportType.PSM))

        while self._running:
            now = datetime.now(eastern_tz)

            # Check WPSR schedule
            if fetch_wpsr:
                next_wpsr = self.schedule.get_next_wpsr_release()
                start_time, end_time = self.schedule.get_polling_window(
                    next_wpsr,
                    self.config.pre_release_buffer_minutes,
                    self.config.post_release_timeout_minutes,
                )

                if start_time <= now <= end_time:
                    logger.info("Entering WPSR polling window")
                    self.poll_for_wpsr(self.config.post_release_timeout_minutes)
                    # After polling, recalculate next release
                    continue

            # Check PSM schedule
            if fetch_psm:
                next_psm = self.schedule.get_next_psm_release()
                start_time, end_time = self.schedule.get_polling_window(
                    next_psm,
                    self.config.pre_release_buffer_minutes,
                    60,  # PSM has longer timeout
                )

                if start_time <= now <= end_time:
                    logger.info("Entering PSM polling window")
                    self.poll_for_psm(60)
                    continue

            # Calculate sleep time until next polling window
            sleep_seconds = self._calculate_sleep_time(fetch_wpsr, fetch_psm)
            if sleep_seconds > 0:
                logger.info(f"Sleeping for {sleep_seconds / 3600:.1f} hours until next release window")
                # Sleep in chunks to allow for shutdown
                sleep_end = time.time() + sleep_seconds
                while time.time() < sleep_end and self._running:
                    time.sleep(min(60, sleep_end - time.time()))

        logger.info("EIA Fetcher daemon stopped")
        self._cleanup()

    def _calculate_sleep_time(
        self,
        fetch_wpsr: bool,
        fetch_psm: bool,
    ) -> float:
        """Calculate seconds until next polling window."""
        sleep_times = []

        if fetch_wpsr:
            wpsr_seconds = self.schedule.seconds_until_release(ReportType.WPSR)
            # Subtract buffer time
            wpsr_seconds -= self.config.pre_release_buffer_minutes * 60
            if wpsr_seconds > 0:
                sleep_times.append(wpsr_seconds)

        if fetch_psm:
            psm_seconds = self.schedule.seconds_until_release(ReportType.PSM)
            psm_seconds -= self.config.pre_release_buffer_minutes * 60
            if psm_seconds > 0:
                sleep_times.append(psm_seconds)

        return min(sleep_times) if sleep_times else 3600  # Default 1 hour

    def run_once(
        self,
        fetch_wpsr: bool = True,
        fetch_psm: bool = True,
        force: bool = False,
    ):
        """
        Run once and exit.

        Args:
            fetch_wpsr: Whether to fetch WPSR data
            fetch_psm: Whether to fetch PSM data
            force: Whether to force fetch regardless of new data detection
        """
        self._running = True

        try:
            if fetch_wpsr:
                self.fetch_wpsr(force=force)

            if fetch_psm:
                self.fetch_psm(force=force)

        except Exception as e:
            logger.error(f"Error during fetch: {e}")
            self.notifier.notify_error(
                "fetch_error",
                str(e),
                {"fetch_wpsr": fetch_wpsr, "fetch_psm": fetch_psm},
            )
            raise
        finally:
            self._cleanup()

    def _cleanup(self):
        """Clean up resources."""
        self.detector.close()
        self.fetcher.close()
        self.api_client.close()
        self.storage.close()
        self.notifier.close()


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="EIA Real-Time Data Fetcher",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )

    parser.add_argument(
        "--once",
        action="store_true",
        help="Run once and exit (don't run as daemon)",
    )
    parser.add_argument(
        "--wpsr",
        action="store_true",
        help="Fetch WPSR data only",
    )
    parser.add_argument(
        "--psm",
        action="store_true",
        help="Fetch PSM data only",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force fetch without waiting for release window",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose logging",
    )

    args = parser.parse_args()

    # Configure logging level
    config = get_config()
    if args.verbose:
        config.log_level = "DEBUG"

    # Determine which reports to fetch
    fetch_wpsr = args.wpsr or (not args.wpsr and not args.psm)
    fetch_psm = args.psm or (not args.wpsr and not args.psm)

    fetcher = EIAFetcher(config)

    try:
        if args.once:
            fetcher.run_once(
                fetch_wpsr=fetch_wpsr,
                fetch_psm=fetch_psm,
                force=args.force,
            )
        else:
            fetcher.run_daemon(
                fetch_wpsr=fetch_wpsr,
                fetch_psm=fetch_psm,
            )
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
