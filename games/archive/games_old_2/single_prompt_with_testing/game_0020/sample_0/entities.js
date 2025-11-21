// entities.js - Entity classes with Matter.js bodies

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.body = Bodies.rectangle(x, y, 40, 60, {
      label: 'player',
      isStatic: true,
      friction: 0.8
    });
    World.add(gameState.world, this.body);
    
    this.color = [50, 150, 255];
    this.attackAnimation = 0;
    this.lastLoggedX = x;
    this.lastLoggedY = y;
  }

  update() {
    // Handle attack animation
    if (this.attackAnimation > 0) {
      this.attackAnimation--;
    }

    // Log position changes
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

  render() {
    const p = this.p;
    const pos = this.body.position;
    
    p.push();
    p.translate(pos.x, pos.y);
    
    // Body
    p.fill(this.color);
    p.noStroke();
    p.rect(-20, -30, 40, 60, 5);
    
    // Head
    p.fill(255, 220, 180);
    p.circle(0, -45, 30);
    
    // Eyes
    p.fill(0);
    p.circle(-7, -47, 5);
    p.circle(7, -47, 5);
    
    // Weapon in hand (if attacking)
    if (this.attackAnimation > 0) {
      const weapon = gameState.weapons[gameState.currentWeaponIndex];
      const offset = this.attackAnimation * 2;
      p.fill(weapon.color);
      p.push();
      p.translate(25 + offset, -10);
      p.rotate(this.p.PI / 4);
      p.rect(-5, -20, 10, 40, 2);
      p.pop();
    }
    
    p.pop();
  }

  attack() {
    if (gameState.attackCooldown <= 0) {
      const weapon = gameState.weapons[gameState.currentWeaponIndex];
      this.attackAnimation = 15;
      gameState.attackCooldown = weapon.attackSpeed;
      return true;
    }
    return false;
  }
}

export class Boss {
  constructor(p, x, y, stage) {
    this.p = p;
    this.stage = stage;
    this.maxHealth = 100 + (stage - 1) * 150;
    this.health = this.maxHealth;
    this.resistance = 1 + (stage - 1) * 0.15;
    
    this.body = Bodies.rectangle(x, y, 80, 100, {
      label: 'boss',
      isStatic: true,
      friction: 0.8
    });
    World.add(gameState.world, this.body);
    
    this.color = [200 - stage * 20, 50 + stage * 10, 50 + stage * 10];
    this.hitAnimation = 0;
    this.shakeX = 0;
    this.shakeY = 0;
  }

  takeDamage(damage) {
    const actualDamage = Math.max(1, Math.floor(damage / this.resistance));
    this.health -= actualDamage;
    this.health = Math.max(0, this.health);
    this.hitAnimation = 20;
    
    // Shake effect
    this.shakeX = this.p.random(-5, 5);
    this.shakeY = this.p.random(-5, 5);
    
    // Create damage particles
    for (let i = 0; i < 3; i++) {
      gameState.particles.push({
        x: this.body.position.x + this.p.random(-30, 30),
        y: this.body.position.y + this.p.random(-40, 40),
        vx: this.p.random(-2, 2),
        vy: this.p.random(-3, -1),
        life: 30,
        color: [255, 100, 100]
      });
    }
    
    return actualDamage;
  }

  update() {
    if (this.hitAnimation > 0) {
      this.hitAnimation--;
      this.shakeX *= 0.8;
      this.shakeY *= 0.8;
    }
  }

  render() {
    const p = this.p;
    const pos = this.body.position;
    
    p.push();
    p.translate(pos.x + this.shakeX, pos.y + this.shakeY);
    
    // Boss body
    const hitFlash = this.hitAnimation > 0 ? 100 : 0;
    p.fill(this.color[0] + hitFlash, this.color[1], this.color[2]);
    p.noStroke();
    p.rect(-40, -50, 80, 100, 10);
    
    // Boss face
    p.fill(150 + hitFlash, 80, 80);
    p.circle(0, -30, 60);
    
    // Eyes
    const eyeOffset = this.hitAnimation > 10 ? 2 : 0;
    p.fill(255, 0, 0);
    p.circle(-15, -35 + eyeOffset, 10);
    p.circle(15, -35 + eyeOffset, 10);
    
    // Angry eyebrows
    p.strokeWeight(3);
    p.stroke(100, 0, 0);
    p.line(-22, -42, -10, -40);
    p.line(22, -42, 10, -40);
    
    // Health bar
    p.noStroke();
    p.fill(50);
    p.rect(-35, -70, 70, 8, 2);
    p.fill(0, 255, 0);
    const healthWidth = (this.health / this.maxHealth) * 70;
    p.rect(-35, -70, healthWidth, 8, 2);
    
    // Stage indicator
    p.fill(255);
    p.textAlign(p.CENTER);
    p.textSize(10);
    p.text(`Stage ${this.stage}`, 0, -80);
    
    p.pop();
  }

  isDead() {
    return this.health <= 0;
  }
}

export class DamageNumber {
  constructor(p, x, y, damage) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.damage = damage;
    this.life = 60;
    this.vy = -2;
    this.alpha = 255;
  }

  update() {
    this.y += this.vy;
    this.vy *= 0.95;
    this.life--;
    this.alpha = (this.life / 60) * 255;
  }

  render() {
    const p = this.p;
    p.push();
    p.fill(255, 255, 0, this.alpha);
    p.textAlign(p.CENTER);
    p.textSize(20);
    p.textStyle(p.BOLD);
    p.text(`-${this.damage}`, this.x, this.y);
    p.pop();
  }

  isDead() {
    return this.life <= 0;
  }
}