# Backend API Specification (MVP)

## Conventions
- Base URL: `/api`
- Authentication: Admin endpoints require `Authorization: Bearer <JWT>` header.
- Response envelope: Direct resource serialization without additional wrappers; errors use FastAPI HTTPException JSON.
- Pagination: Query params `page` (default 1) and `page_size` (default 20, max 100). Responses include `items`, `total`, `page`, `page_size`.

## Public Endpoints
### GET `/api/public/vendors`
Returns a list of enabled vendors.
- **Query Parameters**
  - `status` (optional): filter by status (`enabled`/`disabled`).
- **Response** `200 OK`
```json
{
  "items": [
    {
      "id": 1,
      "name": "OpenAI",
      "description": "...",
      "vendor_image": "https://...",
      "url": "https://...",
      "api_url": "https://api...",
      "note": null,
      "status": "enabled"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20
}
```

### GET `/api/public/models`
Fetch models with filtering, searching, and pagination.
- **Query Parameters**
  - `vendor_id`
  - `vendor_name`
  - `model`
  - `vendor_model_id`
  - `description`
  - `min_context_tokens`
  - `max_context_tokens`
  - `capabilities` (comma separated)
  - `price_model`
  - `price_currency`
  - `license`
  - `status`
  - `search` (matches vendor name, model, vendor_model_id, description)
  - `page`, `page_size`
- **Response** `200 OK`
Returns paginated list of models with nested vendor summary.

### GET `/api/public/models/{model_id}`
Retrieve detailed model information including vendor.
- **Response** `200 OK` with object fields matching schema.

## Admin Authentication
### POST `/api/admin/auth/login`
Authenticate administrator credentials.
- **Body**
```json
{ "username": "admin", "password": "secret" }
```
- **Responses**
  - `200 OK`: `{ "access_token": "<jwt>", "token_type": "bearer" }`
  - `401 Unauthorized`: invalid credentials.

### POST `/api/admin/auth/logout`
Invalidate client-side token (stateless; returns 204 for compatibility).

## Admin Vendor Management
### POST `/api/admin/vendors`
Create a vendor.
- **Body**: VendorCreate schema (all fields except id, status default `enabled`).
- **Responses**: `201 Created` with Vendor schema.

### GET `/api/admin/vendors`
List vendors with optional status filter and pagination (same as public but includes disabled entries by default).

### GET `/api/admin/vendors/{vendor_id}`
Retrieve vendor.

### PUT `/api/admin/vendors/{vendor_id}`
Full update vendor (all fields optional via VendorUpdate schema).

### DELETE `/api/admin/vendors/{vendor_id}`
Soft delete (status -> `disabled`) or hard delete? **MVP**: hard delete row.

## Admin Model Management
### POST `/api/admin/models`
Create model entry.

### GET `/api/admin/models`
Admin list with same filters as public but without status restriction.

### GET `/api/admin/models/{model_id}`
Retrieve model detail.

### PUT `/api/admin/models/{model_id}`
Update model (partial update via ModelUpdate schema).

### DELETE `/api/admin/models/{model_id}`
Delete model record.

## Health Check
### GET `/api/health`
Returns `{"status":"ok"}` for monitoring.
