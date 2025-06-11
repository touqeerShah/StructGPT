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
    outline_node_aws,
    iterate_outline_node,
    formate_answer_node,
    formate_answer_verifier_node,
    generate_conclusion,
    stream_node,
    summary,
)
from app.api.utils.cache import get_stop_flag, delete_stop_flag


class Report:

    def __init__(self, collection_names, model):
        builder = StateGraph(AgentState)

        # memory = SqliteSaver.from_conn_string(":memory:")
        async def combined_summary_and_formatter(state):
            print("Running summary and formatter in parallel...")

            # Define tasks
            summary_task = summary(state)
            formatter_task = formate_answer_node(state)

            # Run both in parallel
            summary_result, formatted_result = await asyncio.gather(
                summary_task, formatter_task
            )
            # state["scape_formate"] = False
            # print("summary_result : ",summary_result)
            # print("formatted_result : ", formatted_result)
            outline_list = state["outline"].outline if "outline" in state else []

            # You can merge or update state accordingly
            # print("Chat_hitory : ",state["chat_history"])
            if formatted_result is not None:
                if state["chat_history"]:
                    state["chat_history"][-1] = AIMessage(content=formatted_result)
                else:
                    state["chat_history"].append(AIMessage(content=formatted_result))
                state["summary"] = summary_result
                state["scape_formate"] = False
            else:
                state["scape_formate"] = True

            state["no_iterate"] += 1
            if state["no_iterate"] >= len(outline_list):
                state["is_Report_generated"] = True

            return state

        def check_user_abort(state):
            chat_id = f"{state['chat_id']}_{state['user_id']}"
            print("get_stop_flag(chat_id) ", get_stop_flag(chat_id))
            if get_stop_flag(chat_id):
                print(f"User {chat_id} aborted process.")
                return "__end"
            return "continue"

        def outline_check(state):
            is_continue = check_user_abort(state)
            print("is_continue : ", is_continue)
            if is_continue == "continue":
                outline = state.get("outline")
                print(" len(outline.outline) ", len(outline.outline))
                if outline and hasattr(outline, "outline") and len(outline.outline) > 0:
                    return "stream"
                return "__end"
            return is_continue

        def iterate_continue(state):
            # print(state["no_iterate"], "__end", len(state["outline"].topic))
            is_continue = check_user_abort(state)
            if is_continue == "continue":
                if not state["is_Report_generated"]:
                    # print("generate_answer")
                    return "parallel_summary_formatter"
                else:
                    # print("__end")
                    return "conclusion_node"
            return is_continue
        
        

        # builder.add_node("check_user_abort", lambda state: None)  # No-op node

        def formate_verification_continue(state):
            # print(state["no_iterate"], "__end", len(state["outline"].topic))
            is_continue = check_user_abort(state)
            if is_continue == "continue":
                if state["scape_formate"]:
                    state["scape_formate"] = False
                    # print("generate_answer")
                    return "iterate_outline"
                else:
                    # print("__end")
                    return "stream"
            return is_continue

        builder.add_node("outline_node", outline_node_aws)
        builder.add_node("iterate_outline", iterate_outline_node)
        builder.add_node("stream", stream_node)
        builder.add_node("conclusion_node", generate_conclusion)
        builder.add_node("parallel_summary_formatter", combined_summary_and_formatter)
        builder.add_node("formate_answer_verifier", formate_answer_verifier_node)

        builder.set_entry_point("outline_node")

        # Outline branching (start or end)
        builder.add_conditional_edges(
            "outline_node",
            outline_check,
            {
                "__end": END,
                "stream": "stream",
            },
        )

        # Main iteration triggers summary + answer generation
        # builder.add_edge("iterate_outline", "parallel_summary_formatter")

        # formate_answer → verifier → stream
        builder.add_edge("parallel_summary_formatter", "formate_answer_verifier")
        # builder.add_edge("formate_answer_verifier", "stream")
        builder.add_edge("stream", "iterate_outline")

        # stream decides: loop or end
        builder.add_conditional_edges(
            "formate_answer_verifier",
            formate_verification_continue,
            {
                "iterate_outline": "iterate_outline",
                "stream": "stream",
                "__end": END,
            },
        )

        # summary_node also goes to stream (optional if both need merging)
        # (can skip if only verifier triggers stream)

        # stream decides: loop or end
        builder.add_conditional_edges(
            "iterate_outline",
            iterate_continue,
            {
                "parallel_summary_formatter": "parallel_summary_formatter",
                "conclusion_node": "conclusion_node",
                "__end": END,
            },
        )

        builder.add_edge("conclusion_node", END)

        # qa_advanced, llm = get_llm_object(collection_names, model)

        self.graph = builder.compile()
        self.collection_names = collection_names
        self.model = model

    async def report_generater(
        self, state: AgentState, chat_id: str
    ) -> AsyncIterable[str]:
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
            if get_stop_flag(f"{chat_id}_{state['user_id']}"):
                print(f"User {chat_id} aborted process.")
                self.message["status"] = "done"
                delete_stop_flag(f"{chat_id}_{state['user_id']}")
                yield f'data: {{"message": {json.dumps(self.message)}}}\n'
            else:
                delete_stop_flag(f"{chat_id}_{state['user_id']}")

                # source = unique_sources_list
                timestamp = datetime.fromtimestamp(time.time()).strftime(
                    "%Y-%m-%d %H:%M:%S"
                )

