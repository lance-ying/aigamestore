// spawner.js - Handles spawning of rings and obstacles

import { Ring, Obstacle } from './entities.js';
import { 
  CANVAS_WIDTH,
  NUM_LANES,
  LANE_WIDTH,
  LANE_Y,
  PLAYER_COLORS
} from './globals.js';

export class Spawner {
  constructor(p) {
    this.p = p;
    this.spawnDistance = 0;
    this.minSpawnGap = 100;
    this.maxSpawnGap = 200;
    this.nextSpawnDistance = this.minSpawnGap;
    this.difficulty = 0;
  }

  getLaneX(lane) {
    const startX = (CANVAS_WIDTH - NUM_LANES * LANE_WIDTH) / 2;
    return startX + lane * LANE_WIDTH + LANE_WIDTH / 2;
  }

  update(distance, currentSpeed) {
    this.spawnDistance = distance;
    this.difficulty = Math.floor(distance / 500);

    if (this.spawnDistance >= this.nextSpawnDistance) {
      this.spawnPattern();
      this.nextSpawnDistance = this.spawnDistance + 
        this.p.random(this.minSpawnGap, this.maxSpawnGap);
    }
  }

  spawnPattern() {
    const patterns = [
      () => this.spawnRingPattern(),
      () => this.spawnObstaclePattern(),
      () => this.spawnMixedPattern()
    ];

    const choice = Math.floor(this.p.random() * patterns.length);
    patterns[choice]();
  }

  spawnRingPattern() {
    const numRings = Math.floor(this.p.random(1, 4));
    const colorIndex = Math.floor(this.p.random() * PLAYER_COLORS.length);
    
    for (let i = 0; i < numRings; i++) {
      const lane = Math.floor(this.p.random() * NUM_LANES);
      const x = CANVAS_WIDTH + 50 + i * 80;
      const y = LANE_Y - this.p.random(30, 80);
      
      const ringColor = this.p.random() > 0.3 ? colorIndex : 
        Math.floor(this.p.random() * PLAYER_COLORS.length);
      
      return new Ring(x, y, lane, ringColor);
    }
    return null;
  }

  spawnObstaclePattern() {
    const types = ["barrier", "zipline", "low_barrier"];
    const type = types[Math.floor(this.p.random() * types.length)];
    const lane = Math.floor(this.p.random() * NUM_LANES);
    const x = CANVAS_WIDTH + 50;
    
    let minNeckHeight = 0;
    if (type === "zipline") {
      minNeckHeight = Math.floor(this.p.random(3, 7));
    }
    
    return new Obstacle(x, lane, type, minNeckHeight);
  }

  spawnMixedPattern() {
    // Spawn both rings and obstacles
    const results = [];
    
    // Rings
    const numRings = Math.floor(this.p.random(1, 3));
    const colorIndex = Math.floor(this.p.random() * PLAYER_COLORS.length);
    
    for (let i = 0; i < numRings; i++) {
      const lane = Math.floor(this.p.random() * NUM_LANES);
      const x = CANVAS_WIDTH + 50 + i * 60;
      const y = LANE_Y - this.p.random(40, 90);
      
      results.push(new Ring(x, y, lane, colorIndex));
    }
    
    // Obstacle
    if (this.p.random() > 0.5) {
      const lane = Math.floor(this.p.random() * NUM_LANES);
      const x = CANVAS_WIDTH + 200;
      const type = this.p.random() > 0.5 ? "barrier" : "low_barrier";
      
      results.push(new Obstacle(x, lane, type, 0));
    }
    
    return results;
  }

  spawnRing(colorIndex) {
    const lane = Math.floor(this.p.random() * NUM_LANES);
    const x = CANVAS_WIDTH + 50;
    const y = LANE_Y - this.p.random(40, 90);
    return new Ring(x, y, lane, colorIndex);
  }

  spawnObstacle() {
    const types = ["barrier", "zipline", "low_barrier"];
    const type = types[Math.floor(this.p.random() * types.length)];
    const lane = Math.floor(this.p.random() * NUM_LANES);
    const x = CANVAS_WIDTH + 50;
    
    let minNeckHeight = 0;
    if (type === "zipline") {
      minNeckHeight = Math.floor(this.p.random(4, 8));
    }
    
    return new Obstacle(x, lane, type, minNeckHeight);
  }
}