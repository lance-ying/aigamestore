// player.js - Player UFO class
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 30;
    this.height = 20;
    this.thrust = 0.15;
    this.maxSpeed = 4;
    this.gravity = 0.08;
    this.rotation = 0;
    this.alive = true;
    this.landingGearOut = false;
  }

  update(keys) {
    if (!this.alive) return;

    // Apply gravity
    this.vy += this.gravity;

    // Thrust
    if (keys.up) {
      this.vy -= this.thrust;
      gameState.fuel = Math.max(0, gameState.fuel - 0.05);
      
      // Exhaust particle effect marker
      this.thrustActive = true;
    } else {
      this.thrustActive = false;
    }

    // Horizontal movement
    if (keys.left) {
      this.vx -= 0.12;
      gameState.fuel = Math.max(0, gameState.fuel - 0.02);
    }
    if (keys.right) {
      this.vx += 0.12;
      gameState.fuel = Math.max(0, gameState.fuel - 0.02);
    }

    // Boost
    if (keys.shift) {
      const boostMultiplier = 1.5;
      if (keys.up) {
        this.vy -= this.thrust * boostMultiplier;
        gameState.fuel = Math.max(0, gameState.fuel - 0.1);
      }
      if (keys.left) {
        this.vx -= 0.12 * boostMultiplier;
        gameState.fuel = Math.max(0, gameState.fuel - 0.05);
      }
      if (keys.right) {
        this.vx += 0.12 * boostMultiplier;
        gameState.fuel = Math.max(0, gameState.fuel - 0.05);
      }
    }

    // Apply drag
    this.vx *= 0.98;
    this.vy *= 0.99;

    // Limit speed
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > this.maxSpeed) {
      this.vx = (this.vx / speed) * this.maxSpeed;
      this.vy = (this.vy / speed) * this.maxSpeed;
    }

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Rotation based on velocity
    this.rotation = Math.atan2(this.vy, this.vx + 0.01);

    // Keep player in horizontal bounds
    if (this.x < this.width / 2) {
      this.x = this.width / 2;
      this.vx = 0;
    }
    if (this.x > CANVAS_WIDTH - this.width / 2) {
      this.x = CANVAS_WIDTH - this.width / 2;
      this.vx = 0;
    }

    // Landing gear
    this.landingGearOut = keys.space || gameState.isLanded;
  }

  draw(p) {
    const screenY = this.y - gameState.cameraY;
    
    p.push();
    p.translate(this.x, screenY);
    
    // UFO body
    p.fill(180, 180, 200);
    p.stroke(120, 120, 150);
    p.strokeWeight(2);
    p.ellipse(0, 0, this.width, this.height);
    
    // Dome
    p.fill(100, 150, 200, 150);
    p.arc(0, -2, this.width * 0.6, this.height * 0.8, Math.PI, 0);
    
    // Lights
    const time = Date.now() * 0.01;
    p.fill(255, 200, 0, Math.abs(Math.sin(time)) * 255);
    p.noStroke();
    p.ellipse(-8, 2, 4, 4);
    p.fill(0, 200, 255, Math.abs(Math.cos(time)) * 255);
    p.ellipse(8, 2, 4, 4);
    
    // Landing gear
    if (this.landingGearOut) {
      p.stroke(100, 100, 120);
      p.strokeWeight(2);
      p.line(-8, 8, -8, 14);
      p.line(8, 8, 8, 14);
      p.fill(100, 100, 120);
      p.noStroke();
      p.ellipse(-8, 14, 4, 4);
      p.ellipse(8, 14, 4, 4);
    }
    
    // Thrust exhaust
    if (this.thrustActive) {
      p.fill(255, 150, 0, 200);
      p.noStroke();
      const exhaustLength = 10 + Math.random() * 5;
      p.triangle(-5, 8, 5, 8, 0, 8 + exhaustLength);
    }
    
    p.pop();
  }

  getCollisionPoints() {
    // Return points around the UFO for collision detection
    const points = [];
    const angles = [0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4, Math.PI, 5 * Math.PI / 4, 3 * Math.PI / 2, 7 * Math.PI / 4];
    
    for (let angle of angles) {
      points.push({
        x: this.x + Math.cos(angle) * this.width / 2,
        y: this.y + Math.sin(angle) * this.height / 2
      });
    }
    
    return points;
  }
}