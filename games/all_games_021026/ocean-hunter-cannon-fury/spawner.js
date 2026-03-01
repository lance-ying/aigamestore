import { FISH_TYPES, CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';
import { Fish } from './entities.js';

export class FishSpawner {
  constructor(p) {
    this.p = p;
    this.lastSpawnTime = 0;
    this.currentLevel = null;
  }
  
  setLevel(level) {
    this.currentLevel = level;
  }
  
  update() {
    if (!this.currentLevel) return;
    
    const now = Date.now();
    const timeSinceLastSpawn = now - this.lastSpawnTime;
    
    if (timeSinceLastSpawn >= this.currentLevel.spawnRate && 
        gameState.fish.length < this.currentLevel.maxFishOnScreen) {
      this.spawnFish();
      this.lastSpawnTime = now;
    }
    
    // Spawn boss in final level (level 9)
    if (this.currentLevel.number === 9 && !gameState.bossSpawned && gameState.timeRemaining < 100) {
      this.spawnBoss();
      gameState.bossSpawned = true;
    }
  }
  
  spawnBoss() {
    const side = this.p.random() < 0.5 ? 'left' : 'right';
    let x, y, direction;
    
    if (side === 'left') {
      x = -50;
      y = CANVAS_HEIGHT / 2;
      direction = 0;
    } else {
      x = CANVAS_WIDTH + 50;
      y = CANVAS_HEIGHT / 2;
      direction = this.p.PI;
    }
    
    const fish = new Fish('SQUID', x, y, direction, this.p);
    gameState.fish.push(fish);
    gameState.entities.push(fish);
  }
  
  spawnFish() {
    if (!this.currentLevel) return;
    
    // Select fish type based on weights
    const fishType = this.selectFishType();
    
    // Random spawn position and direction
    const spawnSide = this.p.floor(this.p.random(4)); // 0=left, 1=right, 2=top, 3=bottom
    let x, y, direction;
    
    switch (spawnSide) {
      case 0: // Left
        x = -50;
        y = this.p.random(50, CANVAS_HEIGHT - 50);
        direction = this.p.random(-0.3, 0.3);
        break;
      case 1: // Right
        x = CANVAS_WIDTH + 50;
        y = this.p.random(50, CANVAS_HEIGHT - 50);
        direction = this.p.PI + this.p.random(-0.3, 0.3);
        break;
      case 2: // Top
        x = this.p.random(50, CANVAS_WIDTH - 50);
        y = -50;
        direction = this.p.HALF_PI + this.p.random(-0.3, 0.3);
        break;
      case 3: // Bottom (rare)
        x = this.p.random(50, CANVAS_WIDTH - 50);
        y = CANVAS_HEIGHT + 50;
        direction = -this.p.HALF_PI + this.p.random(-0.3, 0.3);
        break;
    }
    
    const fish = new Fish(fishType, x, y, direction, this.p);
    gameState.fish.push(fish);
    gameState.entities.push(fish);
  }
  
  selectFishType() {
    const random = this.p.random();
    let cumulative = 0;
    
    for (let i = 0; i < this.currentLevel.fishTypes.length; i++) {
      cumulative += this.currentLevel.fishWeights[i];
      if (random <= cumulative) {
        return this.currentLevel.fishTypes[i];
      }
    }
    
    return this.currentLevel.fishTypes[0];
  }
}