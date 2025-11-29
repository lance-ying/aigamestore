// entities.js - Entity classes for game objects

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, World, Body } = Matter;
import { gameState, CANVAS_WIDTH, PLATFORM_Y } from './globals.js';

export class Shape {
  constructor(p, x, y, type, shapeType, size, color) {
    this.p = p;
    this.type = type; // 'red', 'green', 'gray'
    this.shapeType = shapeType; // 'circle', 'rectangle', 'triangle'
    this.size = size;
    this.color = color;
    this.removed = false;
    this.lastVelocity = 0;
    
    // Create Matter.js body based on shape type
    if (shapeType === 'circle') {
      this.body = Bodies.circle(x, y, size, {
        label: type,
        friction: 0.6,
        restitution: 0.2,
        density: 0.001
      });
    } else if (shapeType === 'rectangle') {
      this.body = Bodies.rectangle(x, y, size * 2, size * 2, {
        label: type,
        friction: 0.6,
        restitution: 0.2,
        density: 0.001
      });
    } else if (shapeType === 'triangle') {
      const vertices = [
        { x: 0, y: -size },
        { x: size, y: size },
        { x: -size, y: size }
      ];
      this.body = Bodies.fromVertices(x, y, vertices, {
        label: type,
        friction: 0.6,
        restitution: 0.2,
        density: 0.001
      });
    }
    
    World.add(gameState.world, this.body);
  }
  
  update() {
    if (!this.removed) {
      // Calculate velocity magnitude
      const vel = this.body.velocity;
      this.lastVelocity = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
    }
  }
  
  render() {
    if (this.removed) return;
    
    const p = this.p;
    p.push();
    p.translate(this.body.position.x, this.body.position.y);
    p.rotate(this.body.angle);
    
    // Set color
    p.fill(this.color);
    p.stroke(0);
    p.strokeWeight(2);
    
    // Draw shape
    if (this.shapeType === 'circle') {
      p.circle(0, 0, this.size * 2);
    } else if (this.shapeType === 'rectangle') {
      p.rectMode(p.CENTER);
      p.rect(0, 0, this.size * 2, this.size * 2);
    } else if (this.shapeType === 'triangle') {
      p.beginShape();
      const vertices = this.body.vertices;
      for (let v of vertices) {
        const vx = v.x - this.body.position.x;
        const vy = v.y - this.body.position.y;
        p.vertex(vx, vy);
      }
      p.endShape(p.CLOSE);
    }
    
    p.pop();
  }
  
  isOnPlatform() {
    // Check if shape is within platform bounds
    const x = this.body.position.x;
    const y = this.body.position.y;
    return y < PLATFORM_Y + 50 && x > 50 && x < CANVAS_WIDTH - 50;
  }
  
  isOffScreen() {
    const x = this.body.position.x;
    const y = this.body.position.y;
    return y > 450 || x < -50 || x > CANVAS_WIDTH + 50;
  }
  
  containsPoint(x, y) {
    if (this.removed) return false;
    
    // Simple bounding box check
    const pos = this.body.position;
    const size = this.size;
    
    if (this.shapeType === 'circle') {
      const dist = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
      return dist < size;
    } else {
      // For polygons, use bounding box
      return Math.abs(x - pos.x) < size && Math.abs(y - pos.y) < size;
    }
  }
  
  remove() {
    if (!this.removed) {
      this.removed = true;
      World.remove(gameState.world, this.body);
    }
  }
}

export class Platform {
  constructor(p, x, y, width, height) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    
    // Create static Matter.js body
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'platform',
      isStatic: true,
      friction: 0.8,
      restitution: 0
    });
    
    World.add(gameState.world, this.body);
  }
  
  render() {
    const p = this.p;
    p.push();
    p.fill(100, 80, 60);
    p.stroke(60, 40, 20);
    p.strokeWeight(3);
    p.rectMode(p.CENTER);
    p.rect(this.x, this.y, this.width, this.height);
    
    // Draw platform texture
    p.stroke(80, 60, 40);
    p.strokeWeight(2);
    for (let i = 0; i < this.width; i += 30) {
      p.line(this.x - this.width / 2 + i, this.y - this.height / 2,
             this.x - this.width / 2 + i, this.y + this.height / 2);
    }
    p.pop();
  }
}