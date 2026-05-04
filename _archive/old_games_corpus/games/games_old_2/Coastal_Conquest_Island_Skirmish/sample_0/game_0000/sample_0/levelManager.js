// levelManager.js - Level loading and management

import { gameState, LEVEL_CONFIGS, BUILDING_TYPES } from './globals.js';
import { Unit, Building } from './entities.js';
import { initializeMap } from './map.js';

export function loadLevel(levelNumber) {
  const config = LEVEL_CONFIGS[levelNumber - 1];
  if (!config) return false;
  
  gameState.levelConfig = config;
  gameState.currentLevel = levelNumber;
  gameState.playerResources = config.startResources;
  gameState.turnCount = 0;
  gameState.combatPhase = false;
  gameState.selectedUnitType = null;
  
  // Clear existing entities
  gameState.playerUnits = [];
  gameState.enemyUnits = [];
  gameState.buildings = [];
  gameState.entities = [];
  gameState.projectiles = [];
  
  // Initialize map
  initializeMap();
  
  // Create player HQ
  const playerHQ = new Building(
    config.playerHQPos.gridX,
    config.playerHQPos.gridY,
    BUILDING_TYPES.PLAYER_HQ,
    false
  );
  gameState.playerHQ = playerHQ;
  gameState.buildings.push(playerHQ);
  gameState.entities.push(playerHQ);
  gameState.mapGrid[playerHQ.gridY][playerHQ.gridX].building = playerHQ;
  
  // Create enemy HQ
  const enemyHQ = new Building(
    config.enemyHQPos.gridX,
    config.enemyHQPos.gridY,
    BUILDING_TYPES.ENEMY_HQ,
    true
  );
  gameState.enemyHQ = enemyHQ;
  gameState.buildings.push(enemyHQ);
  gameState.entities.push(enemyHQ);
  gameState.mapGrid[enemyHQ.gridY][enemyHQ.gridX].building = enemyHQ;
  
  // Create turrets
  if (config.turrets) {
    config.turrets.forEach(turretPos => {
      const turret = new Building(
        turretPos.gridX,
        turretPos.gridY,
        BUILDING_TYPES.TURRET,
        true
      );
      gameState.buildings.push(turret);
      gameState.entities.push(turret);
      gameState.mapGrid[turret.gridY][turret.gridX].building = turret;
    });
  }
  
  return true;
}

export function resetGame() {
  gameState.score = 0;
  gameState.currentLevel = 1;
  loadLevel(1);
}