# Backend Module Design

## Directory Structure
```
backend/
  app/
    __init__.py
    main.py
    core/
      config.py
      security.py
      database.py
      logging.py
    models/
      base.py
      vendor.py
      model.py
    schemas/
      vendor.py
      model.py
      auth.py
      common.py
    repositories/
      base.py
      vendor_repository.py
      model_repository.py
    services/
      auth_service.py
      vendor_service.py
      model_service.py
      search_service.py
    api/
      deps.py
      routers/
        public.py
        admin_auth.py
        admin_vendors.py
        admin_models.py
    utils/
      pagination.py
      filters.py
    tests/
      conftest.py
      test_auth.py
      test_vendor.py
      test_model.py
      test_search.py
```

## Core Components
### `core.config`
- Load environment variables using Pydantic `BaseSettings`.
- Provide settings for database URL, JWT secret, admin credentials, CORS origins.

### `core.database`
- Manage SQLModel engine and session creation.
- Provide `get_session` dependency.
- Include helper to create all tables for SQLite.

### `core.security`
- Password hashing via `passlib`.
- JWT encoding/decoding utilities (HS256).
- Token payload includes `sub`, `exp`, `type`.

### Models & Schemas
- SQLModel entities defined in `models/` with metadata.
- Pydantic schemas separated into `Base`, `Create`, `Update`, `Read` variants for vendors and models.
- Common pagination response schemas defined once.

### Repositories
- `BaseRepository` with CRUD helpers (get, list, create, update, delete).
- `VendorRepository` and `ModelRepository` implement query building for filters, search, and pagination.

### Services
- `AuthService` validates admin credentials, issues tokens, verifies tokens for dependencies.
- `VendorService` orchestrates repository calls, handles business rules (e.g., prevent deletion when models exist?).
- `ModelService` handles JSON field validation, ensures vendor existence.
- `SearchService` centralizes filter parsing for models (context range, capabilities, license arrays, price model/currency).

### API Routers
- `public` router merges `/public/vendors` and `/public/models` endpoints.
- `admin_auth` router exposes login/logout endpoints.
- `admin_vendors` router provides CRUD endpoints with dependency on `get_current_admin`.
- `admin_models` router provides CRUD and filter endpoints.

### Utilities
- `pagination` to unify pagination response structure and metadata.
- `filters` to parse comma-separated lists and JSON search logic.

### Tests
- `conftest` configures in-memory SQLite, dependency overrides, and fixtures for sample data.
- Tests cover services and routers using FastAPI `TestClient` with authenticated contexts.
- Coverage target 90% achieved by testing edge cases: validation errors, filtering logic, authentication.
