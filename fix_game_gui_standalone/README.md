# Game Fix GUI - Standalone

A Gradio-based web interface for fixing games with natural language feedback.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
Create a `.env` file in the project root with your API keys:
```
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here
```

3. Configure game directories:
Edit `scripts/utils/fix_game_gui.py` and update the `GAME_DIRECTORIES` dictionary
to point to your game directories.

4. Run the GUI:
```bash
python scripts/utils/fix_game_gui.py
```

Or with custom port:
```bash
python scripts/utils/fix_game_gui.py --port 7860
```

## Features

- Browse and preview games in an iframe
- Apply fixes using natural language feedback
- Manage backups and restore previous versions
- Flag games with colors (red, yellow, green, blue, purple) for organization
- Regenerate games from concepts stored in metadata.json

## Project Structure

- `scripts/utils/fix_game_gui.py` - Main GUI application
- `iterators/` - Game fixing logic (FeedbackFixIterator)
- `utils/` - Utility functions for saving logs and formatting
- `llm_interface/` - LLM API interface (ModelAPI)
- `generators/` - Game generation (optional, for regenerate feature)

## Notes

- The GUI expects games to be in directories relative to where the script is run
- Games should have an `index.html` file
- The GUI creates backups automatically before applying fixes
- Fix logs are saved in `fix_logs/` subdirectories within each game
