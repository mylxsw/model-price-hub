from typing import Iterable, List, Optional


def parse_csv(value: Optional[str]) -> Optional[List[str]]:
    if value is None:
        return None
    parts = [item.strip() for item in value.split(",") if item.strip()]
    return parts or None


def parse_int(value: Optional[str]) -> Optional[int]:
    if value is None:
        return None
    try:
        return int(value)
    except ValueError:
        return None


def normalize_iterable(values: Optional[Iterable[str]]) -> List[str]:
    if not values:
        return []
    return sorted({value.strip() for value in values if value.strip()})
