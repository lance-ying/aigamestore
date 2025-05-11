# VLM Play

This module provides functionality to evaluate games by recording gameplay and analyzing using Gemini Vision.

## Code Structure

The codebase is organized into the following modules:

- `browser_utils.py`: Contains the `BrowserManager` class to handle browser interactions with Playwright.
- `video_processing.py`: Contains the `VideoRecorder` class to handle video recording and processing.
- `gemini_api.py`: Contains the `GeminiEvaluator` class to handle interactions with Gemini API.
- `vlm_play_test.py`: Contains the `VLMPlayEvaluation` class for the parallel recording with sequential evaluation.
- `test_ai_modes.py`: Contains the `AIModeTester` class for testing different game modes sequentially.
- `evaluator.py`: Contains the original `GameEvaluator` class for backward compatibility.
- `main.py`: Command-line interface for game evaluation and recording.

## Features

- Support for new TEST button format (e.g., `<button id="test_1_ModeBtn" onclick="window.setControlMode('TEST_1')">Test (Win)</button>`)
- Parallel recording of gameplay for all test buttons to optimize testing time
- Sequential evaluation of each video for better reliability
- Reading test descriptions, strategies, and expected outcomes from metadata.json
- Using Gemini 2.5 Flash to evaluate gameplay based on test criteria
- Comprehensive evaluation reports with individual test feedback
- Aggregated feedback for game developers
- Canvas-focused recording that ensures only the game canvas is captured
- Precise recording sequence: wait for page to load, navigate to canvas, press test button, start recording canvas, press ENTER to start the game

## Usage

### Command Line

```bash
# Install dependencies
pip install -r requirements.txt
python -m playwright install firefox

# Play and record gameplay videos
python -m vlm_play.main play /path/to/game/directory

# Evaluate game with the new TEST button format and metadata
python -m vlm_play.main evaluate /path/to/game/directory
```

### Environment Setup

Set up your API key as an environment variable:

```bash
# Either of these environment variables will work
export GOOGLE_API_KEY=your_api_key
export GEMINI_API_KEY=your_api_key
```

### Python API

```python
from vlm_play import evaluate_game

results = evaluate_game("/path/to/game/directory")
print(results)
```

### Metadata Format

The system uses information from `metadata.json` in the game directory to understand test purposes:

```json
{
  "game_info": {
    "automated_testing": "<automated_testing>\n<TEST_1>\n<test_description>What are you testing?</test_description>\n<strategy_description>How are you testing it?</strategy_description>\n<expected_outcome>What is the expected outcome?</expected_outcome>\n</TEST_1>\n</automated_testing>"
  }
}
```

## Requirements

- Python 3.8+
- Google Gemini API key (set as environment variable `GOOGLE_API_KEY` or `GEMINI_API_KEY`)
- google-genai package (install with `pip install google-genai`)
- Playwright (install with `pip install playwright && python -m playwright install firefox`)
- FFmpeg for video processing

## Workflow

1. Identifies all TEST buttons on the game page
2. For each test button (recording in parallel for efficiency):
   a. Waits for the page to load
   b. Navigates to and focuses on the canvas element
   c. Presses the test button
   d. Starts recording only the canvas
   e. Presses ENTER to start the game
   f. Records for 10 seconds
3. Sequentially processes each recorded video:
   a. Sends the video to Gemini Vision with specific test criteria
   b. Receives detailed evaluation feedback
   c. Saves individual evaluation results
4. Aggregates feedback from all individual evaluations
5. Creates comprehensive HTML reports with all evaluations

## Output

The evaluation results are saved in the `vlm_evaluation` directory next to the game directory:

- MP4 videos of gameplay for each test mode
- JSON files with Gemini's evaluation for each test
- Aggregated feedback JSON with comprehensive analysis
- HTML report with all evaluations, videos, and feedback 