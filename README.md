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

As a proof of concept, we curated 100 games generated from the Apple App Store
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
  - `frontend/` — Next.js participant frontend used for the study, shipped with the 10 public games.
  - `study_data/` — collected data for the final 100 games: 87 participants, 2,281 sessions, scores, per-session events, and feedback (participant IDs pseudonymized). Schema and Croissant metadata in `study_data/`.

See each subfolder's README for setup and usage.

## Public games and private test set

Ten of the 100 games are public: they are in `model evaluation/games/` (evaluation versions)
and `human experiment/frontend/public/games/` (study versions). The remaining 90 games are
held out as a private test set to limit benchmark contamination. Human scores for all 100
games are included in `human experiment/study_data/`; raw telemetry and free-text feedback
are released for the public games only. To evaluate a model on the full suite, see
[aigamestore.org](https://aigamestore.org).

## License

Code is released under the [MIT License](LICENSE). The study data in
`human experiment/study_data/` is released under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

**Please do not train AI models on the AI GameStore games, gameplay videos, or study data.**
They are meant for evaluation; including them in training data contaminates the benchmark.
This is a request, not a license condition.

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
