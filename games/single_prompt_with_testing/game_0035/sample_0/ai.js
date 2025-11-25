// ai.js - Enemy AI controller

import { distance, clamp } from './utils.js';
import { KEY_CODES } from './globals.js';

export class EnemyAI {
  constructor(enemy, player) {
    this.enemy = enemy;
    this.player = player;
    this.strategy = 'aggressive';
    this.thinkTimer = 0;
    this.thinkInterval = 10;
    this.targetX = 0;
    this.targetY = 0;
    this.difficulty = 0.7; // 0 to 1
  }

  update() {
    this.thinkTimer++;
    
    if (this.thinkTimer >= this.thinkInterval) {
      this.think();
      this.thinkTimer = 0;
    }
    
    return this.getActions();
  }

  think() {
    const dist = distance(this.enemy.x, this.enemy.y, this.player.x, this.player.y);
    
    // Adjust strategy based on health
    if (this.enemy.health < this.enemy.maxHealth * 0.3) {
      this.strategy = 'defensive';
    } else if (this.enemy.health > this.player.health) {
      this.strategy = 'aggressive';
    } else {
      this.strategy = 'balanced';
    }
    
    // Set target position
    if (this.strategy === 'aggressive') {
      this.targetX = this.player.x;
      this.targetY = this.player.y;
    } else if (this.strategy === 'defensive') {
      // Move away from player
      const angle = Math.atan2(this.player.y - this.enemy.y, this.player.x - this.enemy.x);
      this.targetX = this.enemy.x - Math.cos(angle) * 100;
      this.targetY = this.enemy.y - Math.sin(angle) * 100;
    } else {
      // Strafe
      const angle = Math.atan2(this.player.y - this.enemy.y, this.player.x - this.enemy.x);
      const perpAngle = angle + Math.PI / 2;
      this.targetX = this.enemy.x + Math.cos(perpAngle) * 80;
      this.targetY = this.enemy.y + Math.sin(perpAngle) * 80;
    }
  }

  getActions() {
    const actions = {
      left: false,
      right: false,
      up: false,
      down: false,
      shoot: false,
      shield: false,
      dash: false
    };
    
    // Movement
    const dx = this.targetX - this.enemy.x;
    const dy = this.targetY - this.enemy.y;
    
    if (Math.abs(dx) > 10) {
      if (dx < 0) actions.left = true;
      else actions.right = true;
    }
    
    if (Math.abs(dy) > 10) {
      if (dy < 0) actions.up = true;
      else actions.down = true;
    }
    
    // Combat decisions with difficulty scaling
    const dist = distance(this.enemy.x, this.enemy.y, this.player.x, this.player.y);
    
    // Shoot if player is in sight and we're facing them
    const facingPlayer = this.enemy.facingRight ? (this.player.x > this.enemy.x) : (this.player.x < this.enemy.x);
    if (facingPlayer && dist < 300 && Math.random() < this.difficulty * 0.8) {
      actions.shoot = true;
    }
    
    // Use shield if projectile incoming or low health
    if (this.enemy.health < this.enemy.maxHealth * 0.5 && Math.random() < this.difficulty * 0.3) {
      actions.shield = true;
    }
    
    // Dash occasionally for positioning
    if (Math.random() < this.difficulty * 0.05 && dist > 100) {
      actions.dash = true;
    }
    
    return actions;
  }

  increaseDifficulty() {
    this.difficulty = Math.min(1, this.difficulty + 0.1);
  }
}