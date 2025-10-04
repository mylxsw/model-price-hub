#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
fetch-provider-aliyun-bailian.py

Usage:
  - Import from aliyun-bailian-data.json file into the project's model database:
      python scripts/fetch-provider-aliyun-bailian.py aliyun-bailian-data.json

  - Import with a specific database file (path or URL), e.g. sqlite file at backend/app.db:
      python scripts/fetch-provider-aliyun-bailian.py aliyun-bailian-data.json --database backend/app.db

Notes:
  - Imports will ensure a vendor named "阿里云百炼" exists (create if missing).
  - Pricing from AliYun Bailian is converted to per-1M-token pricing when available.
  - Currency is converted from CNY (元) to USD using approximate rate.
"""

import argparse
import json
import os
import sys
from typing import Any, Dict, List, Optional

# Ensure project root is on sys.path so we can import backend modules
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, os.pardir))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

DEFAULT_VENDOR_NAME = "阿里云百炼"

# CNY to USD approximate rate (this should ideally be fetched from a currency API)
CNY_TO_USD_RATE = 0.14  # 1 CNY ≈ 0.14 USD (approximate rate)

CATEGORY_TEXT = "文本生成"
CATEGORY_IMAGE = "图像生成"
CATEGORY_VIDEO = "视频生成"
CATEGORY_AUDIO = "音频生成"

CAPABILITY_MAPPING = {
    "chat": "TEXT",
    "function_calling": "TOOLS",
    "tools": "TOOLS",
    "web_search": "WEB_SEARCH",
    "image": "VISION",
    "image_input": "VISION",
    "image_output": "VISION",
    "audio_input": "AUDIO_INPUT",
    "audio_output": "AUDIO_OUTPUT",
    "think": "THINK",
}


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


def convert_cny_to_usd(cny_price: float) -> float:
    """Convert CNY price to USD"""
    return cny_price * CNY_TO_USD_RATE


def parse_capabilities(model_data: Dict[str, Any]) -> List[str]:
    """Extract normalized capabilities from Aliyun Bailian model data"""
    raw_caps: set[str] = set()

    capabilities = model_data.get("capabilities", {})

    # Function calling / tools support
    if capabilities.get("function_calling", False):
        raw_caps.add("function_calling")
        raw_caps.add("tools")

    # Web search
    if capabilities.get("web_search", False):
        raw_caps.add("web_search")

    # Input modalities
    input_modalities = capabilities.get("input_modalities", {})
    if input_modalities.get("text", False):
        raw_caps.add("chat")
    if input_modalities.get("image", False):
        raw_caps.add("image_input")
    if input_modalities.get("audio", False):
        raw_caps.add("audio_input")
    if input_modalities.get("video", False):
        raw_caps.add("video_input")

    # Output modalities
    output_modalities = capabilities.get("output_modalities", {})
    if output_modalities.get("image", False):
        raw_caps.add("image_output")
    if output_modalities.get("audio", False):
        raw_caps.add("audio_output")
    if output_modalities.get("video", False):
        raw_caps.add("video_output")

    # Think mode capability (if present)
    if capabilities.get("think", False):
        raw_caps.add("think")

    normalized = sorted({mapped for cap in raw_caps if (mapped := CAPABILITY_MAPPING.get(cap))})
    return normalized


def determine_categories(model_data: Dict[str, Any]) -> Optional[List[str]]:
    """Determine model categories based on model type and capabilities"""

    explicit = model_data.get("model_type") or model_data.get("type") or model_data.get("category")
    if isinstance(explicit, str):
        lowered = explicit.strip().lower()
        if not lowered:
            explicit = None
        else:
            if "image" in lowered or "vision" in lowered or "图像" in lowered:
                return [CATEGORY_IMAGE]
            if "video" in lowered or "视频" in lowered:
                return [CATEGORY_VIDEO]
            if "audio" in lowered or "语音" in lowered or "声音" in lowered:
                return [CATEGORY_AUDIO]
            return [CATEGORY_TEXT]

    capabilities = model_data.get("capabilities", {})
    input_modalities = capabilities.get("input_modalities", {}) if isinstance(capabilities, dict) else {}
    output_modalities = capabilities.get("output_modalities", {}) if isinstance(capabilities, dict) else {}

    if output_modalities.get("video") or input_modalities.get("video"):
        return [CATEGORY_VIDEO]
    if output_modalities.get("image") or input_modalities.get("image"):
        return [CATEGORY_IMAGE]
    if output_modalities.get("audio") or input_modalities.get("audio"):
        return [CATEGORY_AUDIO]

    pricing = model_data.get("pricing") or []
    if isinstance(pricing, list) and pricing:
        first_unit = (pricing[0] or {}).get("unit")
        if isinstance(first_unit, str):
            unit_lower = first_unit.lower()
            if "秒" in unit_lower or "video" in unit_lower:
                return [CATEGORY_VIDEO]
            if "张" in unit_lower or "image" in unit_lower:
                return [CATEGORY_IMAGE]
            if "audio" in unit_lower or "秒/条" in unit_lower:
                return [CATEGORY_AUDIO]

    return [CATEGORY_TEXT]


def format_tier_entry(
    name: str,
    billing: str,
    unit: str,
    *,
    input_price: Optional[float] = None,
    output_price: Optional[float] = None,
    cache_price: Optional[float] = None,
    price: Optional[float] = None,
) -> Dict[str, Any]:
    tier: Dict[str, Any] = {
        "name": name,
        "billing": billing,
        "unit": unit,
    }
    if input_price is not None:
        tier["input_price_per_unit"] = input_price
    if output_price is not None:
        tier["output_price_per_unit"] = output_price
    if cache_price is not None:
        tier["cached_price_per_unit"] = cache_price
    if price is not None:
        tier["price_per_unit"] = price
    return tier


def compute_price(pricing_list: List[Dict[str, Any]]) -> tuple[Optional[str], Optional[str], Optional[dict]]:
    """Convert Aliyun Bailian pricing into our project's price_model/currency/price_data format"""
    if not pricing_list:
        return "unknown", "USD", None

    currency = "USD"

    first_pricing = pricing_list[0] or {}
    unit_value = str(first_pricing.get("unit", ""))
    unit_lower = unit_value.lower()

    # Token-based pricing (typically 元/千Token)
    if "token" in unit_lower:
        tiers: List[Dict[str, Any]] = []
        for index, pricing in enumerate(pricing_list):
            name = pricing.get("range") or f"Tier {index + 1}"
            input_price_cny = to_float(pricing.get("input_price"))
            output_price_cny = to_float(pricing.get("output_price"))
            cache_price_cny = to_float(pricing.get("cache_price"))

            input_price_usd = convert_cny_to_usd(input_price_cny) * 1000 if input_price_cny else None
            output_price_usd = convert_cny_to_usd(output_price_cny) * 1000 if output_price_cny else None
            cache_price_usd = convert_cny_to_usd(cache_price_cny) * 1000 if cache_price_cny else None

            tiers.append(
                format_tier_entry(
                    name,
                    billing="token",
                    unit="1M Tokens",
                    input_price=input_price_usd,
                    output_price=output_price_usd,
                    cache_price=cache_price_usd,
                )
            )

        # Remove empty tiers (no pricing info)
        tiers = [tier for tier in tiers if any(k.endswith("_per_unit") for k in tier.keys())]
        if not tiers:
            return "unknown", "USD", None

        if len(tiers) == 1:
            base = tiers[0]
            key_mapping = {
                "input_price_per_unit": "input_token_1m",
                "output_price_per_unit": "output_token_1m",
                "cached_price_per_unit": "cache_token_1m",
            }
            price_data = {
                "base": {
                    key_mapping[key]: value
                    for key, value in base.items()
                    if key in key_mapping and value is not None
                }
            }
            if price_data["base"]:
                return "token", currency, price_data
            return "unknown", "USD", None

        return "tiered", currency, {"currency": currency, "tiers": tiers}

    # Video pricing (per second)
    if "秒" in unit_lower or "second" in unit_lower:
        tiers: List[Dict[str, Any]] = []
        for index, pricing in enumerate(pricing_list):
            name = pricing.get("range") or f"Tier {index + 1}"
            price_cny = to_float(pricing.get("input_price")) or to_float(pricing.get("output_price"))
            price_usd = convert_cny_to_usd(price_cny) if price_cny else None
            tiers.append(
                format_tier_entry(
                    name,
                    billing="requests",
                    unit="Seconds",
                    price=price_usd,
                )
            )

        tiers = [tier for tier in tiers if tier.get("price_per_unit") is not None]
        if not tiers:
            return "unknown", "USD", None

        if len(tiers) == 1:
            return "tiered", currency, {
                "currency": currency,
                "tiers": tiers,
            }

        return "tiered", currency, {"currency": currency, "tiers": tiers}

    # Image pricing (per image)
    if "张" in unit_lower or "image" in unit_lower:
        tiers: List[Dict[str, Any]] = []
        for index, pricing in enumerate(pricing_list):
            name = pricing.get("range") or f"Tier {index + 1}"
            price_cny = to_float(pricing.get("input_price")) or to_float(pricing.get("output_price"))
            price_usd = convert_cny_to_usd(price_cny) if price_cny else None
            tiers.append(
                format_tier_entry(
                    name,
                    billing="requests",
                    unit="Images",
                    price=price_usd,
                )
            )

        tiers = [tier for tier in tiers if tier.get("price_per_unit") is not None]
        if not tiers:
            return "unknown", "USD", None
        if len(tiers) == 1:
            return "tiered", currency, {
                "currency": currency,
                "tiers": tiers,
            }
        return "tiered", currency, {"currency": currency, "tiers": tiers}

    return "unknown", "USD", None


def build_bulk_items(aliyun_payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Convert Aliyun Bailian data to our bulk import format"""
    models_data = aliyun_payload.get("models", [])
    bulk_items: List[Dict[str, Any]] = []

    for model_data in models_data:
        try:
            # Basic info
            model_name = model_data.get("name", "")
            model_id = model_data.get("model_id", "")
            description = model_data.get("description", "")
            doc_url = model_data.get("doc_url")

            # Context and output tokens
            max_ctx = model_data.get("context_window")
            max_out = model_data.get("max_output_tokens")

            # Convert 0 to None for better data quality
            if max_ctx == 0:
                max_ctx = None
            if max_out == 0:
                max_out = None

            # Capabilities
            capabilities = parse_capabilities(model_data)

            # Categories
            categories = determine_categories(model_data)

            # Pricing
            pricing_list = model_data.get("pricing", [])
            price_model, price_currency, price_data = compute_price(pricing_list)

            vendor_name = DEFAULT_VENDOR_NAME

            licenses: Optional[List[str]] = None
            biaoshi = model_data.get("biaoshi")
            if isinstance(biaoshi, str):
                if "opensource" in biaoshi.lower():
                    licenses = ["OpenSource"]
            elif isinstance(biaoshi, list):
                normalized = [str(item).lower() for item in biaoshi]
                if any("opensource" in item for item in normalized):
                    licenses = ["OpenSource"]

            bulk_item = {
                "vendorName": vendor_name,
                "model": model_name,
                "vendorModelId": model_id,
                "description": description,
                "modelImage": None,
                "maxContextTokens": max_ctx,
                "maxOutputTokens": max_out,
                "modelCapability": capabilities if capabilities else None,
                "modelUrl": doc_url,
                "priceModel": price_model,
                "priceCurrency": price_currency,
                "priceData": price_data,
                "categories": categories,
                "releaseDate": None,  # Not available in the data
                "note": f"数据来源：阿里云百炼平台",
                "license": licenses,
            }

            bulk_items.append(bulk_item)
            
        except Exception as exc:
            print(f"Error processing model {model_data.get('name', 'unknown')}: {exc}")
            continue
    
    return bulk_items


def ensure_vendor(session, name: str) -> int:
    """Ensure vendor exists and return its ID"""
    from backend.app.repositories.vendor_repository import VendorRepository  # type: ignore
    from backend.app.services.vendor_service import VendorService  # type: ignore
    from backend.app.schemas.vendor import VendorCreate  # type: ignore
    
    v_repo = VendorRepository()
    v_svc = VendorService()
    vendor = v_repo.get_by_name(session, name)
    if vendor:
        return vendor.id
    
    # Create vendor with appropriate info
    if "通义千问" in name:
        description = "阿里巴巴通义千问大语言模型，通过阿里云百炼平台提供服务"
        url = "https://tongyi.aliyun.com/"
        api_url = "https://dashscope.aliyuncs.com/"
    elif "通义万相" in name:
        description = "阿里巴巴通义万相多模态模型，通过阿里云百炼平台提供服务"
        url = "https://tongyi.aliyun.com/"
        api_url = "https://dashscope.aliyuncs.com/"
    elif "Moonshot" in name:
        description = "月之暗面（Moonshot AI）大语言模型，通过阿里云百炼平台提供服务"
        url = "https://www.moonshot.cn/"
        api_url = "https://dashscope.aliyuncs.com/"
    elif "DeepSeek" in name:
        description = "DeepSeek 大语言模型，通过阿里云百炼平台提供服务"
        url = "https://www.deepseek.com/"
        api_url = "https://dashscope.aliyuncs.com/"
    elif "智谱" in name:
        description = "智谱AI GLM系列模型，通过阿里云百炼平台提供服务"
        url = "https://www.zhipuai.cn/"
        api_url = "https://dashscope.aliyuncs.com/"
    else:
        description = "阿里云百炼平台提供的AI模型服务"
        url = "https://bailian.console.aliyun.com/"
        api_url = "https://dashscope.aliyuncs.com/"
    
    payload = VendorCreate(
        name=name,
        description=description,
        url=url,
        apiUrl=api_url,
    )
    created = v_svc.create_vendor(session, payload, v_repo)
    return created.id


def format_database_url(db: str) -> str:
    """Format database URL"""
    if db.startswith("sqlite:") or "://" in db:
        return db
    return f"sqlite:///{db}"


def do_import(path: str, database: Optional[str] = None) -> None:
    """Import Aliyun Bailian data into the database"""
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
    
    print(f"Loading data from {path}...")
    payload = load_json(path)
    
    print("Converting data format...")
    items = build_bulk_items(payload)
    if not items:
        print("No valid items to import.")
        return
    
    print(f"Found {len(items)} models to import...")
    
    init_db()
    m_repo = ModelRepository()
    v_repo = VendorRepository()
    m_svc = ModelService()
    v_svc = VendorService()
    
    with session_context() as session:
        # Get unique vendor names and ensure they exist
        vendor_names = set(item["vendorName"] for item in items)
        print(f"Ensuring vendors exist: {', '.join(vendor_names)}")
        
        for vendor_name in vendor_names:
            ensure_vendor(session, vendor_name)
        
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
    parser = argparse.ArgumentParser(description="Import Aliyun Bailian models")
    parser.add_argument(
        "input_file",
        help="Input JSON file path (e.g., aliyun-bailian-data.json)"
    )
    parser.add_argument(
        "-d",
        "--database",
        dest="database",
        help="Database URL or file path (e.g., backend/app.db)",
    )
    
    args = parser.parse_args()
    
    if not os.path.exists(args.input_file):
        print(f"Error: File {args.input_file} does not exist.")
        sys.exit(1)
    
    do_import(args.input_file, args.database)


if __name__ == "__main__":
    main()