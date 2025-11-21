// game_logic.js - Core game logic functions

import { gameState, GRID_SIZE, GRID_COLS, GRID_ROWS, BUILDING_TYPES, BUILDING_COSTS, RESOURCE_TYPES } from './globals.js';
import { Building, Core, Enemy } from './entities.js';

export function initializeGame(p) {
  // Reset game state
  gameState.entities = [];
  gameState.buildings = [];
  gameState.enemies = [];
  gameState.projectiles = [];
  gameState.units = [];
  gameState.resources = {
    COPPER: 100,
    IRON: 50,
    TITANIUM: 0,
    STEEL: 0,
    CIRCUITS: 0
  };
  gameState.camera = { x: 200, y: 150 };
  gameState.cursor = { gridX: 10, gridY: 10 };
  gameState.selectedBuilding = BUILDING_TYPES.DRILL;
  gameState.score = 0;
  gameState.wave = 0;
  gameState.waveTimer = 0;
  gameState.nextWaveTime = 45 * 60;
  gameState.framesSinceLastAction = 0;
  gameState.positionHistory = [];
  
  // Generate resource map
  generateResourceMap(p);
  
  // Create core at center
  const core = new Core(GRID_COLS / 2 - 1, GRID_ROWS / 2 - 1, p);
  gameState.core = core;
  gameState.buildings.push(core);
  gameState.entities.push(core);
  
  // Create player
  gameState.player = {
    x: GRID_COLS / 2 * GRID_SIZE,
    y: GRID_ROWS / 2 * GRID_SIZE
  };
}

export function generateResourceMap(p) {
  gameState.resourceMap = {};
  
  // Place resource deposits
  const deposits = [
    { type: RESOURCE_TYPES.COPPER, count: 15 },
    { type: RESOURCE_TYPES.IRON, count: 10 },
    { type: RESOURCE_TYPES.TITANIUM, count: 5 }
  ];
  
  for (const deposit of deposits) {
    for (let i = 0; i < deposit.count; i++) {
      const x = Math.floor(p.random(5, GRID_COLS - 5));
      const y = Math.floor(p.random(5, GRID_ROWS - 5));
      
      // Don't place on core
      if (Math.abs(x - GRID_COLS / 2) < 3 && Math.abs(y - GRID_ROWS / 2) < 3) {
        continue;
      }
      
      const key = `${x},${y}`;
      if (!gameState.resourceMap[key]) {
        gameState.resourceMap[key] = deposit.type;
      }
    }
  }
}

export function updateGameLogic(p) {
  if (gameState.gamePhase !== 'PLAYING') return;
  
  // Update wave timer
  gameState.waveTimer++;
  
  // Spawn waves
  if (gameState.waveTimer >= gameState.nextWaveTime) {
    spawnWave(p);
    gameState.waveTimer = 0;
  }
  
  // Update all entities
  for (const entity of [...gameState.entities]) {
    if (entity.update) {
      entity.update(gameState);
    }
  }
  
  // Update buildings
  for (const building of [...gameState.buildings]) {
    if (building.update) {
      building.update(gameState);
    }
  }
  
  // Update projectiles
  gameState.projectiles = gameState.projectiles.filter(proj => {
    if (proj.update) {
      proj.update(gameState);
    }
    return proj.active;
  });
  
  // Check win/lose conditions
  checkGameOver();
  
  // Update player position for logging
  gameState.player.x = gameState.camera.x + 300;
  gameState.player.y = gameState.camera.y + 200;
}

export function spawnWave(p) {
  gameState.wave++;
  
  const enemyCount = 5 + gameState.wave * 2;
  const spawnPoints = [
    { x: 0, y: GRID_ROWS / 2 * GRID_SIZE },
    { x: GRID_COLS * GRID_SIZE, y: GRID_ROWS / 2 * GRID_SIZE },
    { x: GRID_COLS / 2 * GRID_SIZE, y: 0 },
    { x: GRID_COLS / 2 * GRID_SIZE, y: GRID_ROWS * GRID_SIZE }
  ];
  
  for (let i = 0; i < enemyCount; i++) {
    const spawnPoint = spawnPoints[Math.floor(p.random(spawnPoints.length))];
    const offsetX = p.random(-50, 50);
    const offsetY = p.random(-50, 50);
    
    const enemy = new Enemy(
      spawnPoint.x + offsetX,
      spawnPoint.y + offsetY,
      gameState.wave,
      p
    );
    
    gameState.enemies.push(enemy);
    gameState.entities.push(enemy);
  }
}

export function checkGameOver() {
  // Check lose condition
  if (gameState.core && gameState.core.health <= 0) {
    gameState.gamePhase = 'GAME_OVER_LOSE';
    return;
  }
  
  // Check win condition (survive 10 waves and clear all enemies)
  if (gameState.wave >= 10 && gameState.enemies.length === 0 && gameState.waveTimer > 60) {
    gameState.gamePhase = 'GAME_OVER_WIN';
  }
}

export function canAffordBuilding(buildingType) {
  const costs = BUILDING_COSTS[buildingType];
  if (!costs) return false;
  
  for (const resource in costs) {
    if ((gameState.resources[resource] || 0) < costs[resource]) {
      return false;
    }
  }
  return true;
}

export function payForBuilding(buildingType) {
  const costs = BUILDING_COSTS[buildingType];
  if (!costs) return false;
  
  for (const resource in costs) {
    gameState.resources[resource] -= costs[resource];
  }
  return true;
}

export function canPlaceBuildingAt(gridX, gridY, buildingType) {
  // Check bounds
  if (gridX < 0 || gridX >= GRID_COLS || gridY < 0 || gridY >= GRID_ROWS) {
    return false;
  }
  
  // Check if occupied
  for (const building of gameState.buildings) {
    if (building.gridX === gridX && building.gridY === gridY) {
      return false;
    }
    // Core occupies 2x2
    if (building.type === 'CORE') {
      if (gridX >= building.gridX && gridX < building.gridX + 2 &&
          gridY >= building.gridY && gridY < building.gridY + 2) {
        return false;
      }
    }
  }
  
  return true;
}

export function placeBuilding(gridX, gridY, buildingType, p) {
  if (!canPlaceBuildingAt(gridX, gridY, buildingType)) {
    return false;
  }
  
  if (!canAffordBuilding(buildingType)) {
    return false;
  }
  
  payForBuilding(buildingType);
  
  const building = new Building(gridX, gridY, buildingType, p);
  gameState.buildings.push(building);
  gameState.entities.push(building);
  
  return true;
}

export function deleteBuilding(gridX, gridY) {
  const index = gameState.buildings.findIndex(b => 
    b.gridX === gridX && b.gridY === gridY && b.type !== 'CORE'
  );
  
  if (index > -1) {
    const building = gameState.buildings[index];
    gameState.buildings.splice(index, 1);
    
    const entityIndex = gameState.entities.indexOf(building);
    if (entityIndex > -1) {
      gameState.entities.splice(entityIndex, 1);
    }
    
    return true;
  }
  return false;
}