import { gameState, GAME_PHASES, GRID_SIZE } from './globals.js';
import { processPath, useAbility } from './combat.js';
import { isAdjacent, isTileInPath } from './grid.js';

export function handleKeyPressed(p) {
  const key = p.key;
  const keyCode = p.keyCode;
  
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: GAME_PHASES.PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: GAME_PHASES.PAUSED },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: GAME_PHASES.PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      const { resetGameState } = await import('./globals.js');
      resetGameState();
      p.logs.game_info.push({
        data: { phase: GAME_PHASES.START },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Gameplay controls (only in PLAYING phase)
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Arrow keys - move cursor
  if (keyCode === 37) { // LEFT
    gameState.cursorX = Math.max(0, gameState.cursorX - 1);
  } else if (keyCode === 39) { // RIGHT
    gameState.cursorX = Math.min(GRID_SIZE - 1, gameState.cursorX + 1);
  } else if (keyCode === 38) { // UP
    gameState.cursorY = Math.max(0, gameState.cursorY - 1);
  } else if (keyCode === 40) { // DOWN
    gameState.cursorY = Math.min(GRID_SIZE - 1, gameState.cursorY + 1);
  }
  
  // Space - start/end path
  if (keyCode === 32) {
    if (gameState.currentPath.length === 0) {
      // Start new path
      gameState.currentPath.push({ x: gameState.cursorX, y: gameState.cursorY });
    } else {
      const lastTile = gameState.currentPath[gameState.currentPath.length - 1];
      
      if (isAdjacent(lastTile.x, lastTile.y, gameState.cursorX, gameState.cursorY)) {
        if (!isTileInPath(gameState.cursorX, gameState.cursorY)) {
          // Add to path
          gameState.currentPath.push({ x: gameState.cursorX, y: gameState.cursorY });
        } else {
          // End path and process
          processPath(p);
        }
      }
    }
  }
  
  // Shift - cancel path
  if (keyCode === 16) {
    gameState.currentPath = [];
  }
  
  // Z - use ability
  if (keyCode === 90) {
    useAbility(p);
  }
  
  // Update cooldown
  if (gameState.abilityCooldown > 0) {
    gameState.abilityCooldown--;
  }
  
  // Log player position
  if (gameState.player) {
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.cursorX,
      game_y: gameState.cursorY,
      framecount: p.frameCount
    });
  }
}

export function processAutomatedInput(p, action) {
  if (!action || gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Simulate key press
  const oldKeyCode = p.keyCode;
  const oldKey = p.key;
  
  p.keyCode = action.keyCode;
  p.key = action.key;
  
  handleKeyPressed(p);
  
  p.keyCode = oldKeyCode;
  p.key = oldKey;
}