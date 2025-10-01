# Database Design

## Overview
- Primary storage: SQLite (file `app.db` in Docker volume).
- ORM: SQLModel (Pydantic + SQLAlchemy) for type-safe models and asynchronous-ready migration path.
- Database access uses synchronous engine for MVP; easily switchable to async via SQLModel.

## Entities
### Vendor
| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | Integer | PK, autoincrement | |
| `name` | Text | Unique, not null | Indexed for search. |
| `description` | Text | Nullable | |
| `vendor_image` | Text | Nullable | URL or CDN path. |
| `url` | Text | Nullable | |
| `api_url` | Text | Nullable | |
| `note` | Text | Nullable | |
| `status` | Enum (`enabled`, `disabled`) | Default `enabled` | |
| `created_at` | DateTime | Default now | Added for auditing. |
| `updated_at` | DateTime | Auto-update | |

### Model
| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| `id` | Integer | PK, autoincrement | |
| `vendor_id` | Integer | FK -> vendor.id, not null | Cascade delete `models` when vendor removed. |
| `model` | Text | Not null | Indexed for search. |
| `vendor_model_id` | Text | Nullable | Indexed for search. |
| `description` | Text | Nullable | |
| `model_image` | Text | Nullable | |
| `max_context_tokens` | Integer | Nullable | |
| `max_output_tokens` | Integer | Nullable | |
| `model_capability` | JSON | Nullable | Stored as JSON text. |
| `model_url` | Text | Nullable | |
| `price_model` | Text | Nullable | Enum-like string. |
| `price_currency` | Text | Nullable | Enum-like string. |
| `price_data` | JSON | Nullable | Stored as JSON text. |
| `note` | Text | Nullable | |
| `license` | JSON | Nullable | JSON array text. |
| `status` | Enum (`enabled`, `disabled`, `outdated`) | Default `enabled` | |
| `created_at` | DateTime | Default now | |
| `updated_at` | DateTime | Auto-update | |

## Relationships
- `vendor` 1 - N `model`
- Cascade delete ensures orphan models do not persist if vendor removed.

## Indexing Strategy
- Composite indexes for search: `(vendor_id, status)`, `(model, status)`.
- Partial indexes not supported in SQLite; use covering indexes by including status.

## Data Integrity
- JSON fields validated at application layer to ensure correct schema.
- Enum values enforced via Python `Enum`; stored as strings in DB.

## Migration Strategy
- Use Alembic for versioned migrations stored in `backend/migrations`.
- Initial migration creates both tables and indexes.
- Future migrations add columns (e.g., region pricing) using Alembic autogenerate.

## Seed Data
- Provide optional seed script `scripts/seed.py` to load sample vendors/models from JSON to aid development/demo.
