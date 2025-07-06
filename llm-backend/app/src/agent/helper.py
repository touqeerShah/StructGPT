from typing import TypedDict, Annotated, List, Union
from pydantic import BaseModel, Field

from langchain_core.agents import AgentAction, AgentFinish
from langchain_core.messages import BaseMessage
from langchain.chains import RetrievalQA


class Struture(BaseModel):
    class_name: str = Field(
        ..., description="class name is generate some as class sturture"
    )
    class_struture: str = Field(
        ..., description="class struture from llm model which user wants"
    )


class AgentState(TypedDict):
    struture: Struture
    fields: List[str]
    keywords: List[str]
    query: str
    answer: List[object]
    feeder: List[str]
    limit: int
    start_page: int
    end_page: int
    total_pages: int
    no_iterate: int
    collection_name: str
    error: bool
    error_message: str
    chat_id: str
    next_step: str
    split_pattern: str
