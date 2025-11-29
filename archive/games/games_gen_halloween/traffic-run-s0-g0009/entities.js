// entities.js - Entity classes for player and traffic vehicles

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Vehicle {
  constructor(p, x, y, width, height, color, label) {
    this.p = p;
    this.width = width;
    this.height = height;
    this.color = color;
    
    // Create Matter.js body
    this.body = Bodies.rectangle(x, y, width, height, {
      label: label,
      friction: 0.8,
      restitution: 0.1,
      density: 0.01
    });
    
    World.add(gameState.world, this.body);
  }
  
  render() {
    this.p.push();
    this.p.translate(this.body.position.x, this.body.position.y);
    this.p.rotate(this.body.angle);
    
    // Draw vehicle body
    this.p.fill(this.color[0], this.color[1], this.color[2]);
    this.p.noStroke();
    this.p.rectMode(this.p.CENTER);
    this.p.rect(0, 0, this.width, this.height);
    
    // Draw windows
    this.p.fill(100, 150, 200, 150);
    this.p.rect(0, -this.height * 0.15, this.width * 0.6, this.height * 0.25);
    
    this.p.pop();
  }
  
  destroy() {
    if (this.body && gameState.world) {
      World.remove(gameState.world, this.body);
    }
  }
}

export class Player extends Vehicle {
  constructor(p, x, y) {
    super(p, x, y, 30, 50, [50, 200, 50], 'player');
    this.maxSpeed = 8;
    this.acceleration = 0.02;
    this.brakeForce = 0.015;
    this.lastLoggedX = x;
    this.lastLoggedY = y;
  }
  
  update() {
    // Handle acceleration/braking
    if (gameState.keys.space) {
      // Apply forward force (upward on screen)
      Body.applyForce(this.body, this.body.position, { x: 0, y: -this.acceleration });
    } else {
      // Apply braking
      const vel = this.body.velocity;
      if (Math.abs(vel.y) > 0.1) {
        const brakeX = -vel.x * this.brakeForce;
        const brakeY = -vel.y * this.brakeForce;
        Body.applyForce(this.body, this.body.position, { x: brakeX, y: brakeY });
      } else {
        // Full stop at low speeds
        Body.setVelocity(this.body, { x: 0, y: 0 });
      }
    }
    
    // Limit max speed
    const vel = this.body.velocity;
    const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
    if (speed > this.maxSpeed) {
      Body.setVelocity(this.body, {
        x: vel.x * (this.maxSpeed / speed),
        y: vel.y * (this.maxSpeed / speed)
      });
    }
    
    // Constrain to lane (horizontal movement)
    if (this.body.position.x < 50) {
      Body.setPosition(this.body, { x: 50, y: this.body.position.y });
      Body.setVelocity(this.body, { x: 0, y: this.body.velocity.y });
    }
    if (this.body.position.x > CANVAS_WIDTH - 50) {
      Body.setPosition(this.body, { x: CANVAS_WIDTH - 50, y: this.body.position.y });
      Body.setVelocity(this.body, { x: 0, y: this.body.velocity.y });
    }
    
    // Log position if changed significantly
    const dx = Math.abs(this.body.position.x - this.lastLoggedX);
    const dy = Math.abs(this.body.position.y - this.lastLoggedY);
    if (dx > 5 || dy > 5) {
      this.p.logs.player_info.push({
        screen_x: this.body.position.x,
        screen_y: this.body.position.y,
        game_x: this.body.position.x,
        game_y: this.body.position.y,
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
      this.lastLoggedX = this.body.position.x;
      this.lastLoggedY = this.body.position.y;
    }
  }
}

export class TrafficVehicle extends Vehicle {
  constructor(p, x, y, direction, speed, laneWidth) {
    const colors = [
      [200, 50, 50],
      [50, 50, 200],
      [200, 200, 50],
      [200, 100, 50],
      [150, 50, 200]
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    super(p, x, y, 40, 30, randomColor, 'traffic');
    
    this.direction = direction; // 1 for right, -1 for left
    this.speed = speed;
    this.laneWidth = laneWidth;
    
    // Set initial velocity
    Body.setVelocity(this.body, { x: direction * speed, y: 0 });
  }
  
  update() {
    // Maintain constant speed
    Body.setVelocity(this.body, { x: this.direction * this.speed, y: 0 });
    
    // Check if off screen
    if (this.direction > 0 && this.body.position.x > CANVAS_WIDTH + 50) {
      return true; // Mark for removal
    }
    if (this.direction < 0 && this.body.position.x < -50) {
      return true; // Mark for removal
    }
    
    return false;
  }
}