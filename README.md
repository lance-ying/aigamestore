# AI GameStore

Anonymous code package accompanying the NeurIPS submission. Three components:

- **`game generation/`** — Steam/App Store URL → playable HTML5 game.
  - `generation/` — generation pipeline (default model: `google:gemini-3-pro-preview`). `generate.py` is one-shot; `generate_with_testing.py` runs the generate → simulated-play test → LLM-fix loop.
  - `review_ui/` — Gradio review UI, batch cleanup scripts used to curate the study corpus, and the Playwright-based `basic_test` harness used by the test-fix loop.
- **`model evaluation/`** — VLM evaluation harness (Playwright + LLM loop over the games).
- **`human experiment/`** — the user study.
  - `frontend/` — Next.js participant frontend that served the 100-game corpus.
  - `study_data/` — collected data: 128 participants, 3,722 sessions, per-session events, scores, and feedback. Schema in `study_data/README.md`. Gameplay videos (~3.2 GB) ship separately as `aigamestore_anonymous_videos/`.

See each subfolder's README for setup and usage.
