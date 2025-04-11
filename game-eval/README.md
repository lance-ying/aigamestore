## Game Evaluation

### Setup
Place games in `game-eval/games` folder with structure:
```
games/{method}/{model}/{genre}/{name}/index.html
```

### Running
```bash
cd game-eval
python app.py
```
Access at http://127.0.0.1:5000/

### Results
Ratings saved to `game-eval/results/all_ratings.json`