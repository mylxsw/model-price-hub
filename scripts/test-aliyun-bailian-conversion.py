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

def parse_capabilities(model_data) -> list:
    """Extract capabilities from Aliyun Bailian model data"""
    caps = set()
    
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

def compute_price(pricing_list) -> tuple:
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

def extract_provider_from_data(model_data) -> str:
    """Extract provider information to create a more specific vendor name"""
    provider = model_data.get("provider", "")
    
    provider_mapping = {
        "moonshot-ai": "Moonshot AI (百炼)",
        "qwen": "通义千问 (百炼)",
        "deepseek": "DeepSeek (百炼)",
        "zhipu-ai": "智谱AI (百炼)",
        "wan": "通义万相 (百炼)"
    }
    
    return provider_mapping.get(provider, f"{provider} (百炼)" if provider else "阿里云百炼")

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
        print(f"Max Context Tokens: {item['maxContextTokens']}")
        print(f"Max Output Tokens: {item['maxOutputTokens']}")
        print(f"Price Model: {item['priceModel']}")
        print(f"Price Currency: {item['priceCurrency']}")
        print(f"Price Data: {item['priceData']}")
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
        
        # Test vendor extraction
        vendor_name = extract_provider_from_data(first_model)
        print(f"Vendor name: {vendor_name}")


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