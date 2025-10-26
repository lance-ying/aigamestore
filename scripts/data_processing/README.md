# Data Processing Scripts

One-off scripts for preparing and expanding game concepts from various sources.

## Scripts

### `evaluate_games_gemini.py`
Evaluate games from CSV using Gemini to determine suitability for generation.
```bash
uv run python scripts/data_processing/evaluate_games_gemini.py
```

### `expand_game_concepts.py`
Expand game descriptions in CSV using Gemini and add as 'expanded_concept' column.
```bash
uv run python scripts/data_processing/expand_game_concepts.py
```

### `expand_csv_games.py`
Expand pre-existing game concepts from CSV and generate games with conversion notes.
```bash
uv run python scripts/data_processing/expand_csv_games.py
```

### `expand_and_generate_games.py`
Expand game descriptions using Gemini and immediately generate games.
```bash
uv run python scripts/data_processing/expand_and_generate_games.py
```

### `generate_games_batch.py`
Generate games directly from CSV descriptions without expansion (comparison mode).
```bash
uv run python scripts/data_processing/generate_games_batch.py
```

### `update_csv_generation_status.py`
Add a `generated` column to unique_suitable_games_with_concepts.csv indicating which games have been generated.
```bash
python scripts/data_processing/update_csv_generation_status.py
python scripts/data_processing/update_csv_generation_status.py --csv path/to/games.csv
python scripts/data_processing/update_csv_generation_status.py --no-backup
```

This script reads metadata.json from each game in `public/games/` to match against CSV entries.

## Typical Usage

These scripts are typically used once to prepare datasets:

1. **Evaluate games**: Filter suitable games from raw data
2. **Expand concepts**: Add detailed specifications to concepts
3. **Generate games**: Create games from prepared concepts

For ongoing game generation, use the scripts in `scripts/batch/` instead.

