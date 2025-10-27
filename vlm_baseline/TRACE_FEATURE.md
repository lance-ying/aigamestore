# Trace/History Feature

## Overview

The VLM baseline now includes a comprehensive **trace/history system** that passes all previous screenshots and actions to the model on each turn. This gives the model full context of what has happened in the game, allowing it to make more informed decisions.

## How It Works

### 1. History Tracking

Each time an action is executed, the system records:
- **Turn number**: Which turn this was
- **Screenshot path**: Path to the screenshot taken before the action
- **Action taken**: The keyboard action that was executed
- **Valid**: Whether the action was successfully executed
- **Error** (if applicable): Any errors that occurred

### 2. Context Building

On each turn, the model receives:
1. **All previous screenshots** (in chronological order)
2. **All previous actions** (labeled with turn numbers)
3. **The current screenshot**
4. **A prompt** explaining the history and asking for the next action

### 3. Multi-Image API Calls

The implementation properly handles multiple images for each provider:

**OpenAI/Together AI:**
```python
content = [
    {"type": "image_url", "image_url": {"url": "data:image/png;base64,..."}},
    {"type": "text", "text": "[Turn 0] Action: ArrowUp"},
    {"type": "image_url", "image_url": {"url": "data:image/png;base64,..."}},
    {"type": "text", "text": "[Turn 1] Action: ArrowRight"},
    {"type": "image_url", "image_url": {"url": "data:image/png;base64,..."}},  # Current
    {"type": "text", "text": "[Current Turn 2] What should I do next?"}
]
```

**Anthropic Claude:**
```python
content = [
    {"type": "image", "source": {"type": "base64", ...}},
    {"type": "text", "text": "[Turn 0] Action: ArrowUp"},
    # ... more images and text ...
]
```

**Google Gemini:**
```python
parts = [
    types.Part.from_bytes(data=image_bytes, mime_type="image/png"),
    types.Part.from_text(text="[Turn 0] Action: ArrowUp"),
    # ... more parts ...
]
```

## Usage

### Enable History (Default)

```bash
# History is enabled by default
python vlm.py --model openai:gpt-4o --max-turns 10
```

The model will see all previous screenshots and actions on each turn.

### Disable History

```bash
# Each turn is independent (no history)
python vlm.py --model openai:gpt-4o --max-turns 10 --no-history
```

Use this for:
- Simpler games where history doesn't matter
- Faster execution (fewer images per API call)
- Lower API costs
- Baseline comparison

### Python API

```python
from vlm import VLMGamePlayer

player = VLMGamePlayer(
    model_name="openai:gpt-4o",
    game_url="https://aigamestore.org/play/6"
)

# With history (default)
stats = player.play(screenshot_dir="./with_history", include_history=True)

# Without history
stats = player.play(screenshot_dir="./without_history", include_history=False)
```

## Benefits

### 1. Better Decision Making

The model can:
- Remember what worked and what didn't
- Avoid repeating mistakes
- Understand game patterns
- Plan multi-step strategies

### 2. Sequential Understanding

For games that require:
- **Memory**: "I've been going right for 3 turns"
- **Pattern recognition**: "Every time I press Up, I move to a new level"
- **State tracking**: "I collected this item earlier"
- **Cause and effect**: "When I pressed Space, I jumped"

### 3. Complete Audit Trail

The `stats["history"]` contains the full trace:
```python
{
    "turns": 10,
    "valid_actions": 9,
    "invalid_actions": 1,
    "errors": 0,
    "duration": 45.3,
    "history": [
        {
            "turn": 0,
            "screenshot_path": "./screenshots/turn_0000.png",
            "action": "ArrowUp",
            "valid": True
        },
        {
            "turn": 1,
            "screenshot_path": "./screenshots/turn_0001.png",
            "action": "ArrowRight",
            "valid": True
        },
        # ... more entries ...
    ]
}
```

## Example Prompts

### Turn 0 (No History)
```
You are an expert AI playing a game. This is the first screenshot.
Analyze the current state and decide the best action.

What is the single best keyboard press to make right now?
Your only possible answers are: ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Space.
Respond with ONLY the key name and absolutely nothing else.
For example: ArrowUp
```

### Turn 5 (With History)
```
You are an expert AI playing a game. You have played 5 turn(s) so far.
Here is the history of your actions:
Turn 0: Action taken = ArrowUp
Turn 1: Action taken = ArrowRight
Turn 2: Action taken = ArrowRight
Turn 3: Action taken = Space
Turn 4: Action taken = ArrowDown

Now at turn 5, analyze the current screenshot and decide the next action.

What is the single best keyboard press to make right now?
Your only possible answers are: ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Space.
Respond with ONLY the key name and absolutely nothing else.
For example: ArrowUp
```

## Performance Considerations

### API Costs

With history enabled:
- **Turn 0**: 1 image
- **Turn 1**: 2 images  
- **Turn 2**: 3 images
- **Turn N**: N+1 images

**Cost grows linearly** with the number of turns.

**Example for 10 turns:**
- Total images sent: 1 + 2 + 3 + ... + 11 = 66 images
- Without history: 10 images

### Latency

More images = longer API calls:
- **With history (Turn 10)**: ~3-5 seconds per call
- **Without history**: ~1-2 seconds per call

### Memory

The system stores screenshot paths (not the images themselves), so memory usage is minimal.

## Best Practices

### 1. Start with Short Runs

```bash
# Test with just 5 turns first
python vlm.py --model openai:gpt-4o --max-turns 5
```

### 2. Compare With and Without

```bash
# With history
python vlm.py --model openai:gpt-4o --max-turns 20 --screenshot-dir ./with_hist

# Without history  
python vlm.py --model openai:gpt-4o --max-turns 20 --screenshot-dir ./no_hist --no-history
```

### 3. Use Cheaper Models for Testing

```bash
# Use cheaper models when testing with history
python vlm.py --model openai:gpt-4o-mini --max-turns 10
python vlm.py --model google:gemini-2.5-flash --max-turns 10
```

### 4. Analyze the Trace

```python
import json

# After running
with open("game_stats.json", "w") as f:
    json.dump(stats, f, indent=2)

# Analyze patterns
for entry in stats["history"]:
    print(f"Turn {entry['turn']}: {entry['action']}")
```

## Implementation Details

### Data Structure

```python
class VLMGamePlayer:
    def __init__(self, ...):
        # History tracking
        self.action_history: list[Dict[str, Any]] = []
    
    def play(self, ...):
        # Reset history for each game
        self.action_history = []
        
        for turn in range(self.max_turns):
            # Get action with history
            action = self.get_action_from_llm(screenshot, include_history=True)
            
            # Execute action
            canvas.press(action)
            
            # Record in history
            self.action_history.append({
                "turn": turn,
                "screenshot_path": screenshot_path,
                "action": action,
                "valid": True
            })
```

### Provider-Specific Handling

Each provider has its own way of handling multiple images:
- **OpenAI**: `image_url` in content array
- **Anthropic**: `image` with base64 source
- **Google**: `Part.from_bytes()` in parts array
- **Together AI**: Same as OpenAI (uses OpenAI-compatible API)

## Troubleshooting

### "Too many images" error

Some models have limits on the number of images per request:
- **Solution**: Use `--no-history` or `--max-turns` with a lower number

### Slow performance

Large history means more data to send:
- **Solution**: Use faster models (gemini-2.5-flash, gpt-4o-mini)
- **Solution**: Reduce `--max-turns`
- **Solution**: Disable history for speed tests

### Out of memory

Unlikely but possible with very long games:
- **Solution**: The system only stores paths, not images
- **Solution**: Make sure screenshot directory has enough disk space

## Future Enhancements

Potential improvements (not yet implemented):
- [ ] **Sliding window**: Only keep last N screenshots
- [ ] **Sampling**: Skip some screenshots (e.g., every other turn)
- [ ] **Summarization**: Compress history into text summaries
- [ ] **Key frames**: Only keep screenshots where something changed significantly
- [ ] **Cost tracking**: Track actual API costs per turn
- [ ] **History replay**: Visualize the game playthrough from history

## Comparison Results

You can use `compare_models.py` to test history vs no-history:

```bash
# Compare the same model with/without history
python compare_models.py --models openai:gpt-4o --max-turns 20
# Then run again with --no-history flag added to compare_models.py
```

## Credits

Trace/history feature added on October 26, 2025.
Supports all model providers: OpenAI, Anthropic, Google, Together AI.

