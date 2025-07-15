from sqlalchemy import (
    Column,
    String,
    Integer,
    DateTime,
    Boolean,
    Text,
    JSON,
    Enum,
    ForeignKey,
    FLOAT,
)

from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
import enum
from pydantic import BaseModel


# from enum import Enum as PyEnum
from sqlalchemy.dialects.postgresql import ENUM as PGEnum

Base = declarative_base()


class OutputFormat(enum.Enum):
    json = "json"
    csv = "csv"
    xml = "xml"


class ProcessingMode(enum.Enum):
    full = "full"
    keywords = "keywords"
    sections = "sections"


class UploadedDocument(Base):
    __tablename__ = "uploaded_documents"

    # id = Column(String, primary_key=True)  # UUID
    chat_id = Column(String, primary_key=True)  # SSE stream ID

    user_id = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size_mb = Column(String)
    collection = Column(String)
    total_pages = Column(String)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Extraction Configuration
    processing_mode = Column(
        Enum(ProcessingMode, name="processingmode"), nullable=False
    )
    priority = Column(String, default="Normal")  # Or map to a `Priority` table
    keywords = Column(JSON, default=[])  # List of keywords (for keyword-based mode)
    output_format = Column(Enum(OutputFormat), default=OutputFormat.json)
    description = Column(Text)

    # Field structure: list of objects with name, description, type
    extract_fields = Column(JSON, default=[])
    error = Column(Boolean, default=False)
    error_message = Column(Text, nullable=True)
    # Optional processing status
    status = Column(String, default="uploaded")  # uploaded, processing, complete, error


class AgentStatus(enum.Enum):
    firstdraft = "firstdraft"
    under_review = "under_review"
    processing = "processing"
    paused = "paused"
    complete = "complete"
    fail = "fail"


class AgentState(Base):
    __tablename__ = "agent_states"

    chat_id = Column(String, primary_key=True)
    user_id = Column(String, nullable=False)
    collection_name = Column(String, nullable=False)

    struture = Column(JSON, nullable=True)
    tables_names = Column(String, default="")
    fields = Column(JSON, default=[])
    keywords = Column(JSON, default=[])
    query = Column(Text, nullable=True)
    answer = Column(JSON, default=[])
    feeder = Column(JSON, default=[])
    chunk_size = Column(Integer, default=10)
    start_page = Column(Integer, default=1)
    end_page = Column(Integer, default=1)
    total_pages = Column(Integer, default=0)
    no_iterate = Column(Integer, default=0)

    error = Column(Boolean, default=False)
    error_message = Column(Text, nullable=True)
    next_step = Column(String, nullable=True)
    split_pattern = Column(String, nullable=True)
    progress = Column(FLOAT, default=0)
    start_time = Column(FLOAT, default=0)
    process_time = Column(FLOAT, default=0)
    memory_usage = Column(FLOAT, default=0)
    cpu_usage = Column(FLOAT, default=0)

    document_chat_id = Column(
        String, ForeignKey("uploaded_documents.chat_id"), nullable=False
    )
    status = Column(
        PGEnum(AgentStatus, name="agent_status"), default=AgentStatus.firstdraft
    )

class RetriggerPayload(BaseModel):
    chat_id: str
    status: AgentStatus