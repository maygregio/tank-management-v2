"""
Data persistence for EIA fetched data.

Handles saving data to local CSV files and optionally to SQLite database
for historical tracking.
"""

import logging
import os
import sqlite3
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional

import pandas as pd

from .config import Config, get_config
from .fetcher import FetchResult

logger = logging.getLogger(__name__)


@dataclass
class StorageResult:
    """Result of a storage operation."""
    success: bool
    file_path: Optional[str] = None
    records_written: int = 0
    error: Optional[str] = None


class DataStorage:
    """Handles data persistence for EIA data."""

    def __init__(self, config: Optional[Config] = None):
        self.config = config or get_config()
        self._db_connection: Optional[sqlite3.Connection] = None
        self._ensure_directories()

    def _ensure_directories(self):
        """Create necessary directories."""
        os.makedirs(self.config.data_dir, exist_ok=True)
        os.makedirs(os.path.join(self.config.data_dir, "wpsr"), exist_ok=True)
        os.makedirs(os.path.join(self.config.data_dir, "psm"), exist_ok=True)
        os.makedirs(os.path.join(self.config.data_dir, "api"), exist_ok=True)
        os.makedirs(os.path.join(self.config.data_dir, "raw"), exist_ok=True)

    def _get_timestamp_dir(self, base_dir: str) -> str:
        """Create a timestamped directory for storing data."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        dir_path = os.path.join(self.config.data_dir, base_dir, timestamp)
        os.makedirs(dir_path, exist_ok=True)
        return dir_path

    def save_raw_file(
        self,
        content: bytes,
        filename: str,
        subdir: str = "raw"
    ) -> StorageResult:
        """
        Save raw file content to disk.

        Args:
            content: Raw file content
            filename: Name for the saved file
            subdir: Subdirectory within data_dir

        Returns:
            StorageResult: Result of the operation
        """
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            base_name, ext = os.path.splitext(filename)
            timestamped_name = f"{base_name}_{timestamp}{ext}"

            dir_path = os.path.join(self.config.data_dir, subdir)
            os.makedirs(dir_path, exist_ok=True)

            file_path = os.path.join(dir_path, timestamped_name)

            with open(file_path, "wb") as f:
                f.write(content)

            logger.info(f"Saved raw file: {file_path}")
            return StorageResult(
                success=True,
                file_path=file_path,
                records_written=1,
            )

        except IOError as e:
            logger.error(f"Failed to save raw file {filename}: {e}")
            return StorageResult(
                success=False,
                error=str(e),
            )

    def save_dataframe(
        self,
        df: pd.DataFrame,
        filename: str,
        subdir: str = "wpsr",
        include_timestamp: bool = True,
    ) -> StorageResult:
        """
        Save a DataFrame to CSV.

        Args:
            df: DataFrame to save
            filename: Base filename (without extension)
            subdir: Subdirectory within data_dir
            include_timestamp: Whether to add timestamp to filename

        Returns:
            StorageResult: Result of the operation
        """
        try:
            if include_timestamp:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                csv_filename = f"{filename}_{timestamp}.csv"
            else:
                csv_filename = f"{filename}.csv"

            dir_path = os.path.join(self.config.data_dir, subdir)
            os.makedirs(dir_path, exist_ok=True)

            file_path = os.path.join(dir_path, csv_filename)

            df.to_csv(file_path, index=False)

            logger.info(f"Saved DataFrame: {file_path} ({len(df)} rows)")
            return StorageResult(
                success=True,
                file_path=file_path,
                records_written=len(df),
            )

        except Exception as e:
            logger.error(f"Failed to save DataFrame {filename}: {e}")
            return StorageResult(
                success=False,
                error=str(e),
            )

    def save_fetch_results(
        self,
        results: Dict[str, FetchResult],
        subdir: str = "wpsr"
    ) -> Dict[str, StorageResult]:
        """
        Save multiple fetch results.

        Args:
            results: Dictionary of fetch results
            subdir: Subdirectory for storage

        Returns:
            Dict[str, StorageResult]: Storage results keyed by table name
        """
        storage_results = {}
        timestamp_dir = self._get_timestamp_dir(subdir)

        for name, result in results.items():
            if not result.success:
                storage_results[name] = StorageResult(
                    success=False,
                    error=f"Fetch failed: {result.error}",
                )
                continue

            # Save raw content
            if result.content:
                raw_path = os.path.join(timestamp_dir, result.filename)
                try:
                    with open(raw_path, "wb") as f:
                        f.write(result.content)
                except IOError as e:
                    logger.error(f"Failed to save raw file {name}: {e}")

            # Save DataFrame as CSV
            if result.dataframe is not None:
                csv_filename = f"{name}.csv"
                csv_path = os.path.join(timestamp_dir, csv_filename)
                try:
                    result.dataframe.to_csv(csv_path, index=False)
                    storage_results[name] = StorageResult(
                        success=True,
                        file_path=csv_path,
                        records_written=len(result.dataframe),
                    )
                except Exception as e:
                    storage_results[name] = StorageResult(
                        success=False,
                        error=str(e),
                    )
            else:
                storage_results[name] = StorageResult(
                    success=True,
                    file_path=os.path.join(timestamp_dir, result.filename),
                    records_written=1,
                )

        successful = sum(1 for r in storage_results.values() if r.success)
        logger.info(f"Saved {successful}/{len(storage_results)} files to {timestamp_dir}")

        return storage_results

    def save_to_latest(
        self,
        df: pd.DataFrame,
        filename: str,
        subdir: str = "wpsr"
    ) -> StorageResult:
        """
        Save DataFrame to a 'latest' file (overwrites previous).

        Args:
            df: DataFrame to save
            filename: Base filename
            subdir: Subdirectory within data_dir

        Returns:
            StorageResult: Result of the operation
        """
        return self.save_dataframe(df, filename, subdir, include_timestamp=False)

    # SQLite Database Methods

    def _get_db_connection(self) -> sqlite3.Connection:
        """Get or create database connection."""
        if self._db_connection is None:
            db_path = os.path.join(self.config.data_dir, "eia_data.db")
            self._db_connection = sqlite3.connect(db_path)
            self._init_database()
        return self._db_connection

    def _init_database(self):
        """Initialize database tables."""
        conn = self._db_connection
        cursor = conn.cursor()

        # Table for tracking fetches
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS fetch_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_type TEXT NOT NULL,
                table_name TEXT NOT NULL,
                fetch_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                success BOOLEAN,
                file_path TEXT,
                records INTEGER,
                error TEXT
            )
        """)

        # Table for storing key metrics
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS petroleum_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_type TEXT NOT NULL,
                period TEXT NOT NULL,
                metric_name TEXT NOT NULL,
                value REAL,
                unit TEXT,
                fetch_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(report_type, period, metric_name)
            )
        """)

        conn.commit()
        logger.debug("Database initialized")

    def log_fetch(
        self,
        report_type: str,
        table_name: str,
        success: bool,
        file_path: Optional[str] = None,
        records: int = 0,
        error: Optional[str] = None
    ):
        """
        Log a fetch operation to the database.

        Args:
            report_type: Type of report (wpsr, psm)
            table_name: Name of the table fetched
            success: Whether fetch was successful
            file_path: Path to saved file
            records: Number of records fetched
            error: Error message if failed
        """
        conn = self._get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO fetch_log (report_type, table_name, success, file_path, records, error)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (report_type, table_name, success, file_path, records, error))

        conn.commit()

    def save_metric(
        self,
        report_type: str,
        period: str,
        metric_name: str,
        value: float,
        unit: Optional[str] = None
    ):
        """
        Save a key metric to the database.

        Args:
            report_type: Type of report (wpsr, psm)
            period: Data period
            metric_name: Name of the metric
            value: Metric value
            unit: Unit of measurement
        """
        conn = self._get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT OR REPLACE INTO petroleum_metrics
            (report_type, period, metric_name, value, unit, fetch_time)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (report_type, period, metric_name, value, unit))

        conn.commit()

    def get_fetch_history(
        self,
        report_type: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict]:
        """
        Get fetch history from database.

        Args:
            report_type: Filter by report type
            limit: Maximum records to return

        Returns:
            List of fetch log entries
        """
        conn = self._get_db_connection()
        cursor = conn.cursor()

        if report_type:
            cursor.execute("""
                SELECT * FROM fetch_log
                WHERE report_type = ?
                ORDER BY fetch_time DESC
                LIMIT ?
            """, (report_type, limit))
        else:
            cursor.execute("""
                SELECT * FROM fetch_log
                ORDER BY fetch_time DESC
                LIMIT ?
            """, (limit,))

        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()

        return [dict(zip(columns, row)) for row in rows]

    def get_metric_history(
        self,
        metric_name: str,
        report_type: Optional[str] = None,
        limit: int = 100
    ) -> pd.DataFrame:
        """
        Get historical values for a metric.

        Args:
            metric_name: Name of the metric
            report_type: Filter by report type
            limit: Maximum records to return

        Returns:
            DataFrame with metric history
        """
        conn = self._get_db_connection()

        if report_type:
            query = """
                SELECT * FROM petroleum_metrics
                WHERE metric_name = ? AND report_type = ?
                ORDER BY period DESC
                LIMIT ?
            """
            return pd.read_sql_query(query, conn, params=(metric_name, report_type, limit))
        else:
            query = """
                SELECT * FROM petroleum_metrics
                WHERE metric_name = ?
                ORDER BY period DESC
                LIMIT ?
            """
            return pd.read_sql_query(query, conn, params=(metric_name, limit))

    def close(self):
        """Close database connection."""
        if self._db_connection:
            self._db_connection.close()
            self._db_connection = None
