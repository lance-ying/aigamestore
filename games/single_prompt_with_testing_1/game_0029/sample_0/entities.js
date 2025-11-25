// entities.js - Game entities (Player, Enemy, QiOrb, Particle)

import { CANVAS_WIDTH, CANVAS_HEIGHT, CULTIVATION_STAGES, gameState } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.worldX = x;
    this.worldY = y;
    this.vx = 0;
    this.vy = 0;
    this.speed = 3;
    this.size = 20;
    this.health = CULTIVATION_STAGES[0].maxHealth;
    this.maxHealth = CULTIVATION_STAGES[0].maxHealth;
    this.attackRange = 80;
    this.attackCooldown = 0;
    this.attackDamage = 20;
    this.specialCooldown = 0;
    this.invulnerable = 0;
    this.glowPhase = 0;
  }

  update() {
    // Update position
    this.worldX += this.vx;
    this.worldY += this.vy;

    // Keep player in bounds (large world)
    const worldBounds = 2000;
    this.worldX = this.p.constrain(this.worldX, 0, worldBounds);
    this.worldY = this.p.constrain(this.worldY, 0, worldBounds);

    // Update screen position (player stays centered)
    this.x = CANVAS_WIDTH / 2;
    this.y = CANVAS_HEIGHT / 2;

    // Update cooldowns
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.specialCooldown > 0) this.specialCooldown--;
    if (this.invulnerable > 0) this.invulnerable--;

    // Update glow animation
    this.glowPhase += 0.1;

    // Update cultivation stage based on qi
    const stage = gameState.cultivationStage;
    if (stage < CULTIVATION_STAGES.length - 1) {
      if (gameState.qi >= CULTIVATION_STAGES[stage + 1].qiRequired) {
        this.breakthrough();
      }
    }
  }

  breakthrough() {
    gameState.cultivationStage++;
    const newStage = CULTIVATION_STAGES[gameState.cultivationStage];
    this.maxHealth = newStage.maxHealth;
    this.health = this.maxHealth;
    this.attackDamage += 15;
    this.speed += 0.5;
    gameState.lastBreakthroughTime = Date.now();

    // Create breakthrough particles
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * this.p.TWO_PI;
      const speed = this.p.random(2, 6);
      gameState.particles.push(new Particle(
        this.p,
        this.worldX,
        this.worldY,
        this.p.cos(angle) * speed,
        this.p.sin(angle) * speed,
        newStage.color,
        60
      ));
    }

    // Check win condition
    if (gameState.cultivationStage >= CULTIVATION_STAGES.length - 1) {
      gameState.gamePhase = "GAME_OVER_WIN";
    }
  }

  attack() {
    if (this.attackCooldown > 0) return;

    this.attackCooldown = 20;

    // Find enemies in range
    for (const enemy of gameState.enemies) {
      const dx = enemy.worldX - this.worldX;
      const dy = enemy.worldY - this.worldY;
      const dist = this.p.sqrt(dx * dx + dy * dy);

      if (dist < this.attackRange) {
        enemy.takeDamage(this.attackDamage);

        // Create attack particles
        for (let i = 0; i < 5; i++) {
          const angle = this.p.atan2(dy, dx) + this.p.random(-0.3, 0.3);
          gameState.particles.push(new Particle(
            this.p,
            this.worldX,
            this.worldY,
            this.p.cos(angle) * 4,
            this.p.sin(angle) * 4,
            [255, 200, 100],
            20
          ));
        }
      }
    }
  }

  specialAbility() {
    if (this.specialCooldown > 0 || gameState.qi < 10) return;

    this.specialCooldown = 120;
    gameState.qi -= 10;

    // Spirit Burst - area damage
    const burstRange = 150;
    for (const enemy of gameState.enemies) {
      const dx = enemy.worldX - this.worldX;
      const dy = enemy.worldY - this.worldY;
      const dist = this.p.sqrt(dx * dx + dy * dy);

      if (dist < burstRange) {
        enemy.takeDamage(this.attackDamage * 2);
      }
    }

    // Create burst particles
    for (let i = 0; i < 50; i++) {
      const angle = this.p.random(this.p.TWO_PI);
      const speed = this.p.random(3, 8);
      gameState.particles.push(new Particle(
        this.p,
        this.worldX,
        this.worldY,
        this.p.cos(angle) * speed,
        this.p.sin(angle) * speed,
        [150, 100, 255],
        40
      ));
    }
  }

  takeDamage(damage) {
    if (this.invulnerable > 0) return;

    this.health -= damage;
    this.invulnerable = 30;

    if (this.health <= 0) {
      this.health = 0;
      gameState.gamePhase = "GAME_OVER_LOSE";
    }
  }

  draw() {
    const p = this.p;
    const stage = CULTIVATION_STAGES[gameState.cultivationStage];

    p.push();
    p.translate(this.x, this.y);

    // Draw aura
    const glowSize = this.size + 10 + this.p.sin(this.glowPhase) * 5;
    p.noStroke();
    p.fill(...stage.color, 30);
    p.circle(0, 0, glowSize * 2);

    // Draw invulnerability flash
    if (this.invulnerable > 0 && this.p.frameCount % 4 < 2) {
      p.fill(255, 255, 255, 150);
    } else {
      p.fill(...stage.color);
    }

    // Draw player body
    p.stroke(0);
    p.strokeWeight(2);
    p.circle(0, 0, this.size * 2);

    // Draw cultivation symbol
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text("修", 0, 0);

    p.pop();
  }
}

export class Enemy {
  constructor(p, worldX, worldY, type = 0) {
    this.p = p;
    this.worldX = worldX;
    this.worldY = worldY;
    this.type = type; // 0: weak, 1: medium, 2: strong
    this.size = 15 + type * 5;
    this.health = 50 + type * 50;
    this.maxHealth = this.health;
    this.speed = 1.5 - type * 0.3;
    this.attackRange = 40;
    this.attackCooldown = 0;
    this.attackDamage = 10 + type * 10;
    this.color = type === 0 ? [255, 100, 100] : type === 1 ? [255, 50, 150] : [150, 50, 255];
    this.active = true;
    this.moveAngle = this.p.random(this.p.TWO_PI);
    this.moveTimer = 0;
  }

  update(player) {
    if (!this.active) return;

    const dx = player.worldX - this.worldX;
    const dy = player.worldY - this.worldY;
    const dist = this.p.sqrt(dx * dx + dy * dy);

    // AI behavior
    if (dist < 300) {
      // Chase player
      this.worldX += (dx / dist) * this.speed;
      this.worldY += (dy / dist) * this.speed;

      // Attack if in range
      if (dist < this.attackRange && this.attackCooldown <= 0) {
        player.takeDamage(this.attackDamage);
        this.attackCooldown = 60;
      }
    } else {
      // Wander
      this.moveTimer++;
      if (this.moveTimer > 60) {
        this.moveAngle = this.p.random(this.p.TWO_PI);
        this.moveTimer = 0;
      }
      this.worldX += this.p.cos(this.moveAngle) * this.speed * 0.5;
      this.worldY += this.p.sin(this.moveAngle) * this.speed * 0.5;
    }

    if (this.attackCooldown > 0) this.attackCooldown--;
  }

  takeDamage(damage) {
    this.health -= damage;
    if (this.health <= 0) {
      this.active = false;
      gameState.score += (this.type + 1) * 50;

      // Create death particles
      for (let i = 0; i < 10; i++) {
        const angle = this.p.random(this.p.TWO_PI);
        const speed = this.p.random(2, 5);
        gameState.particles.push(new Particle(
          this.p,
          this.worldX,
          this.worldY,
          this.p.cos(angle) * speed,
          this.p.sin(angle) * speed,
          this.color,
          30
        ));
      }
    }
  }

  draw(offsetX, offsetY) {
    if (!this.active) return;

    const p = this.p;
    const screenX = this.worldX - offsetX + CANVAS_WIDTH / 2;
    const screenY = this.worldY - offsetY + CANVAS_HEIGHT / 2;

    // Only draw if on screen
    if (screenX < -50 || screenX > CANVAS_WIDTH + 50 || screenY < -50 || screenY > CANVAS_HEIGHT + 50) {
      return;
    }

    p.push();
    p.translate(screenX, screenY);

    // Draw shadow
    p.noStroke();
    p.fill(0, 0, 0, 50);
    p.ellipse(2, 2, this.size * 2, this.size * 2);

    // Draw body
    p.fill(...this.color);
    p.stroke(0);
    p.strokeWeight(2);
    p.circle(0, 0, this.size * 2);

    // Draw eyes
    p.fill(255, 0, 0);
    p.noStroke();
    p.circle(-5, -3, 4);
    p.circle(5, -3, 4);

    // Draw health bar
    const barWidth = this.size * 2;
    const barHeight = 4;
    const healthPercent = this.health / this.maxHealth;
    p.fill(50);
    p.rect(-barWidth / 2, this.size + 5, barWidth, barHeight);
    p.fill(255, 0, 0);
    p.rect(-barWidth / 2, this.size + 5, barWidth * healthPercent, barHeight);

    p.pop();
  }
}

export class QiOrb {
  constructor(p, worldX, worldY) {
    this.p = p;
    this.worldX = worldX;
    this.worldY = worldY;
    this.size = 8;
    this.active = true;
    this.floatPhase = this.p.random(this.p.TWO_PI);
    this.value = 10;
  }

  update(player) {
    if (!this.active) return;

    this.floatPhase += 0.1;

    // Check collection
    const dx = player.worldX - this.worldX;
    const dy = player.worldY - this.worldY;
    const dist = this.p.sqrt(dx * dx + dy * dy);

    if (dist < player.size + this.size) {
      this.active = false;
      gameState.qi += this.value;
      gameState.score += 10;

      // Create collection particles
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * this.p.TWO_PI;
        gameState.particles.push(new Particle(
          this.p,
          this.worldX,
          this.worldY,
          this.p.cos(angle) * 2,
          this.p.sin(angle) * 2,
          [100, 200, 255],
          20
        ));
      }
    }
  }

  draw(offsetX, offsetY) {
    if (!this.active) return;

    const p = this.p;
    const screenX = this.worldX - offsetX + CANVAS_WIDTH / 2;
    const screenY = this.worldY - offsetY + CANVAS_HEIGHT / 2 + this.p.sin(this.floatPhase) * 3;

    // Only draw if on screen
    if (screenX < -50 || screenX > CANVAS_WIDTH + 50 || screenY < -50 || screenY > CANVAS_HEIGHT + 50) {
      return;
    }

    p.push();
    p.translate(screenX, screenY);

    // Draw glow
    p.noStroke();
    p.fill(100, 200, 255, 100);
    p.circle(0, 0, this.size * 4);

    // Draw orb
    p.fill(150, 220, 255);
    p.stroke(255);
    p.strokeWeight(1);
    p.circle(0, 0, this.size * 2);

    // Draw shine
    p.fill(255, 255, 255, 200);
    p.noStroke();
    p.circle(-2, -2, 4);

    p.pop();
  }
}

export class Particle {
  constructor(p, x, y, vx, vy, color, life) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = p.random(2, 6);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1; // gravity
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.life--;
  }

  draw(offsetX, offsetY) {
    if (this.life <= 0) return;

    const p = this.p;
    const screenX = this.x - offsetX + CANVAS_WIDTH / 2;
    const screenY = this.y - offsetY + CANVAS_HEIGHT / 2;

    // Only draw if on screen
    if (screenX < -50 || screenX > CANVAS_WIDTH + 50 || screenY < -50 || screenY > CANVAS_HEIGHT + 50) {
      return;
    }

    const alpha = (this.life / this.maxLife) * 255;
    p.noStroke();
    p.fill(...this.color, alpha);
    p.circle(screenX, screenY, this.size);
  }

  isDead() {
    return this.life <= 0;
  }
}