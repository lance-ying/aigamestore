// entities.js - Entity classes

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;

import { gameState, SNAKE_BALL_RADIUS, COLLECTIBLE_BALL_RADIUS, BLOCK_WIDTH, BLOCK_HEIGHT, CANVAS_WIDTH } from './globals.js';

export class SnakeBall {
  constructor(x, y, isHead = false) {
    this.x = x;
    this.y = y;
    this.isHead = isHead;
    this.radius = SNAKE_BALL_RADIUS;
    this.targetX = x;
    this.targetY = y;
    this.color = isHead ? [255, 100, 100] : [100, 200, 255];
    this.number = 1;
  }

  update() {
    // Smooth following
    const ease = 0.3;
    this.x += (this.targetX - this.x) * ease;
    this.y += (this.targetY - this.y) * ease;
  }

  setTarget(x, y) {
    this.targetX = x;
    this.targetY = y;
  }

  render(p) {
    p.push();
    p.fill(...this.color);
    p.stroke(255, 255, 255, 150);
    p.strokeWeight(2);
    p.circle(this.x, this.y, this.radius * 2);
    
    // Draw number on head
    if (this.isHead) {
      p.fill(255);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(10);
      p.text(gameState.snakeLength, this.x, this.y);
    }
    p.pop();
  }

  checkCollision(entity) {
    const dx = this.x - entity.x;
    const dy = this.y - entity.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < this.radius + entity.radius;
  }

  checkBlockCollision(block) {
    // Check if snake head is within block bounds
    return this.x > block.x - block.width / 2 &&
           this.x < block.x + block.width / 2 &&
           this.y > block.y - block.height / 2 &&
           this.y < block.y + block.height / 2;
  }
}

export class CollectibleBall {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = COLLECTIBLE_BALL_RADIUS;
    this.collected = false;
    this.color = [255, 255, 100];
    this.pulsePhase = Math.random() * Math.PI * 2;
  }

  update() {
    this.pulsePhase += 0.1;
  }

  render(p) {
    if (this.collected) return;
    
    p.push();
    const pulse = Math.sin(this.pulsePhase) * 2 + this.radius * 2;
    p.fill(...this.color);
    p.stroke(255, 255, 255, 150);
    p.strokeWeight(1);
    p.circle(this.x, this.y, pulse);
    p.pop();
  }
}

export class Block {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.width = BLOCK_WIDTH;
    this.height = BLOCK_HEIGHT;
    this.value = value;
    this.destroyed = false;
    this.health = value;
    this.originalHealth = value;
    
    // Color based on value
    const intensity = Math.min(255, value * 5);
    this.color = [intensity, 50, 50];
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.destroyed = true;
      return true;
    }
    return false;
  }

  update() {
    // Update color based on remaining health
    const healthRatio = this.health / this.originalHealth;
    const intensity = Math.min(255, this.health * 5);
    this.color = [intensity * healthRatio, 50, 50];
  }

  render(p) {
    if (this.destroyed) return;
    
    p.push();
    p.fill(...this.color);
    p.stroke(255, 255, 255, 200);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(this.x, this.y, this.width, this.height, 5);
    
    // Draw number
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text(this.health, this.x, this.y);
    p.pop();
  }
}