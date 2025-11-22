// ai.js - AI behavior for worms

import { AI_DECISION_INTERVAL, ARENA_WIDTH, ARENA_HEIGHT } from './globals.js';

export class AIController {
  constructor(worm) {
    this.worm = worm;
    this.decisionTimer = 0;
    this.targetX = worm.x;
    this.targetY = worm.y;
    this.avoidanceMode = false;
    this.confusionTimer = 0;
    this.aimError = 0;
  }

  update(gameState) {
    if (!this.worm.alive) return;

    this.decisionTimer--;
    if (this.decisionTimer <= 0) {
      this.makeDecision(gameState);
      // Vary decision interval to make reactions inconsistent (±50%)
      const variation = AI_DECISION_INTERVAL * (0.5 + Math.random());
      this.decisionTimer = Math.floor(variation);
    }

    // Calculate angle to target with imperfect aim
    const dx = this.targetX - this.worm.x;
    const dy = this.targetY - this.worm.y;
    let targetAngle = Math.atan2(dy, dx);
    
    // Add aim error (AI doesn't aim perfectly)
    targetAngle += this.aimError;

    this.worm.setTargetAngle(targetAngle);
    
    // Update confusion timer
    if (this.confusionTimer > 0) {
      this.confusionTimer--;
    }
  }

  makeDecision(gameState) {
    const head = this.worm.getHead();
    
    // 10% chance to make a completely random decision (confusion)
    if (Math.random() < 0.1) {
      this.confusionTimer = 30;
      this.targetX = head.x + (Math.random() - 0.5) * 200;
      this.targetY = head.y + (Math.random() - 0.5) * 200;
      this.aimError = (Math.random() - 0.5) * 0.5;
      return;
    }
    
    // If confused, don't make new decisions
    if (this.confusionTimer > 0) {
      return;
    }
    
    // Check for nearby threats (but only detect 70% of the time)
    const nearbyThreats = Math.random() < 0.7 ? this.findNearbyThreats(gameState, head, 80) : [];
    
    if (nearbyThreats.length > 0) {
      // 20% chance to ignore the threat (mistake)
      if (Math.random() < 0.2) {
        // Ignore threat, continue with food collection
        this.avoidanceMode = false;
      } else {
        // Avoid threats (but with imperfect aim)
        this.avoidanceMode = true;
        const threat = nearbyThreats[0];
        const avoidAngle = Math.atan2(head.y - threat.y, head.x - threat.x);
        // Add some error to avoidance angle
        const errorAngle = (Math.random() - 0.5) * 0.8;
        this.targetX = head.x + Math.cos(avoidAngle + errorAngle) * 100;
        this.targetY = head.y + Math.sin(avoidAngle + errorAngle) * 100;
        this.aimError = (Math.random() - 0.5) * 0.3;
        return;
      }
    } else {
      this.avoidanceMode = false;
    }
    
    // Find food (but not always the nearest one)
    const nearestFood = this.findNearestFood(gameState, head, 150);
    
    if (nearestFood) {
      // 30% chance to pick a suboptimal food target
      if (Math.random() < 0.3) {
        const randomFood = this.findRandomNearbyFood(gameState, head, 200);
        if (randomFood) {
          this.targetX = randomFood.x;
          this.targetY = randomFood.y;
        } else {
          this.targetX = nearestFood.x;
          this.targetY = nearestFood.y;
        }
      } else {
        this.targetX = nearestFood.x;
        this.targetY = nearestFood.y;
      }
      
      // Add aiming error (AI doesn't aim perfectly at food)
      this.aimError = (Math.random() - 0.5) * 0.4;
    } else {
      // Random exploration (with more variation)
      if (Math.random() < 0.15) {
        this.targetX = Math.random() * ARENA_WIDTH;
        this.targetY = Math.random() * ARENA_HEIGHT;
        this.aimError = (Math.random() - 0.5) * 0.6;
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
      // Only check some segments (simulating imperfect awareness)
      const checkInterval = Math.random() < 0.5 ? 2 : 4;
      for (let i = 3; i < worm.segments.length; i += checkInterval) {
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

    // Only check a subset of food (simulating limited awareness)
    const foodToCheck = gameState.food.filter(() => Math.random() < 0.7);

    for (const food of foodToCheck) {
      if (food.collected) continue;
      const dist = Math.hypot(food.x - head.x, food.y - head.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = food;
      }
    }

    return nearest;
  }

  findRandomNearbyFood(gameState, head, range) {
    const nearbyFood = [];
    
    for (const food of gameState.food) {
      if (food.collected) continue;
      const dist = Math.hypot(food.x - head.x, food.y - head.y);
      if (dist < range) {
        nearbyFood.push(food);
      }
    }
    
    if (nearbyFood.length === 0) return null;
    
    // Pick a random food from nearby options
    return nearbyFood[Math.floor(Math.random() * nearbyFood.length)];
  }
}