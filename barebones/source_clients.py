import re
import json
from typing import Dict, Optional, Tuple
from urllib.parse import urlencode
from urllib.request import urlopen


REQUEST_TIMEOUT = 30
STEAM_APP_DETAILS_URL = "https://store.steampowered.com/api/appdetails"
ITUNES_LOOKUP_URL = "https://itunes.apple.com/lookup"


def extract_steam_app_id(url: str) -> Optional[int]:
    match = re.search(r"/app/(\d+)/", url)
    if not match:
        return None
    return int(match.group(1))


def validate_steam_url(url: str) -> bool:
    return url.startswith("https://store.steampowered.com/") and extract_steam_app_id(url) is not None


def fetch_steam_details(url: str) -> Dict[str, str]:
    app_id = extract_steam_app_id(url)
    if app_id is None:
        raise ValueError("Could not extract Steam app ID from URL")

    query = urlencode({"appids": app_id, "format": "json"})
    with urlopen(f"{STEAM_APP_DETAILS_URL}?{query}", timeout=REQUEST_TIMEOUT) as response:
        payload = json.loads(response.read().decode("utf-8")).get(str(app_id), {})
    if not payload.get("success") or not payload.get("data"):
        raise ValueError(f"Steam app details not found for app ID {app_id}")

    data = payload["data"]
    return {
        "source": "steam",
        "source_label": "Steam",
        "url": url,
        "app_id": str(app_id),
        "name": data.get("name", "Unknown Game"),
        "summary": (data.get("short_description") or "").strip(),
        "description": (data.get("detailed_description") or "").strip(),
    }


def extract_app_store_info(url: str) -> Tuple[Optional[str], str]:
    country_match = re.search(r"apps\.apple\.com/([a-z]{2})/app/", url)
    country_code = country_match.group(1) if country_match else "us"
    app_id_match = re.search(r"/id(\d+)", url)
    app_id = app_id_match.group(1) if app_id_match else None
    return app_id, country_code


def validate_app_store_url(url: str) -> bool:
    app_id, _country = extract_app_store_info(url)
    return url.startswith("https://apps.apple.com/") and "/app/" in url and app_id is not None


def fetch_app_store_details(url: str) -> Dict[str, str]:
    app_id, country_code = extract_app_store_info(url)
    if app_id is None:
        raise ValueError("Could not extract App Store app ID from URL")

    query = urlencode({"id": app_id, "country": country_code})
    with urlopen(f"{ITUNES_LOOKUP_URL}?{query}", timeout=REQUEST_TIMEOUT) as response:
        payload = json.loads(response.read().decode("utf-8"))
    results = payload.get("results") or []
    if not results:
        raise ValueError(f"App Store details not found for app ID {app_id}")

    data = results[0]
    return {
        "source": "app_store",
        "source_label": "App Store",
        "url": url,
        "app_id": app_id,
        "name": data.get("trackName", "Unknown Game"),
        "summary": "",
        "description": (data.get("description") or "").strip(),
    }


def fetch_source_details(source: str, url: str) -> Dict[str, str]:
    if source == "steam":
        if not validate_steam_url(url):
            raise ValueError("Invalid Steam URL format")
        return fetch_steam_details(url)
    if source == "app_store":
        if not validate_app_store_url(url):
            raise ValueError("Invalid App Store URL format")
        return fetch_app_store_details(url)
    raise ValueError(f"Unsupported source: {source}")
