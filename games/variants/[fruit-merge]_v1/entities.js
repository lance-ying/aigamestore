// entities.js - Entity classes for game objects

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies } = Matter;

import { FRUIT_TYPES } from './globals.js';

export class Fruit {
  constructor(x, y, typeIndex) {
    this.typeIndex = typeIndex;
    this.fruitData = FRUIT_TYPES[typeIndex];
    
    // Use defined physics properties or defaults
    const restitution = this.fruitData.restitution !== undefined ? this.fruitData.restitution : 0.3;
    const friction = this.fruitData.friction !== undefined ? this.fruitData.friction : 0.5;
    
    this.body = Bodies.circle(x, y, this.fruitData.radius, {
      restitution: restitution,
      friction: friction,
      density: 0.01,
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
    
    // Use the static helper to draw the visuals at (0,0)
    Fruit.drawVisuals(ctx, 0, 0, this.fruitData.radius, this.fruitData.color);
    
    ctx.restore();
  }

  // Static helper to draw a cartoon fruit at a specific location
  // Useful for the main game loop, previews, and UI
  static drawVisuals(ctx, x, y, radius, color) {
    ctx.save();
    ctx.translate(x, y);

    // 1. Body with Gradient
    const gradient = ctx.createRadialGradient(
      -radius * 0.3, -radius * 0.3, 0, 
      0, 0, radius
    );
    gradient.addColorStop(0, Fruit.lightenColor(color, 40));
    gradient.addColorStop(1, color);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 2. Thick Cartoon Outline
    ctx.strokeStyle = '#2c3e50'; // Dark blue-grey outline
    ctx.lineWidth = 2.5;
    ctx.stroke();
    
    // 3. Glossy Highlight (Top Left)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(-radius * 0.35, -radius * 0.35, radius * 0.25, radius * 0.15, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // 4. Cartoon Face
    // Only draw face if fruit is big enough to look good
    if (radius > 10) {
      // Eyes
      const eyeX = radius * 0.25;
      const eyeY = -radius * 0.05;
      const eyeSize = radius * 0.15;
      
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-eyeX, eyeY, eyeSize, 0, Math.PI * 2); // Left Eye
      ctx.arc(eyeX, eyeY, eyeSize, 0, Math.PI * 2);  // Right Eye
      ctx.fill();
      
      // Pupils
      ctx.fillStyle = '#2c3e50';
      const pupilSize = eyeSize * 0.5;
      ctx.beginPath();
      ctx.arc(-eyeX, eyeY, pupilSize, 0, Math.PI * 2);
      ctx.arc(eyeX, eyeY, pupilSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Mouth (Simple Smile)
      ctx.strokeStyle = '#2c3e50';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, eyeY + radius * 0.15, radius * 0.2, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    }

    ctx.restore();
  }
  
  static lightenColor(color, percent) {
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
  
  static darkenColor(color, percent) {
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
    // Draw stylized wooden crate container
    
    // Background (Inside of the box)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height
    );

    // Wall Styles
    const woodColor = '#8B4513';
    const woodLight = '#A0522D';
    const borderColor = '#5D4037';
    
    ctx.fillStyle = woodColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    
    // Helper to draw a wall segment
    const drawWall = (x, y, w, h) => {
      ctx.fillRect(x, y, w, h);
      
      // Add wood grain texture effect
      ctx.save();
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Simple lines for texture
      for(let i=0; i<w; i+=10) {
        ctx.moveTo(x + i, y);
        ctx.lineTo(x + i, y + h);
      }
      ctx.stroke();
      ctx.restore();
      
      // Outline
      ctx.strokeRect(x, y, w, h);
    };

    // Left wall
    drawWall(
      this.x - this.width / 2 - this.wallThickness,
      this.y - this.height / 2,
      this.wallThickness,
      this.height
    );
    
    // Right wall
    drawWall(
      this.x + this.width / 2,
      this.y - this.height / 2,
      this.wallThickness,
      this.height
    );
    
    // Bottom
    drawWall(
      this.x - this.width / 2 - this.wallThickness,
      this.y + this.height / 2,
      this.width + this.wallThickness * 2,
      this.wallThickness
    );
  }
}