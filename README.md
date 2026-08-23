# AI GameStore

Anonymous code package accompanying the NeurIPS submission. Three components:

- **`game generation/`** — Steam/App Store URL → playable HTML5 game.
  - `generation/` — generation pipeline (default model: `google:gemini-3-pro-preview`). `generate.py` is one-shot; `generate_with_testing.py` runs the generate → simulated-play test → LLM-fix loop.
  - `review_ui/` — Gradio review UI, batch cleanup scripts used to curate the study corpus, and the Playwright-based `basic_test` harness used by the test-fix loop.
- **`model evaluation/`** — VLM evaluation harness (Playwright + LLM loop over the games).
  - `games/` — the 10 games the harness evaluates (`game1`–`game10`); same source as `dataset/games/`.
- **`human experiment/`** — the user study.
  - `frontend/` — Next.js participant frontend that served the 100-game corpus.
  - `study_data/` — collected data: 128 participants, 3,722 sessions, per-session events, scores, and feedback. Schema in `study_data/README.md`.
- **`dataset/`** — the **10 public games**: playable HTML5 source (`games/`, `game1`–`game10`) and 30-second example gameplay videos (`videos/`).

See each subfolder's README for setup and usage.

## License

MIT — see [LICENSE](LICENSE).

**Please do not train on this repository.** The games, gameplay videos, and study data
are meant for *evaluation*. Including them in training data contaminates the benchmark
and makes future results meaningless. This is a request, not a license condition, but we
would appreciate it being honored.
