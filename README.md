# AI GameStore

**Scalable, Open-Ended Evaluation of Machine General Intelligence with Human Games**

🎮 Website: https://www.aigamestore.org &nbsp;·&nbsp; 📄 Paper: [arXiv:2602.17594](https://arxiv.org/abs/2602.17594)

## Overview

AI GameStore evaluates machine general intelligence through performance on **human games** —
games designed by humans for humans. The space of all such games people can imagine and
enjoy, the **Multiverse of Human Games**, is a uniquely comprehensive, objective, and
continuously evolving testbed: games are miniatures of real-world human activity that demand
strategic planning, resource management, pattern recognition, spatial reasoning, rapid
learning of novel rules, memory, and social reasoning, all under standardized, quantifiable
metrics.

Rather than hand-build such a benchmark, AI GameStore is a scalable, open-ended platform that
uses LLMs with humans in the loop to **automatically source and adapt** games from popular
digital gaming platforms into standardized, containerized, web-playable variants for scaled
evaluation against humans. Because the source marketplaces are constantly refreshed with new
popular titles, the benchmark naturally resists overfitting and saturation.

As a proof of concept, this repository curates 100 games generated from the Apple App Store
and Steam top charts, and evaluates seven frontier vision-language models on short episodes
of play. The best models achieved **less than 10% of the human average score on the majority
of games**, struggling especially with games that challenge world-model learning, memory, and
planning.

## Code package

Code package accompanying the paper. Three components:

- **`game generation/`** — Steam/App Store URL → playable HTML5 game.
  - `generation/` — generation pipeline (default model: `google:gemini-3-pro-preview`). `generate.py` is one-shot; `generate_with_testing.py` runs the generate → simulated-play test → LLM-fix loop.
  - `review_ui/` — Gradio review UI, batch cleanup scripts used to curate the study corpus, and the Playwright-based `basic_test` harness used by the test-fix loop.
- **`model evaluation/`** — VLM evaluation harness (Playwright + LLM loop over the games).
- **`human experiment/`** — the user study.
  - `frontend/` — Next.js participant frontend that served the 100-game corpus.
  - `study_data/` — collected data: 128 participants, 3,722 sessions, per-session events, scores, and feedback. Schema in `study_data/README.md`.

See each subfolder's README for setup and usage.

## Citation

AI Gamestore: Scalable, Open-Ended Evaluation of Machine General Intelligence with Human Games.
Lance Ying, Ryan Truong, Prafull Sharma, Kaiya Ivy Zhao, Nathan Cloos, Kelsey R. Allen,
Thomas L. Griffiths, Katherine M. Collins, José Hernández-Orallo, Phillip Isola,
Samuel J. Gershman, Joshua B. Tenenbaum. arXiv:2602.17594, 2026.

```bibtex
@misc{ying2026aigamestore,
  title  = {AI Gamestore: Scalable, Open-Ended Evaluation of Machine General
            Intelligence with Human Games},
  author = {Ying, Lance and Truong, Ryan and Sharma, Prafull and Zhao, Kaiya Ivy and
            Cloos, Nathan and Allen, Kelsey R. and Griffiths, Thomas L. and
            Collins, Katherine M. and Hern\'andez-Orallo, Jos\'e and Isola, Phillip and
            Gershman, Samuel J. and Tenenbaum, Joshua B.},
  year   = {2026},
  eprint = {2602.17594},
  archivePrefix = {arXiv},
  url    = {https://arxiv.org/abs/2602.17594},
}
```
