// ai.js - AI behavior for worms

import { AI_DECISION_INTERVAL, ARENA_WIDTH, ARENA_HEIGHT } from './globals.js';

export class AIController {
  constructor(worm) {
    this.worm = worm;
    this.decisionTimer = 0;
    this.targetX = worm.x;
    this.targetY = worm.y;
    this.avoidanceMode = false;
  }

  update(gameState) {
    if (!this.worm.alive) return;

    this.decisionTimer--;
    if (this.decisionTimer <= 0) {
      this.makeDecision(gameState);
      this.decisionTimer = AI_DECISION_INTERVAL;
    }

    // Calculate angle to target
    const dx = this.targetX - this.worm.x;
    const dy = this.targetY - this.worm.y;
    let targetAngle = Math.atan2(dy, dx);

    this.worm.setTargetAngle(targetAngle);
  }

  makeDecision(gameState) {
    const head = this.worm.getHead();
    
    // Check for nearby threats
    const nearbyThreats = this.findNearbyThreats(gameState, head, 80);
    
    if (nearbyThreats.length > 0) {
      // Avoid threats
      this.avoidanceMode = true;
      const threat = nearbyThreats[0];
      const avoidAngle = Math.atan2(head.y - threat.y, head.x - threat.x);
      this.targetX = head.x + Math.cos(avoidAngle) * 100;
      this.targetY = head.y + Math.sin(avoidAngle) * 100;
    } else {
      this.avoidanceMode = false;
      
      // Find nearest food
      const nearestFood = this.findNearestFood(gameState, head, 150);
      
      if (nearestFood) {
        this.targetX = nearestFood.x;
        this.targetY = nearestFood.y;
      } else {
        // Random exploration
        if (Math.random() < 0.1) {
          this.targetX = Math.random() * ARENA_WIDTH;
          this.targetY = Math.random() * ARENA_HEIGHT;
        }
      }
    }

    // Keep targets in bounds
    this.targetX = Math.max(50, Math.min(ARENA_WIDTH - 50, this.targetX));
    this.targetY = Math.max(50, Math.min(ARENA_HEIGHT - 50, this.targetY));
  }

  findNearbyThreats(gameState, head, range) {
    const threats = [];
    
    // Check all worms
    const allWorms = [gameState.player, ...gameState.aiWorms].filter(w => w && w.alive && w !== this.worm);
    
    for (const worm of allWorms) {
      for (let i = 3; i < worm.segments.length; i++) {
        const seg = worm.segments[i];
        const dist = Math.hypot(seg.x - head.x, seg.y - head.y);
        if (dist < range) {
          threats.push(seg);
        }
      }
    }
    
    return threats;
  }

  findNearestFood(gameState, head, range) {
    let nearest = null;
    let minDist = range;

    for (const food of gameState.food) {
      if (food.collected) continue;
      const dist = Math.hypot(food.x - head.x, food.y - head.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = food;
      }
    }

    return nearest;
  }
}