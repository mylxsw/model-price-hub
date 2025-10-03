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
from datetime import date, datetime
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

# Ensure project root is on sys.path so we can import backend modules
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, os.pardir))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

DEFAULT_VENDOR_NAME = "阿里云百炼"

# CNY to USD approximate rate (this should ideally be fetched from a currency API)
CNY_TO_USD_RATE = 0.14  # 1 CNY ≈ 0.14 USD (approximate rate)


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
    """Extract capabilities from Aliyun Bailian model data"""
    caps: set[str] = set()
    
    capabilities = model_data.get("capabilities", {})
    
    # Function calling
    if capabilities.get("function_calling", False):
        caps.add("tools")
        caps.add("function_calling")
    
    # Web search
    if capabilities.get("web_search", False):
        caps.add("web_search")
    
    # Cache support
    if capabilities.get("cache", False):
        caps.add("cache")
    
    # Structured output
    if capabilities.get("structured_output", False):
        caps.add("structured_output")
    
    # Input modalities
    input_modalities = capabilities.get("input_modalities", {})
    if input_modalities.get("text", False):
        caps.add("text_input")
    if input_modalities.get("image", False):
        caps.add("image_input")
    if input_modalities.get("audio", False):
        caps.add("audio_input")
    if input_modalities.get("video", False):
        caps.add("video_input")
    
    # Output modalities
    output_modalities = capabilities.get("output_modalities", {})
    if output_modalities.get("text", False):
        caps.add("text_output")
    if output_modalities.get("image", False):
        caps.add("image_output")
    if output_modalities.get("audio", False):
        caps.add("audio_output")
    if output_modalities.get("video", False):
        caps.add("video_output")
    
    # Chat capability (assume all text models support chat)
    if input_modalities.get("text", False) and output_modalities.get("text", False):
        caps.add("chat")
    
    return sorted(caps)


def compute_price(pricing_list: List[Dict[str, Any]]) -> tuple[Optional[str], Optional[str], Optional[dict]]:
    """Convert Aliyun Bailian pricing into our project's price_model/currency/price_data format"""
    if not pricing_list or len(pricing_list) == 0:
        return None, None, None
    
    currency = "USD"  # We convert to USD
    
    # Check if this is token-based pricing
    first_pricing = pricing_list[0]
    unit = first_pricing.get("unit", "")
    
    if "Token" in unit or "token" in unit:
        # Token-based pricing
        price_data = {"base": {}}
        
        # If there are multiple pricing tiers, use the first one as base
        # and store all tiers for reference
        tiers = []
        
        for pricing in pricing_list:
            input_price_cny = to_float(pricing.get("input_price", 0))
            output_price_cny = to_float(pricing.get("output_price", 0))
            cache_price_cny = to_float(pricing.get("cache_price"))
            range_desc = pricing.get("range", "")
            
            tier_data = {"range": range_desc}
            
            if input_price_cny and input_price_cny > 0:
                # Convert from 元/千Token to USD per 1M tokens
                input_price_usd_per_1m = convert_cny_to_usd(input_price_cny) * 1000
                tier_data["input_token_1m"] = input_price_usd_per_1m
                
                # Set base price from first tier
                if len(tiers) == 0:
                    price_data["base"]["input_token_1m"] = input_price_usd_per_1m
            
            if output_price_cny and output_price_cny > 0:
                # Convert from 元/千Token to USD per 1M tokens
                output_price_usd_per_1m = convert_cny_to_usd(output_price_cny) * 1000
                tier_data["output_token_1m"] = output_price_usd_per_1m
                
                # Set base price from first tier
                if len(tiers) == 0:
                    price_data["base"]["output_token_1m"] = output_price_usd_per_1m
            
            if cache_price_cny and cache_price_cny > 0:
                cache_price_usd_per_1m = convert_cny_to_usd(cache_price_cny) * 1000
                tier_data["cache_token_1m"] = cache_price_usd_per_1m
                
                # Set base cache price from first tier
                if len(tiers) == 0:
                    price_data["base"]["cache_token_1m"] = cache_price_usd_per_1m
            
            tiers.append(tier_data)
        
        # Store all tiers for reference
        if len(tiers) > 1:
            price_data["tiers"] = tiers
        
        return "token", currency, price_data
        
    elif "秒" in unit:
        # Video generation pricing (per second)
        price_data = {"base": {}}
        tiers = []
        
        for pricing in pricing_list:
            input_price_cny = to_float(pricing.get("input_price", 0))
            range_desc = pricing.get("range", "")
            
            tier_data = {"range": range_desc}
            
            if input_price_cny and input_price_cny > 0:
                price_per_second_usd = convert_cny_to_usd(input_price_cny)
                tier_data["price_per_second"] = price_per_second_usd
                
                # Set base price from first tier
                if len(tiers) == 0:
                    price_data["base"]["price_per_second"] = price_per_second_usd
            
            tiers.append(tier_data)
        
        if len(tiers) > 1:
            price_data["tiers"] = tiers
        
        return "video", currency, price_data
        
    elif "张" in unit:
        # Image processing pricing (per image)
        first_pricing = pricing_list[0]
        input_price_cny = to_float(first_pricing.get("input_price", 0))
        
        if input_price_cny and input_price_cny > 0:
            price_per_image_usd = convert_cny_to_usd(input_price_cny)
            return "image", currency, {"base": {"price_per_image": price_per_image_usd}}
    
    return None, None, None


def extract_provider_from_data(model_data: Dict[str, Any]) -> str:
    """Extract provider information to create a more specific vendor name"""
    provider = model_data.get("provider", "")
    
    provider_mapping = {
        "moonshot-ai": "Moonshot AI (百炼)",
        "qwen": "通义千问 (百炼)",
        "deepseek": "DeepSeek (百炼)",
        "zhipu-ai": "智谱AI (百炼)",
        "wan": "通义万相 (百炼)"
    }
    
    return provider_mapping.get(provider, f"{provider} (百炼)" if provider else DEFAULT_VENDOR_NAME)


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
            
            # Pricing
            pricing_list = model_data.get("pricing", [])
            price_model, price_currency, price_data = compute_price(pricing_list)
            
            # Vendor (create specific vendor names based on provider)
            vendor_name = extract_provider_from_data(model_data)
            
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
                "releaseDate": None,  # Not available in the data
                "note": f"数据来源：阿里云百炼平台",
                "license": None,
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