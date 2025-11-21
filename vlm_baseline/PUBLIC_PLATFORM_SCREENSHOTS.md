# Public Platform Canvas-Only Screenshots

## Overview

The VLM baseline now automatically captures **only the game canvas** (without controls/description sections) when playing games from the `public_platform` directory.

## What Changed

### Modified Files
1. **vlm.py** - Main VLM implementation
2. **vlm_fixed.py** - Fixed version with same updates
3. **README.md** - Added documentation for this feature
4. **example_public_platform.py** - Example script demonstrating the feature

### Key Changes

#### 1. Auto-Detection of Public Platform Games

Added a helper method that checks if the game URL contains `"public_platform"`:

```python
def _is_public_platform_game(self, game_url: str) -> bool:
    """Check if the game URL is from the public_platform directory."""
    return "public_platform" in game_url
```

#### 2. Canvas-Only Screenshot Capture

Modified the screenshot capture logic in the main game loop:

```python
# For public_platform games, capture only the canvas
# For other games, capture the full page
if self.is_public_platform:
    canvas.screenshot(path=str(screenshot_file))
else:
    page.screenshot(path=str(screenshot_file))
```

#### 3. Automatic Logging

When a public_platform game is detected, the VLM logs:
```
Detected public_platform game - will capture canvas only
```

## Benefits

### 1. Cleaner Visual Input
- Screenshots contain only the game content
- No distracting UI elements (titles, descriptions, control buttons)
- VLM can focus entirely on game state

### 2. Consistent Screenshot Size
- All public_platform games use a standardized canvas size (600x400px)
- Consistent dimensions help VLM models process images more reliably

### 3. Better Token Efficiency
- Smaller screenshots mean less visual data to process
- Potentially faster API responses and lower costs

### 4. Automatic & Transparent
- No configuration needed
- Works automatically when URL contains "public_platform"
- Backward compatible with existing games

## Usage

### Command Line

```bash
# Play a public_platform game
python vlm.py \
  --model openai:gpt-4o \
  --game-url file:///absolute/path/to/public_platform/games/snake-io/index.html \
  --max-turns 20
```

### Python API

```python
from pathlib import Path
from vlm import VLMGamePlayer

# Construct path to public_platform game
game_path = Path("../public_platform/games/snake-io/index.html").absolute()
game_url = f"file://{game_path}"

# Initialize player (auto-detects public_platform)
player = VLMGamePlayer(
    model_name="openai:gpt-4o",
    game_url=game_url,
    headless=False,
)

# Play game with canvas-only screenshots
stats = player.play()
```

### Example Script

Run the provided example script:

```bash
cd vlm_baseline
python example_public_platform.py
```

## Technical Details

### How Detection Works

The system checks if the string `"public_platform"` appears anywhere in the game URL:

- ✅ `file:///path/to/public_platform/games/snake-io/index.html` → Canvas-only
- ✅ `http://localhost:8000/public_platform/games/snake-io/` → Canvas-only
- ❌ `https://aigamestore.org/play/6` → Full-page screenshot
- ❌ `file:///path/to/games/snake-io/index.html` → Full-page screenshot

### Screenshot Capture Method

**For public_platform games:**
```python
canvas.screenshot(path=str(screenshot_file))
```
Uses Playwright's element screenshot method to capture only the canvas element.

**For other games:**
```python
page.screenshot(path=str(screenshot_file))
```
Uses Playwright's page screenshot method to capture the entire visible page.

### Compatibility

- ✅ Works with all public_platform games (consistent HTML structure)
- ✅ Backward compatible with existing non-public_platform games
- ✅ Works with all supported VLM providers (OpenAI, Anthropic, Google, Together AI)
- ✅ Works in both headless and non-headless modes

## Testing

To test the feature:

1. Run the example script:
   ```bash
   python example_public_platform.py
   ```

2. Check the screenshots directory:
   ```bash
   ls screenshots/openai_gpt-4o/[timestamp]/
   ```

3. Verify that screenshots show only the game canvas (600x400px)

## Future Enhancements

Potential improvements:
- Support for custom canvas selectors
- Option to override automatic detection
- Configurable screenshot regions
- Support for multiple canvases (if needed)

## Questions or Issues?

If you encounter any issues:
1. Check that the game URL contains "public_platform"
2. Verify the game has a `<canvas>` element
3. Run with `--no-headless` to see what's being captured
4. Check the logs for the "Detected public_platform game" message


