// entities.js
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { World, Bodies, Body } = Matter;

import { gameState, GRID_OFFSET_X, GRID_OFFSET_Y, CELL_SIZE, FURBALL_RADIUS, GRID_SIZE } from './globals.js';

export class Furball {
  constructor(p, gridX, gridY, id) {
    this.p = p;
    this.id = id;
    this.gridX = gridX;
    this.gridY = gridY;
    this.targetGridX = gridX;
    this.targetGridY = gridY;
    
    const x = GRID_OFFSET_X + gridX * CELL_SIZE + CELL_SIZE / 2;
    const y = GRID_OFFSET_Y + gridY * CELL_SIZE + CELL_SIZE / 2;
    
    this.body = Bodies.circle(x, y, FURBALL_RADIUS, {
      label: 'furball',
      isStatic: true,
      friction: 0,
      restitution: 0,
      furballId: id
    });
    
    World.add(gameState.world, this.body);
    
    // Visual properties
    this.hue = (id * 137.5) % 360;
    this.isSelected = false;
    this.isOffScreen = false;
    this.pulsePhase = 0;
  }
  
  update() {
    this.pulsePhase += 0.05;
    
    // Check if off screen
    const pos = this.body.position;
    if (pos.x < GRID_OFFSET_X - FURBALL_RADIUS * 2 || 
        pos.x > GRID_OFFSET_X + GRID_SIZE * CELL_SIZE + FURBALL_RADIUS * 2 ||
        pos.y < GRID_OFFSET_Y - FURBALL_RADIUS * 2 || 
        pos.y > GRID_OFFSET_Y + GRID_SIZE * CELL_SIZE + FURBALL_RADIUS * 2) {
      this.isOffScreen = true;
    }
  }
  
  render() {
    if (this.isOffScreen) return;
    
    const p = this.p;
    const pos = this.body.position;
    
    p.push();
    p.translate(pos.x, pos.y);
    
    // Outer glow if selected
    if (this.isSelected) {
      const pulse = Math.sin(this.pulsePhase) * 0.3 + 0.7;
      p.fill(255, 255, 0, 100 * pulse);
      p.noStroke();
      p.circle(0, 0, FURBALL_RADIUS * 2.8);
    }
    
    // Main body
    p.colorMode(p.HSB);
    p.fill(this.hue, 80, 90);
    p.noStroke();
    p.circle(0, 0, FURBALL_RADIUS * 2);
    
    // Highlight
    p.fill(this.hue, 40, 100, 200);
    p.circle(-FURBALL_RADIUS * 0.3, -FURBALL_RADIUS * 0.3, FURBALL_RADIUS * 0.8);
    
    // Eyes
    p.colorMode(p.RGB);
    p.fill(50);
    p.circle(-FURBALL_RADIUS * 0.25, FURBALL_RADIUS * 0.1, FURBALL_RADIUS * 0.3);
    p.circle(FURBALL_RADIUS * 0.25, FURBALL_RADIUS * 0.1, FURBALL_RADIUS * 0.3);
    
    p.fill(255);
    p.circle(-FURBALL_RADIUS * 0.2, FURBALL_RADIUS * 0.05, FURBALL_RADIUS * 0.15);
    p.circle(FURBALL_RADIUS * 0.3, FURBALL_RADIUS * 0.05, FURBALL_RADIUS * 0.15);
    
    p.pop();
  }
  
  setPosition(x, y) {
    Body.setPosition(this.body, { x, y });
  }
  
  setGridPosition(gridX, gridY) {
    this.gridX = gridX;
    this.gridY = gridY;
    const x = GRID_OFFSET_X + gridX * CELL_SIZE + CELL_SIZE / 2;
    const y = GRID_OFFSET_Y + gridY * CELL_SIZE + CELL_SIZE / 2;
    this.setPosition(x, y);
  }
  
  getState() {
    return {
      id: this.id,
      gridX: this.gridX,
      gridY: this.gridY,
      isOffScreen: this.isOffScreen
    };
  }
  
  setState(state) {
    this.gridX = state.gridX;
    this.gridY = state.gridY;
    this.isOffScreen = state.isOffScreen;
    if (!this.isOffScreen) {
      this.setGridPosition(state.gridX, state.gridY);
    }
  }
}