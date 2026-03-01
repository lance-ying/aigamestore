# Battle Zone Replay System

This replay system allows you to recreate gameplay videos from recorded `inputs.json` and `logs.json` files.

## Features

- **Deterministic Replay**: Uses seeded RNG to ensure identical gameplay
- **Frame-Accurate Inputs**: Replays inputs at exact frame numbers
- **Browser Replay**: View replays directly in the browser
- **Video Generation**: Record videos from replays
- **Validation**: Compare replayed positions with logged positions

## Files

- `rng.js` - Seeded random number generator (replaces Math.random())
- `replay_controller.js` - Core replay logic for loading and managing replay data
- `replay_ui.js` - UI controls for replay (play/pause/speed)
- `replay.html` - Standalone page for viewing replays

## Usage

### Option 1: Using replay.html

1. Open `replay.html` in a browser
2. Load `inputs.json` and `logs.json` files (either from files or URLs)
3. Click "Load Replay"
4. Use the replay controls in the top-right corner

### Option 2: URL Parameters

Add to game URL:
```
?replay_inputs=URL_TO_INPUTS_JSON&replay_logs=URL_TO_LOGS_JSON
```

### Option 3: Programmatic

```javascript
// In browser console or code
await window.initReplay(inputsUrl, logsUrl);
```

## Replay Controls

- **Play/Pause**: Toggle replay playback
- **Stop**: Stop replay and return to normal mode
- **Speed**: Adjust replay speed (0.1x to 5.0x)
- **Frame Counter**: Shows current frame and total frames
- **Record Video**: Record the replay as a video file

## Validation

The replay system automatically validates player positions against logged positions. Discrepancies are shown in the replay UI.

## Batch Fixes

Use the batch scripts to fix other games for replay compatibility:

```bash
# Make games deterministic
python fix_game_gui_standalone/batch_fix_replay_determinism.py --directory games/games_pilot

# Fix input handling
python fix_game_gui_standalone/batch_fix_replay_inputs.py --directory games/games_pilot
```

## Technical Details

### Determinism

- All `Math.random()` calls replaced with seeded RNG
- RNG initialized with seed 42 (matching `p.randomSeed(42)`)
- Same inputs produce identical output

### Input Mapping

The system maps keyboard events from `inputs.json` to game key codes:
- Arrow keys → Movement
- Z → Shoot
- Space → Sprint
- Shift → Crouch
- Enter → Start/Pause
- ESC → Pause/Resume

### Frame Synchronization

- Uses `framecount` from logs when available
- Falls back to timestamp-based estimation
- Applies inputs at exact frame numbers
