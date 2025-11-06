// entities.js - Game entity classes

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;

import { gameState, BALL_RADIUS, ARENA, BALL_COLORS } from './globals.js';

export class Ball {
  constructor(p, x, y, colorIndex) {
    this.p = p;
    this.colorIndex = colorIndex;
    this.color = BALL_COLORS[colorIndex % BALL_COLORS.length];
    
    // Create Matter.js body
    this.body = Bodies.circle(x, y, BALL_RADIUS, {
      label: 'ball',
      restitution: 0.7,
      friction: 0.01,
      density: 0.001,
      frictionAir: 0.001
    });
    
    World.add(gameState.world, this.body);
    
    this.active = true;
    this.settled = false;
    this.settleTimer = 0;
    this.lastY = y;
    this.multiplierHit = new Set(); // Track which multipliers this ball has hit
  }
  
  update() {
    if (!this.active) return;
    
    // Check if ball is settled (not moving much)
    const velocityMag = Math.sqrt(
      this.body.velocity.x * this.body.velocity.x + 
      this.body.velocity.y * this.body.velocity.y
    );
    
    if (velocityMag < 0.1 && Math.abs(this.body.position.y - this.lastY) < 0.5) {
      this.settleTimer++;
      if (this.settleTimer > 60 && !this.settled) { // 1 second
        this.settled = true;
        gameState.ballsInPlay--;
      }
    } else {
      this.settleTimer = 0;
    }
    
    this.lastY = this.body.position.y;
    
    // Remove if out of bounds
    if (this.body.position.y > ARENA.BOTTOM + 50) {
      this.remove();
    }
  }
  
  render() {
    if (!this.active) return;
    
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    // Draw ball with gradient effect
    this.p.fill(this.color[0], this.color[1], this.color[2]);
    this.p.stroke(255, 255, 255, 100);
    this.p.strokeWeight(1);
    this.p.circle(0, 0, BALL_RADIUS * 2);
    
    // Highlight
    this.p.fill(255, 255, 255, 150);
    this.p.noStroke();
    this.p.circle(-BALL_RADIUS * 0.3, -BALL_RADIUS * 0.3, BALL_RADIUS * 0.5);
    
    this.p.pop();
  }
  
  remove() {
    if (this.active) {
      this.active = false;
      World.remove(gameState.world, this.body);
      if (!this.settled) {
        gameState.ballsInPlay--;
      }
    }
  }
}

export class Peg {
  constructor(p, x, y, radius) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.radius = radius;
    
    // Create static Matter.js body
    this.body = Bodies.circle(x, y, radius, {
      label: 'peg',
      isStatic: true,
      restitution: 0.8,
      friction: 0.1
    });
    
    World.add(gameState.world, this.body);
    
    this.hitTimer = 0;
  }
  
  update() {
    if (this.hitTimer > 0) {
      this.hitTimer--;
    }
  }
  
  render() {
    this.p.push();
    
    // Glow effect when hit
    if (this.hitTimer > 0) {
      const alpha = this.p.map(this.hitTimer, 0, 10, 0, 200);
      this.p.fill(255, 255, 100, alpha);
      this.p.noStroke();
      this.p.circle(this.x, this.y, this.radius * 3);
    }
    
    // Main peg
    this.p.fill(180, 180, 200);
    this.p.stroke(150, 150, 170);
    this.p.strokeWeight(1);
    this.p.circle(this.x, this.y, this.radius * 2);
    
    // Highlight
    this.p.fill(220, 220, 240);
    this.p.noStroke();
    this.p.circle(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.8);
    
    this.p.pop();
  }
  
  hit() {
    this.hitTimer = 10;
  }
}

export class Multiplier {
  constructor(p, x, y, width, height, type, value) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
    this.value = value;
    
    // Create sensor body (no collision, just detection)
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'multiplier',
      isStatic: true,
      isSensor: true
    });
    
    this.body.multiplierData = { type, value };
    
    World.add(gameState.world, this.body);
    
    this.activationTimer = 0;
    this.pulse = 0;
  }
  
  update() {
    if (this.activationTimer > 0) {
      this.activationTimer--;
    }
    this.pulse += 0.05;
  }
  
  render() {
    this.p.push();
    
    // Pulsing glow
    const glowSize = 5 + Math.sin(this.pulse) * 3;
    
    // Activation effect
    if (this.activationTimer > 0) {
      const alpha = this.p.map(this.activationTimer, 0, 20, 0, 150);
      this.p.fill(255, 255, 100, alpha);
      this.p.noStroke();
      this.p.rect(this.x, this.y, this.width + 20, this.height + 20);
    }
    
    // Glow
    this.p.fill(255, 200, 0, 50);
    this.p.noStroke();
    this.p.rect(this.x, this.y, this.width + glowSize, this.height + glowSize);
    
    // Main body
    const color = this.getColor();
    this.p.fill(color[0], color[1], color[2]);
    this.p.stroke(255, 255, 255, 200);
    this.p.strokeWeight(2);
    this.p.rect(this.x, this.y, this.width, this.height);
    
    // Text
    this.p.fill(255);
    this.p.noStroke();
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(14);
    this.p.textStyle(this.p.BOLD);
    this.p.text(this.type, this.x, this.y);
    
    this.p.pop();
  }
  
  getColor() {
    if (this.type.includes('x')) {
      const mult = parseInt(this.type.substring(1));
      if (mult >= 5) return [255, 50, 50]; // Red for high multipliers
      if (mult >= 3) return [255, 150, 0]; // Orange
      return [100, 200, 255]; // Blue for low multipliers
    }
    return [100, 255, 100]; // Green for +balls
  }
  
  activate() {
    this.activationTimer = 20;
  }
}

export class MovingObstacle {
  constructor(p, startX, endX, y, speed, width, height) {
    this.p = p;
    this.startX = startX;
    this.endX = endX;
    this.y = y;
    this.speed = speed;
    this.width = width;
    this.height = height;
    this.direction = 1;
    this.progress = 0;
    
    const x = startX;
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'movingObstacle',
      isStatic: true,
      restitution: 0.8
    });
    
    World.add(gameState.world, this.body);
  }
  
  update() {
    this.progress += this.speed * this.direction;
    
    if (this.progress >= 1) {
      this.progress = 1;
      this.direction = -1;
    } else if (this.progress <= 0) {
      this.progress = 0;
      this.direction = 1;
    }
    
    const x = this.p.lerp(this.startX, this.endX, this.progress);
    Body.setPosition(this.body, { x, y: this.y });
  }
  
  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    // Shadow
    this.p.fill(0, 0, 0, 50);
    this.p.noStroke();
    this.p.rect(2, 2, this.width, this.height);
    
    // Main body
    this.p.fill(200, 100, 100);
    this.p.stroke(150, 50, 50);
    this.p.strokeWeight(2);
    this.p.rect(0, 0, this.width, this.height);
    
    // Stripes
    this.p.stroke(255, 255, 0);
    this.p.strokeWeight(2);
    for (let i = -this.width / 2; i < this.width / 2; i += 10) {
      this.p.line(i, -this.height / 2, i + 5, this.height / 2);
    }
    
    this.p.pop();
  }
}

export class Particle {
  constructor(p, x, y, vx, vy, color) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = 255;
    this.size = this.p.random(3, 8);
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // Gravity
    this.life -= 5;
  }
  
  render() {
    this.p.push();
    this.p.fill(this.color[0], this.color[1], this.color[2], this.life);
    this.p.noStroke();
    this.p.circle(this.x, this.y, this.size);
    this.p.pop();
  }
  
  isDead() {
    return this.life <= 0;
  }
}