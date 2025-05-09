"""
VLM Play module for evaluating games using Gemini Vision.
"""

import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

# Export public API
from .evaluator import GameEvaluator, evaluate_game, evaluate_game_async
from .browser_utils import BrowserManager
from .gemini_api import GeminiEvaluator
from .video_processing import VideoRecorder

__all__ = [
    "GameEvaluator",
    "evaluate_game",
    "evaluate_game_async",
    "BrowserManager",
    "GeminiEvaluator",
    "VideoRecorder",
] 