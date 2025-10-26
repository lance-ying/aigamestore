# Data Directory

Organized storage for game concepts, input data, and results.

## Structure

```
data/
├── concepts/          # Game concept files (JSON/YAML)
│   ├── csv_games/
│   ├── csv_suitable_games/
│   └── ios_game_concepts/
│
├── csv/              # CSV data files
│   ├── games.csv
│   ├── Crawled Games - US.csv
│   └── evaluated_games.csv
│
├── results/          # Generated results and analysis
│   ├── test_eval.json
│   ├── fix_results.json
│   └── game_concepts_analysis.json
│
└── archive/          # Archived data
    ├── games.zip
    └── games_archive.tar.gz
```

## Concepts Directory

Game concept files organized by source:
- `csv_games/`: Concepts from CSV with expansion
- `csv_suitable_games/`: Filtered suitable game concepts
- `ios_game_concepts/`: iOS game concepts for conversion

## CSV Files

- `games.csv`: Curated list of games for generation
- `Crawled Games - US.csv`: Raw crawled game data
- `evaluated_games.csv`: Games with evaluation results

## Results

Generated outputs from batch operations:
- Test results
- Evaluation results  
- Fix results
- Analysis files

## Archive

Compressed backups of generated games and data.

