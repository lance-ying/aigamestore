// entities.js - Game entities

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, World, Body } = Matter;

import { gameState, DOT_RADIUS, DOT_COLORS, GRID_OFFSET_X, GRID_OFFSET_Y, DOT_SIZE } from './globals.js';

export class Dot {
  constructor(p, gridX, gridY, colorIndex) {
    this.p = p;
    this.gridX = gridX;
    this.gridY = gridY;
    this.colorIndex = colorIndex;
    this.color = DOT_COLORS[colorIndex];
    
    const screenX = GRID_OFFSET_X + gridX * DOT_SIZE + DOT_SIZE / 2;
    const screenY = GRID_OFFSET_Y + gridY * DOT_SIZE + DOT_SIZE / 2;
    
    this.body = Bodies.circle(screenX, screenY, DOT_RADIUS, {
      label: 'dot',
      isStatic: true,
      friction: 0,
      restitution: 0
    });
    
    World.add(gameState.world, this.body);
    
    this.selected = false;
    this.markedForClear = false;
    this.scale = 1.0;
    this.alpha = 255;
    this.pulsePhase = this.p.random(0, this.p.TWO_PI);
  }

  update() {
    // Animate selected dots
    if (this.selected) {
      this.scale = 1.0 + 0.1 * this.p.sin(this.p.frameCount * 0.2 + this.pulsePhase);
    } else {
      this.scale = 1.0;
    }
    
    // Fade out if marked for clear
    if (this.markedForClear) {
      this.alpha = Math.max(0, this.alpha - 15);
      this.scale = this.scale * 0.95;
    }
  }

  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    
    // Draw glow for selected dots
    if (this.selected) {
      this.p.noStroke();
      this.p.fill(this.color[0], this.color[1], this.color[2], 60);
      this.p.circle(0, 0, DOT_RADIUS * 2.6 * this.scale);
    }
    
    // Draw dot
    this.p.fill(this.color[0], this.color[1], this.color[2], this.alpha);
    this.p.noStroke();
    this.p.circle(0, 0, DOT_RADIUS * 2 * this.scale);
    
    // Draw inner highlight
    this.p.fill(255, 255, 255, this.alpha * 0.4);
    this.p.circle(-DOT_RADIUS * 0.3, -DOT_RADIUS * 0.3, DOT_RADIUS * 0.6);
    
    this.p.pop();
  }

  getScreenPos() {
    return { x: this.body.position.x, y: this.body.position.y };
  }

  getGridPosition() {
    const screenX = GRID_OFFSET_X + this.gridX * DOT_SIZE + DOT_SIZE / 2;
    const screenY = GRID_OFFSET_Y + this.gridY * DOT_SIZE + DOT_SIZE / 2;
    return { x: screenX, y: screenY };
  }

  isAdjacent(otherDot) {
    const dx = Math.abs(this.gridX - otherDot.gridX);
    const dy = Math.abs(this.gridY - otherDot.gridY);
    // Allow horizontal, vertical, AND diagonal adjacency
    return (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
  }

  destroy() {
    if (this.body && gameState.world) {
      World.remove(gameState.world, this.body);
    }
  }
}

export class Particle {
  constructor(p, x, y, color) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = this.p.random(-3, 3);
    this.vy = this.p.random(-5, -2);
    this.color = color;
    this.alpha = 255;
    this.size = this.p.random(4, 8);
    this.lifetime = 0;
    this.maxLifetime = 30;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.3; // gravity
    this.lifetime++;
    this.alpha = 255 * (1 - this.lifetime / this.maxLifetime);
    return this.lifetime < this.maxLifetime;
  }

  render() {
    this.p.push();
    this.p.noStroke();
    this.p.fill(this.color[0], this.color[1], this.color[2], this.alpha);
    this.p.circle(this.x, this.y, this.size);
    this.p.pop();
  }
}