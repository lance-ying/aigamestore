// traffic.js - Traffic management system

import { TrafficCar } from './entities.js';
import {
  gameState,
  INTERSECTION_Y_START,
  INTERSECTION_HEIGHT,
  LANES_PER_INTERSECTION,
  LANE_HEIGHT,
  BASE_TRAFFIC_SPEED,
  BASE_SPAWN_INTERVAL,
  SPEED_INCREASE_PER_LEVEL,
  SPAWN_DECREASE_PER_LEVEL,
  MIN_SPAWN_INTERVAL,
  CANVAS_WIDTH
} from './globals.js';

export function updateTrafficSpawning(p) {
  gameState.trafficSpawnTimer++;
  
  // Update spawn parameters based on difficulty
  const difficultyMultiplier = gameState.currentDifficulty - 1;
  gameState.currentTrafficSpeed = BASE_TRAFFIC_SPEED + (difficultyMultiplier * SPEED_INCREASE_PER_LEVEL);
  gameState.currentSpawnInterval = Math.max(
    MIN_SPAWN_INTERVAL,
    BASE_SPAWN_INTERVAL - (difficultyMultiplier * SPAWN_DECREASE_PER_LEVEL)
  );
  
  // Spawn traffic cars
  if (gameState.trafficSpawnTimer >= gameState.currentSpawnInterval) {
    spawnTrafficCar(p);
    gameState.trafficSpawnTimer = 0;
  }
  
  // Update all traffic cars
  gameState.trafficCars.forEach((car, index) => {
    car.update();
    
    // Remove inactive cars
    if (!car.active) {
      car.remove();
      gameState.trafficCars.splice(index, 1);
      const entityIndex = gameState.entities.indexOf(car);
      if (entityIndex > -1) {
        gameState.entities.splice(entityIndex, 1);
      }
    }
  });
}

function spawnTrafficCar(p) {
  // Choose random lane
  const laneIndex = Math.floor(p.random() * LANES_PER_INTERSECTION);
  const laneY = INTERSECTION_Y_START + (laneIndex * LANE_HEIGHT) + (LANE_HEIGHT / 2);
  
  // Alternate direction based on lane (odd lanes go right, even go left)
  const direction = laneIndex % 2 === 0 ? 1 : -1;
  
  // Spawn position (off screen)
  const spawnX = direction === 1 ? -50 : CANVAS_WIDTH + 50;
  
  // Add some speed variation
  const speedVariation = p.random(-0.5, 0.5);
  const speed = gameState.currentTrafficSpeed + speedVariation;
  
  const car = new TrafficCar(p, spawnX, laneY, direction, speed);
  gameState.trafficCars.push(car);
  gameState.entities.push(car);
}

export function clearAllTraffic() {
  gameState.trafficCars.forEach(car => {
    car.remove();
  });
  gameState.trafficCars = [];
}