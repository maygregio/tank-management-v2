import os
from datetime import datetime, timezone
from azure.storage.blob import BlobServiceClient, ContentSettings
from dotenv import load_dotenv

load_dotenv()

BLOB_CONNECTION_STRING = os.getenv("AZURE_BLOB_CONNECTION_STRING")
BLOB_CONTAINER_NAME = os.getenv("AZURE_BLOB_CONTAINER_NAME", "pdf-imports")


class BlobStorageClient:
    """Singleton Azure Blob Storage client."""
    _instance = None
    _client = None
    _container_client = None

    @classmethod
    def get_container_client(cls):
        if cls._container_client is None:
            if not BLOB_CONNECTION_STRING:
                raise ValueError("AZURE_BLOB_CONNECTION_STRING environment variable is not set")
            cls._client = BlobServiceClient.from_connection_string(BLOB_CONNECTION_STRING)
            cls._container_client = cls._client.get_container_client(BLOB_CONTAINER_NAME)
            # Create container if it doesn't exist
            if not cls._container_client.exists():
                cls._container_client.create_container()
        return cls._container_client


class PDFBlobStorage:
    """Service for storing PDF files in Azure Blob Storage."""

    def __init__(self):
        self._container_client = None

    @property
    def container(self):
        if self._container_client is None:
            self._container_client = BlobStorageClient.get_container_client()
        return self._container_client

    def upload_pdf(self, filename: str, content: bytes) -> str:
        """
        Upload a PDF file to blob storage.

        Returns the blob URL.
        """
        # Create a unique blob name with timestamp
        timestamp = datetime.now(timezone.utc).strftime("%Y/%m/%d/%H%M%S")
        blob_name = f"{timestamp}_{filename}"

        blob_client = self.container.get_blob_client(blob_name)
        blob_client.upload_blob(
            content,
            overwrite=True,
            content_settings=ContentSettings(content_type="application/pdf")
        )

        return blob_client.url

    def get_pdf(self, blob_name: str) -> bytes:
        """Download a PDF file from blob storage."""
        blob_client = self.container.get_blob_client(blob_name)
        return blob_client.download_blob().readall()

    def delete_pdf(self, blob_name: str) -> bool:
        """Delete a PDF file from blob storage."""
        try:
            blob_client = self.container.get_blob_client(blob_name)
            blob_client.delete_blob()
            return True
        except Exception:
            return False

    def list_pdfs(self, prefix: str = "") -> list[str]:
        """List all PDF blob names with optional prefix filter."""
        blobs = self.container.list_blobs(name_starts_with=prefix)
        return [blob.name for blob in blobs]
