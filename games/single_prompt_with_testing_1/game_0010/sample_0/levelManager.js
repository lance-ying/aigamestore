// levelManager.js - Level loading and management

import { gameState, GAME_PHASES, GRID_COLS, GRID_ROWS } from './globals.js';
import { levels } from './levels.js';
import { Truck, Package, House } from './entities.js';

export function loadLevel(levelNumber) {
  const levelData = levels.find(l => l.level === levelNumber) || levels[0];
  
  gameState.currentLevel = levelData.level;
  gameState.grid = JSON.parse(JSON.stringify(levelData.grid));
  
  // Create trucks
  gameState.trucks = levelData.trucks.map(t => 
    new Truck(t.color, t.startX, t.startY)
  );
  
  // Create packages
  gameState.packages = levelData.packages.map(p => 
    new Package(p.color, p.x, p.y)
  );
  
  // Create houses
  gameState.houses = levelData.houses.map(h => 
    new House(h.color, h.x, h.y)
  );
  
  // Load level mechanics
  gameState.bridges = JSON.parse(JSON.stringify(levelData.bridges));
  gameState.buttons = JSON.parse(JSON.stringify(levelData.buttons));
  gameState.barriers = JSON.parse(JSON.stringify(levelData.barriers));
  gameState.swapZones = JSON.parse(JSON.stringify(levelData.swapZones));
  
  // Reset game state
  gameState.selectedTruckIndex = 0;
  gameState.cursorX = 0;
  gameState.cursorY = 0;
  gameState.isSimulating = false;
  gameState.simulationStep = 0;
  gameState.deliveredPackages = 0;
  gameState.totalPackages = gameState.packages.length;
  gameState.collisionOccurred = false;
}

export function resetLevel() {
  loadLevel(gameState.currentLevel);
}

export function nextLevel() {
  const nextLevelNum = gameState.currentLevel + 1;
  if (nextLevelNum <= levels.length) {
    loadLevel(nextLevelNum);
  } else {
    // Wrap around to level 1
    loadLevel(1);
  }
}

export function checkLevelComplete() {
  // All packages delivered and no collision
  const allDelivered = gameState.trucks.every(truck => truck.delivered);
  if (allDelivered && !gameState.collisionOccurred) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    return true;
  }
  return false;
}