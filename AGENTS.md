# Repository Guidelines

## Project Structure & Module Organization

- **Backend**: Python FastAPI application in `backend/`. Source code is in `backend/app/`, with modules for `api`, `core`, `models`, `repositories`, `schemas`, `services`, `tests`, and `utils`. Entry point is `main.py`.
- **Frontend**: Next.js TypeScript app in `frontend/`. Key directories include `app/` for pages, `components/` for UI elements, and `lib/` for utilities.
- **Other**: Configuration files (e.g., `docker-compose.yml`), documentation in `docs/`, scripts in `scripts/`.

## Build, Test, and Development Commands

- **Backend**: Install dependencies with `pip install -r requirements.txt`. Run development server with `uvicorn app.main:app --reload`. Test with `pytest` (coverage via `pytest-cov`).
- **Frontend**: Install with `npm install`. Develop with `npm run dev`, build with `npm run build`, start production with `npm start`. Lint with `npm run lint`.
- **Full Application**: Use `docker-compose up` to run both services locally.

## Coding Style & Naming Conventions

- **Python (Backend)**: Follow PEP8. Use 4-space indentation, type hints, and snake_case for variables/functions. Avoid one-letter variables.
- **TypeScript (Frontend)**: Use 2-space indentation, camelCase for variables/functions, PascalCase for components and types. Leverage TypeScript's strict mode.
- **General**: Use descriptive names. Format code with built-in tools (e.g., `npm run lint` for JS, manual PEP8 adherence for Python).

## Testing Guidelines

- Use `pytest` for backend unit and integration tests.
- Aim for high test coverage; run `pytest --cov=app`.
- Test files in `backend/app/tests/`, named `test_*.py`. Focus on critical paths like API endpoints and services.

## Commit & Pull Request Guidelines

- Use descriptive commit messages (e.g., "Add pagination to models API").
- Create pull requests for changes, linking to issues where applicable.
- Include PR descriptions with changes overview, testing notes, and any UI screenshots if relevant.

## Architecture Overview

This is a full-stack web app for managing model prices, with FastAPI backend for API and data handling, and Next.js frontend for the UI. Database is SQLite for simplicity. Use Docker for local development consistency.
