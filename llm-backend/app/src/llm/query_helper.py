## for run local
from langchain_community.llms import Ollama
from langchain.callbacks.manager import CallbackManager
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain_community.embeddings import GPT4AllEmbeddings


import os

# import nest_asyncio

# # Apply nest_asyncio
# nest_asyncio.apply()
from dotenv import load_dotenv
import boto3
from langchain_aws import ChatBedrock, BedrockEmbeddings


load_dotenv()

###
current_file_dir = os.path.dirname(os.path.abspath(__file__))
# AWS


def get_local_embedding():
    print("Get Local Embedding")
    model_name = "all-MiniLM-L6-v2.gguf2.f16.gguf"
    gpt4all_kwargs = {"allow_download": False}
    embeddings = GPT4AllEmbeddings(model_name=model_name, gpt4all_kwargs=gpt4all_kwargs)

    return embeddings


embedding = get_local_embedding()


def get_bed_rock_object():

    bedrock_client = boto3.client(
        service_name="bedrock-runtime",
        region_name="eu-central-1",
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        aws_session_token=os.getenv("AWS_SESSION_TOKEN"),
    )
    return bedrock_client


def get_llm_object(collections_name, model="qwen2.5-coder:14b"):
    bedrock_client = get_bed_rock_object()
    llm = ChatBedrock(
        region_name="eu-central-1",
        client=bedrock_client,
        model_id="anthropic.claude-3-5-sonnet-20240620-v1:0",
        streaming=True,
        # callbacks=[StreamingStdOutCallbackHandler()],
    )

    # for test local with lama and  model
    # llm = Ollama(
    #     model=model,
    #     verbose=True,
    #     callback_manager=CallbackManager([StreamingStdOutCallbackHandler()]),
    # )

    print("Load with LLM with Document ")

    return llm
