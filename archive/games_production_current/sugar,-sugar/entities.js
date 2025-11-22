// entities.js - Game entity classes

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { colorsMatch } from './levels.js';

export class SugarParticle {
  constructor(x, y, color = [255, 255, 255]) {
    // Add size variation
    this.radius = 2 + Math.random() * 3; // 2-5 pixel radius
    
    this.body = Bodies.circle(x, y, this.radius, {
      label: 'sugar',
      friction: 0.05,  // Reduced from 0.3 to 0.05 for smoother movement
      restitution: 0.4,
      density: 0.001,
      frictionAir: 0.01
    });
    World.add(gameState.world, this.body);
    
    // Add slight color variation
    const colorVar = 10;
    this.color = [
      Math.max(0, Math.min(255, color[0] + (Math.random() - 0.5) * colorVar)),
      Math.max(0, Math.min(255, color[1] + (Math.random() - 0.5) * colorVar)),
      Math.max(0, Math.min(255, color[2] + (Math.random() - 0.5) * colorVar))
    ];
    this.alpha = 180 + Math.random() * 60; // 180-240 alpha variation
    
    // Add slight shape variation for sugar-like appearance
    this.shapeVariation = Math.random();
    
    this.age = 0;
    this.inCup = false;
    this.markedForRemoval = false;
    this.lastPosition = { x: x, y: y };
  }
  
  update() {
    this.age++;
    
    // Check if out of bounds
    if (this.body.position.y > CANVAS_HEIGHT + 50 || 
        this.body.position.y < -50 ||
        this.body.position.x < -50 || 
        this.body.position.x > CANVAS_WIDTH + 50) {
      this.markedForRemoval = true;
    }
    
    // Check if essentially stationary in a cup
    if (this.inCup) {
      const dx = this.body.position.x - this.lastPosition.x;
      const dy = this.body.position.y - this.lastPosition.y;
      const movement = Math.sqrt(dx * dx + dy * dy);
      
      if (movement < 0.5 && this.age > 60) {
        // Particle has settled
      }
    }
    
    this.lastPosition = { x: this.body.position.x, y: this.body.position.y };
  }
  
  render(p) {
    p.push();
    p.noStroke();
    p.fill(this.color[0], this.color[1], this.color[2], this.alpha);
    
    // Render as slightly irregular shape to look more like sugar grain
    const x = this.body.position.x;
    const y = this.body.position.y;
    
    // Create an irregular polygon based on shape variation
    p.beginShape();
    const points = 6;
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const radiusVar = this.radius * (0.8 + this.shapeVariation * 0.4);
      const offsetX = Math.cos(angle + this.shapeVariation) * radiusVar;
      const offsetY = Math.sin(angle + this.shapeVariation) * radiusVar;
      p.vertex(x + offsetX, y + offsetY);
    }
    p.endShape(p.CLOSE);
    
    // Add a small highlight for sugar crystal effect
    p.fill(255, 255, 255, this.alpha * 0.5);
    p.circle(x + this.radius * 0.2, y - this.radius * 0.2, this.radius * 0.4);
    
    p.pop();
  }
  
  changeColor(newColor) {
    // Maintain slight variation when changing color
    const colorVar = 10;
    this.color = [
      Math.max(0, Math.min(255, newColor[0] + (Math.random() - 0.5) * colorVar)),
      Math.max(0, Math.min(255, newColor[1] + (Math.random() - 0.5) * colorVar)),
      Math.max(0, Math.min(255, newColor[2] + (Math.random() - 0.5) * colorVar))
    ];
  }
  
  remove() {
    World.remove(gameState.world, this.body);
    this.markedForRemoval = true;
  }
}

export class Barrier {
  constructor(x1, y1, x2, y2, isStatic = false) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    
    this.body = Bodies.rectangle(cx, cy, length, 10, {
      label: 'barrier',
      isStatic: true,
      angle: angle,
      friction: 0.01,  // Reduced from 0.05 to 0.01 for much smoother sliding
      restitution: 0.3
    });
    World.add(gameState.world, this.body);
    
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.isStatic = isStatic;
    this.color = isStatic ? [100, 100, 100] : [80, 60, 40];
  }
  
  render(p) {
    p.push();
    p.stroke(this.color[0], this.color[1], this.color[2]);
    p.strokeWeight(2);
    p.line(this.x1, this.y1, this.x2, this.y2);
    p.pop();
  }
  
  remove() {
    World.remove(gameState.world, this.body);
  }
}

export class Cup {
  constructor(data) {
    this.x = data.x;
    this.y = data.y;
    this.width = data.width;
    this.height = data.height;
    this.targetAmount = data.targetAmount;
    this.maxAmount = data.maxAmount;
    this.currentAmount = data.currentAmount;
    this.requiredColor = data.color;
    
    // Create physical boundaries (no top wall - open cup)
    const thickness = 8;
    
    // Left wall
    this.leftWall = Bodies.rectangle(
      this.x - this.width / 2,
      this.y,
      thickness,
      this.height,
      { label: 'cup_wall', isStatic: true, friction: 0.3, restitution: 0.2 }
    );
    
    // Right wall
    this.rightWall = Bodies.rectangle(
      this.x + this.width / 2,
      this.y,
      thickness,
      this.height,
      { label: 'cup_wall', isStatic: true, friction: 0.3, restitution: 0.2 }
    );
    
    // Bottom
    this.bottom = Bodies.rectangle(
      this.x,
      this.y + this.height / 2,
      this.width,
      thickness,
      { label: 'cup_wall', isStatic: true, friction: 0.5, restitution: 0.1 }
    );
    
    World.add(gameState.world, [this.leftWall, this.rightWall, this.bottom]);
  }
  
  containsPoint(x, y) {
    return x > this.x - this.width / 2 &&
           x < this.x + this.width / 2 &&
           y > this.y - this.height / 2 &&
           y < this.y + this.height / 2;
  }
  
  addSugar(particle) {
    if (colorsMatch(particle.color, this.requiredColor)) {
      this.currentAmount++;
      return true;
    }
    return false;
  }
  
  isFull() {
    return this.currentAmount >= this.targetAmount;
  }
  
  isOverflowing() {
    return this.currentAmount > this.maxAmount;
  }
  
  getFillPercentage() {
    return Math.min(this.currentAmount / this.targetAmount, 1.0);
  }
  
  render(p) {
    p.push();
    
    // Draw cup outline - only 3 sides (left, bottom, right) - no top
    p.stroke(150);
    p.strokeWeight(3);
    p.noFill();
    
    // Draw left side
    p.line(
      this.x - this.width / 2, this.y - this.height / 2,
      this.x - this.width / 2, this.y + this.height / 2
    );
    
    // Draw bottom
    p.line(
      this.x - this.width / 2, this.y + this.height / 2,
      this.x + this.width / 2, this.y + this.height / 2
    );
    
    // Draw right side
    p.line(
      this.x + this.width / 2, this.y + this.height / 2,
      this.x + this.width / 2, this.y - this.height / 2
    );
    
    // Draw fill level
    const fillHeight = this.height * this.getFillPercentage();
    if (fillHeight > 0) {
      p.noStroke();
      p.fill(this.requiredColor[0], this.requiredColor[1], this.requiredColor[2], 180);
      p.rect(
        this.x - this.width / 2 + 2,
        this.y + this.height / 2 - fillHeight,
        this.width - 4,
        fillHeight
      );
    }
    
    // Draw target indicator
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.fill(255);
    p.noStroke();
    const percentage = Math.floor((this.currentAmount / this.targetAmount) * 100);
    p.text(`${percentage}%`, this.x, this.y - this.height / 2 - 15);
    
    // Warning if overflowing
    if (this.isOverflowing()) {
      p.fill(255, 0, 0);
      p.text('OVERFLOW!', this.x, this.y);
    }
    
    p.pop();
  }
  
  remove() {
    World.remove(gameState.world, [this.leftWall, this.rightWall, this.bottom]);
  }
}

export class Spawner {
  constructor(data) {
    this.x = data.x;
    this.y = data.y;
    this.rate = data.rate;
    this.color = data.color;
    this.timer = 0;
  }
  
  update(p) {
    this.timer++;
    if (this.timer >= this.rate) {
      this.spawn();
      this.timer = 0;
    }
  }
  
  spawn() {
    // Add slight position variation for more natural spawning
    const xVariation = (Math.random() - 0.5) * 10;
    const particle = new SugarParticle(this.x + xVariation, this.y, this.color);
    gameState.sugarParticles.push(particle);
    gameState.entities.push(particle);
    gameState.sugarSpawned++;
  }
  
  render(p) {
    p.push();
    p.fill(200, 200, 100);
    p.noStroke();
    p.triangle(
      this.x - 10, this.y - 5,
      this.x + 10, this.y - 5,
      this.x, this.y + 10
    );
    
    // Animated indicator
    const pulse = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
    p.fill(255, 255, 150, 100 + pulse * 100);
    p.circle(this.x, this.y, 15);
    p.pop();
  }
}

export class ColorFilter {
  constructor(data) {
    this.x = data.x;
    this.y = data.y;
    this.width = data.width;
    this.height = data.height;
    this.color = data.color;
  }
  
  containsPoint(x, y) {
    return x > this.x - this.width / 2 &&
           x < this.x + this.width / 2 &&
           y > this.y - this.height / 2 &&
           y < this.y + this.height / 2;
  }
  
  render(p) {
    p.push();
    p.noStroke();
    p.fill(this.color[0], this.color[1], this.color[2], 80);
    p.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    
    // Border
    p.stroke(this.color[0], this.color[1], this.color[2], 150);
    p.strokeWeight(2);
    p.noFill();
    p.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    p.pop();
  }
}

export class GravitySwitch {
  constructor(data) {
    this.x = data.x;
    this.y = data.y;
    this.radius = data.radius;
    this.active = data.active;
    this.cooldown = 0;
  }
  
  update() {
    if (this.cooldown > 0) {
      this.cooldown--;
    }
  }
  
  containsPoint(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    return Math.sqrt(dx * dx + dy * dy) < this.radius;
  }
  
  activate() {
    if (this.cooldown === 0) {
      this.active = !this.active;
      gameState.gravityDirection *= -1;
      gameState.world.gravity.y = gameState.gravityDirection * 0.5;
      this.cooldown = 60;
    }
  }
  
  render(p) {
    p.push();
    
    // Main circle
    p.noStroke();
    p.fill(this.active ? [100, 255, 100] : [255, 100, 100]);
    p.circle(this.x, this.y, this.radius * 2);
    
    // Direction indicator
    p.fill(255);
    const arrowY = this.active ? -10 : 10;
    p.triangle(
      this.x, this.y + arrowY,
      this.x - 8, this.y - arrowY,
      this.x + 8, this.y - arrowY
    );
    
    // Pulse effect
    if (this.cooldown > 0) {
      const alpha = (this.cooldown / 60) * 100;
      p.noFill();
      p.stroke(255, 255, 255, alpha);
      p.strokeWeight(3);
      p.circle(this.x, this.y, this.radius * 2 + 10);
    }
    
    p.pop();
  }
}

export class Teleporter {
  constructor(data) {
    this.entrance = { ...data.entrance };
    this.exit = { ...data.exit };
    this.cooldown = 0;
    this.particlesCooldown = new Map();
  }
  
  update() {
    if (this.cooldown > 0) {
      this.cooldown--;
    }
    
    // Clean up old particle cooldowns
    for (let [particle, cd] of this.particlesCooldown.entries()) {
      if (cd > 0) {
        this.particlesCooldown.set(particle, cd - 1);
      } else {
        this.particlesCooldown.delete(particle);
      }
    }
  }
  
  containsEntrance(x, y) {
    const dx = x - this.entrance.x;
    const dy = y - this.entrance.y;
    return Math.sqrt(dx * dx + dy * dy) < this.entrance.radius;
  }
  
  teleport(particle) {
    // Check if this particle is on cooldown
    if (this.particlesCooldown.has(particle) && this.particlesCooldown.get(particle) > 0) {
      return false;
    }
    
    Body.setPosition(particle.body, {
      x: this.exit.x,
      y: this.exit.y
    });
    
    this.cooldown = 5;
    this.particlesCooldown.set(particle, 30);
    return true;
  }
  
  render(p) {
    p.push();
    
    // Entrance portal
    p.noStroke();
    p.fill(100, 100, 255, 150);
    p.circle(this.entrance.x, this.entrance.y, this.entrance.radius * 2);
    p.fill(50, 50, 200, 100);
    p.circle(this.entrance.x, this.entrance.y, this.entrance.radius * 1.5);
    
    // Exit portal
    p.fill(255, 100, 255, 150);
    p.circle(this.exit.x, this.exit.y, this.exit.radius * 2);
    p.fill(200, 50, 200, 100);
    p.circle(this.exit.x, this.exit.y, this.exit.radius * 1.5);
    
    // Connection line
    p.stroke(150, 100, 200, 100);
    p.strokeWeight(2);
    p.line(this.entrance.x, this.entrance.y, this.exit.x, this.exit.y);
    
    // Animated swirl
    const angle = p.frameCount * 0.1;
    for (let i = 0; i < 3; i++) {
      const a = angle + i * (Math.PI * 2 / 3);
      const r = this.entrance.radius * 0.7;
      p.noStroke();
      p.fill(255, 255, 255, 150);
      p.circle(
        this.entrance.x + Math.cos(a) * r,
        this.entrance.y + Math.sin(a) * r,
        4
      );
    }
    
    p.pop();
  }
}