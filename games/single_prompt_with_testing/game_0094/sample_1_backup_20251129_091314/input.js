// input.js - Input handling

import { gameState } from './globals.js';
import { startGame, resetGame, togglePause } from './game_logic.js';

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
  // Tab key to switch cursor mode
  if (p.keyCode === 9) { // TAB
    if (gameState.cursorMode === "GRID") {
      gameState.cursorMode = "MENU";
    } else {
      gameState.cursorMode = "GRID";
    }
    p.event.preventDefault(); // Prevent default tab behavior
    return;
  }
  
  // Arrow keys for navigation based on cursor mode
  if (p.keyCode === 38) { // UP
    if (gameState.cursorMode === "MENU") {
      // Navigate plant menu
      navigatePlantMenuUp();
    } else {
      // Move cursor up on grid
      if (gameState.cursorRow > 0) {
        gameState.cursorRow--;
      }
    }
  }
  
  if (p.keyCode === 40) { // DOWN
    if (gameState.cursorMode === "MENU") {
      // Navigate plant menu
      navigatePlantMenuDown();
    } else {
      // Move cursor down on grid
      if (gameState.cursorRow < 4) {
        gameState.cursorRow++;
      }
    }
  }
  
  if (p.keyCode === 37) { // LEFT
    if (gameState.cursorMode === "GRID") {
      if (gameState.cursorCol > 0) {
        gameState.cursorCol--;
      }
    }
  }
  
  if (p.keyCode === 39) { // RIGHT
    if (gameState.cursorMode === "GRID") {
      if (gameState.cursorCol < 8) {
        gameState.cursorCol++;
      }
    }
  }
  
  if (p.keyCode === 32) { // SPACE
    handleSpacePress();
  }
  
  if (p.keyCode === 16) { // SHIFT
    // Cancel plant selection
    gameState.selectedPlantType = null;
  }
  
  if (p.keyCode === 90) { // Z
    // Collect sun near cursor
    collectNearestSun();
  }
}

let plantMenuIndex = 0;
const plantTypes = ['SUNFLOWER', 'PEASHOOTER', 'WALLNUT', 'CHERRY_BOMB'];

function navigatePlantMenuUp() {
  plantMenuIndex = (plantMenuIndex - 1 + plantTypes.length) % plantTypes.length;
}

function navigatePlantMenuDown() {
  plantMenuIndex = (plantMenuIndex + 1) % plantTypes.length;
}

function handleSpacePress() {
  if (gameState.cursorMode === "MENU") {
    // Select/deselect plant from menu
    const selectedType = plantTypes[plantMenuIndex];
    if (gameState.selectedPlantType === selectedType) {
      gameState.selectedPlantType = null;
    } else {
      gameState.selectedPlantType = selectedType;
    }
  } else if (gameState.cursorMode === "GRID") {
    if (gameState.selectedPlantType) {
      // Place plant at cursor position
      attemptPlacePlant();
    }
  }
}

function attemptPlacePlant() {
  const { selectedPlantType, cursorRow, cursorCol, sun, plants } = gameState;
  
  if (!selectedPlantType) return;
  
  // Check if cell is occupied
  if (plants[cursorRow][cursorCol] !== null) {
    return; // Cell occupied
  }
  
  // Check if we have enough sun
  const cost = getPlantCost(selectedPlantType);
  if (sun < cost) {
    return; // Not enough sun
  }
  
  // Place plant
  import('./entities.js').then(module => {
    let plant = null;
    switch (selectedPlantType) {
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
      gameState.sun -= cost;
      gameState.selectedPlantType = null;
    }
  });
}

function getPlantCost(type) {
  const costs = {
    'SUNFLOWER': 50,
    'PEASHOOTER': 100,
    'WALLNUT': 50,
    'CHERRY_BOMB': 150
  };
  return costs[type] || 0;
}

function collectNearestSun() {
  import('./entities.js').then(module => {
    import('./globals.js').then(globalsModule => {
      const { getGridPosition } = globalsModule;
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
    });
  });
}

export function isKeyPressed(keyCode) {
  return keys[keyCode] === true;
}

export function getPlantMenuIndex() {
  return plantMenuIndex;
}

export function getPlantTypes() {
  return plantTypes;
}