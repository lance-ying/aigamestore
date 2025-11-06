// input.js - Input handling

import { gameState, KEY_ENTER, KEY_ESC, KEY_SPACE, KEY_SHIFT, KEY_Z, KEY_R, KEY_LEFT, KEY_UP, KEY_RIGHT, KEY_DOWN, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, CONTROL_HUMAN } from './globals.js';
import { handleMenuInput } from './ui.js';

export function handleKeyPressed(p, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase transitions
  if (keyCode === KEY_ENTER && gameState.gamePhase === PHASE_START) {
    startGame(p);
    return;
  }
  
  if (keyCode === KEY_ESC && (gameState.gamePhase === PHASE_PLAYING || gameState.gamePhase === PHASE_PAUSED)) {
    togglePause(p);
    return;
  }
  
  if (keyCode === KEY_R && (gameState.gamePhase.includes("GAME_OVER"))) {
    restartGame(p);
    return;
  }
  
  // Gameplay inputs (only in PLAYING phase and HUMAN mode)
  if (gameState.gamePhase === PHASE_PLAYING && gameState.controlMode === CONTROL_HUMAN) {
    handleGameplayInput(keyCode);
  }
}

function startGame(p) {
  gameState.gamePhase = PHASE_PLAYING;
  
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function togglePause(p) {
  if (gameState.gamePhase === PHASE_PLAYING) {
    gameState.gamePhase = PHASE_PAUSED;
    p.noLoop();
  } else if (gameState.gamePhase === PHASE_PAUSED) {
    gameState.gamePhase = PHASE_PLAYING;
    p.loop();
  }
  
  p.logs.game_info.push({
    data: { phase: gameState.gamePhase },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  // Reset game state
  gameState.units = [];
  gameState.enemies = [];
  gameState.entities = [];
  gameState.selectedUnit = null;
  gameState.score = 0;
  gameState.gold = 150;
  gameState.level = 1;
  gameState.wave = 0;
  gameState.escapedEnemies = 0;
  gameState.menuOpen = false;
  gameState.menuSelection = 0;
  gameState.powerUps = [];
  gameState.gamePhase = PHASE_START;
  
  p.logs.game_info.push({
    data: { phase: PHASE_START },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (gameState.gamePhase === PHASE_PAUSED) {
    p.loop();
  }
}

function handleGameplayInput(keyCode) {
  // Menu handling
  if (gameState.menuOpen) {
    handleMenuInput(keyCode);
    return;
  }
  
  // Open menu
  if (keyCode === KEY_Z) {
    gameState.menuOpen = true;
    gameState.menuSelection = 0;
    return;
  }
  
  // Unit selection
  if (keyCode === KEY_SPACE) {
    if (gameState.selectedUnit) {
      gameState.selectedUnit = null;
    } else {
      selectNearestUnit();
    }
    return;
  }
  
  // Cancel selection
  if (keyCode === KEY_SHIFT && gameState.selectedUnit) {
    gameState.selectedUnit = null;
    return;
  }
  
  // Move selected unit
  if (gameState.selectedUnit) {
    const moveAmount = 15;
    let targetX = gameState.selectedUnit.targetX;
    let targetY = gameState.selectedUnit.targetY;
    
    if (keyCode === KEY_LEFT) targetX -= moveAmount;
    if (keyCode === KEY_RIGHT) targetX += moveAmount;
    if (keyCode === KEY_UP) targetY -= moveAmount;
    if (keyCode === KEY_DOWN) targetY += moveAmount;
    
    if (keyCode === KEY_LEFT || keyCode === KEY_RIGHT || keyCode === KEY_UP || keyCode === KEY_DOWN) {
      gameState.selectedUnit.moveTo(targetX, targetY);
    }
  }
}

function selectNearestUnit() {
  if (gameState.units.length === 0) return;
  
  // Cycle through units
  let currentIndex = gameState.selectedUnit ? gameState.units.indexOf(gameState.selectedUnit) : -1;
  currentIndex = (currentIndex + 1) % gameState.units.length;
  gameState.selectedUnit = gameState.units[currentIndex];
}

export function processAutomatedInput(p, action) {
  if (!action) return;
  
  // Process each key in the action
  if (action.keyPressed) {
    handleKeyPressed(p, action.keyPressed);
  }
}