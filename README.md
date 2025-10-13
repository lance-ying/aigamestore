# Game Generation

### Setup
- Export `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY` as needed.
- Install deps (example): `pip install playwright google-genai openai anthropic pyyaml` and `python -m playwright install firefox`.

### Generators
- Baseline: Concept + Game
```bash
python generate_game.py --config configs/generators/concept_and_game.yaml
```
- Single-prompt with automated testing (given a concept)
```bash
python generate_game.py --config configs/generators/single_prompt_with_testing.yaml --concept path/to/concept.yaml
```
- Print and save:
```bash
python generate_game.py --config configs/generators/concept_and_game.yaml --debug_prompts --debug_prompts_out /tmp/prompts.txt
```

### Evaluators
- Basic testing (loads page, ENTER/keys, pixel-diff):
```bash
python evaluate_game.py --config configs/evaluators/basic_test/basic_testing.yaml --target /absolute/path/to/game_dir
```

- VLM (Gemini) from gameplay video and test info prompt
```bash
# Provide game folder path via --target to auto-record and evaluate each test
python evaluate_game.py --config configs/evaluators/vlm/vlm.yaml --target /absolute/path/to/game_dir
```

### Iterators
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

### Repository Structure
- `generators/`: concept_and_game, single_prompt_with_testing
- `evaluators/`: basic_test, vlm
- `iterators/`: code_feedback, vibe_coding
- `llm_interface/`: unified ModelAPI
- `utils/prompt_formatting/`: prompt and HTML assembly utilities
- `prompts/`: generation prompts
- `configs/`: nested configs under generators/, evaluators/, iterators/
- `utils/`: saving utilities
- `html_templates/`: HTML templates for game generation

### Generator Config Fields

Each generator YAML supports:

- `model`: provider:model-name string
- `thinking`/`thinking_budget`: enable and budget for reasoning
- `temperature`/`top_p`: sampling params
- `method`: `concept_and_game` or `single_prompt_with_testing`
- `save_dir`: base games directory (fixed as `games`)
- `output_folder`: subfolder under `games/` for this run (defaults to `method`)
- `libraries_allowed`: list of libraries to load into HTML (e.g. `["p5.js", "p5.collide2D", "p5play", "planck"]`)
- `actions_allowed`: list of allowed control inputs (e.g. `Enter`, arrows, `Shift`, `Z`, `R`, `Escape`)
- `canvas_width`/`canvas_height`: canvas dimensions (defaults 600x400)

Prompts and HTML are assembled at runtime using these fields.

