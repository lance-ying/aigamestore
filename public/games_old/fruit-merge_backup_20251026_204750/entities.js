// entities.js - Entity classes for game objects

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies } = Matter;

import { FRUIT_TYPES } from './globals.js';

export class Fruit {
  constructor(x, y, typeIndex) {
    this.typeIndex = typeIndex;
    this.fruitData = FRUIT_TYPES[typeIndex];
    
    this.body = Bodies.circle(x, y, this.fruitData.radius, {
      restitution: 0.3,
      friction: 0.5,
      density: 0.01,  // Increased from 0.001 to prevent phasing through walls
      label: 'fruit'
    });
    
    this.body.fruitInstance = this;
    this.merged = false;
  }
  
  draw(ctx) {
    if (this.merged) return;
    
    ctx.save();
    ctx.translate(this.body.position.x, this.body.position.y);
    ctx.rotate(this.body.angle);
    
    // Draw fruit as a circle with gradient
    const gradient = ctx.createRadialGradient(
      -this.fruitData.radius * 0.3, 
      -this.fruitData.radius * 0.3, 
      0, 
      0, 
      0, 
      this.fruitData.radius
    );
    gradient.addColorStop(0, this.lightenColor(this.fruitData.color, 40));
    gradient.addColorStop(1, this.fruitData.color);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.fruitData.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Add outline
    ctx.strokeStyle = this.darkenColor(this.fruitData.color, 20);
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Add highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(-this.fruitData.radius * 0.3, -this.fruitData.radius * 0.3, this.fruitData.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
  
  lightenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255))
      .toString(16).slice(1);
  }
  
  darkenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R > 0 ? R : 0) * 0x10000 +
      (G > 0 ? G : 0) * 0x100 +
      (B > 0 ? B : 0))
      .toString(16).slice(1);
  }
}

export class Container {
  constructor(x, y, width, height, wallThickness) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.wallThickness = wallThickness;
  }
  
  draw(ctx) {
    // Draw container walls
    ctx.fillStyle = '#8B4513';
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    
    // Left wall
    ctx.fillRect(
      this.x - this.width / 2 - this.wallThickness,
      this.y - this.height / 2,
      this.wallThickness,
      this.height
    );
    ctx.strokeRect(
      this.x - this.width / 2 - this.wallThickness,
      this.y - this.height / 2,
      this.wallThickness,
      this.height
    );
    
    // Right wall
    ctx.fillRect(
      this.x + this.width / 2,
      this.y - this.height / 2,
      this.wallThickness,
      this.height
    );
    ctx.strokeRect(
      this.x + this.width / 2,
      this.y - this.height / 2,
      this.wallThickness,
      this.height
    );
    
    // Bottom
    ctx.fillRect(
      this.x - this.width / 2 - this.wallThickness,
      this.y + this.height / 2,
      this.width + this.wallThickness * 2,
      this.wallThickness
    );
    ctx.strokeRect(
      this.x - this.width / 2 - this.wallThickness,
      this.y + this.height / 2,
      this.width + this.wallThickness * 2,
      this.wallThickness
    );
    
    // Draw background
    ctx.fillStyle = 'rgba(255, 248, 220, 0.3)';
    ctx.fillRect(
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height
    );
  }
}