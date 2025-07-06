from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "postgresql+asyncpg://admin:yourpassword@localhost/mydatabase"


engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    connect_args={"prepared_statement_cache_size": 0}  # disables cache
)
SessionLocal = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
Base = declarative_base()

async def get_db():
    async with SessionLocal() as session:
        yield session
