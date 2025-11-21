// entities.js - Entity classes

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Enemy {
  constructor(p, x, y, wave) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 8;
    this.height = 30;
    this.speed = 0.5 + wave * 0.05; // Speed increases with wave
    this.maxHealth = 20 + wave * 5; // Health increases with wave
    this.health = this.maxHealth;
    this.color = [200, 50, 50];
    this.armAngle = 0;
    this.legPhase = 0;
    this.isDead = false;
    this.deathTimer = 0;
    this.resourceValue = 5 + wave * 2;
  }

  update() {
    if (this.isDead) {
      this.deathTimer++;
      return;
    }

    // Move toward castle
    this.x -= this.speed;

    // Animation
    this.legPhase += 0.15;
    this.armAngle = Math.sin(this.legPhase) * 20;

    // Check if reached castle
    if (this.x < gameState.castleX + 30) {
      this.attackCastle();
    }
  }

  attackCastle() {
    gameState.upgrades.castleHealth -= 2;
    this.isDead = true;
    this.deathTimer = 0;
  }

  takeDamage(damage) {
    this.health -= damage;
    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.isDead = true;
    this.deathTimer = 0;
    gameState.resources += this.resourceValue;
    gameState.score += 10;
  }

  draw() {
    const p = this.p;
    if (this.isDead) {
      // Death animation - fall down
      p.push();
      p.translate(this.x, this.y);
      p.rotate(Math.min(this.deathTimer * 0.1, Math.PI / 2));
      p.fill(100, 100, 100);
      p.stroke(0);
      p.strokeWeight(2);
      p.line(0, -10, 0, 10); // Body
      p.line(0, 10, -5, 20); // Legs
      p.line(0, 10, 5, 20);
      p.ellipse(0, -12, 8, 8); // Head
      p.pop();
      return;
    }

    p.push();
    p.translate(this.x, this.y);

    // Head
    p.fill(...this.color);
    p.stroke(0);
    p.strokeWeight(2);
    p.ellipse(0, -15, 10, 10);

    // Body
    p.line(0, -10, 0, 5);

    // Arms
    p.push();
    p.translate(0, -5);
    p.rotate(this.armAngle * 0.017453); // Convert to radians
    p.line(0, 0, -8, 8);
    p.pop();

    p.push();
    p.translate(0, -5);
    p.rotate(-this.armAngle * 0.017453);
    p.line(0, 0, 8, 8);
    p.pop();

    // Legs
    const leg1 = Math.sin(this.legPhase) * 10;
    const leg2 = Math.sin(this.legPhase + Math.PI) * 10;
    p.line(0, 5, -3, 15 + leg1);
    p.line(0, 5, 3, 15 + leg2);

    // Health bar
    p.noStroke();
    p.fill(255, 0, 0);
    p.rect(-8, -25, 16, 3);
    p.fill(0, 255, 0);
    const healthWidth = (this.health / this.maxHealth) * 16;
    p.rect(-8, -25, healthWidth, 3);

    p.pop();
  }
}

export class Projectile {
  constructor(p, x, y, targetX, targetY, damage, speed = 5) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.damage = damage;
    this.isDead = false;

    // Calculate direction
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.vx = (dx / dist) * speed;
    this.vy = (dy / dist) * speed;
    this.radius = 4;
    this.trail = [];
  }

  update() {
    if (this.isDead) return;

    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 5) this.trail.shift();

    this.x += this.vx;
    this.y += this.vy;

    // Check bounds
    if (this.x < 0 || this.x > CANVAS_WIDTH || this.y < 0 || this.y > CANVAS_HEIGHT) {
      this.isDead = true;
    }

    // Check collision with enemies
    for (const enemy of gameState.enemies) {
      if (enemy.isDead) continue;
      const dist = Math.sqrt((this.x - enemy.x) ** 2 + (this.y - enemy.y) ** 2);
      if (dist < this.radius + 10) {
        enemy.takeDamage(this.damage);
        this.isDead = true;
        this.createHitEffect();
        break;
      }
    }
  }

  createHitEffect() {
    gameState.effects.push(new HitEffect(this.p, this.x, this.y));
  }

  draw() {
    if (this.isDead) return;

    const p = this.p;
    
    // Trail
    p.noStroke();
    for (let i = 0; i < this.trail.length; i++) {
      const alpha = (i / this.trail.length) * 150;
      p.fill(255, 200, 0, alpha);
      p.ellipse(this.trail[i].x, this.trail[i].y, 3);
    }

    // Projectile
    p.fill(255, 220, 0);
    p.stroke(255, 150, 0);
    p.strokeWeight(2);
    p.ellipse(this.x, this.y, this.radius * 2);
  }
}

export class Arrow {
  constructor(p, x, y, targetY, damage) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.targetY = targetY;
    this.damage = damage;
    this.isDead = false;
    this.vx = 8;
    this.vy = (targetY - y) / 40;
    this.angle = Math.atan2(this.vy, this.vx);
  }

  update() {
    if (this.isDead) return;

    this.x += this.vx;
    this.y += this.vy;

    // Gravity
    this.vy += 0.2;
    this.angle = Math.atan2(this.vy, this.vx);

    // Check bounds
    if (this.x > CANVAS_WIDTH || this.y > CANVAS_HEIGHT) {
      this.isDead = true;
    }

    // Check collision with enemies
    for (const enemy of gameState.enemies) {
      if (enemy.isDead) continue;
      const dist = Math.sqrt((this.x - enemy.x) ** 2 + (this.y - enemy.y) ** 2);
      if (dist < 10) {
        enemy.takeDamage(this.damage);
        this.isDead = true;
        this.createHitEffect();
        break;
      }
    }
  }

  createHitEffect() {
    gameState.effects.push(new HitEffect(this.p, this.x, this.y));
  }

  draw() {
    if (this.isDead) return;

    const p = this.p;
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle);
    p.fill(139, 69, 19);
    p.stroke(0);
    p.strokeWeight(1);
    p.rect(-8, -1, 8, 2);
    p.fill(200, 200, 200);
    p.triangle(0, 0, 6, -3, 6, 3);
    p.pop();
  }
}

export class HitEffect {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.particles = [];
    this.timer = 0;
    this.maxTimer = 20;
    
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      this.particles.push({
        x: 0,
        y: 0,
        vx: Math.cos(angle) * 2,
        vy: Math.sin(angle) * 2
      });
    }
  }

  update() {
    this.timer++;
    for (const particle of this.particles) {
      particle.x += particle.vx;
      particle.y += particle.vy;
    }
  }

  isDead() {
    return this.timer >= this.maxTimer;
  }

  draw() {
    const p = this.p;
    const alpha = 255 * (1 - this.timer / this.maxTimer);
    p.push();
    p.translate(this.x, this.y);
    p.noStroke();
    for (const particle of this.particles) {
      p.fill(255, 150, 0, alpha);
      p.ellipse(particle.x, particle.y, 4);
    }
    p.pop();
  }
}

export class ExplosionEffect {
  constructor(p, x, y, radius) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.currentRadius = 0;
    this.timer = 0;
    this.maxTimer = 30;
  }

  update() {
    this.timer++;
    this.currentRadius = this.radius * (this.timer / this.maxTimer);
  }

  isDead() {
    return this.timer >= this.maxTimer;
  }

  draw() {
    const p = this.p;
    const alpha = 200 * (1 - this.timer / this.maxTimer);
    p.push();
    p.noStroke();
    p.fill(255, 100, 0, alpha);
    p.ellipse(this.x, this.y, this.currentRadius * 2);
    p.fill(255, 200, 0, alpha * 0.7);
    p.ellipse(this.x, this.y, this.currentRadius * 1.5);
    p.fill(255, 255, 150, alpha * 0.5);
    p.ellipse(this.x, this.y, this.currentRadius);
    p.pop();
  }
}