from fastapi.encoders import jsonable_encoder
from app.src.agent.helper import AgentState
from langgraph.graph import END, StateGraph
from typing import AsyncIterable
import time
import json
from datetime import datetime
from langchain_core.messages import AIMessage
import asyncio

# from langgraph.checkpoint.sqlite import SqliteSaver
from app.src.agent.graph_nodes import (
    generate_struture,
    feed_data,
    extract_structured_data_from_feeder,
    stream_node,
)
from app.api.utils.cache import get_stop_flag, delete_stop_flag


class Fromater:

    def __init__(self, collection_names, model):
        builder = StateGraph(AgentState)

        def iterate_continue(state):
            # print(state["no_iterate"], "__end", len(state["outline"].topic))
            if state["start_page"] >= state["total_pages"]:
                # print("generate_answer")
                return "__end"
            else:
                # print("__end")
                return "feed_data_node"

        # builder.add_node("check_user_abort", lambda state: None)  # No-op node

        def formate_verification_continue(state):
            print(" = = = = > ",len(state["feeder"]))
            if state["error"] or len(state["feeder"]) == 0:
                return "__end"
            else:
                return "extract_structured_data_from_feeder_node"

        builder.add_node("generate_struture_node", generate_struture)
        builder.add_node("feed_data_node", feed_data)
        builder.add_node("stream", stream_node)
        builder.add_node(
            "extract_structured_data_from_feeder_node",
            extract_structured_data_from_feeder,
        )

        builder.set_entry_point("generate_struture_node")

        # formate_answer → verifier → stream
        builder.add_edge("generate_struture_node", "feed_data_node")
        # builder.add_edge("formate_answer_verifier", "stream")
        builder.add_edge("extract_structured_data_from_feeder_node", "stream")

        # stream decides: loop or end
        builder.add_conditional_edges(
            "feed_data_node",
            formate_verification_continue,
            {
                "extract_structured_data_from_feeder_node": "extract_structured_data_from_feeder_node",
                "__end": END,
            },
        )

        # summary_node also goes to stream (optional if both need merging)
        # (can skip if only verifier triggers stream)

        # stream decides: loop or end
        builder.add_conditional_edges(
            "stream",
            iterate_continue,
            {
                "feed_data_node": "feed_data_node",
                "__end": END,
            },
        )



        self.graph = builder.compile()
        self.collection_names = collection_names
        self.model = model

    async def generater(self, state: AgentState, chat_id: str) -> AsyncIterable[str]:
        try:

            self.answer = ""
            self.message = {
                "chat_id": chat_id,
                "message": f"Report is start generating",
                "answer": "",
                "status": "pending",
                "type": "report",
                "source": [],
            }
            # print("self.collection_names ",self.collection_names)
            state["collection_names"] = self.collection_names
            state["chat_id"] = chat_id
            # print("self.state ",state)

            thread = {"configurable": {"thread_id": chat_id}, "recursion_limit": 250}

            async for event, chunk in self.graph.astream(
                state, thread, stream_mode=["updates"]
            ):
                try:
                    # print("s_serializable",chunk)
                    s_serializable = jsonable_encoder(chunk)
                    self.message["answer"] = s_serializable
                    self.message["status"] = "processing"
                    yield f'data: {{"message": {json.dumps(self.message)}}}\n'
                except Exception as e:
                    print("Error ", e)
                    self.message["error"] = True
                    self.message["error_message"] = e
                    self.message["status"] = "done"
                    # self.message["source"] = unique_sources_list
                    yield f'data: {{"message": {json.dumps(self.message)}}}\n'
                    print(f"Client disconnected during report generation: {chat_id}")
                    return  # Exit early to stop processing
            self.message["answer"] = self.message["answer"]
            self.message["status"] = "done"
            # self.message["source"] = unique_sources_list
            yield f'data: {{"message": {json.dumps(self.message)}}}\n'
        except KeyError as e:
            print(f"Caught exception: {e}")
            self.message["error"] = True
            self.message["error_message"] = e
            yield f'data: {{"message": {json.dumps(self.message)}}}\n'

        finally:
            print("done !")
            if get_stop_flag(f"{chat_id}"):
                print(f"User {chat_id} aborted process.")
                self.message["status"] = "done"
                delete_stop_flag(f"{chat_id}")
                yield f'data: {{"message": {json.dumps(self.message)}}}\n'
            else:
                delete_stop_flag(f"{chat_id}")

                # source = unique_sources_list
                timestamp = datetime.fromtimestamp(time.time()).strftime(
                    "%Y-%m-%d %H:%M:%S"
                )

               
