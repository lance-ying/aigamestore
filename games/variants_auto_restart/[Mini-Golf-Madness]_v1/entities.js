// entities.js - Game entity classes

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, BALL_RADIUS, HOLE_RADIUS, MIN_VELOCITY, HOLE_CAPTURE_RADIUS, WATER_SLOWDOWN } from './globals.js';
// New: Import gameInstance to access its methods
// Using window.gameInstance directly to avoid circular dependency with game.js
// import { gameInstance } from './game.js'; 

export class Ball {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = BALL_RADIUS;
    this.mass = 1;
    this.inHole = false;
    this.inWater = false;
    this.lastPosition = { x: x, y: y };
    this.trail = [];
    this.maxTrailLength = 15;
    
    gameState.ball = this;
    gameState.entities.push(this);
  }
  
  update(p) {
    if (this.inHole) return;
    
    // Store position for trail
    if (this.isMoving()) {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > this.maxTrailLength) {
        this.trail.shift();
      }
    }
    
    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;
    
    // Apply friction
    this.vx *= gameState.friction;
    this.vy *= gameState.friction;
    
    // Check if ball is in water (only current hole's water hazards)
    this.inWater = false;
    const currentHole = gameState.holes[gameState.currentHole];
    if (currentHole) {
      for (const water of currentHole.waterHazards) {
        if (this.x > water.x && this.x < water.x + water.width &&
            this.y > water.y && this.y < water.y + water.height) {
          this.inWater = true;
          this.vx *= WATER_SLOWDOWN;
          this.vy *= WATER_SLOWDOWN;
          break;
        }
      }
    }
    
    // Stop if moving too slowly
    if (Math.abs(this.vx) < MIN_VELOCITY) this.vx = 0;
    if (Math.abs(this.vy) < MIN_VELOCITY) this.vy = 0;
    
    // Update aiming state
    if (!this.isMoving() && !this.inHole) {
      gameState.isAiming = true;
      gameState.canShoot = true;
    } else {
      gameState.isAiming = false;
      gameState.canShoot = false;
    }
    
    // Check hole collision
    if (currentHole) {
      const dx = currentHole.x - this.x;
      const dy = currentHole.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Check if ball is close enough and moving slow enough
      if (distance < HOLE_CAPTURE_RADIUS && this.getSpeed() < 2) {
        this.enterHole(currentHole);
      }
    }
    
    // Log position changes
    if (Math.abs(this.x - this.lastPosition.x) > 1 || 
        Math.abs(this.y - this.lastPosition.y) > 1) {
      this.logPosition(p);
      this.lastPosition.x = this.x;
      this.lastPosition.y = this.y;
    }
  }
  
  isMoving() {
    return Math.abs(this.vx) > MIN_VELOCITY || Math.abs(this.vy) > MIN_VELOCITY;
  }
  
  getSpeed() {
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
  }
  
  shoot(angle, power) {
    if (!gameState.canShoot) return;
    
    this.vx = Math.cos(angle) * power;
    this.vy = Math.sin(angle) * power;
    this.trail = [];
    
    gameState.strokes++;
    gameState.canShoot = false;
    gameState.isAiming = false;
    
    // Create shot particles
    for (let i = 0; i < 8; i++) {
      const particleAngle = angle + (Math.random() - 0.5) * Math.PI / 4;
      const particleSpeed = Math.random() * 2 + 1;
      gameState.particles.push(new Particle(
        this.x,
        this.y,
        Math.cos(particleAngle) * particleSpeed,
        Math.sin(particleAngle) * particleSpeed,
        [255, 255, 255]
      ));
    }
  }
  
  enterHole(hole) {
    this.inHole = true;
    this.vx = 0;
    this.vy = 0;
    this.x = hole.x;
    this.y = hole.y;
    
    // Record strokes for this hole
    gameState.holeStrokes.push(gameState.strokes);
    
    // Create celebration particles
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      const speed = Math.random() * 3 + 2;
      gameState.particles.push(new Particle(
        hole.x,
        hole.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        [255, 215, 0]
      ));
    }
    
    // Check if all holes completed
    if (gameState.currentHole >= gameState.totalHoles - 1) {
      gameState.score = gameState.holeStrokes.reduce((a, b) => a + b, 0);
      setTimeout(() => {
        // New: Call gameInstance method to handle game over phase and auto-restart
        window.gameInstance.setGameOverPhase("GAME_OVER_WIN");
      }, 1000);
    } else {
      // Next hole
      setTimeout(() => {
        gameState.currentHole++;
        gameState.strokes = 0;
        this.resetToStart();
      }, 1000);
    }
  }
  
  resetToStart() {
    const startPos = gameState.holes[gameState.currentHole].startPos;
    this.x = startPos.x;
    this.y = startPos.y;
    this.vx = 0;
    this.vy = 0;
    this.inHole = false;
    this.inWater = false;
    this.trail = [];
    gameState.isAiming = true;
    gameState.canShoot = true;
  }
  
  logPosition(p) {
    if (p.logs && p.logs.player_info) {
      p.logs.player_info.push({
        screen_x: this.x,
        screen_y: this.y,
        game_x: this.x,
        game_y: this.y,
        velocity_x: this.vx,
        velocity_y: this.vy,
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  render(p) {
    // Render trail
    if (this.trail.length > 1) {
      p.noFill();
      p.strokeWeight(2);
      for (let i = 0; i < this.trail.length - 1; i++) {
        const alpha = (i / this.trail.length) * 150;
        p.stroke(255, 255, 255, alpha);
        p.line(this.trail[i].x, this.trail[i].y, this.trail[i + 1].x, this.trail[i + 1].y);
      }
    }
    
    // Render ball
    p.push();
    p.translate(this.x, this.y);
    
    // Ball shadow
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.ellipse(2, 2, this.radius * 2, this.radius * 2);
    
    // Ball body
    if (this.inWater) {
      p.fill(100, 150, 255);
    } else {
      p.fill(255, 255, 255);
    }
    p.stroke(200, 200, 200);
    p.strokeWeight(1);
    p.circle(0, 0, this.radius * 2);
    
    // Ball detail (dimples)
    p.noStroke();
    p.fill(240, 240, 240);
    p.circle(-2, -2, 2);
    p.circle(2, -1, 2);
    p.circle(-1, 2, 2);
    
    p.pop();
  }
}

export class Hole {
  constructor(x, y, startX, startY, par = 3) {
    this.x = x;
    this.y = y;
    this.radius = HOLE_RADIUS;
    this.startPos = { x: startX, y: startY };
    this.par = par;
    
    // Each hole stores its own obstacles
    this.walls = [];
    this.waterHazards = [];
    this.ramps = [];
    
    gameState.holes.push(this);
  }
  
  render(p) {
    // Hole shadow/depth
    p.fill(20, 30, 20);
    p.noStroke();
    p.circle(this.x, this.y, this.radius * 2.2);
    
    // Hole opening
    p.fill(10, 15, 10);
    p.circle(this.x, this.y, this.radius * 2);
    
    // Flag pole
    p.stroke(150, 100, 50);
    p.strokeWeight(2);
    p.line(this.x, this.y - this.radius, this.x, this.y - this.radius - 30);
    
    // Flag
    p.fill(255, 0, 0);
    p.noStroke();
    p.triangle(
      this.x, this.y - this.radius - 30,
      this.x + 15, this.y - this.radius - 25,
      this.x, this.y - this.radius - 20
    );
  }
}

export class Wall {
  constructor(x, y, width, height, hole) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    
    // Register with specific hole
    if (hole) {
      hole.walls.push(this);
    }
  }
  
  render(p) {
    // Wall shadow
    p.fill(60, 40, 20);
    p.noStroke();
    p.rect(this.x + 2, this.y + 2, this.width, this.height);
    
    // Wall body
    p.fill(139, 90, 43);
    p.stroke(100, 60, 30);
    p.strokeWeight(2);
    p.rect(this.x, this.y, this.width, this.height);
    
    // Wood texture
    p.stroke(120, 70, 35, 100);
    p.strokeWeight(1);
    for (let i = 0; i < this.width; i += 10) {
      p.line(this.x + i, this.y, this.x + i, this.y + this.height);
    }
  }
}

export class WaterHazard {
  constructor(x, y, width, height, hole) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.waveOffset = Math.random() * 100;
    
    // Register with specific hole
    if (hole) {
      hole.waterHazards.push(this);
    }
  }
  
  update(p) {
    this.waveOffset += 0.02;
  }
  
  render(p) {
    // Water base
    p.fill(50, 100, 200);
    p.noStroke();
    p.rect(this.x, this.y, this.width, this.height);
    
    // Water waves
    p.noFill();
    p.stroke(70, 120, 220, 150);
    p.strokeWeight(2);
    for (let y = this.y; y < this.y + this.height; y += 15) {
      p.beginShape();
      for (let x = this.x; x < this.x + this.width; x += 10) {
        const waveY = y + Math.sin(x * 0.1 + this.waveOffset) * 3;
        p.vertex(x, waveY);
      }
      p.endShape();
    }
    
    // Water reflection
    p.fill(100, 150, 255, 50);
    p.noStroke();
    p.rect(this.x, this.y, this.width, this.height / 3);
  }
}

export class Ramp {
  constructor(x, y, width, height, slopeDirection = 1, hole) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.slopeDirection = slopeDirection; // 1 = up-right, -1 = up-left
    
    // Register with specific hole
    if (hole) {
      hole.ramps.push(this);
    }
  }
  
  render(p) {
    p.push();
    p.fill(100, 150, 100);
    p.stroke(80, 130, 80);
    p.strokeWeight(2);
    
    if (this.slopeDirection === 1) {
      // Ramp going up to the right
      p.triangle(
        this.x, this.y + this.height,
        this.x + this.width, this.y + this.height,
        this.x + this.width, this.y
      );
    } else {
      // Ramp going up to the left
      p.triangle(
        this.x, this.y,
        this.x, this.y + this.height,
        this.x + this.width, this.y + this.height
      );
    }
    
    // Grass texture
    p.stroke(90, 140, 90, 100);
    p.strokeWeight(1);
    for (let i = 0; i < 10; i++) {
      const rx = this.x + Math.random() * this.width;
      const ry = this.y + Math.random() * this.height;
      p.line(rx, ry, rx, ry + 3);
    }
    
    p.pop();
  }
}

export class Particle {
  constructor(x, y, vx, vy, color = [255, 255, 255], lifetime = 30) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.lifetime = lifetime;
    this.age = 0;
    this.size = Math.random() * 3 + 2;
    this.color = color;
    
    gameState.particles.push(this);
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.95;
    this.vy *= 0.95;
    this.age++;
  }
  
  isDead() {
    return this.age >= this.lifetime;
  }
  
  render(p) {
    const alpha = (1 - this.age / this.lifetime) * 255;
    p.fill(this.color[0], this.color[1], this.color[2], alpha);
    p.noStroke();
    p.circle(this.x, this.y, this.size);
  }
}