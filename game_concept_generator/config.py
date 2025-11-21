"""Configuration for the Game Concept Generator."""

import os

# API Configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyBXMtMoXG3MZkBDsqQ2SO836f4IP109HII")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"

# iTunes API URLs
ITUNES_SEARCH_URL = "https://itunes.apple.com/lookup"

# Processing Configuration
BATCH_SIZE = 5  # Number of games to process per AI batch
REQUEST_TIMEOUT = 30  # Timeout for API requests (seconds)
BATCH_DELAY = 5  # Delay between batches (seconds)


def set_api_key(api_key):
    """Set the Gemini API key at runtime."""
    global GEMINI_API_KEY, GEMINI_URL
    GEMINI_API_KEY = api_key
    GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"






