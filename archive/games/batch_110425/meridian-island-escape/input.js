// input.js
import { gameState, GAME_PHASES, resetGameState } from './globals.js';
import { getAvailableDirections } from './scenes.js';
import { handlePuzzleInput } from './puzzles.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
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
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    // ESC also closes puzzle overlay
    if (gameState.interactionTarget) {
      gameState.interactionTarget = null;
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      resetGameState();
      gameState.gamePhase = GAME_PHASES.START;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase, action: "restart" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Gameplay inputs
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    handlePlayingInput(p, key, keyCode);
  }
}

function handlePlayingInput(p, key, keyCode) {
  // If puzzle is active, handle puzzle input
  if (gameState.interactionTarget) {
    const puzzleId = gameState.interactionTarget;
    
    // Number keys for code input
    if (keyCode >= 48 && keyCode <= 57) {
      const digit = String.fromCharCode(keyCode);
      handlePuzzleInput(puzzleId, digit);
    }
    
    // Z to submit
    if (keyCode === 90) {
      const result = handlePuzzleInput(puzzleId, "");
      if (result === true) {
        gameState.interactionTarget = null;
      }
    }
    
    return;
  }
  
  // Arrow keys for movement
  if (keyCode === 38) { // UP
    if (gameState.availableDirections.includes("UP")) {
      gameState.player.moveToScene("UP");
      logPlayerInfo(p);
    }
  } else if (keyCode === 40) { // DOWN
    if (gameState.availableDirections.includes("DOWN")) {
      gameState.player.moveToScene("DOWN");
      logPlayerInfo(p);
    }
  } else if (keyCode === 37) { // LEFT
    if (gameState.availableDirections.includes("LEFT")) {
      gameState.player.moveToScene("LEFT");
      logPlayerInfo(p);
    }
  } else if (keyCode === 39) { // RIGHT
    if (gameState.availableDirections.includes("RIGHT")) {
      gameState.player.moveToScene("RIGHT");
      logPlayerInfo(p);
    }
  }
  
  // Z for interaction
  if (keyCode === 90) {
    gameState.player.interact(p);
    logPlayerInfo(p);
  }
  
  // Space for inventory selection
  if (keyCode === 32) {
    const mouseX = 10 + Math.floor((p.mouseX - 10) / 35);
    if (mouseX >= 0 && mouseX < gameState.inventory.length) {
      gameState.player.toggleItemSelection(mouseX);
    }
  }
  
  // Shift for combining
  if (keyCode === 16) {
    gameState.player.combineSelectedItems();
    logPlayerInfo(p);
  }
}

export function logPlayerInfo(p) {
  if (gameState.player) {
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
}

export function processAutomatedAction(p, action) {
  if (!action) return;
  
  if (action.keyCode) {
    handleKeyPressed(p, action.key, action.keyCode);
  }
}