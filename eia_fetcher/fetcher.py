"""
Data download and parsing for EIA reports.

Downloads CSV, XLS, and PDF files from ir.eia.gov and parses them
into structured data formats.
"""

import io
import logging
import os
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional, Union

import pandas as pd
import requests

from .config import Config, WPSR_EXCEL_FILES, WPSR_FILES, get_config

logger = logging.getLogger(__name__)


@dataclass
class FetchResult:
    """Result of a file fetch operation."""
    url: str
    filename: str
    success: bool
    content: Optional[bytes] = None
    dataframe: Optional[pd.DataFrame] = None
    error: Optional[str] = None
    fetch_time: Optional[datetime] = None
    file_size: int = 0


class DataFetcher:
    """Downloads and parses EIA data files."""

    def __init__(self, config: Optional[Config] = None):
        self.config = config or get_config()
        self._session = None

    @property
    def session(self) -> requests.Session:
        """Get or create requests session."""
        if self._session is None:
            self._session = requests.Session()
            self._session.headers.update({
                "User-Agent": self.config.user_agent,
                "Accept": "*/*",
            })
        return self._session

    def _get_wpsr_url(self, filename: str) -> str:
        """Get the full URL for a WPSR file."""
        return f"{self.config.wpsr_base_url}/{filename}"

    def fetch_file(self, url: str, filename: str) -> FetchResult:
        """
        Fetch a single file from the given URL.

        Args:
            url: URL to download
            filename: Name of the file (for result tracking)

        Returns:
            FetchResult: Result containing content or error
        """
        fetch_time = datetime.utcnow()

        try:
            response = self.session.get(url, timeout=60)
            response.raise_for_status()

            result = FetchResult(
                url=url,
                filename=filename,
                success=True,
                content=response.content,
                fetch_time=fetch_time,
                file_size=len(response.content),
            )

            logger.info(f"Successfully fetched {filename} ({result.file_size} bytes)")
            return result

        except requests.RequestException as e:
            logger.error(f"Failed to fetch {url}: {e}")
            return FetchResult(
                url=url,
                filename=filename,
                success=False,
                error=str(e),
                fetch_time=fetch_time,
            )

    def fetch_wpsr_csv(self, table_name: str) -> FetchResult:
        """
        Fetch and parse a WPSR CSV table.

        Args:
            table_name: Name of the table (e.g., "table1", "table2")

        Returns:
            FetchResult: Result with parsed DataFrame
        """
        if table_name not in WPSR_FILES:
            return FetchResult(
                url="",
                filename=table_name,
                success=False,
                error=f"Unknown table: {table_name}",
            )

        filename = WPSR_FILES[table_name]
        url = self._get_wpsr_url(filename)
        result = self.fetch_file(url, filename)

        if result.success and result.content and filename.endswith(".csv"):
            try:
                # Parse CSV content
                df = pd.read_csv(
                    io.BytesIO(result.content),
                    encoding="utf-8",
                    on_bad_lines="warn"
                )
                result.dataframe = df
                logger.debug(f"Parsed {filename}: {len(df)} rows, {len(df.columns)} columns")
            except Exception as e:
                logger.error(f"Failed to parse CSV {filename}: {e}")
                result.error = f"Parse error: {e}"

        return result

    def fetch_wpsr_excel(self, table_name: str) -> FetchResult:
        """
        Fetch and parse a WPSR Excel file.

        Args:
            table_name: Name of the table (e.g., "psw01", "psw02")

        Returns:
            FetchResult: Result with parsed DataFrame
        """
        if table_name not in WPSR_EXCEL_FILES:
            return FetchResult(
                url="",
                filename=table_name,
                success=False,
                error=f"Unknown Excel table: {table_name}",
            )

        filename = WPSR_EXCEL_FILES[table_name]
        url = self._get_wpsr_url(filename)
        result = self.fetch_file(url, filename)

        if result.success and result.content:
            try:
                # Parse Excel content
                df = pd.read_excel(
                    io.BytesIO(result.content),
                    engine="xlrd" if filename.endswith(".xls") else "openpyxl"
                )
                result.dataframe = df
                logger.debug(f"Parsed {filename}: {len(df)} rows, {len(df.columns)} columns")
            except Exception as e:
                logger.error(f"Failed to parse Excel {filename}: {e}")
                result.error = f"Parse error: {e}"

        return result

    def fetch_all_wpsr_tables(
        self,
        include_excel: bool = False
    ) -> Dict[str, FetchResult]:
        """
        Fetch all WPSR CSV tables.

        Args:
            include_excel: If True, also fetch Excel files

        Returns:
            Dict[str, FetchResult]: Results keyed by table name
        """
        results = {}

        # Fetch CSV tables
        for table_name in WPSR_FILES.keys():
            if table_name in ("summary", "overview"):
                # These are PDFs, fetch as binary
                filename = WPSR_FILES[table_name]
                url = self._get_wpsr_url(filename)
                results[table_name] = self.fetch_file(url, filename)
            else:
                results[table_name] = self.fetch_wpsr_csv(table_name)

        # Optionally fetch Excel files
        if include_excel:
            for table_name in WPSR_EXCEL_FILES.keys():
                results[table_name] = self.fetch_wpsr_excel(table_name)

        successful = sum(1 for r in results.values() if r.success)
        logger.info(f"Fetched {successful}/{len(results)} WPSR files successfully")

        return results

    def fetch_psm_data(self) -> Dict[str, FetchResult]:
        """
        Fetch Petroleum Supply Monthly data.

        Returns:
            Dict[str, FetchResult]: Results keyed by data type
        """
        results = {}

        # PSM main page URL
        psm_url = f"{self.config.psm_base_url}/csv/table1.csv"

        result = self.fetch_file(psm_url, "psm_table1.csv")

        if result.success and result.content:
            try:
                df = pd.read_csv(io.BytesIO(result.content), encoding="utf-8")
                result.dataframe = df
            except Exception as e:
                logger.error(f"Failed to parse PSM CSV: {e}")
                result.error = f"Parse error: {e}"

        results["psm_summary"] = result

        return results

    def validate_data(self, df: pd.DataFrame, table_name: str) -> List[str]:
        """
        Validate a parsed DataFrame for common issues.

        Args:
            df: DataFrame to validate
            table_name: Name of the table for error messages

        Returns:
            List[str]: List of validation warnings/errors
        """
        issues = []

        if df.empty:
            issues.append(f"{table_name}: DataFrame is empty")
            return issues

        # Check for mostly empty columns
        for col in df.columns:
            null_pct = df[col].isna().sum() / len(df) * 100
            if null_pct > 90:
                issues.append(f"{table_name}: Column '{col}' is {null_pct:.1f}% null")

        # Check for duplicate rows
        dup_count = df.duplicated().sum()
        if dup_count > 0:
            issues.append(f"{table_name}: {dup_count} duplicate rows found")

        return issues

    def get_latest_period(self, df: pd.DataFrame) -> Optional[str]:
        """
        Extract the latest period from a DataFrame.

        Args:
            df: DataFrame with period/date column

        Returns:
            str: Latest period value or None
        """
        # Common period column names
        period_columns = ["period", "date", "Date", "Period", "Week", "week"]

        for col in period_columns:
            if col in df.columns:
                try:
                    # Try to get the max value
                    return str(df[col].max())
                except Exception:
                    continue

        return None

    def close(self):
        """Close the session."""
        if self._session:
            self._session.close()
            self._session = None
