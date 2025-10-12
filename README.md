Setup
- Export `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY` as needed.
- Install deps (example): `pip install playwright google-genai openai anthropic pyyaml` and `python -m playwright install firefox`.

Generators
- Baseline: Concept + Game
```bash
python generate_game.py --config configs/generators/concept_and_game.yaml
```
- Single-prompt with automated testing (given a concept)
```bash
python generate_game.py --config configs/generators/single_prompt_with_testing.yaml
# Edit the 'concept' field in the YAML to provide your concept
```

Evaluator
- Basic testing (loads page, ENTER/keys, pixel-diff):
```bash
python evaluate_game.py --config configs/evaluators/basic_test/basic_testing.yaml --target /absolute/path/to/game_dir
```

- VLM (Gemini) from gameplay video and test info prompt
```bash
# Provide game folder path via --target to auto-record and evaluate each test
python evaluate_game.py --config configs/evaluators/vlm/vlm.yaml --target /absolute/path/to/game_dir
```

Iterator
- Vibe coding (make game more fun):
```bash
python iterate_game.py --config configs/iterators/vibe_coding.yaml
# Set game_dir in the YAML
```
- Feedback-based code iteration (given feedback, improve code):
```bash
python iterate_game.py --config configs/iterators/code_feedback.yaml
# Set game_dir and feedback in the YAML
```

Notes
- Token usage (prompt/completion/total) is recorded into game `metadata.json` (generation) and `iteration_metadata.json` (iteration) when available from the provider.

Structure
- `generators/`: concept_and_game, single_prompt_with_testing
- `evaluators/`: basic_test, vlm
- `iterators/`: code_feedback, vibe_coding
- `llm_interface/`: unified ModelAPI
- `prompts/`: generation prompts
- `configs/`: nested configs under generators/, evaluators/, iterators/
- `utils/`: saving utilities

