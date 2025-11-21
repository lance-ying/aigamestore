// entities.js - Game entity classes

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;

import { gameState, FRUIT_TYPES, CONTAINER_X, CONTAINER_Y, DANGER_LINE_Y } from './globals.js';

export class Fruit {
  constructor(p, x, y, typeIndex) {
    this.p = p;
    this.typeIndex = typeIndex;
    this.type = FRUIT_TYPES[typeIndex];
    this.merged = false;
    this.markedForRemoval = false;
    
    // Create Matter.js body
    this.body = Bodies.circle(x, y, this.type.size, {
      label: 'fruit',
      restitution: 0.3,
      friction: 0.5,
      density: 0.001,
      fruitTypeIndex: typeIndex,
      fruitInstance: this
    });
    
    World.add(gameState.world, this.body);
    
    this.lastLoggedY = y;
  }
  
  update() {
    // Log position if changed significantly
    if (Math.abs(this.body.position.y - this.lastLoggedY) > 10) {
      this.lastLoggedY = this.body.position.y;
    }
    
    // Check if above danger line for game over
    if (this.body.position.y < DANGER_LINE_Y && !this.merged) {
      // Check if fruit is relatively still (settled)
      const velocity = Math.sqrt(
        Math.pow(this.body.velocity.x, 2) + 
        Math.pow(this.body.velocity.y, 2)
      );
      
      if (velocity < 0.5) {
        gameState.gameOverCheck = true;
      }
    }
  }
  
  render() {
    if (this.markedForRemoval) return;
    
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    
    // Draw fruit circle
    this.p.fill(...this.type.color);
    this.p.noStroke();
    this.p.circle(0, 0, this.type.size * 2);
    
    // Add a shine effect
    this.p.fill(255, 255, 255, 100);
    this.p.circle(-this.type.size * 0.3, -this.type.size * 0.3, this.type.size * 0.5);
    
    this.p.pop();
  }
  
  destroy() {
    this.markedForRemoval = true;
    World.remove(gameState.world, this.body);
  }
}

export class PreviewFruit {
  constructor(p, typeIndex) {
    this.p = p;
    this.typeIndex = typeIndex;
    this.type = FRUIT_TYPES[typeIndex];
    this.x = CONTAINER_X;
    this.y = CONTAINER_Y - 180; // Above container
  }
  
  update(deltaX) {
    const containerLeft = CONTAINER_X - 200 + this.type.size;
    const containerRight = CONTAINER_X + 200 - this.type.size;
    
    this.x += deltaX;
    this.x = this.p.constrain(this.x, containerLeft, containerRight);
  }
  
  render() {
    this.p.push();
    this.p.translate(this.x, this.y);
    
    // Draw semi-transparent preview
    this.p.fill(...this.type.color, 150);
    this.p.noStroke();
    this.p.circle(0, 0, this.type.size * 2);
    
    // Shine
    this.p.fill(255, 255, 255, 80);
    this.p.circle(-this.type.size * 0.3, -this.type.size * 0.3, this.type.size * 0.5);
    
    // Drop indicator line
    this.p.stroke(255, 255, 255, 100);
    this.p.strokeWeight(2);
    this.p.line(0, this.type.size, 0, CONTAINER_Y - 180 + 40);
    
    this.p.pop();
  }
}