# VLM Play

This module provides functionality to evaluate games by recording gameplay and analyzing using Gemini 2.0 Flash.

## Code Structure

The codebase is organized into the following modules:

- `browser_utils.py`: Contains the `BrowserManager` class to handle browser interactions with Playwright.
- `video_processing.py`: Contains the `VideoRecorder` class to handle video recording and processing.
- `gemini_api.py`: Contains the `GeminiEvaluator` class to handle interactions with Gemini API.
- `evaluator.py`: Contains the main `GameEvaluator` class that coordinates the evaluation process.
- `main.py`: Command-line interface for game evaluation.
- `evaluate_game.py`: Entry point wrapper script that uses the modular implementation.

## Usage

```bash
python -m vlm_play.evaluate_game /path/to/game/directory
```

or

```python
from vlm_play import evaluate_game

results = evaluate_game("/path/to/game/directory")
print(results)
```

## Requirements

- Python 3.8+
- Google Gemini API key (set as environment variable `GOOGLE_API_KEY`)
- Playwright (install with `pip install playwright && python -m playwright install firefox`)
- FFmpeg for video processing

## Functionality

The module performs the following operations:

1. Launches a browser to load and interact with HTML5 games
2. Finds game test buttons on the page
3. Records gameplay for each mode
4. Evaluates the recorded videos using Gemini Vision API
5. Generates analysis of game mechanics, user experience, visual design, and bugs

## Output

The evaluation results are saved in the `evaluation_results` directory next to the game directory:

- MP4 videos of gameplay for each mode
- JSON files with Gemini's evaluation for each mode
- Summary JSON file with all evaluations 