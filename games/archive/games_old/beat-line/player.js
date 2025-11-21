// player.js - Player line entity

import { gameState } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.direction = { x: 1, y: 0 }; // Moving right initially
    this.segments = [{ x, y }];
    this.maxSegments = 50;
    this.glowIntensity = 0;
    this.alive = true;
    this.collisionRadius = 3;
    this.turnGracePeriod = 0; // Frames of collision immunity after turn
  }

  update(speed) {
    if (!this.alive) return;

    // Move forward based on current direction
    this.x += this.direction.x * speed;
    this.y += this.direction.y * speed;

    // Add new segment
    this.segments.push({ x: this.x, y: this.y });

    // Limit segments
    if (this.segments.length > this.maxSegments) {
      this.segments.shift();
    }

    // Decay glow
    if (this.glowIntensity > 0) {
      this.glowIntensity -= 5;
    }
    
    // Decay grace period
    if (this.turnGracePeriod > 0) {
      this.turnGracePeriod--;
    }
  }

  turn(direction) {
    // Change direction based on specified direction
    switch (direction) {
      case "UP":
        this.direction = { x: 0, y: -1 };
        break;
      case "DOWN":
        this.direction = { x: 0, y: 1 };
        break;
      case "LEFT":
        this.direction = { x: -1, y: 0 };
        break;
      case "RIGHT":
        this.direction = { x: 1, y: 0 };
        break;
    }
    this.glowIntensity = 255;
    this.turnGracePeriod = 30; // 0.5 seconds of grace at 60fps
  }

  die() {
    this.alive = false;
  }

  getTraveledDistance() {
    // Calculate total distance traveled based on segments
    let distance = 0;
    for (let i = 1; i < this.segments.length; i++) {
      const dx = this.segments[i].x - this.segments[i - 1].x;
      const dy = this.segments[i].y - this.segments[i - 1].y;
      distance += Math.sqrt(dx * dx + dy * dy);
    }
    return distance;
  }
}