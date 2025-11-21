# Game Generation

### Setup
- Environment: `conda env create -f environment.yml && conda activate gordian`
- Set Model API keys as environment variables: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY` as needed.

### Modules
- Generators: `generators/` (Concept + Game, Single Prompt with Testing)
- Evaluators: `evaluators/` (Basic Test, VLM/Gemini)
- Iterators: `iterators/` (Base code iterator, Vibe coding, VLM feedback)

### Pipelines for game generation

```bash
# Concept and Game: Concept → Game → Basic test → Bug fix (if needed)
python -m pipelines.game_pipeline --pipeline configs/pipelines/concept_to_game_basic.yaml

# Single prompt gen (requires concept): Single prompt gen (requires concept) → Basic test → Bug fix
python -m pipelines.game_pipeline --pipeline configs/pipelines/single_prompt_basic.yaml --concept game_concepts/game_0002.yaml
```

### Pipelines for game iteration
```bash
# Vibe coding on an existing game: Vibe coding on an existing game → Basic test → Bug fix
python -m pipelines.game_pipeline --pipeline configs/pipelines/single_prompt_vibe.yaml --game_folder /absolute/path/to/game_dir

# VLM evaluator: VLM eval (Gemini) → VLM feedback iteration → Basic test → Bug fix
python -m pipelines.game_pipeline --pipeline configs/pipelines/single_prompt_vlm.yaml --game_folder /absolute/path/to/game_dir
```

Flags:
- `--concept`: path to YAML or raw text
- `--game_folder`: path to an existing game directory
- `--debug_prompts`: saves prompts under `evaluation/prompts/` inside the game folder

### Direct module usage
- Generators:
  - Baseline: `python scripts/cli/generate_game.py --config configs/generators/concept_and_game.yaml`
  - Single prompt: `python scripts/cli/generate_game.py --config configs/generators/single_prompt_with_testing.yaml --concept path/to/concept.yaml`
- Evaluators:
  - Basic test (saves results to evaluation/basic_test and prints rich panel):
    - `python scripts/cli/evaluate_game.py --config configs/evaluators/basic_testing.yaml --game_folder /abs/path/to/game_dir --debug`
    - Artifacts under `evaluation/basic_test/`:
      - `results.json` (includes `start_on_enter` and `interaction`)
      - `keypress_log.json` (per-key state snapshots)
      - `feedback.md` (used by basic bug-fix iterator)
  - VLM (Gemini) evaluation (records videos, writes evaluation/vlm/results.json):
    - `python scripts/cli/evaluate_game.py --config configs/evaluators/vlm.yaml --game_folder /abs/path/to/game_dir`
- Iterators:
  - Vibe coding (out-of-place default): `python scripts/cli/iterate_game.py --config configs/iterators/vibe_coding.yaml [--output_dir /abs/output]`
  - Basic bug fix (in-place; reads `evaluation/basic_test/feedback.md`):
    - `python scripts/cli/iterate_game.py --config configs/iterators/code_iterator.yaml --mode basic_bug_fix --game_folder /abs/path/to/game_dir`
  - VLM feedback (out-of-place default): `python scripts/cli/iterate_game.py --config configs/iterators/vlm_feedback.yaml [--output_dir /abs/output]`

Notes
- Iterator modes:
  - In-place (basic-testing fix): updates only the returned file, backs up full prior game to `.previous_code/iter_%02d`, and logs prompts/responses into `iteration_info/iter_%02d`.
  - Out-of-place (vibe coding, VLM feedback): copies the input game to the `--output_dir` (or evaluation/iteration subdir if omitted), applies the single-file update there, and writes iteration logs alongside in `iteration_info/iter_%02d`.
- Token usage is recorded where available in the iteration metadata files.

### Repository Structure
- `generators/`, `evaluators/`, `iterators/`, `pipelines/`, `configs/`, `llm_interface/`, `utils/`, `prompts/`, `html_templates/`
- `scripts/cli/` - Main CLI scripts (generate_game.py, evaluate_game.py, iterate_game.py, expand_concept.py)
- `scripts/rl/` - Reinforcement learning tools (train_rl.py, gym_wrapper.py, etc.)
- `scripts/tests/` - Test scripts
- `scripts/utils/` - Utility scripts
- `scripts/js/` - JavaScript utilities
- `docs/` - Documentation files
- `data/` - Data files

### Gemini model selection for VLM
Configure the VLM evaluator’s model via pipeline YAML (default `gemini-2.5-flash`, optionally `gemini-2.5-pro`). See Gemini model versions: https://ai.google.dev/gemini-api/docs/models#model-versions

### Conda environment
Create and activate the `gordian` conda env:

```bash
conda env create -f environment.yml
conda activate gordian
```

Install Playwright browsers (one-time):
```bash
python -m playwright install firefox
```

