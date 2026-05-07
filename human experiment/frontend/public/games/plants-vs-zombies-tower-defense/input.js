// input.js - Input handling

import { gameState, PLANT_KEYS, PLANT_TYPES } from './globals.js';
import { startGame, resetGame, togglePause } from './game_logic.js';
import { getGridPosition } from './globals.js';

// Key state tracking
const keys = {};

export function handleKeyPress(p) {
  keys[p.keyCode] = true;
  
  // Log input
  if (p.logs && p.logs.inputs) {
    p.logs.inputs.push({
      input_type: 'keyPressed',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Phase control keys
  if (p.keyCode === 13) { // ENTER
    if (gameState.gamePhase === "START") {
      startGame();
    }
  }
  
  if (p.keyCode === 27) { // ESC
    if (gameState.gamePhase === "PLAYING") {
      togglePause();
    } else if (gameState.gamePhase === "PAUSED") {
      togglePause();
    }
  }
  
  if (p.keyCode === 82) { // R - Restart
    if (gameState.gamePhase === "GAME_OVER_WIN" || 
        gameState.gamePhase === "GAME_OVER_LOSE") {
      resetGame();
    }
  }
  
  // Gameplay keys (only during PLAYING phase)
  if (gameState.gamePhase === "PLAYING") {
    handleGameplayInput(p);
  }
}

export function handleKeyRelease(p) {
  keys[p.keyCode] = false;
  
  // Log input
  if (p.logs && p.logs.inputs) {
    p.logs.inputs.push({
      input_type: 'keyReleased',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function handleGameplayInput(p) {
  // Cursor Movement
  if (p.keyCode === 37) { // LEFT
    if (gameState.cursorCol > 0) {
      gameState.cursorCol--;
    }
  }
  
  if (p.keyCode === 39) { // RIGHT
    if (gameState.cursorCol < 8) {
      gameState.cursorCol++;
    }
  }
  
  if (p.keyCode === 38) { // UP
    if (gameState.cursorRow > 0) {
      gameState.cursorRow--;
    }
  }
  
  if (p.keyCode === 40) { // DOWN
    if (gameState.cursorRow < 4) {
      gameState.cursorRow++;
    }
  }
  
  // Cycle Plants (Z)
  if (p.keyCode === 90) { // Z - only for switching plants
    gameState.selectedPlantIndex = (gameState.selectedPlantIndex + 1) % PLANT_KEYS.length;
  }
  
  // Collect Sun (C)
  if (p.keyCode === 67) { // C - designated button for collecting sun
    collectNearestSun();
  }
  
  // Action (Space)
  if (p.keyCode === 32) { // SPACE
    // Check for SHIFT key for Shovel mode
    if (p.keyIsDown && p.keyIsDown(16)) {
      handleShovel();
    } else {
      handlePlanting();
    }
  }
}

function handlePlanting() {
  if (gameState.selectedPlantIndex < 0) {
    // No plant selected, do nothing
    return;
  }
  
  const plantKey = PLANT_KEYS[gameState.selectedPlantIndex];
  const plantType = PLANT_TYPES[plantKey];
  const { cursorRow, cursorCol, sun, plants, plantCooldowns } = gameState;
  
  // Check if cell is occupied
  if (plants[cursorRow][cursorCol] !== null) {
    return; // Cell occupied
  }
  
  // Check cooldown
  if (plantCooldowns[plantKey] > 0) {
    return; // Plant on cooldown
  }
  
  // Check if we have enough sun
  if (sun < plantType.cost) {
    return; // Not enough sun
  }
  
  // Place plant
  import('./entities.js').then(module => {
    let plant = null;
    switch (plantKey) {
      case 'SUNFLOWER':
        plant = new module.Sunflower(cursorRow, cursorCol);
        break;
      case 'PEASHOOTER':
        plant = new module.Peashooter(cursorRow, cursorCol);
        break;
      case 'WALLNUT':
        plant = new module.Wallnut(cursorRow, cursorCol);
        break;
      case 'CHERRY_BOMB':
        plant = new module.CherryBomb(cursorRow, cursorCol);
        break;
    }
    
    if (plant) {
      gameState.sun -= plantType.cost;
      gameState.plantCooldowns[plantKey] = plantType.cooldown;
    }
  });
}

function handleShovel() {
  const { cursorRow, cursorCol, plants } = gameState;
  const plant = plants[cursorRow][cursorCol];
  
  if (plant) {
    plant.die();
  }
}

function collectNearestSun() {
  const cursorPos = getGridPosition(gameState.cursorRow, gameState.cursorCol);
  
  let nearestSun = null;
  let nearestDistance = Infinity;
  
  gameState.sunDrops.forEach(sun => {
    const dx = sun.x - cursorPos.x;
    const dy = sun.y - cursorPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 80 && distance < nearestDistance) {
      nearestSun = sun;
      nearestDistance = distance;
    }
  });
  
  if (nearestSun) {
    nearestSun.collect();
  }
}

export function isKeyPressed(keyCode) {
  return keys[keyCode] === true;
}