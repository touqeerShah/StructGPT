
from langchain.chains import RetrievalQA


## for run local
from langchain_community.llms import Ollama
from langchain.callbacks.manager import CallbackManager
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain_community.embeddings import GPT4AllEmbeddings
from langchain.schema import Document

### Multiple Query

from langchain.retrievers import EnsembleRetriever

from llama_index.vector_stores.chroma import ChromaVectorStore
from langchain_community.vectorstores import Chroma

import chromadb
from chromadb.config import Settings

from langchain.pydantic_v1 import Extra
from typing import Optional, Sequence
from langchain.callbacks.manager import Callbacks

from langchain.retrievers import (
    MergerRetriever,
)

import os

# import nest_asyncio

# # Apply nest_asyncio
# nest_asyncio.apply()
from dotenv import load_dotenv

# from app.tasks.process_pdf.pdf_generation import (
#     create_title_page,
#     create_toc_slides,
#     create_presentation_from_text,
#     add_thank_you,
# )

load_dotenv()

###
current_file_dir = os.path.dirname(os.path.abspath(__file__))
# AWS



async def send_websocket_message(uri, message):
    async with websockets.connect(uri) as websocket:
        await websocket.send(message)





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
    qa_advanced = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=get_multiple_retriever(collections_name),
        return_source_documents=True,
    )

    return qa_advanced, llm


def get_vector_store(collections_name):
    # get/create a chroma client
    #  for AWS deployment
    chroma_credentials = os.getenv("chromaPassword")

    if not chroma_credentials:
        raise ValueError("CHROMA_CLIENT_AUTH_CREDENTIALS is not set!")
    chroma_host = os.getenv("CHROMA_HOST")

    if not chroma_host:
        raise ValueError("CHROMA_HOST is not set!")

    db = chromadb.HttpClient(
        host=chroma_host,  # "chroma-server.monitoring.svc.cluster.local",
        port=8000,
        settings=Settings(
            chroma_client_auth_provider="chromadb.auth.basic_authn.BasicAuthClientProvider",
            chroma_client_auth_credentials=chroma_credentials,
        ),
    )

    chroma_collection = db.get_or_create_collection(collections_name)
    vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
    vector_store = Chroma(
        embedding_function=embedding,  # Ensure you pass an embedding function
        collection_name=collections_name,
        client=db
    )
    # Local
    # vector_store = Chroma(
    #     embedding_function=embedding,
    #     persist_directory=DB_PATH,
    #     collection_name=collections_name,
    # )
    return vector_store


def get_ensemble_retriever(collections_name):
    # bm25_retriever = BM25Retriever.from_documents([Document("demo", "demo")])
    retrievers = []
    # https://docs.llamaindex.ai/en/stable/module_guides/indexing/vector_store_guide/
    #  used this above link to convert into more inxdex based
    for collection_name in collections_name:
        vectorstore = get_vector_store(collection_name)
        retrievers.append(
            vectorstore.as_retriever(search_kwargs={"k": 10}, search_type="mmr")
        )

    ensemble_retriever = EnsembleRetriever(retrievers=retrievers, weight=[0.5, 0.5])
    return ensemble_retriever


def get_multiple_retriever(collections_name):
    retrievers = []

    for collection_name in collections_name:
        vectorstore = get_vector_store(collection_name)
        retrievers.append(
            vectorstore.as_retriever(search_kwargs={"k": 25}, search_type="mmr")
        )

    ensemble_retriever = MergerRetriever(retrievers=retrievers, weight=[0.7, 0.3])
    return ensemble_retriever


# def get_compression_pipeline(collections_name):
#     reranker = BgeRerank()

#     ensemble_retriever = get_ensemble_retriever(collections_name)
#     redundant_filter = EmbeddingsRedundantFilter(embeddings=embedding)
#     reordering = LongContextReorder()
#     pipeline_compressor = DocumentCompressorPipeline(
#         transformers=[redundant_filter, reordering, reranker]
#     )
#     return ContextualCompressionRetriever(
#         base_compressor=pipeline_compressor, base_retriever=ensemble_retriever
#     )


