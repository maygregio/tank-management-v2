"""
EIA API v2 client for structured data access.

Provides backup/supplementary data fetching when ir.eia.gov polling
is not sufficient or for additional data series.
"""

import json
import logging
import os
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional

import pandas as pd
import requests

from .config import Config, get_config

logger = logging.getLogger(__name__)


@dataclass
class APIResponse:
    """Response from an EIA API call."""
    success: bool
    data: Optional[List[Dict[str, Any]]] = None
    dataframe: Optional[pd.DataFrame] = None
    total_records: int = 0
    request_url: str = ""
    error: Optional[str] = None
    response_time_ms: float = 0


class EIAAPIClient:
    """Client for EIA API v2."""

    def __init__(self, config: Optional[Config] = None):
        self.config = config or get_config()
        self._session = None
        self._last_period_cache: Dict[str, str] = {}
        self._cache_file = os.path.join(
            self.config.data_dir, ".eia_api_period_cache.json"
        )
        self._load_period_cache()

    @property
    def session(self) -> requests.Session:
        """Get or create requests session."""
        if self._session is None:
            self._session = requests.Session()
            self._session.headers.update({
                "User-Agent": self.config.user_agent,
                "Accept": "application/json",
            })
        return self._session

    def _load_period_cache(self):
        """Load period cache from disk."""
        if os.path.exists(self._cache_file):
            try:
                with open(self._cache_file, "r") as f:
                    self._last_period_cache = json.load(f)
                logger.debug(f"Loaded period cache with {len(self._last_period_cache)} entries")
            except (json.JSONDecodeError, IOError) as e:
                logger.warning(f"Failed to load period cache: {e}")
                self._last_period_cache = {}

    def _save_period_cache(self):
        """Save period cache to disk."""
        os.makedirs(os.path.dirname(self._cache_file), exist_ok=True)
        try:
            with open(self._cache_file, "w") as f:
                json.dump(self._last_period_cache, f, indent=2)
        except IOError as e:
            logger.error(f"Failed to save period cache: {e}")

    def _build_url(self, endpoint: str, params: Dict[str, Any]) -> str:
        """Build the full API URL with parameters."""
        base_url = f"{self.config.eia_api_base_url}{endpoint}"

        # Add API key
        params["api_key"] = self.config.eia_api_key

        # Build query string
        query_parts = []
        for key, value in params.items():
            if isinstance(value, list):
                for i, v in enumerate(value):
                    if isinstance(v, dict):
                        for k2, v2 in v.items():
                            query_parts.append(f"{key}[{i}][{k2}]={v2}")
                    else:
                        query_parts.append(f"{key}[{i}]={v}")
            else:
                query_parts.append(f"{key}={value}")

        return f"{base_url}?{'&'.join(query_parts)}"

    def query(
        self,
        endpoint: str,
        frequency: str = "weekly",
        data_columns: Optional[List[str]] = None,
        sort_by: str = "period",
        sort_direction: str = "desc",
        limit: int = 100,
        facets: Optional[Dict[str, List[str]]] = None,
    ) -> APIResponse:
        """
        Query the EIA API v2.

        Args:
            endpoint: API endpoint path
            frequency: Data frequency (weekly, monthly, annual)
            data_columns: List of data columns to retrieve
            sort_by: Column to sort by
            sort_direction: Sort direction (asc, desc)
            limit: Maximum number of records
            facets: Filter facets

        Returns:
            APIResponse: Query result
        """
        if not self.config.eia_api_key:
            return APIResponse(
                success=False,
                error="EIA API key not configured. Set EIA_API_KEY environment variable.",
            )

        params = {
            "frequency": frequency,
            "data": data_columns or ["value"],
            "sort": [{"column": sort_by, "direction": sort_direction}],
            "length": limit,
        }

        if facets:
            params["facets"] = facets

        url = self._build_url(endpoint, params)
        logger.debug(f"Querying EIA API: {url[:100]}...")

        start_time = datetime.now()
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()

            elapsed_ms = (datetime.now() - start_time).total_seconds() * 1000
            result = response.json()

            if "response" not in result:
                return APIResponse(
                    success=False,
                    error=f"Unexpected API response format: {list(result.keys())}",
                    request_url=url,
                    response_time_ms=elapsed_ms,
                )

            data = result["response"].get("data", [])
            total = result["response"].get("total", len(data))

            # Convert to DataFrame
            df = pd.DataFrame(data) if data else None

            return APIResponse(
                success=True,
                data=data,
                dataframe=df,
                total_records=total,
                request_url=url,
                response_time_ms=elapsed_ms,
            )

        except requests.RequestException as e:
            elapsed_ms = (datetime.now() - start_time).total_seconds() * 1000
            logger.error(f"API request failed: {e}")
            return APIResponse(
                success=False,
                error=str(e),
                request_url=url,
                response_time_ms=elapsed_ms,
            )

    def get_weekly_crude_stocks(self, limit: int = 10) -> APIResponse:
        """
        Get weekly crude oil stocks data.

        Args:
            limit: Number of records to retrieve

        Returns:
            APIResponse: Query result
        """
        return self.query(
            endpoint="/petroleum/stoc/wstk/data",
            frequency="weekly",
            data_columns=["value"],
            limit=limit,
            facets={"product": ["EPC0"]},  # Crude oil
        )

    def get_weekly_gasoline_stocks(self, limit: int = 10) -> APIResponse:
        """
        Get weekly motor gasoline stocks data.

        Args:
            limit: Number of records to retrieve

        Returns:
            APIResponse: Query result
        """
        return self.query(
            endpoint="/petroleum/stoc/wstk/data",
            frequency="weekly",
            data_columns=["value"],
            limit=limit,
            facets={"product": ["EPM0"]},  # Motor gasoline
        )

    def get_weekly_distillate_stocks(self, limit: int = 10) -> APIResponse:
        """
        Get weekly distillate fuel oil stocks data.

        Args:
            limit: Number of records to retrieve

        Returns:
            APIResponse: Query result
        """
        return self.query(
            endpoint="/petroleum/stoc/wstk/data",
            frequency="weekly",
            data_columns=["value"],
            limit=limit,
            facets={"product": ["EPD0"]},  # Distillate fuel oil
        )

    def get_latest_period(self, endpoint: str, frequency: str = "weekly") -> Optional[str]:
        """
        Get the latest period available for an endpoint.

        Args:
            endpoint: API endpoint path
            frequency: Data frequency

        Returns:
            str: Latest period value or None
        """
        response = self.query(
            endpoint=endpoint,
            frequency=frequency,
            limit=1,
        )

        if response.success and response.data:
            return response.data[0].get("period")

        return None

    def has_new_weekly_data(self, endpoint: str = "/petroleum/stoc/wstk/data") -> bool:
        """
        Check if new weekly data is available.

        Args:
            endpoint: API endpoint to check

        Returns:
            bool: True if new data is available
        """
        cache_key = f"{endpoint}:weekly"
        current_period = self.get_latest_period(endpoint, "weekly")

        if current_period is None:
            logger.warning(f"Could not get latest period for {endpoint}")
            return False

        cached_period = self._last_period_cache.get(cache_key)

        if cached_period is None:
            logger.info(f"No cached period for {cache_key} - treating as new")
            self._last_period_cache[cache_key] = current_period
            self._save_period_cache()
            return True

        if current_period != cached_period:
            logger.info(f"New data detected for {cache_key}: {cached_period} -> {current_period}")
            self._last_period_cache[cache_key] = current_period
            self._save_period_cache()
            return True

        logger.debug(f"No new data for {cache_key} (current: {current_period})")
        return False

    def has_new_monthly_data(self, endpoint: str = "/petroleum/sum/snd/data") -> bool:
        """
        Check if new monthly data is available.

        Args:
            endpoint: API endpoint to check

        Returns:
            bool: True if new data is available
        """
        cache_key = f"{endpoint}:monthly"
        current_period = self.get_latest_period(endpoint, "monthly")

        if current_period is None:
            logger.warning(f"Could not get latest period for {endpoint}")
            return False

        cached_period = self._last_period_cache.get(cache_key)

        if cached_period is None:
            logger.info(f"No cached period for {cache_key} - treating as new")
            self._last_period_cache[cache_key] = current_period
            self._save_period_cache()
            return True

        if current_period != cached_period:
            logger.info(f"New data detected for {cache_key}: {cached_period} -> {current_period}")
            self._last_period_cache[cache_key] = current_period
            self._save_period_cache()
            return True

        logger.debug(f"No new data for {cache_key} (current: {current_period})")
        return False

    def get_all_weekly_stocks(self) -> Dict[str, APIResponse]:
        """
        Get all weekly petroleum stock data.

        Returns:
            Dict[str, APIResponse]: Results keyed by product type
        """
        return {
            "crude": self.get_weekly_crude_stocks(),
            "gasoline": self.get_weekly_gasoline_stocks(),
            "distillate": self.get_weekly_distillate_stocks(),
        }

    def close(self):
        """Close the session and save cache."""
        self._save_period_cache()
        if self._session:
            self._session.close()
            self._session = None
