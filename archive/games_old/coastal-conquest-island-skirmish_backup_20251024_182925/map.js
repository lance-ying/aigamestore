// map.js - Map generation and management

import { gameState, GRID_COLS, GRID_ROWS, TERRAIN_TYPES, CELL_SIZE } from './globals.js';

export function initializeMap() {
  gameState.mapGrid = [];
  
  for (let row = 0; row < GRID_ROWS; row++) {
    gameState.mapGrid[row] = [];
    for (let col = 0; col < GRID_COLS; col++) {
      let terrain = TERRAIN_TYPES.LAND;
      
      // Player deployment zone (left side)
      if (col <= 3) {
        terrain = TERRAIN_TYPES.PLAYER_DEPLOY;
      }
      // Enemy deployment zone (right side)
      else if (col >= GRID_COLS - 4) {
        terrain = TERRAIN_TYPES.ENEMY_DEPLOY;
      }
      
      gameState.mapGrid[row][col] = {
        terrain: terrain,
        entity: null,
        building: null
      };
    }
  }
  
  // Add rocks from level config
  const levelConfig = gameState.levelConfig;
  if (levelConfig.rocks) {
    levelConfig.rocks.forEach(rock => {
      if (rock.gridX >= 0 && rock.gridX < GRID_COLS && 
          rock.gridY >= 0 && rock.gridY < GRID_ROWS) {
        gameState.mapGrid[rock.gridY][rock.gridX].terrain = TERRAIN_TYPES.IMPASSABLE;
      }
    });
  }
}

export function renderMap(p) {
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const cell = gameState.mapGrid[row][col];
      const x = col * CELL_SIZE;
      const y = row * CELL_SIZE;
      
      // Terrain color
      let terrainColor;
      switch (cell.terrain) {
        case TERRAIN_TYPES.LAND:
          terrainColor = [120, 180, 100];
          break;
        case TERRAIN_TYPES.WATER:
          terrainColor = [100, 150, 220];
          break;
        case TERRAIN_TYPES.IMPASSABLE:
          terrainColor = [80, 80, 80];
          break;
        case TERRAIN_TYPES.PLAYER_DEPLOY:
          terrainColor = [80, 140, 80];
          break;
        case TERRAIN_TYPES.ENEMY_DEPLOY:
          terrainColor = [140, 80, 80];
          break;
        default:
          terrainColor = [120, 180, 100];
      }
      
      p.fill(...terrainColor);
      p.stroke(100, 120, 90);
      p.strokeWeight(1);
      p.rect(x, y, CELL_SIZE, CELL_SIZE);
      
      // Grid lines
      p.stroke(90, 110, 80, 100);
      p.strokeWeight(0.5);
      p.line(x, y, x + CELL_SIZE, y);
      p.line(x, y, x, y + CELL_SIZE);
    }
  }
}

export function isValidDeployment(gridX, gridY) {
  if (gridX < 0 || gridX >= GRID_COLS || gridY < 0 || gridY >= GRID_ROWS) {
    return false;
  }
  
  const cell = gameState.mapGrid[gridY][gridX];
  
  // Must be in player deployment zone
  if (cell.terrain !== TERRAIN_TYPES.PLAYER_DEPLOY) {
    return false;
  }
  
  // Must be empty
  if (cell.entity || cell.building) {
    return false;
  }
  
  return true;
}

export function getCellAtPosition(x, y) {
  const gridX = Math.floor(x / CELL_SIZE);
  const gridY = Math.floor(y / CELL_SIZE);
  
  if (gridX < 0 || gridX >= GRID_COLS || gridY < 0 || gridY >= GRID_ROWS) {
    return null;
  }
  
  return { gridX, gridY };
}

export function isValidPosition(gridX, gridY) {
  if (gridX < 0 || gridX >= GRID_COLS || gridY < 0 || gridY >= GRID_ROWS) {
    return false;
  }
  
  const cell = gameState.mapGrid[gridY][gridX];
  return cell.terrain !== TERRAIN_TYPES.IMPASSABLE && 
         cell.terrain !== TERRAIN_TYPES.WATER;
}

export function getDistance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function getGridDistance(gridX1, gridY1, gridX2, gridY2) {
  return Math.abs(gridX2 - gridX1) + Math.abs(gridY2 - gridY1);
}