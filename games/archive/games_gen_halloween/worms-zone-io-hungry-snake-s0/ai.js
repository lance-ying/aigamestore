// ai.js - AI logic for computer-controlled worms
import { distance, normalizeAngle } from './utils.js';
import { ARENA_CENTER_X, ARENA_CENTER_Y, ARENA_RADIUS } from './globals.js';

export class AIController {
  constructor(worm, p) {
    this.worm = worm;
    this.p = p;
    this.targetFood = null;
    this.avoidanceMode = false;
    this.randomTargetAngle = p.random(0, p.TWO_PI);
    this.decisionTimer = 0;
  }

  update(foods, worms) {
    this.decisionTimer++;
    
    if (!this.worm.isAlive) return;

    const head = this.worm.getHead();
    
    // Check for nearby threats
    let nearestThreat = null;
    let minThreatDist = Infinity;
    
    for (const otherWorm of worms) {
      if (otherWorm === this.worm || !otherWorm.isAlive) continue;
      
      for (const seg of otherWorm.segments) {
        const dist = distance(head.x, head.y, seg.x, seg.y);
        if (dist < 40 && dist < minThreatDist) {
          minThreatDist = dist;
          nearestThreat = { x: seg.x, y: seg.y };
        }
      }
    }

    // Check arena boundary
    const distFromCenter = distance(head.x, head.y, ARENA_CENTER_X, ARENA_CENTER_Y);
    const avoidBoundary = distFromCenter > ARENA_RADIUS - 30;

    // Decision making
    if (nearestThreat && minThreatDist < 30) {
      // Avoid threat
      const avoidAngle = Math.atan2(head.y - nearestThreat.y, head.x - nearestThreat.x);
      this.worm.setTargetAngle(avoidAngle);
    } else if (avoidBoundary) {
      // Turn towards center
      const centerAngle = Math.atan2(ARENA_CENTER_Y - head.y, ARENA_CENTER_X - head.x);
      this.worm.setTargetAngle(centerAngle);
    } else {
      // Find and move towards nearest food
      let nearestFood = null;
      let minDist = Infinity;
      
      for (const food of foods) {
        if (!food.active) continue;
        const dist = distance(head.x, head.y, food.x, food.y);
        if (dist < 100 && dist < minDist) {
          minDist = dist;
          nearestFood = food;
        }
      }

      if (nearestFood) {
        const foodAngle = Math.atan2(nearestFood.y - head.y, nearestFood.x - head.x);
        this.worm.setTargetAngle(foodAngle);
      } else {
        // Random movement with occasional direction changes
        if (this.decisionTimer > 60) {
          this.randomTargetAngle = this.p.random(0, this.p.TWO_PI);
          this.decisionTimer = 0;
        }
        this.worm.setTargetAngle(this.randomTargetAngle);
      }
    }

    // Occasionally boost towards food
    if (nearestFood && minDist < 60 && minDist > 20 && this.worm.mass > 50) {
      if (this.p.random() < 0.02) {
        this.worm.isBoosting = true;
      }
    } else {
      this.worm.isBoosting = false;
    }
  }
}