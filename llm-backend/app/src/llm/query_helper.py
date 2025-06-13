
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






def get_llm_object(collections_name, model=""):
    # bedrock_client = get_bed_rock_object()
    # llm = ChatBedrock(
    #     region_name=AWS_DEFAULT_REGION,
    #     client=bedrock_client,
    #     model_id=AWS_MODEL_ID,
    #     streaming=True,
    #     # callbacks=[StreamingStdOutCallbackHandler()],
    # )

    # for test local with lama and  model
    llm = Ollama(
        model=model,
        verbose=True,
        callback_manager=CallbackManager([StreamingStdOutCallbackHandler()]),
    )

    print("Load with LLM with Document ")
   

    return  llm

