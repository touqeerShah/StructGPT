# StructGPT

⚡ Project Title:
AutoStruct: Serverless AI Pipeline for Document-to-Structure Transformation

🧩 Problem
In the age of AI, the biggest bottleneck isn’t modeling—it’s formatting. Organizations possess mountains of raw documents (PDFs, scanned text, reports), but turning them into structured data suitable for fine-tuning or analytics remains a manual, error-prone, and slow process. Traditional LLMs can't process large documents efficiently due to context window limitations.

💡 Solution
AutoStruct is a serverless solution that transforms unstructured documents into structured formats using LLMs + AWS Lambda. Users define their desired data structure via prompt, upload documents (PDF, TXT, DOCX), and receive structured outputs like JSON or CSV. Behind the scenes:

Documents are chunked and indexed in a vector store.

User prompts are converted into schemas (classes/fields).

We retrieve relevant content using semantic + keyword search.

LLMs extract data into structured formats, chunk by chunk.

All processing is handled scalably using AWS Lambda.

🛠️ How It Works (Architecture)

[User Uploads PDF/TXT] ──▶ [S3 Bucket]
                             │
                             ▼
           [Metadata + Prompt Saved to DynamoDB]
                             │
                             ▼
              [Trigger Lambda: Process in Chunks]
      │  - Convert file to text                        │
      │  - Group pages semantically                    │
      │  - Use Vector Store for Retrieval (OpenSearch)│
      │  - Extract structured data via Bedrock LLM    │
                             │
                             ▼
                  [Results Saved Back to S3]
                             │
                             ▼
                  [User Downloads Structured File]
⚙️ AWS Services Used
Lambda: Stateless, on-demand, scalable chunk processor

S3: Document and output storage

Bedrock or SageMaker: LLM inference

DynamoDB: Metadata and prompt/schema storage

OpenSearch: Vector and keyword document search

Step Functions (optional): Chunk orchestration

🌍 Impact
Reduces 10,000+ page document processing from days to minutes

Enables non-technical users to define and extract data easily

Accelerates LLM training, enterprise data pipelines, and AI agents

🚀 Why It Wins
Tackles a real, growing pain point in AI adoption

Uses AWS Lambda for its core scalability advantage

Handles documents far beyond traditional LLM context windows

Modular and extensible for future plugins (e.g., auto-schema, summarization)

🧭 2. Next Steps / Demo Suggestions
✅ You Should:
Use a real document (e.g., financial report, clinical trial, or legal doc)

Show user entering a prompt like:

"Extract company name, revenue, and product categories per section."

Show structured JSON output being generated for 3–5 pages.

Show Lambda logs or architecture diagram with event flow.


- first case user fields are define without keywords.
- second case fields with keywords
- keyword without fields
- no fields or keywords.
