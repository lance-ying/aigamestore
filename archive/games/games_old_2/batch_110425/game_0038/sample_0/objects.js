// objects.js - Destructible objects and items

import { gameState, GROUND_Y } from './globals.js';

export class BreakableObject {
  constructor(x, y, type = 'crate') {
    this.type = 'breakable';
    this.objectType = type;
    this.x = x;
    this.y = y;
    this.width = 35;
    this.height = 35;
    this.health = 20;
    this.destroyed = false;
    this.color = type === 'crate' ? [139, 90, 43] : [100, 100, 100];
  }

  takeDamage(amount, p) {
    this.health -= amount;
    if (this.health <= 0 && !this.destroyed) {
      this.destroyed = true;
      this.dropItem(p);
      gameState.score += 50;
    }
  }

  dropItem(p) {
    // Chance to drop health pickup
    if (p.random() < 0.5) {
      const item = new HealthPickup(this.x + this.width / 2, this.y + this.height / 2);
      gameState.entities.push(item);
    }
  }

  update(p) {
    // Check for player attacks
    if (!this.destroyed && gameState.player && gameState.player.attackHitbox) {
      const hitbox = gameState.player.attackHitbox;
      if (p.collideRectRect(this.x, this.y, this.width, this.height,
                            hitbox.x, hitbox.y, hitbox.width, hitbox.height)) {
        this.takeDamage(10, p);
      }
    }
  }

  render(p, camera) {
    if (this.destroyed) return;

    const screenX = this.x - camera.x;

    p.push();
    p.fill(...this.color);
    p.stroke(50);
    p.strokeWeight(2);
    p.rect(screenX, this.y, this.width, this.height);

    // Draw crate details
    if (this.objectType === 'crate') {
      p.stroke(80, 50, 20);
      p.line(screenX + 5, this.y + 5, screenX + this.width - 5, this.y + this.height - 5);
      p.line(screenX + this.width - 5, this.y + 5, screenX + 5, this.y + this.height - 5);
    }

    p.pop();
  }
}

export class HealthPickup {
  constructor(x, y) {
    this.type = 'item';
    this.itemType = 'health';
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 20;
    this.collected = false;
    this.healAmount = 25;
    this.lifetime = 300; // frames
  }

  update(p) {
    this.lifetime--;
    if (this.lifetime <= 0) {
      this.collected = true;
    }

    // Check collision with player
    if (!this.collected && gameState.player) {
      const dist = p.dist(this.x, this.y, gameState.player.x + gameState.player.width / 2, 
                          gameState.player.y + gameState.player.height / 2);
      if (dist < 30) {
        gameState.player.heal(this.healAmount);
        this.collected = true;
        gameState.score += 25;
      }
    }
  }

  render(p, camera) {
    if (this.collected) return;

    const screenX = this.x - camera.x;

    p.push();
    
    // Floating animation
    const floatOffset = Math.sin(p.frameCount * 0.1) * 3;
    
    p.fill(255, 100, 100);
    p.noStroke();
    p.circle(screenX, this.y + floatOffset, this.width);

    // Cross symbol
    p.fill(255);
    p.rect(screenX - 2, this.y - 8 + floatOffset, 4, 16);
    p.rect(screenX - 8, this.y - 2 + floatOffset, 16, 4);

    p.pop();
  }
}