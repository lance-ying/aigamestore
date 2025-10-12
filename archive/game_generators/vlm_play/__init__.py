"""
VLM Play module for evaluating games using Gemini Vision.
"""

import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

# Export public API
from .evaluator import GameEvaluator, evaluate_game_original
from .vlm_play_test import VLMPlayEvaluation, evaluate_game as evaluate_test_game
from .browser_utils import BrowserManager
from .gemini_api import GeminiEvaluator
from .video_processing import VideoRecorder
from .test_ai_modes import AIModeTester, test_ai_modes

__all__ = [
    "GameEvaluator",
    "evaluate_game_original",
    "VLMPlayEvaluation",
    "evaluate_test_game",
    "BrowserManager",
    "GeminiEvaluator",
    "VideoRecorder",
    "AIModeTester",
    "test_ai_modes",
]

# Default evaluation function
evaluate_game = evaluate_test_game 