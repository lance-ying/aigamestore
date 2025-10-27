# VLM Baseline for Game Playing

A baseline implementation for playing browser-based games using Vision-Language Models (VLMs). This tool supports multiple model providers and can autonomously play games by analyzing screenshots and choosing keyboard actions.

## Supported Model Providers

### 1. OpenAI
- **Models**: `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-4-vision-preview`
- **Required**: Set `OPENAI_API_KEY` environment variable
- **Installation**: `pip install openai`

### 2. Anthropic (Claude)
- **Models**: `claude-3-5-sonnet-20241022`, `claude-3-opus-20240229`, `claude-3-sonnet-20240229`
- **Required**: Set `ANTHROPIC_API_KEY` environment variable
- **Installation**: `pip install anthropic`

### 3. Google (Gemini)
- **Models**: `gemini-2.0-flash`, `gemini-2.5-flash-preview-04-17`, `gemini-1.5-pro`, `gemini-1.5-flash`
- **Required**: Set `GOOGLE_API_KEY` or `GEMINI_API_KEY` environment variable
- **Installation**: `pip install google-genai`

### 4. Together AI
- **Models**: `meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo`, `Qwen/Qwen2-VL-72B-Instruct`
- **Required**: Set `TOGETHER_API_KEY` environment variable
- **Installation**: `pip install openai` (uses OpenAI-compatible API)

## Installation

1. Install Python dependencies:
```bash
pip install playwright python-dotenv

# Install specific model provider packages (choose what you need)
pip install openai           # For OpenAI and Together AI
pip install anthropic        # For Claude
pip install google-genai     # For Gemini
```

2. Install Playwright browsers:
```bash
playwright install chromium
```

3. Set up environment variables in `.env` file:
```bash
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
GOOGLE_API_KEY=your_google_key_here
TOGETHER_API_KEY=your_together_key_here
```

## Usage

### Command Line Interface

Basic usage:
```bash
python vlm.py --model openai:gpt-4o --game-url https://aigamestore.org/play/6
```

### Examples

**Play with GPT-4o (OpenAI):**
```bash
python vlm.py --model openai:gpt-4o --game-url https://aigamestore.org/play/6
```

**Play with Claude 3.5 Sonnet:**
```bash
python vlm.py --model anthropic:claude-3-5-sonnet-20241022
```

**Play with Gemini 2.0 Flash:**
```bash
python vlm.py --model google:gemini-2.0-flash
```

**Play with Together AI (Llama Vision):**
```bash
python vlm.py --model together:meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo
```

**Custom settings with visible browser:**
```bash
python vlm.py \
  --model openai:gpt-4o \
  --game-url https://aigamestore.org/play/10 \
  --no-headless \
  --max-turns 50 \
  --turn-delay 2.0 \
  --screenshot-dir ./game_screenshots
```

**Custom allowed keys:**
```bash
python vlm.py \
  --model openai:gpt-4o \
  --allowed-keys ArrowUp ArrowDown Space Enter \
  --verbose
```

### CLI Options

- `--model`: Model to use in format `provider:model` (default: `openai:gpt-4o`)
- `--game-url`: URL of the game to play (default: `https://aigamestore.org/play/6`)
- `--allowed-keys`: List of allowed keyboard keys (default: `ArrowUp ArrowDown ArrowLeft ArrowRight Space`)
- `--no-headless`: Run browser in visible mode (default: headless)
- `--max-turns`: Maximum number of turns to play (default: 100)
- `--turn-delay`: Delay in seconds between turns (default: 1.0)
- `--screenshot-dir`: Directory to save screenshots (default: `./screenshots`)
- `--verbose`: Enable verbose logging

### Python API

You can also use the VLMGamePlayer class directly in your Python code:

```python
from vlm import VLMGamePlayer

# Initialize player
player = VLMGamePlayer(
    model_name="openai:gpt-4o",
    game_url="https://aigamestore.org/play/6",
    allowed_keys=["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"],
    headless=True,
    max_turns=100,
    turn_delay=1.0,
)

# Play game
stats = player.play(screenshot_dir="./screenshots")

# Print statistics
print(f"Turns: {stats['turns']}")
print(f"Valid actions: {stats['valid_actions']}")
print(f"Success rate: {stats['valid_actions'] / stats['turns'] * 100:.1f}%")
```

## Architecture

The `VLMGamePlayer` class provides:

1. **Multi-provider Support**: Unified interface for different VLM providers
2. **Browser Automation**: Uses Playwright to control the game
3. **Screenshot Analysis**: Captures game state and sends to VLM
4. **Action Execution**: Validates and executes keyboard actions
5. **Statistics Tracking**: Records performance metrics

### Key Methods

- `__init__()`: Initialize the player with model and game settings
- `get_action_from_llm(image_path)`: Get next action from VLM based on screenshot
- `play(screenshot_dir)`: Run the main game loop
- `_find_canvas(page)`: Locate the game canvas element
- `_encode_image(image_path)`: Encode image to base64 for API calls

## Output

The tool generates:
- **Screenshots**: Saved to the specified directory (one per turn)
- **Logs**: Detailed logging of actions and events
- **Statistics**: Summary of game performance

Example statistics output:
```
==================================================
Game Statistics:
  Total turns: 100
  Valid actions: 95
  Invalid actions: 5
  Errors: 0
  Duration: 125.34 seconds
  Success rate: 95.0%
==================================================
```

## Customization

### Game-Specific Setup

Edit the `play()` method to add game-specific initialization:

```python
# In the play() method, after canvas.click():
canvas.press("Enter")  # Start the game
time.sleep(0.5)
```

### Game Over Detection

Uncomment and customize the game-over detection in the main loop:

```python
try:
    game_over = page.locator("text=Game Over").is_visible(timeout=100)
    if game_over:
        logger.info("🏁 Game Over detected")
        break
except Exception:
    pass
```

### Custom Prompts

Modify the prompt in `get_action_from_llm()` for game-specific instructions:

```python
prompt = (
    f"You are playing a racing game. Analyze this screenshot. "
    f"Choose the best action to avoid obstacles and stay on track. "
    f"Your options are: {', '.join(self.allowed_keys)}. "
    f"Respond with ONLY the key name."
)
```

## Troubleshooting

### Canvas Not Found
- Try running with `--no-headless` to see the browser
- Check if the game loads correctly in the URL
- Add delays after page load if needed

### Invalid Actions
- Check the game's keyboard controls
- Update `--allowed-keys` to match the game
- Verify the VLM understands the game mechanics

### API Errors
- Verify your API keys are set correctly
- Check API rate limits and quotas
- Ensure you have the correct model name

### Performance Issues
- Increase `--turn-delay` to give the game time to respond
- Use faster models like `gpt-4o-mini` or `gemini-2.0-flash`
- Reduce screenshot quality if needed

## License

Part of the aigamestore project.

