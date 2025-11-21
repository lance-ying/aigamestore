"""
Game Concept Generator - Self-contained module for converting App Store URLs to game concepts.

This module provides a complete pipeline for:
1. Parsing App Store URLs
2. Fetching game details from iTunes API
3. Generating mechanic-focused game concepts using AI
"""

from .main import generate_concept_from_url, generate_concepts_from_urls
from .config import set_api_key

__version__ = "1.0.0"

__all__ = [
    "generate_concept_from_url",
    "generate_concepts_from_urls",
    "set_api_key"
]

