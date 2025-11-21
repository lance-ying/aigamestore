// enemy.js - Enemy entities
import { gameState, ENEMY_TYPES } from './globals.js';

export class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    const stats = ENEMY_TYPES[type];
    this.health = stats.health;
    this.maxHealth = stats.health;
    this.damage = stats.damage;
    this.speed = stats.speed;
    this.xp = stats.xp;
    this.color = stats.color;
    this.width = 25;
    this.height = 25;
    this.attackCooldown = 0;
    this.lastDamageFrame = -1000;
    this.aggroRange = 150;
    this.attackRange = 35;
    this.active = true;
  }

  update(p, player) {
    if (!this.active) return;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // AI: Move towards player if in aggro range
    if (distance < this.aggroRange && distance > this.attackRange) {
      const moveX = (dx / distance) * this.speed;
      const moveY = (dy / distance) * this.speed;
      this.x += moveX;
      this.y += moveY;
    }

    // Attack player if in range
    if (distance < this.attackRange && this.attackCooldown === 0) {
      const died = player.takeDamage(this.damage, p);
      this.attackCooldown = 60;
      if (died) {
        gameState.gamePhase = "GAME_OVER_LOSE";
      }
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }
  }

  takeDamage(amount, p) {
    this.health -= amount;
    this.lastDamageFrame = p.frameCount;
    gameState.combatTimer = p.frameCount;
    if (this.health <= 0) {
      this.health = 0;
      this.active = false;
      return true; // enemy died
    }
    return false;
  }

  render(p, camera) {
    if (!this.active) return;

    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    p.push();

    // Body
    p.fill(...(p.frameCount - this.lastDamageFrame < 10 ? [255, 255, 255] : this.color));
    p.noStroke();
    p.ellipse(screenX, screenY, this.width, this.height);

    // Eyes (menacing)
    p.fill(255, 0, 0);
    p.ellipse(screenX - 5, screenY - 3, 4, 6);
    p.ellipse(screenX + 5, screenY - 3, 4, 6);

    // Health bar
    const barWidth = 30;
    const barHeight = 3;
    const healthPercent = this.health / this.maxHealth;
    p.fill(40);
    p.rect(screenX - barWidth / 2, screenY - this.height / 2 - 8, barWidth, barHeight);
    p.fill(255, 50, 50);
    p.rect(screenX - barWidth / 2, screenY - this.height / 2 - 8, barWidth * healthPercent, barHeight);

    p.pop();
  }
}