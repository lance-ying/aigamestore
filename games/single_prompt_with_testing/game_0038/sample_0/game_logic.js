// game_logic.js - Core game logic

import { gameState, initializeGrid, PHASE_PLAYING, PHASE_GAME_OVER_LOSE } from './globals.js';
import { spawnBuilding, spawnCar } from './entities.js';
import { findPath } from './pathfinding.js';

export function initGame(p) {
  // Initialize grid
  initializeGrid();
  
  // Reset game state
  gameState.score = 0;
  gameState.buildings = [];
  gameState.roads = [];
  gameState.cars = [];
  gameState.roadTilesAvailable = 15;
  gameState.highwayTilesAvailable = 0;
  gameState.upgradeMode = false;
  gameState.frameCount = 0;
  gameState.nextSpawnTime = 180;
  gameState.spawnInterval = 300;
  gameState.difficulty = 1;
  gameState.cursorX = 10;
  gameState.cursorY = 7;
  gameState.showConnectionView = false;
  gameState.positionHistory = [];
  gameState.lastActionFrame = 0;
  
  // Spawn initial buildings
  for (let i = 0; i < 2; i++) {
    spawnBuilding(p);
  }
}

export function updateGame(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  gameState.frameCount++;
  
  // Spawn new buildings
  if (gameState.frameCount >= gameState.nextSpawnTime) {
    spawnBuilding(p);
    gameState.nextSpawnTime += gameState.spawnInterval;
    gameState.spawnInterval = Math.max(180, gameState.spawnInterval - 5);
    gameState.difficulty += 0.1;
    
    // Award upgrades periodically
    if (gameState.buildings.length % 4 === 0) {
      gameState.highwayTilesAvailable += 2;
    }
  }
  
  // Update houses - spawn cars
  for (const building of gameState.buildings) {
    if (building.type === "HOUSE") {
      // Spawn car periodically
      const spawnChance = 0.01 + gameState.difficulty * 0.001;
      if (p.random() < spawnChance && building.capacity < building.maxCapacity) {
        building.addToQueue();
        
        // Try to spawn actual car
        if (building.capacity === 1 || p.random() < 0.3) {
          const car = spawnCar(building);
          if (car) {
            const path = findPath(building, car.endBuilding);
            if (path) {
              car.updatePath(path);
              gameState.cars.push(car);
              building.removeFromQueue();
            }
          }
        }
      }
      
      // Check for overload
      if (building.isOverloaded) {
        gameOver(p, false);
        return;
      }
    }
  }
  
  // Update cars
  const activeCars = [];
  for (const car of gameState.cars) {
    const stillActive = car.move();
    if (stillActive) {
      activeCars.push(car);
    } else {
      // Car reached destination or removed
      if (!car.stuck) {
        gameState.score += 10;
      }
    }
  }
  gameState.cars = activeCars;
  
  // Log player info periodically
  if (gameState.frameCount % 30 === 0) {
    p.logs.player_info.push({
      screen_x: gameState.cursorX * 30,
      screen_y: gameState.cursorY * (400/15),
      game_x: gameState.cursorX,
      game_y: gameState.cursorY,
      framecount: p.frameCount
    });
  }
  
  // Check win condition - high score
  if (gameState.score >= 500) {
    gameOver(p, true);
  }
}

export function placeRoad(x, y) {
  const cell = gameState.grid[y][x];
  if (cell.type !== null) return false;
  
  if (gameState.upgradeMode && gameState.highwayTilesAvailable > 0) {
    gameState.grid[y][x] = { type: "HIGHWAY", data: null };
    gameState.roads.push({ x, y, type: "HIGHWAY" });
    gameState.highwayTilesAvailable--;
    gameState.upgradeMode = gameState.highwayTilesAvailable > 0;
    return true;
  } else if (gameState.roadTilesAvailable > 0) {
    gameState.grid[y][x] = { type: "ROAD", data: null };
    gameState.roads.push({ x, y, type: "ROAD" });
    gameState.roadTilesAvailable--;
    
    // Recalculate paths for all cars
    for (const car of gameState.cars) {
      const path = findPath(car, car.endBuilding);
      car.updatePath(path);
    }
    
    return true;
  }
  
  return false;
}

export function removeRoad(x, y) {
  const cell = gameState.grid[y][x];
  if (cell.type !== "ROAD" && cell.type !== "HIGHWAY") return false;
  
  // Check if any car is on this road
  const carOnRoad = gameState.cars.some(car => {
    const cx = Math.floor(car.x);
    const cy = Math.floor(car.y);
    return cx === x && cy === y;
  });
  
  if (carOnRoad) return false;  // Can't remove road with car on it
  
  // Return tiles
  if (cell.type === "HIGHWAY") {
    gameState.highwayTilesAvailable++;
  } else {
    gameState.roadTilesAvailable++;
  }
  
  gameState.grid[y][x] = { type: null, data: null };
  gameState.roads = gameState.roads.filter(r => !(r.x === x && r.y === y));
  
  // Recalculate paths
  for (const car of gameState.cars) {
    const path = findPath(car, car.endBuilding);
    car.updatePath(path);
  }
  
  return true;
}

function gameOver(p, isWin) {
  gameState.gamePhase = isWin ? "GAME_OVER_WIN" : PHASE_GAME_OVER_LOSE;
  p.logs.game_info.push({
    data: { 
      phase: gameState.gamePhase, 
      final_score: gameState.score,
      result: isWin ? "win" : "lose"
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}