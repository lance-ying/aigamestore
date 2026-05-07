# Understanding Replay Discrepancies

## Why Discrepancies Occur

Discrepancies happen when the replayed game state doesn't match the logged game state. Here are the main causes:

### 1. **Input Timing Issues**

**Problem**: `inputs.json` only has timestamps, not framecounts. The replay system estimates frames from timestamps, which can accumulate errors over time.

**Solution**: The system now prioritizes `logs.json` inputs which have framecounts (more accurate).

### 2. **Frame Estimation Errors**

When inputs don't have framecounts, frames are estimated using:
```
frame = (timestamp - startTimestamp) / 1000 * 60
```

This can drift due to:
- Browser performance variations
- Frame rate not being exactly 60 FPS
- Timestamp precision issues

### 3. **Game Restarts**

The game may have been restarted multiple times during the session. Each restart:
- Resets the game state
- May reset the RNG seed
- Changes the frame count context

The replay system now handles restarts by:
- Detecting `START` → `PLAYING` transitions
- Resetting game state and RNG seed
- Continuing from the correct frame

### 4. **Floating Point Precision**

Small differences in floating point calculations can accumulate:
- Position calculations
- Physics updates
- Enemy AI movements

**Tolerance**: The validation uses a 2-pixel tolerance to account for these small differences.

### 5. **Non-Deterministic Elements**

Even with seeded RNG, other sources of non-determinism may exist:
- Browser-specific behavior
- Performance timing
- Event loop ordering

## How to Reduce Discrepancies

1. **Use logs.json inputs**: The system now prioritizes inputs from `logs.json` which have framecounts
2. **Check console logs**: The first few discrepancies are logged to console for debugging
3. **Verify RNG seeding**: Make sure the RNG is properly seeded (seed 42)
4. **Check game restarts**: Multiple restarts are now handled, but verify they're detected correctly

## Validation Details

- **Tolerance**: 2 pixels (accounts for floating point precision)
- **Max logged discrepancies**: 1000 (to prevent memory issues)
- **First 5 discrepancies**: Logged to console for debugging

## Debugging Tips

1. Open browser console to see discrepancy details
2. Check if inputs are being loaded from `logs.json` (preferred) or `inputs.json`
3. Verify game phase transitions are being detected
4. Check if RNG is being reseeded on game restarts


