// input.js - Input handling
import { gameState, GAME_PHASES, initGameState, PANEL_COLS, PANEL_ROWS } from './globals.js';
import { setupLevel, checkLevelComplete } from './levels.js';
import { saveStateForUndo, performUndo } from './undo.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase transition controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { gamePhase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      restartGame(p);
    }
    return;
  }
  
  // Gameplay controls (only during PLAYING phase)
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  handleGameplayInput(p, keyCode);
}

function handleGameplayInput(p, keyCode) {
  // Arrow keys - Navigate between panels
  if (keyCode === 37) { // LEFT
    if (!gameState.swapMode) {
      gameState.selectedPanel = (gameState.selectedPanel % PANEL_COLS === 0) 
        ? gameState.selectedPanel + PANEL_COLS - 1 
        : gameState.selectedPanel - 1;
    }
  } else if (keyCode === 39) { // RIGHT
    if (!gameState.swapMode) {
      gameState.selectedPanel = ((gameState.selectedPanel + 1) % PANEL_COLS === 0) 
        ? gameState.selectedPanel - PANEL_COLS + 1 
        : gameState.selectedPanel + 1;
    }
  } else if (keyCode === 38) { // UP
    if (!gameState.swapMode) {
      gameState.selectedPanel = (gameState.selectedPanel < PANEL_COLS) 
        ? gameState.selectedPanel + PANEL_COLS * (PANEL_ROWS - 1) 
        : gameState.selectedPanel - PANEL_COLS;
    }
  } else if (keyCode === 40) { // DOWN
    if (!gameState.swapMode) {
      gameState.selectedPanel = (gameState.selectedPanel >= PANEL_COLS * (PANEL_ROWS - 1)) 
        ? gameState.selectedPanel % PANEL_COLS 
        : gameState.selectedPanel + PANEL_COLS;
    }
  } else if (keyCode === 32) { // SPACE - Interact/Zoom
    handleSpaceInteraction(p);
  } else if (keyCode === 16) { // SHIFT - Swap panels
    handleShiftSwap(p);
  } else if (keyCode === 90) { // Z - Undo
    performUndo(p);
  }
}

function handleSpaceInteraction(p) {
  if (gameState.swapMode) return;
  
  const panel = gameState.panels[gameState.selectedPanel];
  if (!panel) return;
  
  saveStateForUndo();
  
  // Try to zoom in
  if (panel.canZoomIn()) {
    panel.zoomIn();
    gameState.score += 10;
    
    // Check if orb is revealed
    if (panel.checkOrbReveal(gameState.panels)) {
      gameState.orbsCollected++;
      gameState.score += 100;
      gameState.levelComplete = true;
      gameState.transitionTimer = 60; // 1 second at 60 FPS
      
      p.logs.game_info.push({
        data: { 
          event: "orb_collected", 
          level: gameState.currentLevel,
          orbsCollected: gameState.orbsCollected 
        },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (panel.canZoomOut()) {
    panel.zoomOut();
    gameState.score += 5;
  }
}

function handleShiftSwap(p) {
  if (!gameState.swapMode) {
    // Enter swap mode
    gameState.swapMode = true;
    gameState.swapFrom = gameState.selectedPanel;
  } else {
    // Execute swap
    if (gameState.swapFrom !== gameState.selectedPanel) {
      saveStateForUndo();
      
      const temp = gameState.panels[gameState.swapFrom];
      gameState.panels[gameState.swapFrom] = gameState.panels[gameState.selectedPanel];
      gameState.panels[gameState.selectedPanel] = temp;
      
      // Update indices
      gameState.panels[gameState.swapFrom].index = gameState.swapFrom;
      gameState.panels[gameState.selectedPanel].index = gameState.selectedPanel;
      
      gameState.score += 15;
    }
    
    // Exit swap mode
    gameState.swapMode = false;
    gameState.swapFrom = -1;
  }
}

function startGame(p) {
  initGameState();
  gameState.panels = setupLevel(0);
  gameState.gamePhase = GAME_PHASES.PLAYING;
  
  p.logs.game_info.push({
    data: { gamePhase: "PLAYING", level: 0 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  initGameState();
  gameState.gamePhase = GAME_PHASES.START;
  
  p.logs.game_info.push({
    data: { gamePhase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function processAutomatedInput(p, action) {
  if (!action || gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  if (action.keyCode) {
    handleGameplayInput(p, action.keyCode);
  }
}