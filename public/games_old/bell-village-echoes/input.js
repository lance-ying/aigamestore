// input.js - Input handling

import { GAME_PHASES, CONTROL_MODES, gameState } from './globals.js';
import { handlePlayingInput, handleInventoryInput, handlePuzzleInput } from './gameplay.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // ENTER - Start game
  if (keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) {
    startGame(p);
    return;
  }
  
  // R - Restart
  if (keyCode === 82 && (
    gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ||
    gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE ||
    gameState.gamePhase === GAME_PHASES.PAUSED
  )) {
    restartGame(p);
    return;
  }
  
  // ESC - Pause/Unpause
  if (keyCode === 27) {
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
    } else if (gameState.gamePhase === GAME_PHASES.INVENTORY_OPEN) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: GAME_PHASES.PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PUZZLE_ACTIVE) {
      gameState.gamePhase = gameState.phaseBeforePuzzle || GAME_PHASES.PLAYING;
      gameState.activePuzzleId = null;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Phase-specific inputs
  switch (gameState.gamePhase) {
    case GAME_PHASES.PLAYING:
      handlePlayingInput(p, key, keyCode);
      break;
    case GAME_PHASES.INVENTORY_OPEN:
      handleInventoryInput(p, key, keyCode);
      break;
    case GAME_PHASES.PUZZLE_ACTIVE:
      handlePuzzleInput(p, key, keyCode);
      break;
    case GAME_PHASES.LEVEL_COMPLETE:
      if (keyCode === 32) { // SPACE
        advanceToNextLevel(p);
      }
      break;
  }
}

export function handleKeyReleased(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyReleased',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Reset hint hold time when shift is released
  if (keyCode === 16) {
    gameState.hintShiftHoldTime = 0;
  }
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.currentLevel = 1;
  gameState.score = 0;
  gameState.inventory = [];
  gameState.hotspotStates = {};
  gameState.activeInventoryItemId = null;
  gameState.selectedHotspotIndex = 0;
  gameState.selectedInventoryIndex = 0;
  gameState.hintsUsedThisLevel = 0;
  
  initializeLevel(p, 1);
  
  p.logs.game_info.push({
    data: { phase: GAME_PHASES.PLAYING, level: 1 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.currentLevel = 1;
  gameState.score = 0;
  gameState.inventory = [];
  gameState.hotspotStates = {};
  gameState.activeInventoryItemId = null;
  gameState.activePuzzleId = null;
  gameState.selectedHotspotIndex = 0;
  gameState.selectedInventoryIndex = 0;
  gameState.hintsUsedThisLevel = 0;
  
  p.logs.game_info.push({
    data: { phase: GAME_PHASES.START },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function initializeLevel(p, levelNum) {
  import('./levels.js').then(module => {
    const level = module.LEVEL_DATA[levelNum];
    if (!level) return;
    
    gameState.currentSceneId = level.startScene;
    gameState.levelTimeRemaining = level.timeLimit;
    gameState.levelStartTime = Date.now();
    gameState.hintsUsedThisLevel = 0;
    gameState.levelScore = 0;
    gameState.selectedHotspotIndex = 0;
    
    // Reset puzzle states
    import('./puzzles.js').then(puzzleModule => {
      Object.keys(puzzleModule.PUZZLES).forEach(puzzleId => {
        puzzleModule.resetPuzzle(puzzleId);
      });
    });
  });
}

function advanceToNextLevel(p) {
  if (gameState.currentLevel >= 3) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { phase: GAME_PHASES.GAME_OVER_WIN, finalScore: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else {
    gameState.currentLevel++;
    gameState.gamePhase = GAME_PHASES.PLAYING;
    initializeLevel(p, gameState.currentLevel);
    
    p.logs.game_info.push({
      data: { phase: GAME_PHASES.PLAYING, level: gameState.currentLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}