// performance_zones.js - Performance zones that affect metrics

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  ZONE_SIZE,
  HIGH_DEMAND_ZONE_COLOR,
  NORMAL_ZONE_COLOR,
  gameState
} from './globals.js';

export class PerformanceZone {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.size = ZONE_SIZE;
    this.type = type; // 'HIGH_DEMAND' or 'OPTIMIZED'
    this.lifetime = 600; // 10 seconds
  }
  
  update(p) {
    this.lifetime--;
    
    // Check if player is in zone
    if (gameState.player) {
      const dist = p.dist(this.x, this.y, gameState.player.x, gameState.player.y);
      if (dist < this.size / 2 + gameState.player.size / 2) {
        this.applyEffect();
      }
    }
    
    return this.lifetime > 0;
  }
  
  applyEffect() {
    if (this.type === 'HIGH_DEMAND') {
      gameState.currentFPS = Math.max(gameState.currentFPS - 0.2, 30);
      gameState.cpuUsage = Math.min(gameState.cpuUsage + 0.1, 95);
      gameState.gpuUsage = Math.min(gameState.gpuUsage + 0.1, 95);
    } else if (this.type === 'OPTIMIZED') {
      gameState.currentFPS = Math.min(gameState.currentFPS + 0.1, 90);
      gameState.cpuUsage = Math.max(gameState.cpuUsage - 0.1, 20);
      gameState.gpuUsage = Math.max(gameState.gpuUsage - 0.1, 20);
    }
  }
  
  draw(p) {
    p.push();
    
    const alpha = Math.min(this.lifetime / 600, 0.5) * 255;
    const color = this.type === 'HIGH_DEMAND' ? HIGH_DEMAND_ZONE_COLOR : NORMAL_ZONE_COLOR;
    
    p.fill(color[0], color[1], color[2], alpha * 0.4);
    p.stroke(color[0], color[1], color[2], alpha);
    p.strokeWeight(2);
    p.circle(this.x, this.y, this.size);
    
    // Icon
    p.fill(color[0], color[1], color[2], alpha);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text(this.type === 'HIGH_DEMAND' ? '⚠' : '✓', this.x, this.y);
    
    p.pop();
  }
}

export function spawnPerformanceZones(p) {
  // Spawn zones periodically
  if (gameState.frameCount % 180 === 0) {
    const type = Math.random() > 0.6 ? 'HIGH_DEMAND' : 'OPTIMIZED';
    const x = p.random(ZONE_SIZE, CANVAS_WIDTH - ZONE_SIZE);
    const y = p.random(ZONE_SIZE, CANVAS_HEIGHT - ZONE_SIZE);
    
    gameState.performanceZones.push(new PerformanceZone(x, y, type));
  }
}