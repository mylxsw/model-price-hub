# Model Price Hub - Architecture Overview

## Goals
- Aggregate and expose pricing and capability metadata for large language models across vendors.
- Offer a public catalog experience and an authenticated administration console in a single deployment.
- Provide a modular foundation that can scale from SQLite to larger database engines and from MVP to enterprise features.

## High-Level Architecture
```
+-------------------+      HTTPS      +----------------------+      SQL      +------------------+
| Next.js Frontend  | <-------------> | FastAPI Application | <-----------> | SQLite Database  |
| - Public catalog  |                 | - REST + Auth       |               | via SQLModel ORM |
| - Admin console   |                 | - Background tasks  |               |                  |
+-------------------+                 +----------------------+               +------------------+
          |                                     |                                      |
          |                                     |                                      |
          v                                     v                                      v
 Static assets (S3/CDN optional)     OpenAPI schema / Docs               Future: MySQL/PostgreSQL
```

## Deployment Topology
- **Docker Compose** orchestrates two services: `web` (Next.js) and `api` (FastAPI), both sharing a network.
- A third `db` service hosts SQLite via a mounted volume; later migrations to MySQL/PostgreSQL happen by changing environment variables and DSN.
- Environment configuration handled via `.env` files and build-time secrets.

## Modules & Responsibilities
### Frontend (Next.js / React)
- `app/` directory with route groups for `catalog` (public) and `admin` (protected via NextAuth credentials provider).
- Shared UI component library under `components/` featuring Tailwind-based primitives and data display tables.
- `lib/api` for strongly typed API clients using OpenAPI-generated TypeScript types.

### Backend (FastAPI)
- `app/main.py` bootstraps FastAPI with routers, middleware, exception handlers, and CORS.
- `app/core/` provides configuration, security (JWT), logging utilities, and database session management.
- `app/models/` defines SQLModel ORM entities reflecting `vendor` and `model` tables.
- `app/schemas/` declares Pydantic models for request/response separation.
- `app/api/` organizes routers: `public` for catalog queries, `admin` for CRUD operations.
- `app/services/` encapsulates business logic and search/filter operations.
- `app/tests/` houses pytest unit tests with coverage measurement.

### Database
- SQLModel metadata mirrored in Alembic migration scripts (optional for SQLite; included for future DB portability).
- `repository` pattern ensures database access is abstracted for future engine swapping.

### Authentication & Authorization
- Admin console uses JWT-based session tokens issued by the API; Next.js stores tokens via httpOnly cookies.
- Credentials originate from environment configuration (`ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`).
- Public catalog endpoints remain unauthenticated with rate limiting potential.

## Data Flow
1. User hits catalog page -> Next.js calls `/api/public/models` -> FastAPI queries SQLModel -> returns paginated response.
2. Admin logs in via `/api/admin/auth/login` -> obtains JWT -> Next.js attaches token to subsequent admin requests -> Admin performs CRUD operations.
3. Search & filtering executed server-side with query parameters; results cached client-side via SWR/react-query.

## Non-Functional Requirements
- **Testing**: Pytest with >90% coverage, including service and repository layers using SQLite in-memory DB.
- **Observability**: Structured logging and basic request metrics (Prometheus-ready dependency optional).
- **Security**: Input validation via Pydantic, rate limiting placeholder, CORS restricted to front-end origin.
- **Scalability**: Stateless API enabling horizontal scaling; Next.js SSG/ISR for catalog pages to reduce API load.

## Future Enhancements
- Full-text search integration (e.g., Postgres trigram, Meilisearch).
- Vendor-provided webhook ingestion for automated price updates.
- Multi-language support and localization.
- Role-based admin accounts sourced from DB instead of configuration.
