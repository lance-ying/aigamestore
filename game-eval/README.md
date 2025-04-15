## Game Evaluation

### Setup
1. Install required packages:
```bash
pip install datasets flask
```

2. Set Hugging Face token:
```bash
export HF_TOKEN="your-token-here"
```

The app loads games from the Hugging Face dataset "generative-games/gen-games-v2". Each game in the dataset contains:
- HTML content
- JavaScript files
- Game metadata
- Description
- Conversation log

### Running
```bash
cd game-eval
python app.py
```
Access at http://127.0.0.1:5000/

### Results
Ratings saved to `game-eval/results/all_ratings.json`

### Dataset Structure
Each game in the dataset has the following fields:
- `id`: Unique identifier
- `method`: Generation method (e.g., "conversation")
- `model`: Model used (e.g., "o3-mini")
- `genre`: Game genre (e.g., "action")
- `game_name`: Name of the game
- `metadata`: Game metadata (name, description, controls, etc.)
- `description`: Game description
- `conversation_log`: Generation conversation log
- `html`: HTML content
- `dependencies`: External dependencies (e.g., p5.js)
- `js_files`: Dictionary of JavaScript files