// entities.js - Game entity classes

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;
import { gameState } from './globals.js';

export class SugarParticle {
  constructor(p, x, y, color = [255, 255, 255]) {
    this.p = p;
    this.color = color;
    this.active = true;
    this.offScreen = false;
    
    // Create Matter.js body
    this.body = Bodies.circle(x, y, 3, {
      label: 'sugar',
      restitution: 0.3,
      friction: 0.1,
      density: 0.001,
      frictionAir: 0.01
    });
    
    World.add(gameState.world, this.body);
  }
  
  update() {
    // Check if off screen
    if (this.body.position.y > 450 || this.body.position.x < -50 || this.body.position.x > 650) {
      this.offScreen = true;
      this.active = false;
    }
  }
  
  render() {
    if (!this.active) return;
    
    this.p.push();
    this.p.fill(this.color[0], this.color[1], this.color[2]);
    this.p.noStroke();
    this.p.circle(this.body.position.x, this.body.position.y, 6);
    this.p.pop();
  }
  
  setColor(color) {
    this.color = color;
  }
  
  destroy() {
    World.remove(gameState.world, this.body);
    this.active = false;
  }
}

export class Cup {
  constructor(p, x, y, width, height, targetAmount, color = null) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.targetAmount = targetAmount;
    this.currentAmount = 0;
    this.requiredColor = color; // null means any color
    this.collectedParticles = [];
    
    // Create Matter.js bodies for cup walls
    this.bodies = [];
    
    const wallThickness = 5;
    
    // Left wall
    const leftWall = Bodies.rectangle(
      x - width/2 + wallThickness/2,
      y,
      wallThickness,
      height,
      { 
        isStatic: true,
        label: 'cup_wall',
        friction: 0.8
      }
    );
    
    // Right wall
    const rightWall = Bodies.rectangle(
      x + width/2 - wallThickness/2,
      y,
      wallThickness,
      height,
      { 
        isStatic: true,
        label: 'cup_wall',
        friction: 0.8
      }
    );
    
    // Bottom wall
    const bottomWall = Bodies.rectangle(
      x,
      y + height/2 - wallThickness/2,
      width,
      wallThickness,
      { 
        isStatic: true,
        label: 'cup_bottom',
        friction: 0.8
      }
    );
    
    // Store reference to this cup in each body
    leftWall.cupReference = this;
    rightWall.cupReference = this;
    bottomWall.cupReference = this;
    
    this.bodies.push(leftWall, rightWall, bottomWall);
    World.add(gameState.world, this.bodies);
  }
  
  checkParticleInside(particle) {
    const px = particle.body.position.x;
    const py = particle.body.position.y;
    
    // Check if particle is inside cup bounds
    if (px > this.x - this.width/2 && 
        px < this.x + this.width/2 &&
        py > this.y - this.height/2 && 
        py < this.y + this.height/2) {
      
      // Check color requirement
      if (this.requiredColor === null || this.colorsMatch(particle.color, this.requiredColor)) {
        if (!this.collectedParticles.includes(particle)) {
          this.collectedParticles.push(particle);
          this.currentAmount++;
          particle.destroy();
          return true;
        }
      }
    }
    return false;
  }
  
  colorsMatch(color1, color2) {
    return color1[0] === color2[0] && 
           color1[1] === color2[1] && 
           color1[2] === color2[2];
  }
  
  isFilled() {
    return this.currentAmount >= this.targetAmount;
  }
  
  getFillPercentage() {
    return Math.min(100, (this.currentAmount / this.targetAmount) * 100);
  }
  
  render() {
    this.p.push();
    
    // Draw cup walls
    this.p.fill(100);
    this.p.noStroke();
    
    this.bodies.forEach(body => {
      this.p.push();
      this.p.translate(body.position.x, body.position.y);
      this.p.rotate(body.angle);
      
      const vertices = body.vertices;
      this.p.beginShape();
      for (let v of vertices) {
        const vx = v.x - body.position.x;
        const vy = v.y - body.position.y;
        this.p.vertex(vx, vy);
      }
      this.p.endShape(this.p.CLOSE);
      this.p.pop();
    });
    
    // Draw fill indicator
    const fillHeight = (this.currentAmount / this.targetAmount) * (this.height - 10);
    if (fillHeight > 0) {
      if (this.requiredColor) {
        this.p.fill(this.requiredColor[0], this.requiredColor[1], this.requiredColor[2], 150);
      } else {
        this.p.fill(255, 255, 255, 150);
      }
      this.p.rect(
        this.x - this.width/2 + 8,
        this.y + this.height/2 - 8 - fillHeight,
        this.width - 16,
        fillHeight
      );
    }
    
    // Draw target indicator
    this.p.fill(255);
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(12);
    this.p.text(`${this.currentAmount}/${this.targetAmount}`, this.x, this.y - this.height/2 - 15);
    
    // Draw color indicator if required
    if (this.requiredColor) {
      this.p.fill(this.requiredColor[0], this.requiredColor[1], this.requiredColor[2]);
      this.p.circle(this.x, this.y - this.height/2 - 25, 10);
    }
    
    this.p.pop();
  }
  
  destroy() {
    this.bodies.forEach(body => {
      World.remove(gameState.world, body);
    });
  }
}

export class ColorFilter {
  constructor(p, x, y, width, height, color) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    
    // Create sensor body (no collision)
    this.body = Bodies.rectangle(x, y, width, height, {
      isStatic: true,
      isSensor: true,
      label: 'color_filter'
    });
    
    this.body.filterReference = this;
    World.add(gameState.world, this.body);
  }
  
  render() {
    this.p.push();
    this.p.fill(this.color[0], this.color[1], this.color[2], 100);
    this.p.stroke(this.color[0], this.color[1], this.color[2]);
    this.p.strokeWeight(2);
    this.p.rect(this.x, this.y, this.width, this.height);
    this.p.pop();
  }
  
  destroy() {
    World.remove(gameState.world, this.body);
  }
}

export class DrawnLine {
  constructor(p, x1, y1, x2, y2) {
    this.p = p;
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    
    // Calculate angle and dimensions
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;
    
    this.length = length;
    
    // Create Matter.js body
    this.body = Bodies.rectangle(centerX, centerY, length, 4, {
      isStatic: true,
      angle: angle,
      label: 'drawn_line',
      friction: 0.8
    });
    
    World.add(gameState.world, this.body);
  }
  
  render() {
    this.p.push();
    this.p.stroke(80, 60, 40);
    this.p.strokeWeight(4);
    this.p.line(this.x1, this.y1, this.x2, this.y2);
    this.p.pop();
  }
  
  destroy() {
    World.remove(gameState.world, this.body);
  }
}

export class SugarSource {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.spawnRate = 3; // particles per second at 60fps
    this.frameCounter = 0;
    this.active = true;
  }
  
  update() {
    if (!this.active || gameState.totalSugarProduced >= gameState.maxSugarPerLevel) {
      this.active = false;
      return;
    }
    
    this.frameCounter++;
    
    // Spawn particles based on rate
    const framesPerParticle = 60 / this.spawnRate;
    if (this.frameCounter >= framesPerParticle) {
      this.spawnParticle();
      this.frameCounter = 0;
    }
  }
  
  spawnParticle() {
    const offsetX = this.p.random(-5, 5);
    const particle = new SugarParticle(this.p, this.x + offsetX, this.y);
    gameState.sugarParticles.push(particle);
    gameState.entities.push(particle);
    gameState.totalSugarProduced++;
  }
  
  render() {
    this.p.push();
    this.p.fill(200);
    this.p.noStroke();
    this.p.rect(this.x, this.y - 10, 30, 20);
    
    // Draw spout
    this.p.fill(150);
    this.p.triangle(
      this.x - 10, this.y,
      this.x + 10, this.y,
      this.x, this.y + 10
    );
    
    this.p.pop();
  }
}