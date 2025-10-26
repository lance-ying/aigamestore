# Batch Processing Scripts

Scripts for batch operations on multiple games.

## Scripts

### `evaluate.py`
Batch evaluate all games using VLM (Vision Language Model).
```bash
python scripts/batch/evaluate.py --games-dir games --output results.json
python scripts/batch/evaluate.py --only-csv-games --max-games 10
```

### `fix_failed_games.py`
Fix games that failed basic testing based on test results JSON.
```bash
python scripts/batch/fix_failed_games.py --results public/test_results.json --failure-type start
python scripts/batch/fix_failed_games.py --results public/test_results.json --failure-type all
```

### `fix_from_evaluation.py`
Fix games based on VLM evaluation results.
```bash
python scripts/batch/fix_from_evaluation.py --eval test_eval.json
python scripts/batch/fix_from_evaluation.py --eval test_eval.json --max-fixes 5 --only-failed
```

### `generate_from_concepts.py`
Smart batch game generator that chooses between matter.js and p5.js based on physics requirements.
```bash
python scripts/batch/generate_from_concepts.py --concepts-dir data/concepts/ios_game_concepts
python scripts/batch/generate_from_concepts.py --concepts-dir data/concepts/ios_game_concepts --max-games 10
```

## Workflow

Typical batch workflow:
1. Generate games: `python scripts/batch/generate_from_concepts.py`
2. Test games: `python test_all_games.py --output test_results.json`
3. Fix failures: `python scripts/batch/fix_failed_games.py --results test_results.json`
4. Evaluate quality: `python scripts/batch/evaluate.py --output eval_results.json`
5. Fix from evaluation: `python scripts/batch/fix_from_evaluation.py --eval eval_results.json`

