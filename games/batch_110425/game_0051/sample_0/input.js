// input.js - Input handling

import {
  gameState,
  KEY_ENTER,
  KEY_ESC,
  KEY_SPACE,
  KEY_SHIFT,
  KEY_Z,
  KEY_R,
  KEY_LEFT,
  KEY_UP,
  KEY_RIGHT,
  KEY_DOWN,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE
} from './globals.js';
import {
  startGame,
  pauseGame,
  resumeGame,
  restartGame,
  toggleSystem,
  usePowerBoost,
  openPrizeCounter,
  closePrizeCounter,
  purchasePrizeItem,
  changePrizeSelection
} from './game_logic.js';
import { getNextUIElement } from './ui.js';

let p5Instance = null;

export function initInput(p) {
  p5Instance = p;
}

export function handleKeyPressed(key, keyCode) {
  // Log input
  if (p5Instance) {
    p5Instance.logs.inputs.push({
      input_type: "keyPressed",
      data: { key, keyCode },
      framecount: p5Instance.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Phase transitions (available in all phases)
  if (keyCode === KEY_ENTER && gameState.gamePhase === PHASE_START) {
    startGame();
    return;
  }
  
  if (keyCode === KEY_ESC) {
    if (gameState.gamePhase === PHASE_PLAYING) {
      pauseGame();
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      resumeGame();
    }
    return;
  }
  
  if (keyCode === KEY_R && (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE)) {
    restartGame();
    return;
  }
  
  // Gameplay controls (only during PLAYING phase)
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  // Prize counter controls
  if (gameState.prizeCounterOpen) {
    handlePrizeCounterInput(keyCode);
    return;
  }
  
  // Regular gameplay controls
  handleGameplayInput(keyCode);
}

function handleGameplayInput(keyCode) {
  switch (keyCode) {
    case KEY_LEFT:
      gameState.selectedElement = getNextUIElement(gameState.selectedElement, "left");
      break;
    case KEY_RIGHT:
      gameState.selectedElement = getNextUIElement(gameState.selectedElement, "right");
      break;
    case KEY_UP:
      gameState.selectedElement = getNextUIElement(gameState.selectedElement, "up");
      break;
    case KEY_DOWN:
      gameState.selectedElement = getNextUIElement(gameState.selectedElement, "down");
      break;
    case KEY_SPACE:
      activateSelectedSystem();
      break;
    case KEY_SHIFT:
      openPrizeCounter();
      break;
    case KEY_Z:
      usePowerBoost();
      break;
  }
}

function handlePrizeCounterInput(keyCode) {
  switch (keyCode) {
    case KEY_UP:
      changePrizeSelection("up");
      break;
    case KEY_DOWN:
      changePrizeSelection("down");
      break;
    case KEY_SPACE:
      purchasePrizeItem();
      break;
    case KEY_SHIFT:
      closePrizeCounter();
      break;
  }
}

function activateSelectedSystem() {
  const systemMapping = {
    LEFT_DOOR: "leftDoor",
    RIGHT_DOOR: "rightDoor",
    LEFT_VENT: "leftVent",
    RIGHT_VENT: "rightVent",
    LEFT_HOSE: "leftHose",
    RIGHT_HOSE: "rightHose",
    GENERATOR: "generator",
    MUSIC_BOX: "musicBox",
    LEFT_CAMERA: "leftCamera",
    RIGHT_CAMERA: "rightCamera"
  };
  
  const systemKey = systemMapping[gameState.selectedElement];
  if (systemKey) {
    toggleSystem(systemKey);
  }
}

export function processAutomatedInput(action) {
  if (!action) return;
  
  if (action.keyCode) {
    handleKeyPressed(action.key, action.keyCode);
  }
}