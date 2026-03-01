import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { World, Bodies, Body } = Matter;
import { gameState, CATEGORIES, PALETTE } from './globals.js';
import { drawBody } from './renderer.js';

export class Target {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.radius = 10;
    this.collected = false;
    this.pulsePhase = 0;
    
    this.body = Bodies.circle(x, y, this.radius, {
      isStatic: true,
      label: 'target',
      isSensor: true, // Don't physically block letters
      collisionFilter: {
        category: CATEGORIES.TARGET,
        mask: CATEGORIES.LETTER
      }
    });
    
    World.add(gameState.world, this.body);
  }
  
  collect() {
    if (!this.collected) {
      this.collected = true;
      // Visual feedback handled in render
      // Remove from physics world immediately to prevent double triggers
      World.remove(gameState.world, this.body);
    }
  }
  
  render(p) {
    if (this.collected) return;
    
    this.pulsePhase += 0.1;
    const pulse = Math.sin(this.pulsePhase) * 2;
    
    p.push();
    p.translate(this.x, this.y);
    p.noStroke();
    
    // Glow
    p.fill(255, 255, 0, 100);
    p.circle(0, 0, (this.radius * 2) + 10 + pulse);
    
    // Core
    p.fill(PALETTE.target);
    p.circle(0, 0, (this.radius * 2) + pulse);
    
    p.pop();
  }
}

export class Obstacle {
  constructor(p, x, y, w, h, angle = 0) {
    this.p = p;
    this.w = w;
    this.h = h;
    
    this.body = Bodies.rectangle(x, y, w, h, {
      isStatic: true,
      label: 'obstacle',
      angle: angle,
      friction: 0.8,
      collisionFilter: {
        category: CATEGORIES.OBSTACLE,
        mask: CATEGORIES.LETTER
      }
    });
    
    World.add(gameState.world, this.body);
  }
  
  render(p) {
    p.push();
    p.fill(PALETTE.obstacle);
    p.noStroke();
    drawBody(p, this.body);
    p.pop();
  }
}