// trafficManager.js - Traffic spawning and management

import { TrafficVehicle } from './entities.js';
import { gameState } from './globals.js';

export function spawnTraffic(p) {
  const config = gameState.levelConfig;
  
  // Spawn traffic with probability based on density
  if (Math.random() < config.trafficDensity) {
    const laneIndex = Math.floor(Math.random() * config.lanes);
    const laneY = gameState.intersectionBounds.start + 
                  laneIndex * config.laneWidth + config.laneWidth / 2;
    
    // Alternate directions by lane
    const direction = laneIndex % 2 === 0 ? 1 : -1;
    const startX = direction > 0 ? -30 : 630;
    
    // Add speed variation
    const speedVariation = 0.5 + Math.random() * 1.0;
    const speed = config.trafficSpeed * speedVariation;
    
    const vehicle = new TrafficVehicle(p, startX, laneY, direction, speed, config.laneWidth);
    gameState.traffic.push(vehicle);
    gameState.entities.push(vehicle);
  }
}

export function updateTraffic() {
  // Update all traffic vehicles
  for (let i = gameState.traffic.length - 1; i >= 0; i--) {
    const vehicle = gameState.traffic[i];
    const shouldRemove = vehicle.update();
    
    if (shouldRemove) {
      vehicle.destroy();
      gameState.traffic.splice(i, 1);
      const entityIndex = gameState.entities.indexOf(vehicle);
      if (entityIndex > -1) {
        gameState.entities.splice(entityIndex, 1);
      }
    }
  }
}

export function clearTraffic() {
  for (let vehicle of gameState.traffic) {
    vehicle.destroy();
  }
  gameState.traffic = [];
}