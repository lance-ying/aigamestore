# Making logs.json Complete for Replay

## The Goal

Make `logs.json` contain all the input data needed for perfect replay, so we can rely on it instead of `inputs.json` (which only has timestamps, not framecounts).

## Current Situation

1. **battle-zone**: Logs inputs to `p.logs.inputs` with framecounts ✅
2. **fruit-merge**: Logs inputs to `window.logs.inputs` with framecounts ✅, but recorder wasn't capturing it (now fixed)

## What Needs to Be in logs.json

The `logs.json` file should have this structure:

```json
{
  "game_info": [
    {
      "game_status": "START",
      "data": {},
      "framecount": 0,
      "timestamp": 1234567890
    }
  ],
  "player_info": [
    {
      "screen_x": 300,
      "screen_y": 200,
      "game_x": 600,
      "game_y": 400,
      "framecount": 100,
      "timestamp": 1234567890
    }
  ],
  "inputs": [
    {
      "input_type": "keyPressed",
      "data": { "key": "ArrowLeft", "keyCode": 37 },
      "framecount": 150,
      "timestamp": 1234567890
    },
    {
      "input_type": "keyReleased",
      "data": { "key": "ArrowLeft", "keyCode": 37 },
      "framecount": 200,
      "timestamp": 1234567890
    }
  ]
}
```

## Key Requirements

1. **All keyboard inputs must be logged** with:
   - `input_type`: "keyPressed" or "keyReleased"
   - `data.key`: The key name (e.g., "ArrowLeft", "z", " ")
   - `data.keyCode`: The key code number
   - `framecount`: The exact frame when the input occurred
   - `timestamp`: When the input occurred

2. **Game must expose logs object** in one of these ways:
   - `window.p.logs` (p5.js games)
   - `window.gameInstance.logs` (some p5.js games)
   - `window.logs` (non-p5 games like fruit-merge)
   - `canvas._pInst.logs` (p5.js via canvas)

3. **Input logging must happen in input handlers**:
   ```javascript
   // In keydown/keyup handlers
   logs.inputs.push({
     input_type: 'keydown', // or 'keyup'
     data: { key: e.key, keyCode: e.keyCode },
     framecount: currentFrameCount,
     timestamp: Date.now()
   });
   ```

## How to Fix a Game

1. **Find the input handling code** (usually in `input.js` or `game.js`)

2. **Add logging to keydown/keyup handlers**:
   ```javascript
   function handleKeyDown(e) {
     // Log the input
     logs.inputs.push({
       input_type: 'keydown',
       data: { key: e.key, keyCode: e.keyCode },
       framecount: gameState.frameCount, // or p.frameCount for p5.js
       timestamp: Date.now()
     });
     
     // ... rest of handler
   }
   
   function handleKeyUp(e) {
     logs.inputs.push({
       input_type: 'keyup',
       data: { key: e.key, keyCode: e.keyCode },
       framecount: gameState.frameCount,
       timestamp: Date.now()
     });
     
     // ... rest of handler
   }
   ```

3. **Make sure logs object is exposed**:
   ```javascript
   // For p5.js games
   p.logs = {
     game_info: [],
     player_info: [],
     inputs: []
   };
   
   // For non-p5 games
   window.logs = {
     game_info: [],
     player_info: [],
     inputs: []
   };
   ```

4. **Verify the recorder script can find it** (now checks `window.logs` too)

## Why This Is Better Than inputs.json

- **Framecounts**: `logs.json` has exact framecounts, `inputs.json` only has timestamps
- **Game context**: Inputs are logged at the exact frame they're processed
- **No estimation needed**: No need to estimate frames from timestamps
- **More accurate**: Eliminates timing drift issues

## Testing

After fixing a game:
1. Play the game and record a session
2. Check `logs.json` - it should have an `inputs` array with entries
3. Try replaying using only `logs.json` (no `inputs.json`)
4. Verify the replay matches the original gameplay


