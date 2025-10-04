#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Test script to validate Aliyun Bailian data conversion logic
"""

import json
import sys
import os

# Add the script's parent directory to sys.path for imports
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, CURRENT_DIR)

# Import functions directly by copying them instead of importing

def load_json(path: str):
    import json
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def to_float(value):
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
    CNY_TO_USD_RATE = 0.14
    return cny_price * CNY_TO_USD_RATE

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


def parse_capabilities(model_data) -> list:
    """Extract normalized capabilities from Aliyun Bailian model data"""
    caps = set()

    capabilities = model_data.get("capabilities", {})

    if capabilities.get("function_calling", False):
        caps.add("function_calling")
        caps.add("tools")

    if capabilities.get("web_search", False):
        caps.add("web_search")

    input_modalities = capabilities.get("input_modalities", {})
    if input_modalities.get("text", False):
        caps.add("chat")
    if input_modalities.get("image", False):
        caps.add("image_input")
    if input_modalities.get("audio", False):
        caps.add("audio_input")
    if input_modalities.get("video", False):
        caps.add("video_input")

    output_modalities = capabilities.get("output_modalities", {})
    if output_modalities.get("image", False):
        caps.add("image_output")
    if output_modalities.get("audio", False):
        caps.add("audio_output")
    if output_modalities.get("video", False):
        caps.add("video_output")

    if capabilities.get("think", False):
        caps.add("think")

    return sorted({CAPABILITY_MAPPING[cap] for cap in caps if cap in CAPABILITY_MAPPING})


def determine_categories(model_data) -> list:
    CATEGORY_TEXT = "文本生成"
    CATEGORY_IMAGE = "图像生成"
    CATEGORY_VIDEO = "视频生成"
    CATEGORY_AUDIO = "音频生成"

    explicit = model_data.get("model_type") or model_data.get("type") or model_data.get("category")
    if isinstance(explicit, str):
        lowered = explicit.strip().lower()
        if lowered:
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
            lowered = first_unit.lower()
            if "秒" in lowered or "video" in lowered:
                return [CATEGORY_VIDEO]
            if "张" in lowered or "image" in lowered:
                return [CATEGORY_IMAGE]
            if "audio" in lowered or "秒/条" in lowered:
                return [CATEGORY_AUDIO]

    return [CATEGORY_TEXT]


def format_tier_entry(name, billing, unit, **prices):
    tier = {"name": name, "billing": billing, "unit": unit}
    for key, value in prices.items():
        if value is not None:
            tier[key] = value
    return tier

def compute_price(pricing_list) -> tuple:
    """Convert Aliyun Bailian pricing into our project's price_model/currency/price_data format"""
    if not pricing_list:
        return None, None, None

    currency = "USD"
    first_pricing = pricing_list[0] or {}
    unit_value = str(first_pricing.get("unit", ""))
    unit_lower = unit_value.lower()

    if "token" in unit_lower:
        tiers = []
        for index, pricing in enumerate(pricing_list):
            name = pricing.get("range") or f"Tier {index + 1}"
            input_price_cny = to_float(pricing.get("input_price"))
            output_price_cny = to_float(pricing.get("output_price"))
            cache_price_cny = to_float(pricing.get("cache_price"))

            input_price_usd = convert_cny_to_usd(input_price_cny) * 1000 if input_price_cny else None
            output_price_usd = convert_cny_to_usd(output_price_cny) * 1000 if output_price_cny else None
            cache_price_usd = convert_cny_to_usd(cache_price_cny) * 1000 if cache_price_cny else None

            tier = format_tier_entry(
                name,
                billing="token",
                unit="1M Tokens",
                input_price_per_unit=input_price_usd,
                output_price_per_unit=output_price_usd,
                cached_price_per_unit=cache_price_usd,
            )
            if any(k.endswith("_per_unit") for k in tier):
                tiers.append(tier)

        if not tiers:
            return None, None, None

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
            return None, None, None

        return "tiered", currency, {"currency": currency, "tiers": tiers}

    if "秒" in unit_lower or "second" in unit_lower:
        tiers = []
        for index, pricing in enumerate(pricing_list):
            name = pricing.get("range") or f"Tier {index + 1}"
            price_cny = to_float(pricing.get("input_price")) or to_float(pricing.get("output_price"))
            price_usd = convert_cny_to_usd(price_cny) if price_cny else None
            tier = format_tier_entry(name, billing="requests", unit="Seconds", price_per_unit=price_usd)
            if tier.get("price_per_unit") is not None:
                tiers.append(tier)

        if not tiers:
            return None, None, None
        return "tiered", currency, {"currency": currency, "tiers": tiers}

    if "张" in unit_lower or "image" in unit_lower:
        tiers = []
        for index, pricing in enumerate(pricing_list):
            name = pricing.get("range") or f"Tier {index + 1}"
            price_cny = to_float(pricing.get("input_price")) or to_float(pricing.get("output_price"))
            price_usd = convert_cny_to_usd(price_cny) if price_cny else None
            tier = format_tier_entry(name, billing="requests", unit="Images", price_per_unit=price_usd)
            if tier.get("price_per_unit") is not None:
                tiers.append(tier)

        if not tiers:
            return None, None, None
        return "tiered", currency, {"currency": currency, "tiers": tiers}

    return None, None, None


def extract_license(model_data):
    biaoshi = model_data.get("biaoshi")
    if isinstance(biaoshi, str):
        if "opensource" in biaoshi.lower():
            return ["OpenSource"]
    elif isinstance(biaoshi, list):
        normalized = [str(item).lower() for item in biaoshi]
        if any("opensource" in item for item in normalized):
            return ["OpenSource"]
    return None

def build_bulk_items(aliyun_payload) -> list:
    """Convert Aliyun Bailian data to our bulk import format"""
    models_data = aliyun_payload.get("models", [])
    bulk_items = []

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

            vendor_name = "阿里云百炼"
            license_info = extract_license(model_data)

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
                "license": license_info,
            }
            
            bulk_items.append(bulk_item)
            
        except Exception as exc:
            print(f"Error processing model {model_data.get('name', 'unknown')}: {exc}")
            continue
    
    return bulk_items

# Dummy imports for the functions we copied above


def test_conversion(input_file: str) -> None:
    """Test the conversion without database operations"""
    print(f"Loading data from {input_file}...")
    try:
        payload = load_json(input_file)
    except Exception as e:
        print(f"Error loading JSON file: {e}")
        return
    
    print(f"Found {len(payload.get('models', []))} models in data")
    
    # Test conversion
    print("\nConverting data format...")
    items = build_bulk_items(payload)
    
    print(f"Successfully converted {len(items)} models")
    print("\n" + "="*80)
    
    # Show first few examples
    for i, item in enumerate(items[:3]):
        print(f"\nModel {i+1}: {item['model']}")
        print(f"Vendor: {item['vendorName']}")
        print(f"Model ID: {item['vendorModelId']}")
        print(f"Description: {item['description'][:100]}..." if item['description'] and len(item['description']) > 100 else f"Description: {item['description']}")
        print(f"Capabilities: {item['modelCapability']}")
        print(f"Categories: {item.get('categories')}")
        print(f"Max Context Tokens: {item['maxContextTokens']}")
        print(f"Max Output Tokens: {item['maxOutputTokens']}")
        print(f"Price Model: {item['priceModel']}")
        print(f"Price Currency: {item['priceCurrency']}")
        print(f"Price Data: {item['priceData']}")
        print(f"License: {item['license']}")
        print(f"Model URL: {item['modelUrl']}")
        print("-" * 60)
    
    # Summary by vendor
    vendor_count = {}
    price_model_count = {}
    
    for item in items:
        vendor = item['vendorName']
        price_model = item['priceModel']
        
        vendor_count[vendor] = vendor_count.get(vendor, 0) + 1
        if price_model:
            price_model_count[price_model] = price_model_count.get(price_model, 0) + 1
    
    print(f"\n{'='*80}")
    print("CONVERSION SUMMARY")
    print(f"{'='*80}")
    print(f"Total models converted: {len(items)}")
    print("\nModels by vendor:")
    for vendor, count in sorted(vendor_count.items()):
        print(f"  {vendor}: {count}")
    
    print("\nModels by price model:")
    for price_model, count in sorted(price_model_count.items()):
        print(f"  {price_model}: {count}")
    
    # Test individual components
    print(f"\n{'='*80}")
    print("TESTING INDIVIDUAL COMPONENTS")
    print(f"{'='*80}")
    
    # Test first model in detail
    if payload.get('models'):
        first_model = payload['models'][0]
        print(f"\nTesting with first model: {first_model.get('name')}")
        
        # Test capabilities parsing
        capabilities = parse_capabilities(first_model)
        print(f"Capabilities: {capabilities}")
        
        # Test pricing computation
        pricing_list = first_model.get('pricing', [])
        price_model, price_currency, price_data = compute_price(pricing_list)
        print(f"Price model: {price_model}")
        print(f"Price currency: {price_currency}")
        print(f"Price data: {price_data}")
        
        # Test categories
        print(f"Categories: {determine_categories(first_model)}")

        # Test license extraction
        print(f"License: {extract_license(first_model)}")


def main():
    if len(sys.argv) != 2:
        print("Usage: python test-aliyun-bailian-conversion.py <input_file>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    
    if not os.path.exists(input_file):
        print(f"Error: File {input_file} does not exist.")
        sys.exit(1)
    
    test_conversion(input_file)


if __name__ == "__main__":
    main()