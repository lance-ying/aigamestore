// input.js - Input handling

import { GAME_PHASES, gameState } from './globals.js';
import { handlePuzzleInput } from './puzzle_ui.js';

export function setupInputHandling(p) {
  const keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    space: false,
    z: false
  };
  
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Handle game phase transitions
    if (p.keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) { // ENTER
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, message: "Game started" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return;
    }
    
    if (p.keyCode === 27 && (gameState.gamePhase === GAME_PHASES.PLAYING || gameState.gamePhase === GAME_PHASES.PAUSED)) { // ESC
      gameState.gamePhase = gameState.gamePhase === GAME_PHASES.PLAYING ? GAME_PHASES.PAUSED : GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, message: gameState.gamePhase === GAME_PHASES.PAUSED ? "Game paused" : "Game resumed" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return;
    }
    
    if (p.keyCode === 82) { // R - restart
      location.reload();
      return;
    }
    
    // Playing phase controls
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (gameState.inPuzzleMode) {
        handlePuzzleInput(p, p.key, p.keyCode);
      } else {
        if (p.keyCode === 37) keys.left = true;
        if (p.keyCode === 38) keys.up = true;
        if (p.keyCode === 39) keys.right = true;
        if (p.keyCode === 40) keys.down = true;
        if (p.keyCode === 32) keys.space = true;
      }
    }
  };
  
  p.keyReleased = function() {
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    if (p.keyCode === 37) keys.left = false;
    if (p.keyCode === 38) keys.up = false;
    if (p.keyCode === 39) keys.right = false;
    if (p.keyCode === 40) keys.down = false;
    if (p.keyCode === 32) keys.space = false;
  };
  
  return keys;
}

export function handleInteractions(p, keys, gameState) {
  if (gameState.inPuzzleMode || gameState.interactionCooldown > 0) {
    if (gameState.interactionCooldown > 0) {
      gameState.interactionCooldown--;
    }
    return;
  }
  
  // Check hint coin collection
  gameState.hintCoins.forEach(coin => {
    if (coin.checkCollection(gameState.player)) {
      gameState.collectedCoins++;
      gameState.totalHintCoins++;
      gameState.score += 10;
    }
  });
  
  // Check puzzle hotspot interaction
  if (keys.space) {
    for (let hotspot of gameState.puzzleHotspots) {
      if (!hotspot.solved && hotspot.checkInteraction(gameState.player)) {
        // Enter puzzle mode
        gameState.inPuzzleMode = true;
        gameState.currentPuzzle = gameState.puzzles.find(p => p.id === hotspot.puzzleId);
        gameState.puzzleInput = "";
        gameState.showingHint = false;
        gameState.currentHintLevel = 0;
        gameState.lastInteraction = p.frameCount;
        gameState.interactionCooldown = 30;
        
        p.logs.game_info.push({
          data: { event: "puzzle_started", puzzleId: hotspot.puzzleId },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
        break;
      }
    }
  }
}