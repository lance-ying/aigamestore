# Quick Start Guide

## Installation (30 seconds)

```bash
cd vlm_baseline
pip install -r requirements.txt
playwright install chromium
```

## Set API Keys (1 minute)

Create `.env` file:
```bash
# Choose ONE or MORE providers:

# Option 1: OpenAI
OPENAI_API_KEY=sk-...

# Option 2: Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Option 3: Google
GOOGLE_API_KEY=AI...

# Option 4: Together AI
TOGETHER_API_KEY=...
```

## Run Your First Test (10 seconds)

```bash
# Pick one based on which API key you have:

# OpenAI
python vlm.py --model openai:gpt-4o --max-turns 10

# Anthropic
python vlm.py --model anthropic:claude-3-5-sonnet-20241022 --max-turns 10

# Google
python vlm.py --model google:gemini-2.0-flash --max-turns 10

# Together AI
python vlm.py --model together:meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo --max-turns 10
```

## Common Commands

### Test Different Games
```bash
python vlm.py --model openai:gpt-4o --game-url https://aigamestore.org/play/10
```

### Watch the Browser (Debug Mode)
```bash
python vlm.py --model openai:gpt-4o --no-headless --max-turns 5
```

### Compare Multiple Models
```bash
python compare_models.py --models openai:gpt-4o google:gemini-2.0-flash --max-turns 20
```

### Custom Controls
```bash
python vlm.py --model openai:gpt-4o --allowed-keys w a s d Space
```

## Supported Models

| Provider | Recommended Model | Cost | Speed |
|----------|------------------|------|-------|
| OpenAI | `gpt-4o` | Medium | Fast |
| OpenAI | `gpt-4o-mini` | Low | Faster |
| Anthropic | `claude-3-5-sonnet-20241022` | Medium | Fast |
| Google | `gemini-2.0-flash` | Low | Fastest |
| Google | `gemini-2.5-flash-preview-04-17` | Low | Fast |
| Together | `meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo` | Low | Fast |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "API key not found" | Check your `.env` file is in `vlm_baseline/` directory |
| "Canvas not found" | Try `--no-headless` to see what's happening |
| "Module not found" | Run `pip install -r requirements.txt` |
| Too slow | Try `gemini-2.0-flash` or `gpt-4o-mini` |
| Poor performance | Increase `--turn-delay` or customize prompts |

## Next Steps

1. ✅ Test with a simple game
2. 📊 Compare different models with `compare_models.py`
3. 🎮 Try different games from https://aigamestore.org
4. 🔧 Customize prompts in `vlm.py` for better performance
5. 📖 Read [README.md](README.md) for full documentation

## Python API

```python
from vlm import VLMGamePlayer

player = VLMGamePlayer(
    model_name="openai:gpt-4o",
    game_url="https://aigamestore.org/play/6",
    max_turns=50,
)

stats = player.play(screenshot_dir="./my_screenshots")
print(f"Success rate: {stats['valid_actions'] / stats['turns'] * 100:.1f}%")
```

## Model Format

Always use: `provider:model`

Examples:
- `openai:gpt-4o`
- `anthropic:claude-3-5-sonnet-20241022`
- `google:gemini-2.0-flash`
- `together:meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo`

---

**Need help?** Check [SETUP.md](SETUP.md) or [README.md](README.md)

