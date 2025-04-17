import json
from pathlib import Path
from replay_game import replay_game

# Path to the simple_p5_game directory
# GAME_DIR = Path(__file__).parent / "games/games_test/claude-3.7-sonnet/complexity_guide/concept_0020/simple_p5_game"
GAME_DIR = Path(__file__).parent / "games/games_v4/claude-3.7-sonnet/judge/concept_0001/sample_0"


# Load all game files (HTML, JS, etc.)
game_files = {}
for file_path in GAME_DIR.glob("**/*"):
    if file_path.is_file() and file_path.suffix in {'.html', '.js', '.css'}:
        rel_path = file_path.relative_to(GAME_DIR)
        with open(file_path, 'r', encoding='utf-8') as f:
            game_files[str(rel_path)] = f.read()

# Load recorded actions
recorded_events_path = GAME_DIR / "recorded_events.json"
with open(recorded_events_path, 'r', encoding='utf-8') as f:
    actions = json.load(f)

# Replay the game actions
replay_game(game_files, actions, debug=True) 