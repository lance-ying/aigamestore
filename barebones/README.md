# Barebones Generator

`barebones/` is a standalone game generator directory. It does not import from the
rest of the `gordian` repo. All runtime code, prompt files, template files, and
source clients live inside this folder.

## What it does

- Accepts a Steam or App Store URL
- Fetches the game title and description
- Builds a short prompt for a chosen rendering/runtime library
- Asks an LLM for a small multi-file game scaffold
- Saves the output under `barebones/generated/`

## Output shape

The generator asks for a middle-ground scaffold:

- `index.html`
- `game.js`
- `state.js`
- `ui.js`
- `metadata.json`

The model may add small helper files if needed. The generator accepts that as long
as `index.html` and at least one JavaScript file are present.

## Usage

From the repo root:

```bash
uv run python3 barebones/generate.py \
  --source steam \
  --library p5js \
  --url "https://store.steampowered.com/app/1061090/Jump_King/"
```

```bash
uv run python3 barebones/generate.py \
  --source app_store \
  --library threejs \
  --url "https://apps.apple.com/us/app/color-road/id1342468799"
```

From inside `barebones/`:

```bash
uv run python3 generate.py \
  --source steam \
  --library matterjs \
  --url "https://store.steampowered.com/app/1061090/Jump_King/"
```

Useful flags:

- `--model google:gemini-3.1-pro-preview`
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

By default the generator uses Gemini, so `GOOGLE_API_KEY` is the one that matters
unless you override `--model`.

## Library selection

Accepted values:

- `p5js` or `p5.js`
- `matterjs` or `matter.js`
- `threejs` or `three.js`

## References

The `refs/` folder contains copied prompt/context files from the original project
so you can compare the new shorter prompt against the prior stack.
