// simulation_phase.js - Traffic simulation logic

import {
  SIMULATION_DURATION,
  JAM_THRESHOLD,
  JAM_CAR_COUNT,
  STAR_3_THRESHOLD,
  STAR_2_THRESHOLD,
  STAR_1_THRESHOLD,
  TARGET_FPS,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  gameState
} from './globals.js';

import { Vehicle } from './vehicle.js';
import { RoadNetwork } from './road.js';

let roadNetwork = null;
let spawnTimer = 0;

export function initializeSimulation(p) {
  // Build road network from segments
  roadNetwork = new RoadNetwork();
  for (const seg of gameState.roadSegments) {
    roadNetwork.addSegment(seg);
  }
  
  spawnTimer = 0;
}

export function updateSimulation(p) {
  if (!gameState.simulationRunning) return;
  
  // Update simulation time
  gameState.simulationTime += 1 / TARGET_FPS;
  
  // Spawn vehicles
  spawnVehicles(p);
  
  // Update all vehicles
  for (const vehicle of gameState.vehicles) {
    vehicle.update(p);
  }
  
  // Check for jams
  checkForJams(p);
  
  // Calculate efficiency
  calculateEfficiency(p);
  
  // Check if simulation complete
  if (gameState.simulationTime >= gameState.levelData.timeLimit) {
    endSimulation(p);
  }
}

function spawnVehicles(p) {
  if (gameState.vehiclesSpawned >= gameState.totalVehicles) return;
  
  spawnTimer += 1 / TARGET_FPS;
  
  for (const entry of gameState.entryPoints) {
    const spawnInterval = 1 / entry.spawnRate;
    
    if (spawnTimer >= spawnInterval && gameState.vehiclesSpawned < gameState.totalVehicles) {
      // Choose random exit
      const exit = gameState.exitPoints[
        Math.floor(Math.random() * gameState.exitPoints.length)
      ];
      
      // Find path
      const path = roadNetwork.findPath(entry.x, entry.y, exit.x, exit.y);
      
      // Create vehicle
      const vehicle = new Vehicle(entry, exit, path);
      gameState.vehicles.push(vehicle);
      gameState.entities.push(vehicle);
      gameState.vehiclesSpawned++;
      
      spawnTimer = 0;
    }
  }
}

function checkForJams(p) {
  let stuckCount = 0;
  
  for (const vehicle of gameState.vehicles) {
    if (vehicle.active && vehicle.stuck) {
      stuckCount++;
    }
  }
  
  if (stuckCount >= JAM_CAR_COUNT) {
    gameState.jammedTime += 1 / TARGET_FPS;
  }
}

function calculateEfficiency(p) {
  if (gameState.totalVehicles === 0) {
    gameState.efficiency = 1.0;
    return;
  }
  
  const completionRate = gameState.completedVehicles / gameState.totalVehicles;
  const jamPenalty = Math.min(1.0, gameState.jammedTime / JAM_THRESHOLD);
  
  gameState.efficiency = Math.max(0, completionRate - jamPenalty * 0.5);
  
  // Calculate stars
  if (gameState.efficiency >= STAR_3_THRESHOLD) {
    gameState.stars = 3;
  } else if (gameState.efficiency >= STAR_2_THRESHOLD) {
    gameState.stars = 2;
  } else if (gameState.efficiency >= STAR_1_THRESHOLD) {
    gameState.stars = 1;
  } else {
    gameState.stars = 0;
  }
}

function endSimulation(p) {
  gameState.simulationRunning = false;
  
  // Determine win/lose
  if (gameState.stars >= 1) {
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
    gameState.score += gameState.stars * 100;
    
    p.logs.game_info.push({
      data: { event: "level_complete", stars: gameState.stars },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    
    p.logs.game_info.push({
      data: { event: "level_failed" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function drawSimulation(p) {
  // Draw roads
  for (const seg of gameState.roadSegments) {
    seg.draw(p);
  }
  
  // Draw vehicles
  for (const vehicle of gameState.vehicles) {
    vehicle.draw(p);
  }
}