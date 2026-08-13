# THE SHIPYARD — LangChain First Principles

## Part 0 - Briefing

LangChain is a framework for developing applications powered by language models. It started as a thin wrapper around OpenAI and grew into a massive ecosystem of integrations, parsers, and orchestration tools.

The trap of LangChain is its abstraction. It provides hundreds of "chains" that do magic out of the box. They demo beautifully, but when they break in production, the stack traces are incomprehensible. To master LangChain, you must ignore the magic and understand the primitive components: Prompts, Models, Parsers, and LCEL (LangChain Expression Language).

**The One Rule:** LangChain is just string manipulation and HTTP calls. Do not use its abstractions to hide complexity you don't understand natively.

## Part 1 - The LLM Primitive [DEEP]

### 1.1 The stateless reasoning engine

At its core, an LLM is a stateless reasoning engine. You send it text, it predicts the next tokens, and it forgets you immediately. It is not a database, and it has no persistent memory. LangChain's primary job is to standardize the HTTP requests to these various engines (OpenAI, Anthropic, Google) so you can swap them without rewriting your application logic.

### 1.2 ChatModel vs BaseLLM

In 2022, models took a single string prompt (`BaseLLM`). Modern models (GPT-4, Claude 3) are fine-tuned on conversational data and expect a strict array of structured messages (`BaseChatModel`).

```python
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

# Initialize the standardized wrapper. The actual API call hasn't happened yet.
model = ChatOpenAI(model="gpt-4o", temperature=0)

messages = [
    SystemMessage(content="You are a senior Linux administrator."),
    HumanMessage(content="How do I list open ports?")
]

# The blocking HTTP POST request happens here.
response = model.invoke(messages)
```

Using the legacy `LLM` class for a modern chat model forces LangChain to hack the string into a pseudo-message array, often causing hallucinations. Always use `ChatOpenAI`, `ChatAnthropic`, etc.

### 1.3 The API cost trap

Because `model.invoke()` abstracts away the HTTP request, it's easy to treat it like a local function call. Calling `.invoke()` inside a `for` loop over 1,000 database rows is the fastest way to drain an API budget and trigger rate limits. 

## Part 2 - Prompt Templates [DEEP]

### 2.1 Separation of logic and data

Hardcoding f-strings (`f"Translate this: {user_input}"`) does not scale. It mixes application instructions with untrusted user data, creating severe prompt injection vulnerabilities. Prompt templates separate the two, automatically handling special character escaping.

### 2.2 Constructing message arrays

Just as `ChatModel` replaced `BaseLLM`, `ChatPromptTemplate` replaced the legacy string-based `PromptTemplate`. When you format a `ChatPromptTemplate`, it returns the strict list of `BaseMessage` objects required by modern models.

```python
from langchain_core.prompts import ChatPromptTemplate

# The template defines the structure and the roles
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an expert in {topic}."),
    ("human", "Explain {concept} to a beginner.")
])

# Under the hood, this returns: [SystemMessage(...), HumanMessage(...)]
messages = prompt.format_messages(topic="physics", concept="gravity")
```

### 2.3 The anti-pattern: Control flow in the prompt

A common beginner mistake is asking the LLM to do control flow: *"If the user asks for a refund, say X, otherwise say Y."* 
**Never ask an LLM to do control-flow routing if you can accomplish it with a Python if-statement.** It is slower, more expensive, and non-deterministic.

## Part 3 - Output Parsers [RECOGNIZE]

### 3.1 Bridging unstructured text and structured objects

LLMs return unstructured text. Software applications expect structured data (dictionaries, lists, objects). Output parsers bridge this gap by enforcing schemas. 

### 3.2 The Pydantic Output Parser

The most powerful text-based parser in LangChain uses Pydantic. It performs two critical tasks:
1. It exposes a `.get_format_instructions()` method that generates a massive string (e.g., *"Return your answer as a JSON block with keys X and Y..."*) which you must manually append to your prompt.
2. It takes the raw string returned by the LLM, extracts the JSON block using regex, and validates it against your Pydantic schema.

```python
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field

class Person(BaseModel):
    name: str = Field(description="The person's full name")
    age: int = Field(description="The person's age")

parser = PydanticOutputParser(pydantic_object=Person)

# You MUST inject these instructions into your prompt template manually!
format_instructions = parser.get_format_instructions()
```

### 3.3 The modern shift: Tool Calling

Regex and string-matching parsers are inherently brittle. In modern applications, if the model supports native **Tool Calling** (Function Calling), you should use that instead of a text-based Output Parser. Tool Calling guarantees JSON structure at the API level.

## Part 4 - LCEL (LangChain Expression Language) [DEEP]

### 4.1 The unified Runnable interface

The most critical architectural addition to modern LangChain is LCEL. It forces every component (Prompts, Models, Parsers) to implement a unified `Runnable` interface. This means every component guarantees the same methods: `.invoke()`, `.stream()`, `.batch()`, and their async equivalents.

### 4.2 Composition via the pipe operator

LCEL uses Python's bitwise OR operator (`|`) to chain these runnables together into a `RunnableSequence`.

```python
from langchain_core.output_parsers import StrOutputParser

prompt = ChatPromptTemplate.from_template("Tell me a joke about {topic}")
model = ChatOpenAI()
parser = StrOutputParser() # Extracts just the string content from the AIMessage

# The magic happens here. 
# Under the hood, this overrides __or__ to create a sequential pipeline.
chain = prompt | model | parser

# The dictionary goes to the prompt, the formatted messages go to the model, 
# and the AIMessage goes to the parser.
result = chain.invoke({"topic": "bears"})
```

### 4.3 Streaming for free

Before LCEL, streaming tokens to a UI required complex callback handlers. Because LCEL pipelines are composed of unified Runnables, calling `chain.stream()` automatically creates a generator that yields chunks from the model and passes them sequentially through the parser, without waiting for the full response to finish.

### 4.4 The debuggability trade-off

LCEL is brilliant for linear data flows. However, because it relies on deeply nested internal function calls and generators, the stack traces are notoriously difficult to read. The moment your logic requires complex conditional routing or cyclic loops, drop LCEL and use native Python or LangGraph.

## Part 5 - Chains (Legacy vs LCEL) [REFERENCE]

### 5.1 The dark ages of LangChain

In early LangChain (v0.0.x), the only way to build complex behavior was to use pre-built OOP classes like `LLMChain`, `SequentialChain`, or `ConversationalRetrievalChain`.

### 5.2 Opaque magic

These legacy chains hid the actual prompts inside their source code. They executed opaque "magic" behavior behind the scenes, making it impossible to debug why an LLM returned a bad answer, because you couldn't easily see the exact string that was sent to the API.

<div class="tblwrap"><table>
<thead><tr><th>Legacy Chain</th><th>Modern LCEL Equivalent</th></tr></thead>
<tbody>
<tr><td><code class="inline">LLMChain</code></td><td><code class="inline">prompt | model | parser</code></td></tr>
<tr><td><code class="inline">SequentialChain</code></td><td><code class="inline">chain1 | chain2 | chain3</code></td></tr>
<tr><td><code class="inline">RouterChain</code></td><td><code class="inline">RunnableBranch</code></td></tr>
</tbody>
</table></div>

### 5.3 The rule for modern codebases

Never use legacy subclassed chains in a new project. You only need to recognize them when maintaining older codebases. LCEL makes the data flow explicit, which is exactly what you want when debugging non-deterministic LLMs.

## Part 6 - Memory & State [DEEP]

### 6.1 The illusion of memory

LLMs are purely stateless APIs. If you send "What is my name?", the model has no idea who you are unless you literally include the previous messages ("Hi, my name is Alice") in the current prompt payload. Memory is an illusion created by dynamically expanding the context window payload on every request.

### 6.2 Managing the history store

Internally, a `ChatMessageHistory` object stores messages in RAM or a database. `RunnableWithMessageHistory` intercepts the incoming request, fetches the past messages, appends the new user input, sends the massive array to the LLM, and saves the new response back to the store.

```python
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory

store = {}
def get_session_history(session_id: str):
    if session_id not in store: store[session_id] = ChatMessageHistory()
    return store[session_id]

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful bot."),
    ("placeholder", "{chat_history}"), # The history array gets injected here
    ("human", "{input}")
])

chain = prompt | model
# Acts as middleware for the read/write lifecycle
with_history = RunnableWithMessageHistory(chain, get_session_history)
```

### 6.3 The context window limit

Naively appending every message eventually exceeds the model's context window limit and costs a fortune in API fees per request (since you pay per input token). True state management in production requires explicit summarization pipelines or semantic retrieval to prune the history.

## Part 7 - Document Loaders [RECOGNIZE]

### 7.1 Ingesting unstructured data

To give an LLM context about private company data, you must ingest that data. Loaders standardize the ingestion process across hundreds of file types (PDFs, HTML, Markdown) and APIs (Notion, Slack).

### 7.2 The Document object

Every loader outputs an array of LangChain `Document` objects. A `Document` has exactly two fields:
1. `page_content`: A giant string of raw text.
2. `metadata`: A dictionary of source info (filename, page number, url).

```python
from langchain_community.document_loaders import PyPDFLoader

loader = PyPDFLoader("financial_report_2023.pdf")
docs = loader.load()

print(docs[0].page_content) # The raw text of page 1
print(docs[0].metadata)     # {'source': '...', 'page': 1}
```

### 7.3 Prototyping vs Production

Built-in loaders (like `WebBaseLoader`) are often brittle and lack sanitization (e.g., they grab HTML navbars and footer junk). Use them to prototype. For production, you will inevitably rip them out and write your own robust ingest pipeline.

## Part 8 - Text Splitters [RECOGNIZE]

### 8.1 The context bottleneck

You cannot stuff a 500-page manual into an LLM prompt. You must break it into smaller, bite-sized chunks so they can be individually embedded, searched, and injected into a prompt without hitting the token limit.

### 8.2 Preserving semantic boundaries

Blindly slicing a document exactly every 1000 characters is a terrible strategy—it often cuts a critical sentence or code block in half, rendering the resulting chunk semantically useless.

The `RecursiveCharacterTextSplitter` solves this by respecting natural language boundaries. It tries to split by `\n\n` (paragraphs) first. If a paragraph exceeds the `chunk_size`, it falls back to `\n` (sentences), then spaces (words).

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,   # Prevents a sentence from being orphaned without context
    separators=["\n\n", "\n", " ", ""]
)
chunks = splitter.split_documents(docs)
```

Chunking strategy is the biggest single driver of RAG quality. If the retrieved text chunk doesn't contain the full answer, the LLM cannot magically invent it.

## Part 9 - Vector Stores & Embeddings [DEEP]

### 9.1 Mapping meaning to math

Traditional database search relies on exact keyword matches. If a user asks for "felines", a keyword search won't find a document about "cats". **Embeddings** map semantic meaning into mathematical coordinates (dense arrays of floats). **Vector Stores** index these coordinates for fast similarity search.

### 9.2 The embedding pipeline

1. Text chunks are sent to an embedding API (e.g., OpenAI's `text-embedding-3-small`).
2. The API returns a vector (e.g., an array of 1536 floats).
3. The Vector Store saves this array alongside the text payload.
4. At query time, the user's question is embedded into a vector.
5. The database calculates the Cosine Similarity (the angle between the vectors) to find the closest matches.

```python
from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma

embeddings = OpenAIEmbeddings()
# Under the hood: chunks -> API -> vectors -> saved to DB
vectorstore = Chroma.from_documents(chunks, embeddings)

results = vectorstore.similarity_search("Company revenue?", k=3)
```

### 9.3 The limits of vectors

Embeddings capture semantic similarity, not factual relevance. A query for "2023 Q3 earnings" will pull "2022 Q3 earnings" because the sentence structure is identical. Always use **Hybrid Search** in production—combining Vector Search for concepts with BM25 Keyword Search for exact names and IDs.

## Part 10 - Retrievers [DEEP]

### 10.1 Abstracting the database

Your application chain shouldn't care if data comes from a Vector Store, Wikipedia, or a SQL database. The Retriever interface abstracts the data source away, exposing a single `get_relevant_documents(query)` method.

### 10.2 Advanced retrieval strategies

A naive retriever just wraps `similarity_search`. Advanced retrievers inject logic *before* or *after* the search:
- **MultiQueryRetriever:** Uses an LLM to rewrite the user's query into 3 synonyms, runs 3 searches, and merges the results to overcome poorly phrased questions.
- **ParentDocumentRetriever:** Embeds small chunks for highly accurate search, but returns the larger parent document to the LLM to preserve context.

```python
# Convert a vector store into a standard retriever interface
retriever = vectorstore.as_retriever(search_kwargs={"k": 4})

# Standard RAG LCEL integration
rag_chain = (
    {"context": retriever, "question": RunnablePassthrough()}
    | prompt | model | parser
)
```

### 10.3 "Lost in the Middle" syndrome

Do not return 20 chunks to the LLM. LLMs suffer from attention degradation; stuffing too many chunks into a prompt guarantees the model will ignore the facts located in the center of the text. 

## Part 11 - Tools & Toolkits [RECOGNIZE]

### 11.1 Giving the LLM hands

LLMs are frozen in time and cannot interact with the outside world natively. They cannot check the weather, run a SQL query, or execute code. **Tools** are Python functions that you explicitly authorize the LLM to trigger.

### 11.2 Docstrings are the new system prompts

LangChain uses Python's `inspect` module and Pydantic to parse your function's arguments and docstring, generating a strict JSON Schema. This schema is sent to the LLM. **The LLM literally reads your docstring to figure out when and how to use the tool.** If your docstring is vague, the LLM will fail to call it.

```python
from langchain_core.tools import tool

@tool
def get_weather(city: str) -> str:
    """Returns the current weather in a given city. Use this when the user asks about weather."""
    return f"It is sunny in {city}"

# Bind the JSON schema of the tool to the model
model_with_tools = model.bind_tools([get_weather])
```

### 11.3 The execution loop

If the LLM decides to use a tool, it responds with an `AIMessage` containing a `tool_calls` block. LangChain intercepts this, runs your actual Python function locally, and sends a `ToolMessage` with the result back to the LLM so it can continue reasoning.

## Part 12 - Agents [DEEP]

### 12.1 Dynamic planning vs static chains

Standard LCEL chains are deterministic state machines (Step 1 -> Step 2 -> Step 3). An **Agent** is an LLM running inside a `while` loop, acting as an autonomous reasoning engine. It observes user input, decides which Tools to use, executes them, observes the result, and decides what to do next.

### 12.2 The ReAct loop

Agents rely on the ReAct (Reason + Act) prompting strategy:
1. **Thought:** "I need to find the CEO of Apple."
2. **Action:** `SearchTool("Apple CEO")`
3. **Observation:** "Tim Cook."
4. **Thought:** "Now I need his age."

The `AgentExecutor` manages this while-loop, parsing the LLM's text to execute tools and catching exceptions if the LLM hallucinates a tool name.

```python
from langchain.agents import create_tool_calling_agent, AgentExecutor

agent = create_tool_calling_agent(model, tools, prompt)
# The executor is the while loop that runs the agent and tools
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
```

### 12.3 The production reality

Agents demo incredibly well but often fail in production. They are non-deterministic, prone to infinite loops, and inherently slow. Only use an Agent if the execution path is completely unknown and highly variable. If you know the exact steps of your workflow, write a static LCEL chain.

## Part 13 - Callbacks & Tracing [REFERENCE]

### 13.1 The visibility problem

When chains get deep, debugging via `print()` is impossible. Data flows through complex generators and wrappers. If an Agent returns a bad answer after 15 internal steps, you have no idea *where* it failed.

### 13.2 Hooking into the lifecycle

Every `Runnable` in LangChain accepts a `callbacks` array. When a component starts, it fires `on_chain_start`. When it finishes, it fires `on_llm_end`. Tracers listen to these events.

```python
from langchain.callbacks import ConsoleCallbackHandler

# Prints the exact prompts, token usage, and latencies to the terminal
chain.invoke({"topic": "bears"}, config={"callbacks": [ConsoleCallbackHandler()]})
```

### 13.3 LangSmith

LangSmith is the commercial tracing platform built on top of this callback system. If you aren't logging the exact prompt payload, completion, token count, and latency for every LLM call in production, you are flying blind.

## Part 14 - LangGraph (The Future) [ADVANCED]

### 14.1 Constraining the agent loop

Standard LCEL pipelines are Directed Acyclic Graphs (DAGs)—they cannot loop. Agents *can* loop, but their loops are completely unconstrained and handled by a black-box `AgentExecutor`. LangGraph solves this by letting you explicitly model workflows as state machines where you control exactly how and when loops happen.

### 14.2 Nodes, Edges, and State

In LangGraph, you define **Nodes** (Python functions that receive a global State dictionary, modify it, and return updates) and **Edges** (conditional logic dictating which node runs next). 

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict

class State(TypedDict):
    input: str
    result: str

def node_a(state):
    return {"result": "processed " + state["input"]}

workflow = StateGraph(State)
workflow.add_node("step_1", node_a)
workflow.set_entry_point("step_1")
workflow.add_edge("step_1", END)

app = workflow.compile()
app.invoke({"input": "test"})
```

### 14.3 Human-in-the-loop

Because LangGraph manages state persistence automatically, you can pause execution at any node, wait for human approval (e.g., authorizing a payment), and resume exactly where it left off. LangGraph is the tacit admission that "just let the agent figure it out" does not work in production; real engineering requires explicit state machines.
