# Review UI + Study-Prep Scripts

Tooling for reviewing, fixing, and preparing generated games for the user study.

## Components

- **Gradio review UI** (`scripts/utils/fix_game_gui.py`): browse, preview, flag,
  and fix games via natural-language feedback. Used during corpus curation.
- **Single-game fixer** (`scripts/fix_game.py`): CLI wrapper around the
  `FeedbackFixIterator`. Applies one feedback prompt to one game directory.
- **Batch study-prep** (`scripts/batch/`): scripts that applied consistent
  LLM-driven cleanup passes over the corpus before the user study.

## Study-prep batch scripts

These scripts are how the participant-facing corpus was anonymized and
sanitized. Each iterates over a games directory and calls `fix_game.py` per
game with a fixed feedback prompt.

| Script | Purpose |
|---|---|
| `batch/batch_remove_game_names.py` | Strip original game-title text from start screens; replace with "press enter to begin". Preserves controls + game description. Anonymizes the corpus so participants are not biased by recognizing the source title. |
| `batch/batch_remove_pause_overlay.py` | Remove the pause-screen overlay while preserving freeze/unfreeze logic. Cleaner participant UX. |
| `batch/batch_remove_test_files.py` | Strip test controllers, test-mode buttons, and other automated-testing scaffolding from game files. |

Each script accepts:

- `--directory <path>` — the games directory to operate on
- `--pattern <glob>` — optional glob filter (e.g. `space-*`)
- `--model <id>` — LLM to use; defaults to `google:gemini-2.5-flash`
- `--max-games <n>` / `--skip-to <n>` — partial / resumable runs
- `--dry-run` — list affected games without modifying them

`batch_remove_game_names.py` additionally supports `--from-violations-csv`
to filter to games that a prior validation pass flagged as containing
title-screen game-name leakage.

Example:

```bash
python scripts/batch/batch_remove_game_names.py \
  --directory <games_dir> \
  --model google:gemini-2.5-flash
```

## Single-game fixer

```bash
python scripts/fix_game.py <game_dir> "<feedback>"
python scripts/fix_game.py <game_dir> --feedback feedback.txt
python scripts/fix_game.py <game_dir> --restore   # roll back last fix
```

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env  # set ANTHROPIC_API_KEY / GOOGLE_API_KEY / OPENAI_API_KEY
```

## Run the GUI

```bash
python scripts/utils/fix_game_gui.py             # default port 7860
python scripts/utils/fix_game_gui.py --large-text
python scripts/utils/fix_game_gui.py --share     # public Gradio link
```

## Layout

```
review_ui/
├── scripts/
│   ├── utils/fix_game_gui.py      # Gradio review/fix UI
│   ├── fix_game.py                # Single-game CLI fixer
│   └── batch/                     # Study-prep batch passes
├── iterators/                     # FeedbackFixIterator, base iterator
├── evaluators/                    # Basic test runner (Playwright)
├── llm_interface/                 # Model API wrapper (Claude / GPT / Gemini)
├── utils/                         # Prompt formatting + log writers
└── requirements.txt
```
