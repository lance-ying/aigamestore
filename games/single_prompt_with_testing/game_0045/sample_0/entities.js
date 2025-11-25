// entities.js - Game entities (demons, cards, platforms, portal)

import { gameState, CARD_TYPES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Particle } from './player.js';

export class Demon {
  constructor(p, x, y, patrolX1, patrolX2) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.startX = x;
    this.patrolX1 = patrolX1;
    this.patrolX2 = patrolX2;
    this.radius = 15;
    this.health = 100;
    this.maxHealth = 100;
    this.speed = 1;
    this.vx = this.speed;
    this.vy = 0;
    this.active = true;
    this.attackCooldown = 0;
    this.attackRange = 100;
    this.type = this.p.random() > 0.5 ? "GROUND" : "FLYING";
  }

  update() {
    if (!this.active) return;
    
    const player = gameState.player;
    
    if (this.type === "GROUND") {
      // Patrol behavior
      this.x += this.vx;
      
      if (this.x <= this.patrolX1 || this.x >= this.patrolX2) {
        this.vx *= -1;
      }
      
      // Check if player is nearby
      if (player && this.p.dist(this.x, this.y, player.x, player.y) < this.attackRange) {
        // Move towards player
        const dx = player.x - this.x;
        this.vx = dx > 0 ? this.speed * 1.5 : -this.speed * 1.5;
        
        // Try to attack
        if (this.p.dist(this.x, this.y, player.x, player.y) < this.radius + player.w && 
            this.attackCooldown <= 0) {
          player.takeDamage(10);
          this.attackCooldown = 60;
        }
      }
    } else if (this.type === "FLYING") {
      // Floating and shooting behavior
      this.y += this.p.sin(this.p.frameCount * 0.05) * 0.5;
      
      if (player && this.p.dist(this.x, this.y, player.x, player.y) < this.attackRange * 2) {
        // Shoot projectile towards player
        if (this.attackCooldown <= 0) {
          const angle = this.p.atan2(player.y - this.y, player.x - this.x);
          gameState.entities.push(new DemonProjectile(this.p, this.x, this.y, angle));
          this.attackCooldown = 90;
        }
      }
    }
    
    if (this.attackCooldown > 0) this.attackCooldown--;
    
    if (this.health <= 0) {
      this.die();
    }
  }

  takeDamage(amount) {
    this.health -= amount;
  }

  die() {
    this.active = false;
    gameState.demonsKilled++;
    gameState.score += 100;
    
    // Create death particles
    for (let i = 0; i < 15; i++) {
      const angle = (i / 15) * this.p.TWO_PI;
      gameState.particles.push(new Particle(
        this.p,
        this.x,
        this.y,
        this.p.cos(angle) * 4,
        this.p.sin(angle) * 4,
        [255, 50, 100],
        30
      ));
    }
    
    // Spawn a card
    const cardTypes = [CARD_TYPES.PISTOL, CARD_TYPES.DASH, CARD_TYPES.JUMP];
    const cardType = cardTypes[this.p.floor(this.p.random(cardTypes.length))];
    gameState.cards.push(new Card(this.p, this.x, this.y, cardType));
  }

  render() {
    if (!this.active) return;
    
    this.p.push();
    
    // Draw demon body with glow
    const glowColor = this.type === "FLYING" ? [255, 100, 255] : [255, 100, 100];
    this.p.fill(...glowColor, 100);
    this.p.noStroke();
    this.p.circle(this.x, this.y, this.radius * 2.4);
    
    // Main body
    this.p.fill(this.attackCooldown > 0 ? 255 : 200, 50, 50);
    this.p.stroke(150, 0, 0);
    this.p.strokeWeight(2);
    this.p.circle(this.x, this.y, this.radius * 2);
    
    // Eyes
    this.p.fill(255, 255, 0);
    this.p.noStroke();
    this.p.circle(this.x - 5, this.y - 3, 4);
    this.p.circle(this.x + 5, this.y - 3, 4);
    
    // Health bar
    const barWidth = 30;
    const barHeight = 4;
    const healthPercent = this.health / this.maxHealth;
    this.p.fill(50);
    this.p.rect(this.x - barWidth / 2, this.y - this.radius - 10, barWidth, barHeight);
    this.p.fill(255, 0, 0);
    this.p.rect(this.x - barWidth / 2, this.y - this.radius - 10, barWidth * healthPercent, barHeight);
    
    this.p.pop();
  }
}

export class DemonProjectile {
  constructor(p, x, y, angle) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = this.p.cos(angle) * 5;
    this.vy = this.p.sin(angle) * 5;
    this.radius = 6;
    this.lifetime = 120;
    this.active = true;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.lifetime--;
    
    if (this.lifetime <= 0 || this.x < 0 || this.x > CANVAS_WIDTH || 
        this.y < 0 || this.y > CANVAS_HEIGHT) {
      this.active = false;
    }
    
    // Check collision with player
    const player = gameState.player;
    if (player && this.p.dist(this.x, this.y, player.x + player.w / 2, player.y + player.h / 2) < 
        this.radius + player.w / 2) {
      player.takeDamage(15);
      this.active = false;
    }
  }

  render() {
    this.p.push();
    this.p.fill(255, 100, 255, 200);
    this.p.noStroke();
    this.p.circle(this.x, this.y, this.radius * 2);
    this.p.fill(255, 200, 255, 100);
    this.p.circle(this.x, this.y, this.radius * 3);
    this.p.pop();
  }
}

export class Card {
  constructor(p, x, y, cardType) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.startY = y;
    this.w = 25;
    this.h = 35;
    this.type = cardType;
    this.active = true;
    this.collected = false;
    this.floatOffset = 0;
  }

  update() {
    if (this.collected) return;
    
    // Floating animation
    this.floatOffset = this.p.sin(this.p.frameCount * 0.1 + this.x) * 5;
    
    // Check collection by player
    const player = gameState.player;
    if (player && this.p.collideRectRect(
      this.x - this.w / 2, this.y + this.floatOffset - this.h / 2, this.w, this.h,
      player.x, player.y, player.w, player.h
    )) {
      player.addCard(this.type);
      this.collected = true;
      this.active = false;
      gameState.score += 10;
      
      // Create collection particles
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * this.p.TWO_PI;
        gameState.particles.push(new Particle(
          this.p,
          this.x,
          this.y + this.floatOffset,
          this.p.cos(angle) * 3,
          this.p.sin(angle) * 3,
          this.type.color,
          25
        ));
      }
    }
  }

  render() {
    if (!this.active) return;
    
    this.p.push();
    const y = this.y + this.floatOffset;
    
    // Glow effect
    this.p.fill(...this.type.color, 80);
    this.p.noStroke();
    this.p.rect(this.x - this.w / 2 - 3, y - this.h / 2 - 3, this.w + 6, this.h + 6);
    
    // Card body
    this.p.fill(20, 20, 30);
    this.p.stroke(...this.type.color);
    this.p.strokeWeight(2);
    this.p.rect(this.x - this.w / 2, y - this.h / 2, this.w, this.h);
    
    // Card symbol
    this.p.fill(...this.type.color);
    this.p.noStroke();
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(10);
    this.p.text(this.type.name[0], this.x, y);
    
    this.p.pop();
  }
}

export class Platform {
  constructor(p, x, y, w, h, type = "normal") {
    this.p = p;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.type = type;
  }

  render() {
    this.p.push();
    
    if (this.type === "normal") {
      // Platform with neon edge
      this.p.fill(40, 40, 60);
      this.p.noStroke();
      this.p.rect(this.x, this.y, this.w, this.h);
      
      this.p.stroke(100, 200, 255);
      this.p.strokeWeight(2);
      this.p.noFill();
      this.p.rect(this.x, this.y, this.w, this.h);
    }
    
    this.p.pop();
  }
}

export class ExitPortal {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.w = 40;
    this.h = 60;
    this.active = false;
  }

  update() {
    // Activate when all demons are dead
    if (gameState.demonsKilled >= gameState.totalDemons) {
      this.active = true;
    }
    
    // Check if player enters
    if (this.active) {
      const player = gameState.player;
      if (player && this.p.collideRectRect(
        this.x, this.y, this.w, this.h,
        player.x, player.y, player.w, player.h
      )) {
        gameState.levelComplete = true;
      }
    }
  }

  render() {
    this.p.push();
    
    const alpha = this.active ? 255 : 80;
    const pulseSize = this.active ? this.p.sin(this.p.frameCount * 0.1) * 5 : 0;
    
    // Outer glow
    this.p.fill(100, 255, 255, alpha * 0.3);
    this.p.noStroke();
    this.p.rect(this.x - pulseSize, this.y - pulseSize, this.w + pulseSize * 2, this.h + pulseSize * 2);
    
    // Portal body
    this.p.fill(20, 20, 40, alpha);
    this.p.stroke(100, 255, 255, alpha);
    this.p.strokeWeight(3);
    this.p.rect(this.x, this.y, this.w, this.h);
    
    // Inner effect
    this.p.fill(100, 255, 255, alpha * 0.5);
    this.p.noStroke();
    for (let i = 0; i < 3; i++) {
      const offset = this.p.sin(this.p.frameCount * 0.15 + i) * 10;
      this.p.rect(this.x + 5, this.y + 10 + i * 15 + offset, this.w - 10, 5);
    }
    
    if (this.active) {
      this.p.fill(255, 255, 255);
      this.p.textAlign(this.p.CENTER, this.p.CENTER);
      this.p.textSize(10);
      this.p.text("EXIT", this.x + this.w / 2, this.y - 15);
    }
    
    this.p.pop();
  }
}