from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from pymongo import MongoClient
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from typing import List

DATABASE_URL = "postgresql+asyncpg://admin:yourpassword@localhost/mydatabase"
MONGO_URL = "mongodb://admin:password@localhost:27017"


engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    connect_args={"prepared_statement_cache_size": 0},  # disables cache
)
SessionLocal = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
Base = declarative_base()


async def get_db():
    async with SessionLocal() as session:
        yield session


async def get_collection_data(collection_name: str, page: int = 1, limit=10):
    client = AsyncIOMotorClient(MONGO_URL)
    db = client["struct_llm"]
    collection = db[collection_name]

    skip = (page - 1) * limit
    cursor = collection.find().skip(skip).limit(limit)

    records = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        records.append(doc)

    total = await collection.count_documents({})

    return {
        "data": records,
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit,
        },
    }


async def fetch_all_documents(collection_name: str):
    client = AsyncIOMotorClient(MONGO_URL)
    db = client["struct_llm"]
    collection = db[collection_name]

    cursor = collection.find()
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])  # Make JSON serializable
        yield doc


async def fetch_selected_documents(collection_name: str, ids: List[str]):
    client = AsyncIOMotorClient(MONGO_URL)
    db = client["struct_llm"]
    collection = db[collection_name]

    object_ids = [ObjectId(id) for id in ids]
    cursor = collection.find({"_id": {"$in": object_ids}})
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        yield doc


