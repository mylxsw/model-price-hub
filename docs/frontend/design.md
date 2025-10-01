# Frontend Design Document

## Technology Stack
- Next.js 13+ (App Router) with TypeScript.
- Tailwind CSS for styling; DaisyUI for basic components if needed.
- React Query (TanStack Query) for data fetching and caching.
- Zustand for lightweight client-side state (auth token).
- NextAuth credentials provider bridging to FastAPI login endpoint.

## App Structure
```
frontend/
  app/
    layout.tsx
    page.tsx (redirect to /catalog)
    catalog/
      page.tsx (list view)
      [modelId]/page.tsx (detail view)
    admin/
      layout.tsx (auth guard)
      login/page.tsx
      vendors/page.tsx
      models/page.tsx
      vendors/[id]/page.tsx
      models/[id]/page.tsx
  components/
    layout/
      Header.tsx
      Footer.tsx
      Sidebar.tsx
    ui/
      Button.tsx
      Card.tsx
      Badge.tsx
      Table.tsx
      Input.tsx
      Select.tsx
      TagInput.tsx
      Modal.tsx
    catalog/
      ModelFilterPanel.tsx
      ModelList.tsx
      ModelDetail.tsx
    admin/
      VendorForm.tsx
      ModelForm.tsx
  lib/
    apiClient.ts
    auth.ts
    types.ts (generated from OpenAPI)
    hooks/
      useAuth.ts
      useModels.ts
      useVendors.ts
  styles/
    globals.css
```

## Pages & UX
### Catalog List
- Displays filters on left (collapsible on mobile) and results grid/table on right.
- Search input with debounce triggers query updates.
- Model cards show vendor badge, price summary, capabilities chips.

### Model Detail
- Hero section with vendor info, price breakdown (render JSON as readable table).
- Tabs for Overview, Pricing, Capabilities.

### Admin Login
- Centered card with username/password form.
- On success store JWT in httpOnly cookie (via Next.js route handler calling FastAPI) and Zustand state for immediate use.

### Admin Vendors/Models List
- Data tables with CRUD actions (add/edit/delete) using modals or dedicated forms.
- Pagination controls reuse shared component.

### Admin Forms
- Controlled forms with Zod schema validation.
- JSON fields (capabilities, license, price_data) using structured editors (textarea with JSON validation for MVP).

## State Management & Data Fetching
- `apiClient` wraps `fetch` with base URL, attaches JWT from cookies when available.
- React Query handles caching and revalidation.
- `useAuth` hook manages login/logout, reading cookie and refreshing token.

## Routing & Access Control
- `admin/layout.tsx` checks token via server-side function (`cookies()`), redirects to `/admin/login` if missing or invalid (call API to verify if needed).
- Public routes are static/SSR friendly with data fetching via React Query + server components (Next.js `fetch` caching for initial load).

## Styling Guidelines
- Tailwind utility-first design.
- Define color palette in Tailwind config (neutral background, accent color for primary actions).
- Use CSS variables for light/dark theme toggles (optional, but structure ready).

## Testing
- Jest + React Testing Library for critical components (filter panel, forms, data table interactions).
- Cypress (optional) for smoke tests (may skip for MVP due to time, but structure prepared).

## Internationalization
- Use `next-intl` ready but not implemented for MVP. Strings kept in constants for future extraction.

## Accessibility
- Semantic HTML, ARIA for modals and form validations.

## Build & Deployment
- Dockerfile builds Next.js app using multi-stage build (install -> build -> production image with `next start`).
- Environment variables for API base URL and NextAuth secret provided via `.env`.
