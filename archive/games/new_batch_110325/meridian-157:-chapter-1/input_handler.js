// input_handler.js - Input handling

import { gameState, GAME_PHASES } from './globals.js';
import { navigateToScene, interactWithHotspot, getVisibleHotspots, getCurrentScene } from './scene_manager.js';
import get_automated_testing_action from './automated_testing_controller.js';

export function handleKeyPress(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase transitions
  if (keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    logGameInfo(p, "Game started");
    return;
  }
  
  if (keyCode === 27 && (gameState.gamePhase === GAME_PHASES.PLAYING || gameState.gamePhase === GAME_PHASES.PAUSED)) {
    gameState.gamePhase = gameState.gamePhase === GAME_PHASES.PAUSED ? GAME_PHASES.PLAYING : GAME_PHASES.PAUSED;
    logGameInfo(p, `Game ${gameState.gamePhase === GAME_PHASES.PAUSED ? 'paused' : 'resumed'}`);
    return;
  }
  
  if (keyCode === 82) {
    resetGame();
    logGameInfo(p, "Game reset");
    return;
  }
  
  // Gameplay inputs
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    handleGameplayInput(p, keyCode);
  }
}

function handleGameplayInput(p, keyCode) {
  gameState.framesSinceLastAction = 0;
  
  // Arrow keys - navigation
  if (keyCode === 37) { // LEFT
    navigateToScene('left');
  } else if (keyCode === 39) { // RIGHT
    navigateToScene('right');
  } else if (keyCode === 38) { // UP
    navigateToScene('up');
  } else if (keyCode === 40) { // DOWN
    navigateToScene('down');
  }
  // Space - interact
  else if (keyCode === 32) {
    handleInteraction(p);
  }
  // Z - cycle inventory
  else if (keyCode === 90) {
    cycleInventory();
  }
  // Shift - hint
  else if (keyCode === 16) {
    requestHint(p);
  }
}

function handleInteraction(p) {
  const hotspots = getVisibleHotspots();
  const scene = getCurrentScene();
  
  // Try to interact with nearest hotspot
  if (hotspots.length > 0) {
    const result = interactWithHotspot(hotspots[0]);
    
    if (result === "WIN") {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      logGameInfo(p, "Game won");
    }
  }
}

function cycleInventory() {
  if (gameState.inventory.length > 0) {
    gameState.selectedItemIndex = (gameState.selectedItemIndex + 1) % gameState.inventory.length;
  }
}

function requestHint(p) {
  if (gameState.hintCooldown === 0) {
    gameState.hintCooldown = 3600; // 60 seconds at 60 FPS
    gameState.lastHintTime = p.frameCount;
  }
}

export function updateHintCooldown() {
  if (gameState.hintCooldown > 0) {
    gameState.hintCooldown--;
  }
}

function logGameInfo(p, data) {
  p.logs.game_info.push({
    data,
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetGame() {
  const currentControlMode = gameState.controlMode;
  Object.assign(gameState, {
    gamePhase: GAME_PHASES.START,
    controlMode: currentControlMode,
    currentScene: 0,
    inventory: [],
    selectedItemIndex: -1,
    score: 0,
    hintCooldown: 0,
    lastHintTime: 0,
    framesSinceLastAction: 0,
    visitedScenes: [],
    interactedHotspots: []
  });
  
  // Reset puzzle states
  const { PUZZLES } = require('./globals.js');
  Object.keys(PUZZLES).forEach(key => {
    PUZZLES[key].solved = false;
    if (PUZZLES[key].currentInput !== undefined) {
      PUZZLES[key].currentInput = "";
    }
  });
  
  // Reset scene hotspots
  const { SCENE_DATA } = require('./globals.js');
  SCENE_DATA.forEach(scene => {
    scene.hotspots.forEach(hotspot => {
      hotspot.visible = true;
    });
  });
}

export function handleAutomatedInput(p) {
  if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
    const action = get_automated_testing_action(gameState);
    
    if (action && action.keyCode) {
      handleGameplayInput(p, action.keyCode);
    }
  }
}