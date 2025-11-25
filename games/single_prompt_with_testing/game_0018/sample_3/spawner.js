import { gameState, LANES, SPAWN_DISTANCE, OBSTACLE_TYPES, INITIAL_SPEED, SPEED_INCREMENT, MAX_SPEED } from './globals.js';
import { Obstacle, Coin, TrackSection } from './entities.js';

export function spawnObstacles() {
  // Increase speed over time
  if (gameState.gameSpeed < MAX_SPEED) {
    gameState.gameSpeed += SPEED_INCREMENT * gameState.deltaTime;
  }
  
  // Check if it's time to spawn
  const playerZ = gameState.player ? gameState.player.mesh.position.z : 0;
  
  if (playerZ + SPAWN_DISTANCE > gameState.nextSpawnZ) {
    const spawnZ = gameState.nextSpawnZ;
    
    // Randomly choose spawn pattern
    const pattern = Math.random();
    
    if (pattern < 0.3) {
      // Single train in random lane
      const lane = LANES[Math.floor(Math.random() * LANES.length)];
      const train = new Obstacle(lane, spawnZ, OBSTACLE_TYPES.TRAIN);
      gameState.obstacles.push(train);
    } else if (pattern < 0.5) {
      // Low barriers in 2 lanes
      const lanes = [...LANES];
      const skipLane = Math.floor(Math.random() * 3);
      for (let i = 0; i < 3; i++) {
        if (i !== skipLane) {
          const barrier = new Obstacle(lanes[i], spawnZ, OBSTACLE_TYPES.LOW_BARRIER);
          gameState.obstacles.push(barrier);
        }
      }
    } else if (pattern < 0.7) {
      // High barriers in 2 lanes
      const lanes = [...LANES];
      const skipLane = Math.floor(Math.random() * 3);
      for (let i = 0; i < 3; i++) {
        if (i !== skipLane) {
          const barrier = new Obstacle(lanes[i], spawnZ, OBSTACLE_TYPES.HIGH_BARRIER);
          gameState.obstacles.push(barrier);
        }
      }
    } else {
      // Mixed pattern
      const lane1 = LANES[Math.floor(Math.random() * 3)];
      let lane2;
      do {
        lane2 = LANES[Math.floor(Math.random() * 3)];
      } while (lane2 === lane1);
      
      const barrier1 = new Obstacle(lane1, spawnZ, OBSTACLE_TYPES.LOW_BARRIER);
      const barrier2 = new Obstacle(lane2, spawnZ, OBSTACLE_TYPES.HIGH_BARRIER);
      gameState.obstacles.push(barrier1, barrier2);
    }
    
    // Spawn coins
    if (Math.random() < 0.6) {
      const coinLane = LANES[Math.floor(Math.random() * LANES.length)];
      const coinHeight = Math.random() < 0.5 ? 1.5 : 2.5;
      const coin = new Coin(coinLane, spawnZ - 3, coinHeight);
      gameState.coins.push(coin);
    }
    
    // Update next spawn position
    const baseInterval = 8;
    const speedFactor = Math.max(0.5, 1 - (gameState.gameSpeed - INITIAL_SPEED) * 2);
    gameState.nextSpawnZ += baseInterval * speedFactor;
  }
}

export function spawnTrack() {
  const playerZ = gameState.player ? gameState.player.mesh.position.z : 0;
  const lastSection = gameState.trackSections[gameState.trackSections.length - 1];
  const lastZ = lastSection ? lastSection.mesh.position.z : 0;
  
  // Spawn track sections ahead
  if (playerZ + SPAWN_DISTANCE > lastZ) {
    const section = new TrackSection(lastZ + 20);
    gameState.trackSections.push(section);
  }
}