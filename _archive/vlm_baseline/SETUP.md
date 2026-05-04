# Setup Guide for VLM Baseline

## Quick Start

1. **Install Dependencies**

```bash
cd vlm_baseline
pip install -r requirements.txt
playwright install chromium
```

2. **Set Up API Keys**

Create a `.env` file in this directory with your API keys:

```bash
# OpenAI API Key (for GPT-4o, GPT-4V, etc.)
OPENAI_API_KEY=your_openai_api_key_here

# Anthropic API Key (for Claude models)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Google API Key (for Gemini models)
GOOGLE_API_KEY=your_google_api_key_here

# Together AI API Key (for Llama Vision, Qwen VL, etc.)
TOGETHER_API_KEY=your_together_api_key_here
```

You only need to set up the API keys for the providers you plan to use.

3. **Run a Test**

```bash
# Test with GPT-4o (if you have OpenAI API key)
python vlm.py --model openai:gpt-4o --max-turns 10

# Or test with Claude (if you have Anthropic API key)
python vlm.py --model anthropic:claude-3-5-sonnet-20241022 --max-turns 10

# Or test with Gemini (if you have Google API key)
python vlm.py --model google:gemini-2.0-flash --max-turns 10

# Or test with Together AI (if you have Together API key)
python vlm.py --model together:meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo --max-turns 10
```

## Getting API Keys

### OpenAI
1. Visit https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key and add it to your `.env` file

### Anthropic
1. Visit https://console.anthropic.com/
2. Sign in or create an account
3. Go to API Keys section
4. Create a new API key
5. Copy the key and add it to your `.env` file

### Google (Gemini)
1. Visit https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to your `.env` file as `GOOGLE_API_KEY`

### Together AI
1. Visit https://api.together.xyz/
2. Sign up or log in
3. Go to Settings > API Keys
4. Create a new API key
5. Copy the key and add it to your `.env` file

## Troubleshooting

### "Module not found" errors
Make sure you've installed the required packages:
```bash
pip install -r requirements.txt
```

### Playwright browser not found
Install the Chromium browser for Playwright:
```bash
playwright install chromium
```

### API key errors
- Check that your `.env` file is in the `vlm_baseline` directory
- Verify your API keys are correct (no extra spaces)
- Make sure you have sufficient credits/quota in your API account

### Canvas not found
- Run with `--no-headless` to see what's happening in the browser
- Check if the game URL is correct and accessible
- Some games may need manual interaction to start - you can add this in the code

## Advanced Configuration

### Custom Game Controls

Edit `vlm.py` to customize the allowed keys for your game:

```python
player = VLMGamePlayer(
    model_name="openai:gpt-4o",
    allowed_keys=["w", "a", "s", "d", "Space"],  # WASD + Space
    # ... other settings
)
```

### Game-Specific Initialization

If your game needs specific initialization (like pressing Enter to start), modify the `play()` method in `vlm.py`:

```python
# After canvas.click() in the play() method:
canvas.press("Enter")
time.sleep(0.5)
```

### Custom Prompts

To improve model performance on specific games, customize the prompt in `get_action_from_llm()` method:

```python
prompt = (
    f"You are an expert at playing [GAME NAME]. "
    f"The goal is to [GAME OBJECTIVE]. "
    f"Looking at this screenshot, what's the best move? "
    f"Choose from: {', '.join(self.allowed_keys)}. "
    f"Respond with ONLY the key name."
)
```

## Performance Tips

1. **Start with fewer turns**: Use `--max-turns 10` for testing
2. **Try different models**: Some models are faster/cheaper
   - Fast & cheap: `gpt-4o-mini`, `gemini-2.0-flash`
   - Balanced: `gpt-4o`, `gemini-2.5-flash-preview-04-17`
   - High quality: `claude-3-5-sonnet-20241022`
3. **Adjust turn delay**: Increase `--turn-delay` if the game needs more time to respond
4. **Use headless mode**: Default headless mode is faster (remove `--no-headless`)

## Next Steps

- See [README.md](README.md) for full documentation
- Run `python vlm.py --help` for all options
- Try `python compare_models.py` to compare different models
- Check the screenshots to see what the models are seeing

