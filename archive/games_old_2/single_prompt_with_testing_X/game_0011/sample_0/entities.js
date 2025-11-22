// entities.js - Entity classes for game objects

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;

import { gameState } from './globals.js';

export class Ball {
  constructor(p, x, y) {
    this.p = p;
    this.radius = 12;
    
    // Create Matter.js body
    this.body = Bodies.circle(x, y, this.radius, {
      label: 'ball',
      friction: 0.3,
      restitution: 0.6,
      density: 0.01
    });
    
    World.add(gameState.world, this.body);
    
    this.color = [255, 200, 50];
    this.settled = false;
    this.settleTimer = 0;
  }
  
  update() {
    // Check if ball has settled (stopped moving)
    const velocity = Math.sqrt(
      this.body.velocity.x ** 2 + this.body.velocity.y ** 2
    );
    
    if (velocity < 0.1 && !this.settled) {
      this.settleTimer++;
      if (this.settleTimer > 60) { // 1 second at 60fps
        this.settled = true;
      }
    } else if (velocity >= 0.1) {
      this.settleTimer = 0;
    }
  }
  
  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    // Draw ball with gradient effect
    this.p.fill(this.color[0], this.color[1], this.color[2]);
    this.p.noStroke();
    this.p.circle(0, 0, this.radius * 2);
    
    // Add highlight
    this.p.fill(255, 255, 255, 100);
    this.p.circle(-this.radius * 0.3, -this.radius * 0.3, this.radius * 0.8);
    
    this.p.pop();
  }
  
  remove() {
    World.remove(gameState.world, this.body);
  }
}

export class Glass {
  constructor(p, x, y, width, height) {
    this.p = p;
    this.width = width;
    this.height = height;
    this.toppled = false;
    this.tippedThreshold = 0.5; // radians (~30 degrees)
    
    // Create Matter.js body
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'glass',
      friction: 0.5,
      restitution: 0.1,
      density: 0.002
    });
    
    World.add(gameState.world, this.body);
    
    this.color = [100, 200, 255];
    this.initialAngle = this.body.angle;
  }
  
  update() {
    // Check if glass is toppled based on angle
    const angleDiff = Math.abs(this.body.angle - this.initialAngle);
    if (angleDiff > this.tippedThreshold && !this.toppled) {
      this.toppled = true;
      gameState.glassesToppledCount++;
      
      // Log glass toppled
      this.p.logs.game_info.push({
        data: { event: 'glass_toppled', count: gameState.glassesToppledCount },
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    if (this.toppled) {
      this.p.fill(150, 150, 150, 150);
    } else {
      this.p.fill(this.color[0], this.color[1], this.color[2], 200);
    }
    
    this.p.stroke(50, 150, 200);
    this.p.strokeWeight(2);
    this.p.rect(0, 0, this.width, this.height);
    
    // Draw liquid inside
    if (!this.toppled) {
      this.p.fill(50, 150, 255, 150);
      this.p.noStroke();
      this.p.rect(0, this.height * 0.15, this.width * 0.8, this.height * 0.6);
    }
    
    this.p.pop();
  }
  
  remove() {
    World.remove(gameState.world, this.body);
  }
}

export class Platform {
  constructor(p, x, y, width, height, isStatic = true, angle = 0) {
    this.p = p;
    this.width = width;
    this.height = height;
    
    // Create Matter.js body
    this.body = Bodies.rectangle(x, y, width, height, {
      label: 'platform',
      isStatic: isStatic,
      friction: 0.8,
      restitution: 0.2,
      angle: angle
    });
    
    World.add(gameState.world, this.body);
    
    this.color = [139, 90, 43];
  }
  
  update() {
    // Platforms are static, no update needed
  }
  
  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    this.p.fill(this.color[0], this.color[1], this.color[2]);
    this.p.stroke(100, 60, 30);
    this.p.strokeWeight(2);
    this.p.rect(0, 0, this.width, this.height);
    
    // Add wood grain effect
    this.p.stroke(120, 80, 40);
    this.p.strokeWeight(1);
    for (let i = -this.width / 2; i < this.width / 2; i += 15) {
      this.p.line(i, -this.height / 2, i, this.height / 2);
    }
    
    this.p.pop();
  }
  
  remove() {
    World.remove(gameState.world, this.body);
  }
}