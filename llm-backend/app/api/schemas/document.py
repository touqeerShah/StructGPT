from pydantic import BaseModel, Field
from typing import List, Optional, Any
import enum
from enum import Enum


class OutputFormat(enum.Enum):
    json = "json"
    csv = "csv"
    xml = "xml"


class ProcessingMode(enum.Enum):
    full = "full"
    keywords = "keywords"
    sections = "sections"


class ExtractField(BaseModel):
    name: str
    description: str
    type: str


class UploadedDocumentCreate(BaseModel):
    chat_id: str
    file_name: str
    file_path: str
    file_size_mb: str
    collection: str
    total_pages: str

    processing_mode: ProcessingMode
    priority: str
    output_format: OutputFormat
    status: str = "uploaded"
    error: bool = False
    error_message: Optional[str] = None

    # Optional fields
    extract_fields: Optional[List[ExtractField]] = []
    description: Optional[str] = ""
    keywords: Optional[List[str]] = []


class AgentStatus(str, Enum):
    firstdraft = "firstdraft"
    under_review = "under_review"
    processing = "processing"
    paused = "paused"
    complete = "complete"
    fail = "fail"


class AgentStateCreate(BaseModel):
    chat_id: str
    user_id: str
    collection_name: str

    struture: Optional[Any] = None
    tables_names: Optional[str] = None
    fields: Optional[List[Any]] = []
    keywords: Optional[List[str]] = []
    query: Optional[str] = None
    answer: Optional[List[Any]] = []
    feeder: Optional[List[Any]] = []

    chunk_size: int = 10
    start_page: int = 1
    end_page: int = 1
    total_pages: int = 0
    no_iterate: int = 0
    progress: float

    error: bool = False
    error_message: Optional[str] = None
    next_step: Optional[str] = None
    split_pattern: Optional[str] = None

    document_chat_id: str
    status: AgentStatus = AgentStatus.firstdraft
