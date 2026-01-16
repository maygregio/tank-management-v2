"""
New data detection logic for EIA releases.

Uses HTTP headers (Last-Modified, ETag, Content-Length) and file hashing
to detect when new data is published.
"""

import hashlib
import json
import logging
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Dict, Optional

import requests

from .config import Config, WPSR_FILES, get_config

logger = logging.getLogger(__name__)


@dataclass
class FileMetadata:
    """Metadata for tracking file changes."""
    url: str
    last_modified: Optional[str] = None
    etag: Optional[str] = None
    content_length: Optional[int] = None
    content_hash: Optional[str] = None
    last_checked: Optional[str] = None


class ReleaseDetector:
    """Detects new EIA data releases by monitoring file changes."""

    def __init__(self, config: Optional[Config] = None):
        self.config = config or get_config()
        self._session = None
        self._metadata_cache: Dict[str, FileMetadata] = {}
        self._metadata_file = os.path.join(
            self.config.data_dir, ".eia_metadata_cache.json"
        )
        self._load_metadata_cache()

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

    def _load_metadata_cache(self):
        """Load metadata cache from disk."""
        if os.path.exists(self._metadata_file):
            try:
                with open(self._metadata_file, "r") as f:
                    data = json.load(f)
                    self._metadata_cache = {
                        url: FileMetadata(**meta)
                        for url, meta in data.items()
                    }
                logger.debug(f"Loaded metadata cache with {len(self._metadata_cache)} entries")
            except (json.JSONDecodeError, TypeError) as e:
                logger.warning(f"Failed to load metadata cache: {e}")
                self._metadata_cache = {}

    def _save_metadata_cache(self):
        """Save metadata cache to disk."""
        os.makedirs(os.path.dirname(self._metadata_file), exist_ok=True)
        try:
            data = {
                url: {
                    "url": meta.url,
                    "last_modified": meta.last_modified,
                    "etag": meta.etag,
                    "content_length": meta.content_length,
                    "content_hash": meta.content_hash,
                    "last_checked": meta.last_checked,
                }
                for url, meta in self._metadata_cache.items()
            }
            with open(self._metadata_file, "w") as f:
                json.dump(data, f, indent=2)
        except IOError as e:
            logger.error(f"Failed to save metadata cache: {e}")

    def _get_file_url(self, filename: str) -> str:
        """Get the full URL for a WPSR file."""
        return f"{self.config.wpsr_base_url}/{filename}"

    def check_file_headers(self, url: str) -> FileMetadata:
        """
        Check HTTP headers for a file without downloading it.

        Args:
            url: URL to check

        Returns:
            FileMetadata: Current file metadata
        """
        try:
            response = self.session.head(url, timeout=10)
            response.raise_for_status()

            metadata = FileMetadata(
                url=url,
                last_modified=response.headers.get("Last-Modified"),
                etag=response.headers.get("ETag"),
                content_length=int(response.headers.get("Content-Length", 0)) or None,
                last_checked=datetime.now(timezone.utc).isoformat(),
            )

            logger.debug(
                f"Headers for {url}: "
                f"Last-Modified={metadata.last_modified}, "
                f"ETag={metadata.etag}, "
                f"Content-Length={metadata.content_length}"
            )

            return metadata

        except requests.RequestException as e:
            logger.error(f"Failed to check headers for {url}: {e}")
            return FileMetadata(url=url, last_checked=datetime.now(timezone.utc).isoformat())

    def check_file_hash(self, url: str) -> Optional[str]:
        """
        Download a file and compute its hash.

        Args:
            url: URL to download

        Returns:
            str: SHA256 hash of the file content, or None on error
        """
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()

            content_hash = hashlib.sha256(response.content).hexdigest()
            logger.debug(f"Hash for {url}: {content_hash}")
            return content_hash

        except requests.RequestException as e:
            logger.error(f"Failed to download {url} for hashing: {e}")
            return None

    def has_file_changed(self, url: str, use_hash_fallback: bool = True) -> bool:
        """
        Check if a file has changed since the last check.

        Args:
            url: URL to check
            use_hash_fallback: If True, download and hash if headers are inconclusive

        Returns:
            bool: True if the file has changed or is new
        """
        current_metadata = self.check_file_headers(url)
        cached_metadata = self._metadata_cache.get(url)

        # If no cached metadata, this is a new file
        if cached_metadata is None:
            logger.info(f"No cached metadata for {url} - treating as new")
            return True

        # Check Last-Modified header
        if current_metadata.last_modified and cached_metadata.last_modified:
            if current_metadata.last_modified != cached_metadata.last_modified:
                logger.info(
                    f"Last-Modified changed for {url}: "
                    f"{cached_metadata.last_modified} -> {current_metadata.last_modified}"
                )
                return True

        # Check ETag
        if current_metadata.etag and cached_metadata.etag:
            if current_metadata.etag != cached_metadata.etag:
                logger.info(
                    f"ETag changed for {url}: "
                    f"{cached_metadata.etag} -> {current_metadata.etag}"
                )
                return True

        # Check Content-Length
        if current_metadata.content_length and cached_metadata.content_length:
            if current_metadata.content_length != cached_metadata.content_length:
                logger.info(
                    f"Content-Length changed for {url}: "
                    f"{cached_metadata.content_length} -> {current_metadata.content_length}"
                )
                return True

        # Fallback: Download and hash
        if use_hash_fallback:
            current_hash = self.check_file_hash(url)
            if current_hash and cached_metadata.content_hash:
                if current_hash != cached_metadata.content_hash:
                    logger.info(
                        f"Content hash changed for {url}: "
                        f"{cached_metadata.content_hash[:16]}... -> {current_hash[:16]}..."
                    )
                    return True

        logger.debug(f"No changes detected for {url}")
        return False

    def update_metadata(self, url: str, content_hash: Optional[str] = None):
        """
        Update the cached metadata for a URL.

        Args:
            url: URL to update
            content_hash: Optional content hash to store
        """
        metadata = self.check_file_headers(url)
        if content_hash:
            metadata.content_hash = content_hash
        elif metadata.content_hash is None:
            # Compute hash if not provided
            metadata.content_hash = self.check_file_hash(url)

        self._metadata_cache[url] = metadata
        self._save_metadata_cache()
        logger.debug(f"Updated metadata for {url}")

    def detect_wpsr_release(
        self,
        check_all_files: bool = False,
        primary_file: str = "wpsrsummary.pdf"
    ) -> bool:
        """
        Detect if a new WPSR release is available.

        Args:
            check_all_files: If True, check all WPSR files
            primary_file: Primary file to check (default: wpsrsummary.pdf)

        Returns:
            bool: True if new release detected
        """
        if check_all_files:
            files_to_check = list(WPSR_FILES.values())
        else:
            files_to_check = [primary_file]

        for filename in files_to_check:
            url = self._get_file_url(filename)
            if self.has_file_changed(url):
                logger.info(f"New WPSR release detected via {filename}")
                return True

        return False

    def detect_psm_release(self, api_client=None) -> bool:
        """
        Detect if a new PSM release is available.

        Since PSM doesn't have a fixed URL pattern like WPSR,
        we need to use the API to check for new data.

        Args:
            api_client: EIA API client instance

        Returns:
            bool: True if new release detected
        """
        if api_client is None:
            logger.warning("PSM detection requires API client")
            return False

        # Check for new monthly data via API
        # This will be implemented in conjunction with api_client.py
        return api_client.has_new_monthly_data()

    def get_changed_files(self) -> Dict[str, bool]:
        """
        Check all WPSR files and return which ones have changed.

        Returns:
            Dict[str, bool]: Mapping of filename to changed status
        """
        changed = {}
        for name, filename in WPSR_FILES.items():
            url = self._get_file_url(filename)
            changed[name] = self.has_file_changed(url)
        return changed

    def clear_cache(self):
        """Clear the metadata cache."""
        self._metadata_cache = {}
        if os.path.exists(self._metadata_file):
            os.remove(self._metadata_file)
        logger.info("Metadata cache cleared")

    def close(self):
        """Close the session and save cache."""
        self._save_metadata_cache()
        if self._session:
            self._session.close()
            self._session = None
