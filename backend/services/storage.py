import os
import logging
from datetime import datetime, date, timezone
from typing import TypeVar, Generic, Type, Any
from pydantic import BaseModel
from azure.cosmos import CosmosClient, PartitionKey
from azure.cosmos.exceptions import CosmosResourceNotFoundError
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

# Cosmos DB configuration
COSMOS_CONNECTION_STRING = os.getenv("COSMOS_CONNECTION_STRING")
COSMOS_DATABASE_NAME = os.getenv("COSMOS_DATABASE_NAME", "tank-management")


def serialize_for_cosmos(obj):
    """Convert Python objects to Cosmos DB compatible format."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, date):
        return obj.isoformat()
    return obj


def serialize_dict(data: dict) -> dict:
    """Recursively serialize a dictionary for Cosmos DB."""
    result = {}
    for key, value in data.items():
        if isinstance(value, (datetime, date)):
            result[key] = value.isoformat()
        elif isinstance(value, dict):
            result[key] = serialize_dict(value)
        else:
            result[key] = value
    return result


class CosmosDBClient:
    """Singleton Cosmos DB client."""
    _instance = None
    _client = None
    _database = None

    @classmethod
    def get_database(cls):
        if cls._database is None:
            if not COSMOS_CONNECTION_STRING:
                raise ValueError("COSMOS_CONNECTION_STRING environment variable is not set")
            cls._client = CosmosClient.from_connection_string(COSMOS_CONNECTION_STRING)
            # Use shared throughput at database level (free tier: 1000 RU/s max)
            cls._database = cls._client.create_database_if_not_exists(
                id=COSMOS_DATABASE_NAME,
                offer_throughput=400  # Shared across all containers
            )
        return cls._database


class CosmosStorage(Generic[T]):
    def __init__(self, container_name: str, model_class: Type[T]):
        self.container_name = container_name
        self.model_class = model_class
        self._container = None

    @property
    def container(self):
        if self._container is None:
            database = CosmosDBClient.get_database()
            self._container = database.create_container_if_not_exists(
                id=self.container_name,
                partition_key=PartitionKey(path="/id"),
                offer_throughput=400
            )
        return self._container

    def get_all(self, skip: int = 0, limit: int | None = None) -> list[T]:
        """Get all items from the container with optional pagination."""
        query = "SELECT * FROM c"
        if limit is not None:
            query = f"SELECT * FROM c OFFSET {skip} LIMIT {limit}"
        items = list(self.container.query_items(query=query, enable_cross_partition_query=True))
        logger.debug(f"Retrieved {len(items)} items from {self.container_name}")
        return [self.model_class.model_validate(item) for item in items]

    def count(self) -> int:
        """Get total count of items in the container."""
        query = "SELECT VALUE COUNT(1) FROM c"
        result = list(self.container.query_items(query=query, enable_cross_partition_query=True))
        return result[0] if result else 0

    def get_by_id(self, id: str) -> T | None:
        """Get a single item by ID."""
        try:
            item = self.container.read_item(item=id, partition_key=id)
            return self.model_class.model_validate(item)
        except CosmosResourceNotFoundError:
            return None

    def create(self, item: T) -> T:
        """Create a new item."""
        data = serialize_dict(item.model_dump())
        self.container.create_item(body=data)
        return item

    def update(self, id: str, updates: dict) -> T | None:
        """Update an existing item."""
        try:
            existing = self.container.read_item(item=id, partition_key=id)
            # Filter out None values from updates
            filtered_updates = {k: v for k, v in updates.items() if v is not None}
            # Serialize date/datetime values
            filtered_updates = serialize_dict(filtered_updates)
            existing.update(filtered_updates)
            updated = self.container.replace_item(item=id, body=existing)
            return self.model_class.model_validate(updated)
        except CosmosResourceNotFoundError:
            return None

    def delete(self, id: str) -> bool:
        """Delete an item by ID."""
        try:
            self.container.delete_item(item=id, partition_key=id)
            return True
        except CosmosResourceNotFoundError:
            return False

    def filter(
        self,
        skip: int = 0,
        limit: int | None = None,
        order_by: str | None = None,
        order_desc: bool = False,
        **kwargs
    ) -> list[T]:
        """Filter items by field values using Cosmos DB query."""
        conditions = []
        parameters: list[dict[str, Any]] = []

        for key, value in kwargs.items():
            if value is None:
                conditions.append(f"IS_NULL(c.{key})")
            else:
                param_name = f"@{key}"
                conditions.append(f"c.{key} = {param_name}")
                # Handle date serialization
                if isinstance(value, (datetime, date)):
                    parameters.append({"name": param_name, "value": value.isoformat()})
                else:
                    parameters.append({"name": param_name, "value": value})

        where_clause = " AND ".join(conditions) if conditions else "1=1"
        query = f"SELECT * FROM c WHERE {where_clause}"

        if order_by:
            direction = "DESC" if order_desc else "ASC"
            query += f" ORDER BY c.{order_by} {direction}"

        if limit is not None:
            query += f" OFFSET {skip} LIMIT {limit}"

        logger.debug(f"Executing query: {query} with params: {parameters}")
        items = list(self.container.query_items(
            query=query,
            parameters=parameters if parameters else None,
            enable_cross_partition_query=True
        ))
        return [self.model_class.model_validate(item) for item in items]

    def query(
        self,
        conditions: list[str],
        parameters: list[dict[str, Any]] | None = None,
        skip: int = 0,
        limit: int | None = None,
        order_by: str | None = None,
        order_desc: bool = False
    ) -> list[T]:
        """Execute a custom query with conditions."""
        where_clause = " AND ".join(conditions) if conditions else "1=1"
        query = f"SELECT * FROM c WHERE {where_clause}"

        if order_by:
            direction = "DESC" if order_desc else "ASC"
            query += f" ORDER BY c.{order_by} {direction}"

        if limit is not None:
            query += f" OFFSET {skip} LIMIT {limit}"

        logger.debug(f"Executing custom query: {query}")
        items = list(self.container.query_items(
            query=query,
            parameters=parameters,
            enable_cross_partition_query=True
        ))
        return [self.model_class.model_validate(item) for item in items]


# Alias for backward compatibility
Storage = CosmosStorage
