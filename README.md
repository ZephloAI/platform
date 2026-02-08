# Website Chatbot SaaS Platform

A multi-tenant SaaS platform that lets users create AI-powered chatbots from any website. Point the bot at a URL, the platform crawls and indexes the content, then users can chat with an AI agent that answers questions using the website's content as its knowledge base.

Built with a microservices architecture: a React frontend, three FastAPI backends, PostgreSQL, Qdrant vector database, and Redis.

---

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend   │────>│     API     │────>│   Crawler   │
│   (React)    │     │  (FastAPI)  │     │  (Crawl4AI) │
│   Port 80    │     │  Port 8000  │     │  Port 8001  │
└─────────────┘     └──────┬──────┘     └──────┬──────┘
                           │                    │
                    ┌──────▼──────┐     ┌──────▼──────┐
                    │ PostgreSQL  │     │   Qdrant    │
                    │  Port 5432  │     │  Port 6333  │
                    └─────────────┘     └──────▲──────┘
                                               │
                    ┌─────────────┐             │
                    │    Agent    │─────────────┘
                    │   (Agno)    │
                    │  Port 8002  │
                    └─────────────┘
```

**Data flow**: The frontend talks to the API. The API orchestrates crawl jobs (via the Crawler service) and chat requests (via the Agent service). The Crawler writes embeddings to Qdrant. The Agent reads from Qdrant to answer questions with RAG.

---

## Services Overview

| Service      | Tech Stack                          | Port  | Description                                        |
|--------------|-------------------------------------|-------|----------------------------------------------------|
| **frontend** | React 18, TypeScript, Vite, Tailwind | 80    | User dashboard for managing chatbots and chatting   |
| **api**      | FastAPI, SQLAlchemy, Alembic, asyncpg | 8000  | Core API: auth, chatbot CRUD, job orchestration     |
| **crawler**  | FastAPI, Crawl4AI, sentence-transformers | 8001  | Crawls websites, chunks content, stores embeddings  |
| **agent**    | FastAPI, Agno, OpenRouter            | 8002  | RAG chat agent using vector search + LLM            |
| **postgres** | PostgreSQL 16                        | 5432  | Stores users, chatbots, crawl jobs, pages           |
| **qdrant**   | Qdrant (latest)                      | 6333  | Vector database for content embeddings              |
| **redis**    | Redis 7                              | 6379  | Caching and job queue (optional)                    |

---

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed
- An [OpenRouter API key](https://openrouter.ai/keys) (free tier works -- the default model is free)

### Steps

```bash
# 1. Clone the repository
git clone <repo-url> && cd website_agent

# 2. Copy the environment file and add your API key
cp .env.example .env
# Edit .env and set OPENROUTER_API_KEY=your-key-here

# 3. Start all services
docker compose up --build

# 4. Run database migrations (in a separate terminal)
docker compose exec api alembic upgrade head

# 5. Open the app
#    Frontend:        http://localhost
#    API docs:        http://localhost:8000/docs
#    Qdrant dashboard: http://localhost:6334
```

To stop everything:

```bash
docker compose down
```

To stop and remove all data volumes:

```bash
docker compose down -v
```

---

## Development Setup

For local development, you can run each service individually outside Docker. The supporting services (Postgres, Qdrant, Redis) still run in Docker.

### Start supporting services only

```bash
docker compose up postgres qdrant redis
```

### API service

```bash
cd api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env     # Uses localhost URLs by default
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Crawler service

```bash
cd crawler
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
crawl4ai-setup           # Install browser dependencies
cp .env.example .env
uvicorn app.main:app --reload --port 8001
```

### Agent service

```bash
cd agent
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env     # Add your OPENROUTER_API_KEY
uvicorn app.main:app --reload --port 8002
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev              # Starts on http://localhost:5173
```

---

## API Endpoints

All API endpoints are served under the API service (port 8000). Interactive docs are available at `http://localhost:8000/docs`.

### Authentication

| Method | Endpoint             | Description          |
|--------|----------------------|----------------------|
| POST   | `/api/auth/register` | Register a new user  |
| POST   | `/api/auth/login`    | Login, returns JWT   |
| GET    | `/api/auth/me`       | Get current user     |

### Chatbots

| Method | Endpoint              | Description                   |
|--------|-----------------------|-------------------------------|
| GET    | `/api/chatbots`       | List user's chatbots          |
| POST   | `/api/chatbots`       | Create a new chatbot          |
| GET    | `/api/chatbots/{id}`  | Get chatbot details           |
| DELETE | `/api/chatbots/{id}`  | Delete a chatbot              |

### Crawl Jobs

| Method | Endpoint                       | Description              |
|--------|--------------------------------|--------------------------|
| POST   | `/api/chatbots/{id}/crawl`     | Start crawling a website |
| GET    | `/api/chatbots/{id}/crawl`     | Get crawl job status     |

### Chat

| Method | Endpoint                       | Description                      |
|--------|--------------------------------|----------------------------------|
| POST   | `/api/chatbots/{id}/chat`      | Send a message, get AI response  |

### Health

| Method | Endpoint   | Description          |
|--------|------------|----------------------|
| GET    | `/health`  | API health check     |

---

## Tech Stack

| Layer       | Technology                              | Purpose                          |
|-------------|-----------------------------------------|----------------------------------|
| Frontend    | React 18, TypeScript, Vite              | SPA framework and build tool     |
| Styling     | Tailwind CSS                            | Utility-first CSS framework      |
| State       | Zustand, TanStack React Query           | Client state and server cache    |
| HTTP Client | Axios                                   | API communication                |
| API Gateway | Nginx                                   | Reverse proxy, SPA routing       |
| Backend     | FastAPI, Pydantic                       | REST API framework               |
| ORM         | SQLAlchemy 2.0 (async)                  | Database access layer            |
| Migrations  | Alembic                                 | Database schema management       |
| Auth        | python-jose, passlib (bcrypt)           | JWT tokens and password hashing  |
| Crawler     | Crawl4AI                                | Website crawling and extraction  |
| Embeddings  | sentence-transformers (all-MiniLM-L6-v2)| Text-to-vector embeddings        |
| Vector DB   | Qdrant                                  | Similarity search                |
| LLM         | Agno + OpenRouter                       | RAG-based chat generation        |
| Database    | PostgreSQL 16                           | Relational data storage          |
| Cache       | Redis 7                                 | Caching and job queue            |
| Containers  | Docker, Docker Compose                  | Service orchestration            |

---

## Project Structure

```
website_agent/
├── docker-compose.yml        # Orchestrates all services
├── .env.example              # Root environment template
├── .gitignore
├── README.md
│
├── api/                      # Core API service
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   │       └── 001_initial.py
│   └── app/
│       ├── main.py           # FastAPI app entry point
│       ├── config.py         # Settings from env vars
│       ├── database.py       # Async SQLAlchemy session
│       ├── dependencies.py   # FastAPI dependency injection
│       ├── models/           # SQLAlchemy ORM models
│       ├── schemas/          # Pydantic request/response schemas
│       ├── routers/          # API route handlers
│       ├── services/         # Business logic layer
│       └── repositories/     # Database query layer
│
├── crawler/                  # Website crawler service
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── main.py           # FastAPI app entry point
│       ├── config.py         # Settings from env vars
│       ├── crawler.py        # Crawl4AI website scraping
│       ├── chunker.py        # Text chunking logic
│       ├── embedder.py       # Embedding generation + Qdrant storage
│       └── routers/          # Crawl API routes
│
├── agent/                    # RAG chat agent service
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── main.py           # FastAPI app entry point
│       ├── config.py         # Settings from env vars
│       └── routers/          # Chat API routes
│
└── frontend/                 # React SPA
    ├── Dockerfile
    ├── nginx.conf            # Nginx config with API proxy
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tailwind.config.js
    ├── index.html
    ├── .env.example
    └── src/
        ├── main.tsx          # App entry point
        ├── App.tsx           # Router setup
        ├── index.css         # Tailwind imports
        ├── api/
        │   └── client.ts     # Axios instance with JWT
        ├── types/
        │   └── index.ts      # TypeScript interfaces
        ├── stores/
        │   └── authStore.ts  # Zustand auth state
        ├── hooks/            # React Query hooks
        ├── components/       # Reusable UI components
        └── pages/            # Route page components
```

---

## Environment Variables

### Root `.env` (used by docker-compose)

| Variable            | Required | Default    | Description                          |
|---------------------|----------|------------|--------------------------------------|
| `OPENROUTER_API_KEY`| Yes      | -          | API key for OpenRouter LLM access    |
| `POSTGRES_USER`     | No       | `postgres` | PostgreSQL username                  |
| `POSTGRES_PASSWORD` | No       | `postgres` | PostgreSQL password                  |
| `POSTGRES_DB`       | No       | `chatbot_saas` | PostgreSQL database name         |
| `JWT_SECRET`        | No       | (set in compose) | Secret key for JWT signing     |
| `MAX_PAGES`         | No       | `50`       | Max pages to crawl per website       |

### API service (`api/.env`)

| Variable              | Default                                                     | Description              |
|-----------------------|-------------------------------------------------------------|--------------------------|
| `DATABASE_URL`        | `postgresql+asyncpg://postgres:postgres@localhost:5432/chatbot_saas` | Database connection |
| `JWT_SECRET`          | `your-secret-key-change-in-production`                      | JWT signing secret       |
| `JWT_ALGORITHM`       | `HS256`                                                     | JWT algorithm            |
| `JWT_EXPIRE_MINUTES`  | `1440`                                                      | Token expiry (24 hours)  |
| `CRAWLER_SERVICE_URL` | `http://localhost:8001`                                     | Crawler service URL      |
| `AGENT_SERVICE_URL`   | `http://localhost:8002`                                     | Agent service URL        |

### Crawler service (`crawler/.env`)

| Variable          | Default              | Description                      |
|-------------------|----------------------|----------------------------------|
| `QDRANT_HOST`     | `localhost`          | Qdrant hostname                  |
| `QDRANT_PORT`     | `6333`               | Qdrant port                      |
| `API_SERVICE_URL` | `http://localhost:8000` | API service URL               |
| `MAX_PAGES`       | `50`                 | Max pages to crawl               |
| `CHUNK_SIZE`      | `500`                | Characters per text chunk        |
| `CHUNK_OVERLAP`   | `50`                 | Overlap between chunks           |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2`  | sentence-transformers model      |

### Agent service (`agent/.env`)

| Variable              | Default                              | Description                  |
|-----------------------|--------------------------------------|------------------------------|
| `QDRANT_HOST`         | `localhost`                          | Qdrant hostname              |
| `QDRANT_PORT`         | `6333`                               | Qdrant port                  |
| `OPENROUTER_API_KEY`  | -                                    | OpenRouter API key           |
| `OPENROUTER_BASE_URL` | `https://openrouter.ai/api/v1`      | OpenRouter base URL          |
| `LLM_MODEL`          | `meta-llama/llama-3.1-8b-instruct:free` | LLM model via OpenRouter |
| `EMBEDDING_MODEL`     | `all-MiniLM-L6-v2`                  | Model for query embeddings   |
| `TOP_K`               | `5`                                  | Chunks to retrieve per query |

### Frontend (`frontend/.env`)

| Variable       | Default                  | Description          |
|----------------|--------------------------|----------------------|
| `VITE_API_URL` | `http://localhost:8000`  | API URL for dev mode |

---

## User Flow

1. **Register / Login** -- Create an account or sign in. The API returns a JWT token that the frontend stores for authenticated requests.

2. **Create a Chatbot** -- Provide a name and the website URL you want your chatbot to know about.

3. **Start Crawling** -- Hit the crawl button. The API sends a request to the Crawler service, which scrapes the website pages, chunks the text, generates embeddings, and stores them in Qdrant.

4. **Wait for Indexing** -- The dashboard shows crawl progress (pages crawled, status). Once the status is `ready`, the chatbot is live.

5. **Chat** -- Open the chat interface and ask questions. The Agent service takes your question, searches Qdrant for relevant content chunks, and sends them as context to the LLM via OpenRouter. The LLM generates an answer grounded in the website's content.

---

## Database Schema

Four tables managed by Alembic migrations:

- **users** -- `id`, `email`, `password_hash`, `created_at`
- **chatbots** -- `id`, `user_id` (FK), `name`, `website_url`, `status`, `created_at`
- **crawl_jobs** -- `id`, `chatbot_id` (FK), `status`, `pages_crawled`, `started_at`, `completed_at`
- **pages** -- `id`, `chatbot_id` (FK), `url`, `title`, `content`, `crawled_at`

---

## Useful Commands

```bash
# View logs for a specific service
docker compose logs -f api

# Rebuild a single service after code changes
docker compose up --build api

# Open a shell inside a running container
docker compose exec api bash

# Run alembic migrations
docker compose exec api alembic upgrade head

# Create a new migration
docker compose exec api alembic revision --autogenerate -m "description"

# Reset the database (destroys data)
docker compose down -v && docker compose up --build

# Check service health
curl http://localhost:8000/health
curl http://localhost:6333/healthz
```

---

## License

This project is for educational and development purposes.
