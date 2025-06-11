import operator
from typing import TypedDict, Annotated, List, Union
from langchain_core.pydantic_v1 import BaseModel, Field
from langchain_community.llms import Ollama
from langchain_aws import ChatBedrock

from langchain_core.agents import AgentAction, AgentFinish
from langchain_core.messages import BaseMessage
from langchain.chains import RetrievalQA


class ToolCall(BaseModel):
    next: str


class DataSets(BaseModel):
    label: str
    data: List[int]
    fill: bool
    borderWidth: int
    borderColor: str
    tension: float


class LineChartData(BaseModel):
    labels: List[str] = Field(..., description="List if all topic for report")
    datasets: DataSets

class TopicPoint(BaseModel):
    topic: str = Field(..., description="Topic for the report")
    points: List[str] = Field(..., description="List of main points related to the topic")

class Outline(BaseModel):
    outline: List[TopicPoint] = Field(..., description="List of topics with their main points")


class Response(BaseModel):
    answer: str = Field(..., description="it will contain response of the llm")
    format_answer: str = Field(
        ..., description="it will contain response final format response"
    )


class Query(BaseModel):
    question: str = Field(..., description=" Quester user ask to llm")
    answer: str = Field(..., description="Response from llm model")


class AgentState(TypedDict):
    topic: str
    query: List[Query]
    response: list[Response]
    no_iterate: int
    current_topic: str
    user_id:str
    outline:Outline
    next_action: str
    conclusion:str
    qa_advanced: RetrievalQA
    db_name: List[str]
    chat_history: list[BaseMessage]
    is_Report_generated:bool
    collection_names: List[str] 
    agent_outcome: Union[AgentAction, AgentFinish, None]
    summary: str
    error:bool
    error_message:str
    chat_id:str
    scape_formate:bool


class SelectedState(BaseModel):
    response: list[Response]
    next_action: str
    is_Report_generated: bool
    outline: Outline


