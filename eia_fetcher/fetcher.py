"""
Data download and parsing for EIA reports.

Downloads CSV, XLS, and PDF files from ir.eia.gov and parses them
into structured data formats.
"""

import io
import logging
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Dict, List, Optional, Union

import pandas as pd
import requests

from .config import (
    Config,
    DNAV_BASE_URL,
    DNAV_MONTHLY_SERIES,
    DNAV_WEEKLY_SERIES,
    PSM_PDF_BASE_URL,
    PSM_TABLES,
    WPSR_EXCEL_FILES,
    WPSR_FILES,
    get_config,
)

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
        fetch_time = datetime.now(timezone.utc)

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

    def fetch_psm_pdf(self, table_name: str) -> FetchResult:
        """
        Fetch a single PSM PDF table.

        Args:
            table_name: Name of the table (e.g., "table1", "table39")

        Returns:
            FetchResult: Result containing PDF content
        """
        if table_name not in PSM_TABLES:
            return FetchResult(
                url="",
                filename=table_name,
                success=False,
                error=f"Unknown PSM table: {table_name}",
            )

        filename = f"{table_name}.pdf"
        url = f"{PSM_PDF_BASE_URL}/{filename}"
        return self.fetch_file(url, filename)

    def fetch_psm_data(
        self,
        tables: Optional[List[str]] = None,
        fetch_all: bool = True
    ) -> Dict[str, FetchResult]:
        """
        Fetch Petroleum Supply Monthly data (all 60 tables as PDFs).

        Note: PSM CSV files have been discontinued by EIA.
        Data is now accessed via PDF tables or the EIA API.

        Args:
            tables: Specific tables to fetch (e.g., ["table1", "table39"])
                   If None and fetch_all=True, fetches all 60 tables
            fetch_all: If True and tables is None, fetch all tables

        Returns:
            Dict[str, FetchResult]: Results keyed by table name
        """
        results = {}

        if tables is not None:
            tables_to_fetch = tables
        elif fetch_all:
            tables_to_fetch = list(PSM_TABLES.keys())
        else:
            # Default: fetch key summary tables only
            tables_to_fetch = [
                "table1",   # U.S. Supply & Disposition
                "table25",  # Crude Oil by PAD District
                "table26",  # Crude Production by State
                "table39",  # Imports by Country
                "table49",  # Exports by PAD District
                "table53",  # Net Imports by Country
                "table55",  # Stocks by PAD District
            ]

        logger.info(f"Fetching {len(tables_to_fetch)} PSM tables...")

        for table_name in tables_to_fetch:
            results[table_name] = self.fetch_psm_pdf(table_name)

        successful = sum(1 for r in results.values() if r.success)
        logger.info(f"Fetched {successful}/{len(results)} PSM PDF tables successfully")

        return results

    def fetch_psm_key_tables(self) -> Dict[str, FetchResult]:
        """
        Fetch only key PSM summary tables (7 tables instead of all 60).

        Returns:
            Dict[str, FetchResult]: Results for key tables
        """
        return self.fetch_psm_data(fetch_all=False)

    # =========================================================================
    # DNAV (Data Navigator) XLS Downloads
    # =========================================================================

    def fetch_dnav_xls(self, series_name: str, weekly: bool = False) -> FetchResult:
        """
        Fetch a DNAV XLS data file (historical time series).

        Args:
            series_name: Name of the series (e.g., "supply_disposition", "stocks_type")
            weekly: If True, fetch from weekly series; if False, from monthly

        Returns:
            FetchResult: Result with parsed DataFrame
        """
        series_dict = DNAV_WEEKLY_SERIES if weekly else DNAV_MONTHLY_SERIES

        if series_name not in series_dict:
            return FetchResult(
                url="",
                filename=series_name,
                success=False,
                error=f"Unknown DNAV series: {series_name}",
            )

        series_info = series_dict[series_name]
        filename = series_info["file"]
        url = f"{DNAV_BASE_URL}/{filename}"

        result = self.fetch_file(url, filename)

        if result.success and result.content:
            try:
                # Parse Excel content
                df = pd.read_excel(
                    io.BytesIO(result.content),
                    engine="xlrd" if filename.endswith(".xls") else "openpyxl"
                )
                result.dataframe = df
                logger.debug(f"Parsed DNAV {filename}: {len(df)} rows, {len(df.columns)} columns")
            except Exception as e:
                logger.error(f"Failed to parse DNAV Excel {filename}: {e}")
                result.error = f"Parse error: {e}"

        return result

    def fetch_all_dnav_monthly(self) -> Dict[str, FetchResult]:
        """
        Fetch all monthly DNAV XLS data series.

        Returns:
            Dict[str, FetchResult]: Results keyed by series name
        """
        results = {}

        logger.info(f"Fetching {len(DNAV_MONTHLY_SERIES)} monthly DNAV series...")

        for series_name in DNAV_MONTHLY_SERIES.keys():
            results[series_name] = self.fetch_dnav_xls(series_name, weekly=False)

        successful = sum(1 for r in results.values() if r.success)
        logger.info(f"Fetched {successful}/{len(results)} DNAV monthly series successfully")

        return results

    def fetch_all_dnav_weekly(self) -> Dict[str, FetchResult]:
        """
        Fetch all weekly DNAV XLS data series.

        Returns:
            Dict[str, FetchResult]: Results keyed by series name
        """
        results = {}

        logger.info(f"Fetching {len(DNAV_WEEKLY_SERIES)} weekly DNAV series...")

        for series_name in DNAV_WEEKLY_SERIES.keys():
            results[series_name] = self.fetch_dnav_xls(series_name, weekly=True)

        successful = sum(1 for r in results.values() if r.success)
        logger.info(f"Fetched {successful}/{len(results)} DNAV weekly series successfully")

        return results

    def fetch_dnav_key_series(self) -> Dict[str, FetchResult]:
        """
        Fetch key monthly DNAV series (subset of most important data).

        Returns:
            Dict[str, FetchResult]: Results for key series
        """
        key_series = [
            "supply_disposition",
            "crude_supply_disposition",
            "crude_production",
            "refinery_utilization",
            "imports_country",
            "exports",
            "stocks_type",
            "product_supplied",
        ]

        results = {}
        for series_name in key_series:
            results[series_name] = self.fetch_dnav_xls(series_name, weekly=False)

        successful = sum(1 for r in results.values() if r.success)
        logger.info(f"Fetched {successful}/{len(results)} key DNAV series successfully")

        return results

    # =========================================================================
    # DNAV HTML Table Scraping (Current Data from Web Pages)
    # =========================================================================

    def fetch_dnav_html_table(
        self,
        page_url: str,
        table_index: Optional[int] = None,
        auto_detect: bool = True,
        clean_dataframe: bool = True
    ) -> FetchResult:
        """
        Fetch and parse an HTML table directly from a DNAV page.

        This gets the current data displayed on the page (recent months)
        without downloading the full historical XLS file.

        Args:
            page_url: Full URL to the DNAV page (e.g.,
                     "https://www.eia.gov/dnav/pet/pet_sum_crdsnd_k_m.htm")
            table_index: Which table to extract. If None and auto_detect=True,
                        automatically finds the main data table.
            auto_detect: If True and table_index is None, automatically detect
                        the main data table (largest table with numeric data).
            clean_dataframe: If True, clean up the dataframe by removing
                            empty/unnamed columns.

        Returns:
            FetchResult: Result with parsed DataFrame
        """
        fetch_time = datetime.now(timezone.utc)
        filename = page_url.split("/")[-1]

        try:
            response = self.session.get(page_url, timeout=30)
            response.raise_for_status()

            # Use pandas to parse HTML tables
            tables = pd.read_html(
                io.StringIO(response.text),
                flavor="lxml"
            )

            if not tables:
                return FetchResult(
                    url=page_url,
                    filename=filename,
                    success=False,
                    error="No tables found on page",
                    fetch_time=fetch_time,
                )

            # Determine which table to use
            if table_index is not None:
                if table_index >= len(tables):
                    return FetchResult(
                        url=page_url,
                        filename=filename,
                        success=False,
                        error=f"Table index {table_index} not found (only {len(tables)} tables)",
                        fetch_time=fetch_time,
                    )
                selected_index = table_index
            elif auto_detect:
                # Auto-detect: find the largest table with numeric data
                selected_index = self._find_data_table(tables)
            else:
                selected_index = 0

            df = tables[selected_index]

            # Clean up the dataframe
            if clean_dataframe:
                df = self._clean_dnav_dataframe(df)

            logger.info(
                f"Parsed HTML table from {filename} (table {selected_index}): "
                f"{len(df)} rows, {len(df.columns)} columns"
            )

            return FetchResult(
                url=page_url,
                filename=filename,
                success=True,
                content=response.content,
                dataframe=df,
                fetch_time=fetch_time,
                file_size=len(response.content),
            )

        except ImportError:
            logger.error("lxml not installed. Install with: pip install lxml")
            return FetchResult(
                url=page_url,
                filename=filename,
                success=False,
                error="lxml not installed for HTML parsing",
                fetch_time=fetch_time,
            )
        except Exception as e:
            logger.error(f"Failed to fetch HTML table from {page_url}: {e}")
            return FetchResult(
                url=page_url,
                filename=filename,
                success=False,
                error=str(e),
                fetch_time=fetch_time,
            )

    def _find_data_table(self, tables: List[pd.DataFrame]) -> int:
        """
        Find the main data table from a list of tables.

        Looks for the table with the most rows that contains numeric data.
        DNAV pages typically have the data table at index 3.

        Args:
            tables: List of DataFrames from pd.read_html()

        Returns:
            int: Index of the best data table
        """
        best_index = 0
        best_score = 0

        for i, df in enumerate(tables):
            if df.empty:
                continue

            # Score based on: rows, columns, and numeric content
            rows = len(df)
            cols = len(df.columns)

            # Count numeric values
            numeric_count = 0
            for col in df.columns:
                try:
                    numeric_count += pd.to_numeric(df[col], errors='coerce').notna().sum()
                except Exception:
                    pass

            # Calculate score (favor tables with more rows and numeric data)
            score = rows * cols + numeric_count * 2

            # Bonus for tables that look like data tables (>10 rows, >3 columns)
            if rows > 10 and cols > 3:
                score *= 2

            if score > best_score:
                best_score = score
                best_index = i

        logger.debug(f"Auto-detected data table at index {best_index}")
        return best_index

    def _clean_dnav_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Clean up a DNAV HTML table dataframe.

        - Flattens multi-level column headers
        - Removes unnamed/empty columns
        - Drops rows that are all NaN
        - Removes 'View History' column

        Args:
            df: DataFrame to clean

        Returns:
            pd.DataFrame: Cleaned DataFrame
        """
        # Flatten multi-level column headers (common in DNAV tables)
        if isinstance(df.columns, pd.MultiIndex):
            # Use the last level of the multi-index (actual column names)
            df.columns = [col[-1] if isinstance(col, tuple) else col for col in df.columns]

        # Remove columns that are all NaN
        df = df.dropna(axis=1, how='all')

        # Remove columns with 'Unnamed' in name
        unnamed_cols = [col for col in df.columns if 'Unnamed' in str(col)]
        if unnamed_cols:
            df = df.drop(columns=unnamed_cols)

        # Remove 'View History' column if present (not useful for data)
        if 'View History' in df.columns:
            df = df.drop(columns=['View History'])

        # Remove rows that are all NaN
        df = df.dropna(how='all')

        # Rename first column if it looks like a label column
        if len(df.columns) > 0:
            first_col = df.columns[0]
            if first_col == 0 or 'Unnamed' in str(first_col):
                df = df.rename(columns={first_col: 'Item'})

        # Reset index
        df = df.reset_index(drop=True)

        return df

    def fetch_dnav_page(self, page_code: str) -> FetchResult:
        """
        Fetch HTML table from a DNAV page using a short code.

        Args:
            page_code: The page code (e.g., "pet_sum_crdsnd_k_m" for crude supply)

        Returns:
            FetchResult: Result with parsed DataFrame
        """
        url = f"https://www.eia.gov/dnav/pet/{page_code}.htm"
        return self.fetch_dnav_html_table(url)

    def fetch_dnav_html_tables(
        self,
        page_codes: Optional[List[str]] = None
    ) -> Dict[str, FetchResult]:
        """
        Fetch HTML tables from multiple DNAV pages.

        Args:
            page_codes: List of page codes to fetch. If None, fetches key pages.

        Returns:
            Dict[str, FetchResult]: Results keyed by page code
        """
        if page_codes is None:
            # Default key pages for monthly data
            page_codes = [
                "pet_sum_snd_d_nus_mbbl_m_cur",      # Supply & Disposition
                "pet_sum_crdsnd_k_m",                 # Crude Oil Supply & Disposition
                "pet_crd_crpdn_adc_mbbl_m",          # Crude Production by State
                "pet_pnp_unc_dcu_nus_m",             # Refinery Utilization
                "pet_move_impcus_a2_nus_ep00_im0_mbbl_m",  # Imports by Country
                "pet_move_exp_dc_NUS-Z00_mbbl_m",    # Exports
                "pet_stoc_typ_d_nus_SAE_mbbl_m",     # Stocks by Type
                "pet_cons_psup_dc_nus_mbbl_m",       # Product Supplied
                "pet_pri_spt_s1_d",                  # Spot Prices
            ]

        results = {}

        logger.info(f"Fetching {len(page_codes)} DNAV HTML tables...")

        for code in page_codes:
            results[code] = self.fetch_dnav_page(code)

        successful = sum(1 for r in results.values() if r.success)
        logger.info(f"Fetched {successful}/{len(results)} DNAV HTML tables successfully")

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
