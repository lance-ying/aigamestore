// entities.js - Entity classes

import { GRID_SIZE, ENTITY_TYPES, gameState } from './globals.js';

export class Entity {
  constructor(gridX, gridY, type) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.x = gridX * GRID_SIZE + GRID_SIZE / 2;
    this.y = gridY * GRID_SIZE + GRID_SIZE / 2;
    this.type = type;
    this.hp = 100;
    this.maxHp = 100;
    this.atk = 10;
    this.asp = 60;
    this.spd = 1;
    this.size = 40;
    this.hitFlashTimer = 0;
    this.deathTimer = -1;
    this.attackCooldown = 0;
  }

  takeDamage(damage) {
    this.hp -= damage;
    this.hitFlashTimer = 10;
    if (this.hp <= 0) {
      this.hp = 0;
      this.deathTimer = 30;
    }
  }

  update() {
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer--;
    }
    if (this.deathTimer > 0) {
      this.deathTimer--;
    }
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }
  }

  isDead() {
    return this.deathTimer === 0;
  }

  isAlive() {
    return this.hp > 0 && this.deathTimer < 0;
  }
}

export class Player extends Entity {
  constructor(gridX, gridY) {
    super(gridX, gridY, ENTITY_TYPES.PLAYER);
    this.hp = 100;
    this.maxHp = 100;
    this.atk = 15;
    this.asp = 30;
    this.spd = 1;
    this.size = 40;
    this.hasPiercing = false;
    this.multiShotCount = 1;
    this.projectileSpeed = 5;
  }

  render(p) {
    p.push();
    if (this.deathTimer > 0) {
      const alpha = p.map(this.deathTimer, 30, 0, 255, 0);
      const scale = p.map(this.deathTimer, 30, 0, 1, 0.5);
      p.translate(this.x, this.y);
      p.scale(scale);
      p.translate(-this.x, -this.y);
      p.fill(this.hitFlashTimer > 0 ? 255 : 100, this.hitFlashTimer > 0 ? 255 : 150, this.hitFlashTimer > 0 ? 255 : 255, alpha);
    } else {
      p.fill(this.hitFlashTimer > 0 ? 255 : 100, this.hitFlashTimer > 0 ? 255 : 150, this.hitFlashTimer > 0 ? 255 : 255);
    }
    p.rectMode(p.CENTER);
    p.rect(this.x, this.y, this.size, this.size);
    p.pop();

    // Health bar
    if (this.isAlive()) {
      this.renderHealthBar(p);
    }
  }

  renderHealthBar(p) {
    const barWidth = this.size;
    const barHeight = 5;
    const barX = this.x - barWidth / 2;
    const barY = this.y - this.size / 2 - 10;

    p.fill(200, 0, 0);
    p.noStroke();
    p.rect(barX, barY, barWidth, barHeight);

    const healthWidth = (this.hp / this.maxHp) * barWidth;
    p.fill(0, 200, 0);
    p.rect(barX, barY, healthWidth, barHeight);
  }
}

export class Enemy extends Entity {
  constructor(gridX, gridY, type) {
    super(gridX, gridY, type);
    this.targetX = gridX;
    this.targetY = gridY;
    this.moveProgress = 0;
  }

  render(p) {
    p.push();
    if (this.deathTimer > 0) {
      const alpha = p.map(this.deathTimer, 30, 0, 255, 0);
      const scale = p.map(this.deathTimer, 30, 0, 1, 0.5);
      p.translate(this.x, this.y);
      p.scale(scale);
      p.translate(-this.x, -this.y);
      this.renderShape(p, alpha);
    } else {
      this.renderShape(p, 255);
    }
    p.pop();

    // Health bar
    if (this.isAlive()) {
      this.renderHealthBar(p);
    }
  }

  renderShape(p, alpha) {
    // Override in subclasses
  }

  renderHealthBar(p) {
    const barWidth = this.size;
    const barHeight = 5;
    const barX = this.x - barWidth / 2;
    const barY = this.y - this.size / 2 - 10;

    p.fill(200, 0, 0);
    p.noStroke();
    p.rect(barX, barY, barWidth, barHeight);

    const healthWidth = (this.hp / this.maxHp) * barWidth;
    p.fill(0, 200, 0);
    p.rect(barX, barY, healthWidth, barHeight);
  }

  moveTowards(targetGridX, targetGridY) {
    if (this.moveProgress > 0) {
      this.moveProgress--;
      const startX = this.gridX * GRID_SIZE + GRID_SIZE / 2;
      const startY = this.gridY * GRID_SIZE + GRID_SIZE / 2;
      const endX = this.targetX * GRID_SIZE + GRID_SIZE / 2;
      const endY = this.targetY * GRID_SIZE + GRID_SIZE / 2;
      const t = 1 - (this.moveProgress / 10);
      this.x = startX + (endX - startX) * t;
      this.y = startY + (endY - startY) * t;
      return;
    }

    const dx = targetGridX - this.gridX;
    const dy = targetGridY - this.gridY;

    if (dx === 0 && dy === 0) return;

    let moveX = 0;
    let moveY = 0;

    if (Math.abs(dx) > Math.abs(dy)) {
      moveX = dx > 0 ? 1 : -1;
    } else {
      moveY = dy > 0 ? 1 : -1;
    }

    this.targetX = this.gridX + moveX;
    this.targetY = this.gridY + moveY;
    this.moveProgress = 10;
  }

  commitMove() {
    if (this.moveProgress === 0) {
      this.gridX = this.targetX;
      this.gridY = this.targetY;
      this.x = this.gridX * GRID_SIZE + GRID_SIZE / 2;
      this.y = this.gridY * GRID_SIZE + GRID_SIZE / 2;
    }
  }
}

export class MeleeEnemy extends Enemy {
  constructor(gridX, gridY) {
    super(gridX, gridY, ENTITY_TYPES.MELEE_ENEMY);
    this.hp = 50;
    this.maxHp = 50;
    this.atk = 10;
    this.spd = 1;
    this.size = 40;
  }

  renderShape(p, alpha) {
    p.fill(this.hitFlashTimer > 0 ? 255 : 255, this.hitFlashTimer > 0 ? 255 : 100, this.hitFlashTimer > 0 ? 255 : 100, alpha);
    p.ellipse(this.x, this.y, this.size, this.size);
  }
}

export class RangedEnemy extends Enemy {
  constructor(gridX, gridY) {
    super(gridX, gridY, ENTITY_TYPES.RANGED_ENEMY);
    this.hp = 40;
    this.maxHp = 40;
    this.atk = 15;
    this.asp = 90;
    this.spd = 1;
    this.size = 40;
  }

  renderShape(p, alpha) {
    p.fill(this.hitFlashTimer > 0 ? 255 : 100, this.hitFlashTimer > 0 ? 255 : 255, this.hitFlashTimer > 0 ? 255 : 100, alpha);
    p.beginShape();
    p.vertex(this.x, this.y - this.size / 2);
    p.vertex(this.x - this.size / 2, this.y + this.size / 2);
    p.vertex(this.x + this.size / 2, this.y + this.size / 2);
    p.endShape(p.CLOSE);
  }
}

export class TankEnemy extends Enemy {
  constructor(gridX, gridY) {
    super(gridX, gridY, ENTITY_TYPES.TANK_ENEMY);
    this.hp = 150;
    this.maxHp = 150;
    this.atk = 25;
    this.spd = 0.5;
    this.size = 60;
  }

  renderShape(p, alpha) {
    p.fill(this.hitFlashTimer > 0 ? 255 : 150, this.hitFlashTimer > 0 ? 255 : 100, this.hitFlashTimer > 0 ? 255 : 200, alpha);
    p.rectMode(p.CENTER);
    p.rect(this.x, this.y, this.size, this.size);
  }
}

export class BossEnemy extends Enemy {
  constructor(gridX, gridY) {
    super(gridX, gridY, ENTITY_TYPES.BOSS_ENEMY);
    this.hp = 500;
    this.maxHp = 500;
    this.atk = 30;
    this.asp = 60;
    this.spd = 0.5;
    this.size = 80;
    this.specialAttackCooldown = 0;
  }

  renderShape(p, alpha) {
    p.fill(this.hitFlashTimer > 0 ? 255 : 100, this.hitFlashTimer > 0 ? 255 : 50, this.hitFlashTimer > 0 ? 255 : 150, alpha);
    p.beginShape();
    for (let i = 0; i < 8; i++) {
      const angle = (p.TWO_PI / 8) * i;
      const px = this.x + p.cos(angle) * (this.size / 2);
      const py = this.y + p.sin(angle) * (this.size / 2);
      p.vertex(px, py);
    }
    p.endShape(p.CLOSE);
  }

  update() {
    super.update();
    if (this.specialAttackCooldown > 0) {
      this.specialAttackCooldown--;
    }
  }
}