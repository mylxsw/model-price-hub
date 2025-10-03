#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
fetch-provider-openrouter.py

Usage:
  - Fetch and save models to openrouter.models.json (default):
      python scripts/fetch-provider-openrouter.py

  - Import from a saved JSON file into the project's model database:
      python scripts/fetch-provider-openrouter.py --import openrouter.models.json

  - Import with a specific database file (path or URL), e.g. sqlite file at backend/app.db:
      python scripts/fetch-provider-openrouter.py --import openrouter.models.json --database backend/app.db

Notes:
  - Imports will ensure a vendor named "OpenRouter" exists (create if missing).
  - Pricing from OpenRouter is converted to per-1M-token pricing when available.
"""

import argparse
import json
import os
import sys
from datetime import datetime
from typing import Any, Dict, List, Optional
from urllib.request import urlopen, Request

# Ensure project root is on sys.path so we can import backend modules
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, os.pardir))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)


OPENROUTER_MODELS_URL = "https://openrouter.ai/api/frontend/models"
DEFAULT_OUTPUT = "openrouter.models.json"
DEFAULT_VENDOR_NAME = "OpenRouter"


def http_get_json(url: str) -> Dict[str, Any]:
    req = Request(url, headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"})
    with urlopen(req) as resp:  # nosec - trusted URL provided by user
        charset = resp.headers.get_content_charset() or "utf-8"
        data = resp.read().decode(charset)
        return json.loads(data)


def save_json(path: str, data: Any) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def load_json(path: str) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def to_float(value: Any) -> Optional[float]:
    try:
        if value is None:
            return None
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str) and value.strip() != "":
            return float(value.strip())
    except (TypeError, ValueError):
        return None
    return None


def compute_price(pricing: Dict[str, Any]) -> tuple[Optional[str], Optional[str], Optional[dict]]:
    """Map OpenRouter pricing into our project's price_model/currency/price_data.

    - If prompt or completion price per token is present, treat as token pricing
      and scale to per-1M tokens (input_token_1m/output_token_1m).
    - Else if request price is present, treat as call pricing (price_per_call).
    - Currency assumed USD unless specified otherwise.
    """
    if not isinstance(pricing, dict):
        return None, None, None

    prompt = to_float(pricing.get("prompt"))
    completion = to_float(pricing.get("completion"))
    request_price = to_float(pricing.get("request"))

    currency = "USD"

    # Prefer token-based pricing if either prompt or completion is > 0
    if (prompt and prompt > 0) or (completion and completion > 0):
        base: dict[str, float] = {}
        if prompt and prompt > 0:
            base["input_token_1m"] = prompt * 1_000_000.0
        if completion and completion > 0:
            base["output_token_1m"] = completion * 1_000_000.0
        return "token", currency, {"base": base}

    # Fallback to per-request pricing
    if request_price and request_price > 0:
        return "call", currency, {"base": {"price_per_call": request_price}}

    return None, None, None


def parse_capabilities(item: Dict[str, Any]) -> List[str]:
    caps: set[str] = set()
    # Input/output modalities
    for mod in item.get("input_modalities") or []:
        if isinstance(mod, str) and mod.strip():
            caps.add(mod.strip())
    for mod in item.get("output_modalities") or []:
        if isinstance(mod, str) and mod.strip():
            caps.add(mod.strip())

    # Endpoint feature flags
    endpoint = item.get("endpoint") or {}
    if endpoint.get("has_chat_completions"):
        caps.add("chat")
    if endpoint.get("has_completions"):
        caps.add("completion")
    if endpoint.get("supports_multipart"):
        caps.add("multipart")
    if endpoint.get("supports_reasoning"):
        caps.add("reasoning")

    # Supported parameters (tools, etc.)
    supp = endpoint.get("supported_parameters") or []
    if isinstance(supp, list) and any(p == "tools" for p in supp):
        caps.add("tools")

    return sorted(caps)


def build_bulk_items(openrouter_payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    items_data = openrouter_payload.get("data") or []
    bulk_items: List[Dict[str, Any]] = []

    for obj in items_data:
        try:
            # Identify best vendor_model_id
            endpoint = obj.get("endpoint") or {}
            model_obj = endpoint.get("model") or {}
            vendor_model_id = (
                endpoint.get("provider_model_id")
                or obj.get("slug")
                or obj.get("permaslug")
                or endpoint.get("model_variant_slug")
                or model_obj.get("slug")
            )

            # Model name
            model_name = obj.get("name") or model_obj.get("name") or obj.get("slug")

            # Description
            description = obj.get("description") or model_obj.get("description")

            # Context / tokens
            max_ctx = (
                to_float(endpoint.get("context_length"))
                or to_float(obj.get("context_length"))
                or to_float(model_obj.get("context_length"))
            )
            max_out = to_float(endpoint.get("max_completion_tokens"))

            # Capabilities
            capabilities = parse_capabilities(obj)

            # Model URL (best-effort)
            slug = obj.get("permaslug") or obj.get("slug")
            model_url = f"https://openrouter.ai/models/{slug}" if slug else None

            # Pricing
            price_model, price_currency, price_data = compute_price(endpoint.get("pricing") or {})

            # Release date from created_at (top-level)
            created_at = obj.get("created_at") or model_obj.get("created_at")
            release_date = None
            if isinstance(created_at, str) and "T" in created_at:
                try:
                    release_date = datetime.fromisoformat(created_at.replace("Z", "+00:00")).date()
                except Exception:
                    # Fallback: simple split
                    release_date = created_at.split("T")[0]

            bulk = {
                "vendorName": DEFAULT_VENDOR_NAME,
                "model": str(model_name) if model_name else "",
                "vendorModelId": str(vendor_model_id) if vendor_model_id else None,
                "description": description,
                "modelImage": None,
                "maxContextTokens": int(max_ctx) if isinstance(max_ctx, (int, float)) else None,
                "maxOutputTokens": int(max_out) if isinstance(max_out, (int, float)) else None,
                "modelCapability": capabilities or None,
                "modelUrl": model_url,
                "priceModel": price_model,
                "priceCurrency": price_currency,
                "priceData": price_data,
                "releaseDate": release_date,
                "note": None,
                "license": None,
            }
            bulk_items.append(bulk)
        except Exception as exc:
            # Skip malformed entries quietly; could be logged if needed
            continue

    return bulk_items


def ensure_vendor(session, name: str = DEFAULT_VENDOR_NAME) -> int:
    # Import here to ensure DATABASE_URL override (if any) is applied first
    from backend.app.repositories.vendor_repository import VendorRepository  # type: ignore
    from backend.app.services.vendor_service import VendorService  # type: ignore
    from backend.app.schemas.vendor import VendorCreate  # type: ignore

    v_repo = VendorRepository()
    v_svc = VendorService()
    vendor = v_repo.get_by_name(session, name)
    if vendor:
        return vendor.id
    payload = VendorCreate(
        name=name,
        description="OpenRouter aggregated provider",
        url="https://openrouter.ai",
        apiUrl="https://openrouter.ai/api",
    )
    created = v_svc.create_vendor(session, payload, v_repo)
    return created.id


def do_fetch(output: str) -> None:
    data = http_get_json(OPENROUTER_MODELS_URL)
    save_json(output, data)
    print(f"Saved {len(data.get('data') or [])} models to {output}")


def format_database_url(db: str) -> str:
    # If already a URL, return as-is
    if db.startswith("sqlite:") or "://" in db:
        return db
    # Treat as filesystem path
    return f"sqlite:///{db}"


def do_import(path: str, database: Optional[str] = None) -> None:
    # Allow overriding database via CLI before backend modules initialize
    if database:
        os.environ["DATABASE_URL"] = format_database_url(database)

    # Import backend modules after potential DATABASE_URL override
    from backend.app.core.database import init_db, session_context  # type: ignore
    from backend.app.repositories.model_repository import ModelRepository  # type: ignore
    from backend.app.repositories.vendor_repository import VendorRepository  # type: ignore
    from backend.app.services.model_service import ModelService  # type: ignore
    from backend.app.services.vendor_service import VendorService  # type: ignore
    from backend.app.schemas.model import ModelBulkImportRequest  # type: ignore

    payload = load_json(path)
    items = build_bulk_items(payload)
    if not items:
        print("No valid items to import.")
        return

    init_db()
    m_repo = ModelRepository()
    v_repo = VendorRepository()
    m_svc = ModelService()
    v_svc = VendorService()

    with session_context() as session:
        # Ensure vendor exists (OpenRouter)
        ensure_vendor(session, DEFAULT_VENDOR_NAME)

        # Build request and import
        req = ModelBulkImportRequest(items=items)
        result = m_svc.import_models(session, req, m_repo, v_repo)

        print(
            f"Import finished: created={result.created}, updated={result.updated}, errors={len(result.errors)}"
        )
        if result.errors:
            for err in result.errors:
                print(f"  - {err}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch and import OpenRouter models")
    parser.add_argument(
        "--import",
        dest="import_path",
        metavar="FILE",
        help="Import models from a saved JSON file",
    )
    parser.add_argument(
        "-o",
        "--output",
        dest="output",
        default=DEFAULT_OUTPUT,
        help=f"Output file for fetch (default: {DEFAULT_OUTPUT})",
    )
    parser.add_argument(
        "-d",
        "--database",
        dest="database",
        help="Database URL or file path (e.g., backend/app.db)",
    )

    args = parser.parse_args()
    if args.import_path:
        do_import(args.import_path, args.database)
    else:
        do_fetch(args.output)


if __name__ == "__main__":
    main()
