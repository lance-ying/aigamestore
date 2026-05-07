# Generation Module

A self-contained generator for browser games. No external repo imports —
runtime code, prompts, templates, and source clients all live in this folder.

## What it does

- Accepts a Steam or App Store URL
- Fetches the game title and description
- Builds a prompt for a chosen rendering/runtime library
- Calls an LLM for a small multi-file game scaffold
- Saves the output under the configured output root

## Output shape

A middle-ground scaffold:

- `index.html`
- `game.js`
- `state.js`
- `ui.js`
- `metadata.json`

The model may add small helper files. The generator accepts any output as long
as `index.html` and at least one JavaScript file are present.

## Usage

```bash
python generate.py \
  --source steam \
  --library p5js \
  --url "https://store.steampowered.com/app/1061090/Jump_King/"
```

```bash
python generate.py \
  --source app_store \
  --library threejs \
  --url "https://apps.apple.com/us/app/color-road/id1342468799"
```

Useful flags:

- `--model google:gemini-3-pro-preview`
- `--library p5js|matterjs|threejs`
- `--game-index 12`
- `--summary-only`
- `--skip-generation`
- `--debug-prompt`
- `--output-root /some/other/folder`

## Environment variables

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_API_KEY`

By default the generator uses Gemini, so `GOOGLE_API_KEY` is the one that
matters unless you override `--model`.

## Library selection

Accepted values:

- `p5js` or `p5.js`
- `matterjs` or `matter.js`
- `threejs` or `three.js`

## Generate-test-fix loop

`generate_with_testing.py` extends the one-shot generator with the
test-driven loop described in the paper: the LLM emits an automated-testing
plan alongside the code, the Playwright-based `basic_test` harness runs the
generated game (loading it, pressing ENTER to start, then sending randomized
gameplay keys for a few seconds), and any failure feedback is fed back to the
LLM for up to `--max-iters` fix passes.

```bash
pip install playwright
python -m playwright install firefox

python generate_with_testing.py \
  --source steam \
  --library p5js \
  --url "https://store.steampowered.com/app/1061090/Jump_King/" \
  --max-iters 2
```

Per-iteration test results, feedback, and the LLM-authored testing plan are
saved under `<game_dir>/evaluation/basic_test/` and `<game_dir>/automated_testing.md`.
The harness lives in `../review_ui/evaluators/basic_test/`; this script imports
`test_game()` from there directly.

## References

The `refs/` folder contains earlier prompt/context files for comparison
against the current shorter prompt.
