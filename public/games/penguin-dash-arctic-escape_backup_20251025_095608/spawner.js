// spawner.js - Object spawning logic

import {
  gameState,
  LANE_Y_POSITIONS,
  NUM_LANES,
  TYPE_OBSTACLE_HIGH,
  TYPE_OBSTACLE_LOW,
  TYPE_GAP,
  TYPE_FISH,
  TYPE_RESCUED_PENGUIN,
  TYPE_POWERUP_SHIELD,
  TYPE_POWERUP_MAGNET,
  CANVAS_WIDTH
} from './globals.js';
import { GameObject } from './obstacles.js';

export class Spawner {
  constructor(p) {
    this.p = p;
    this.lastSpawnX = CANVAS_WIDTH;
    this.minSpacing = 150;
  }

  update() {
    if (gameState.gamePhase !== "PLAYING") return;

    const config = gameState.levelConfig;
    if (!config) return;

    // Check if we should spawn something
    const rightmostX = Math.max(...gameState.obstacles.map(o => o.x), 
                                 ...gameState.items.map(i => i.x), 
                                 this.lastSpawnX);

    if (rightmostX < CANVAS_WIDTH + this.minSpacing) {
      this.spawn();
      this.lastSpawnX = CANVAS_WIDTH + 50;
    }
  }

  spawn() {
    const config = gameState.levelConfig;
    const rand = this.p.random();

    // Decide what to spawn based on level config
    if (rand < config.obstacleDensity) {
      this.spawnObstacle();
    } else if (rand < config.obstacleDensity + config.itemDensity) {
      this.spawnItem();
    }
  }

  spawnObstacle() {
    const config = gameState.levelConfig;
    const lane = Math.floor(this.p.random(NUM_LANES));
    const laneY = LANE_Y_POSITIONS[lane];
    const x = CANVAS_WIDTH + 50;

    // Choose obstacle type based on level
    let type;
    const typeRand = this.p.random();
    
    if (config.level === 1) {
      type = typeRand < 0.4 ? TYPE_OBSTACLE_LOW : 
             typeRand < 0.8 ? TYPE_OBSTACLE_HIGH : TYPE_GAP;
    } else if (config.level === 2) {
      type = typeRand < 0.35 ? TYPE_OBSTACLE_LOW : 
             typeRand < 0.70 ? TYPE_OBSTACLE_HIGH : TYPE_GAP;
    } else {
      type = typeRand < 0.30 ? TYPE_OBSTACLE_LOW : 
             typeRand < 0.65 ? TYPE_OBSTACLE_HIGH : TYPE_GAP;
    }

    const obstacle = new GameObject(this.p, type, x, lane, laneY);
    gameState.obstacles.push(obstacle);
    gameState.entities.push(obstacle);
  }

  spawnItem() {
    const config = gameState.levelConfig;
    const lane = Math.floor(this.p.random(NUM_LANES));
    const laneY = LANE_Y_POSITIONS[lane];
    const x = CANVAS_WIDTH + 50;

    // Choose item type
    let type;
    const typeRand = this.p.random();
    
    if (typeRand < 0.7) {
      type = TYPE_FISH;
    } else if (typeRand < 0.9) {
      type = TYPE_RESCUED_PENGUIN;
    } else if (this.p.random() < config.powerUpChance) {
      type = this.p.random() < 0.5 ? TYPE_POWERUP_SHIELD : TYPE_POWERUP_MAGNET;
    } else {
      type = TYPE_FISH;
    }

    const item = new GameObject(this.p, type, x, lane, laneY);
    gameState.items.push(item);
    gameState.entities.push(item);
  }

  reset() {
    this.lastSpawnX = CANVAS_WIDTH;
  }
}