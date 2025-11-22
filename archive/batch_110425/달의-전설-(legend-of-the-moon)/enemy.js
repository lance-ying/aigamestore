// enemy.js - Enemy classes and AI

import { 
  ENEMY_SIZE, ROOM_PADDING, CANVAS_WIDTH, CANVAS_HEIGHT,
  gameState
} from './globals.js';
import { distance } from './utils.js';

export class Enemy {
  constructor(x, y, type = 'slime') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.size = ENEMY_SIZE;
    this.animationFrame = 0;
    this.attackCooldown = 0;
    this.moveTimer = 0;
    this.targetX = x;
    this.targetY = y;
    this.isAlive = true;
    
    // Set stats based on type
    switch(type) {
      case 'slime':
        this.maxHp = 50;
        this.hp = 50;
        this.attack = 5;
        this.speed = 1.5;
        this.attackRange = 25;
        this.detectionRange = 150;
        this.gold = 10;
        break;
      case 'goblin':
        this.maxHp = 80;
        this.hp = 80;
        this.attack = 8;
        this.speed = 2;
        this.attackRange = 30;
        this.detectionRange = 180;
        this.gold = 20;
        break;
      case 'orc':
        this.maxHp = 150;
        this.hp = 150;
        this.attack = 12;
        this.speed = 1.2;
        this.attackRange = 35;
        this.detectionRange = 200;
        this.gold = 30;
        break;
      case 'boss':
        this.maxHp = 500;
        this.hp = 500;
        this.attack = 20;
        this.speed = 1.8;
        this.attackRange = 40;
        this.detectionRange = 300;
        this.gold = 100;
        this.size = ENEMY_SIZE * 1.5;
        break;
    }
  }

  update(player) {
    if (!this.isAlive) return;
    
    this.animationFrame++;
    
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }
    
    const dist = distance(this.x, this.y, player.x, player.y);
    
    // AI behavior
    if (dist < this.detectionRange) {
      // Move towards player
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const magnitude = Math.sqrt(dx * dx + dy * dy);
      
      if (magnitude > this.attackRange) {
        // Move towards player
        this.x += (dx / magnitude) * this.speed;
        this.y += (dy / magnitude) * this.speed;
        
        // Keep within bounds
        this.x = Math.max(ROOM_PADDING + this.size/2, 
                         Math.min(CANVAS_WIDTH - ROOM_PADDING - this.size/2, this.x));
        this.y = Math.max(ROOM_PADDING + this.size/2, 
                         Math.min(CANVAS_HEIGHT - ROOM_PADDING - this.size/2, this.y));
      } else if (this.attackCooldown === 0) {
        // Attack player
        this.attack(player);
        this.attackCooldown = 60; // 1 second cooldown
      }
    } else {
      // Idle movement
      this.moveTimer++;
      if (this.moveTimer > 120) {
        this.targetX = ROOM_PADDING + Math.random() * (CANVAS_WIDTH - 2 * ROOM_PADDING);
        this.targetY = ROOM_PADDING + Math.random() * (CANVAS_HEIGHT - 2 * ROOM_PADDING);
        this.moveTimer = 0;
      }
      
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const magnitude = Math.sqrt(dx * dx + dy * dy);
      
      if (magnitude > 5) {
        this.x += (dx / magnitude) * this.speed * 0.5;
        this.y += (dy / magnitude) * this.speed * 0.5;
      }
    }
  }

  attack(player) {
    const damage = player.takeDamage(this.attack);
    return damage;
  }

  takeDamage(damage) {
    this.hp = Math.max(0, this.hp - damage);
    if (this.hp <= 0) {
      this.isAlive = false;
      gameState.gold += this.gold;
      gameState.score += this.gold * 10;
    }
    return damage;
  }
}

export function spawnEnemies(roomNumber, isBossRoom = false) {
  const enemies = [];
  
  if (isBossRoom) {
    // Spawn boss
    const boss = new Enemy(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 'boss');
    enemies.push(boss);
  } else {
    // Spawn normal enemies based on room number
    const enemyCount = Math.min(3 + Math.floor(roomNumber / 2), 8);
    
    for (let i = 0; i < enemyCount; i++) {
      const x = ROOM_PADDING + 50 + Math.random() * (CANVAS_WIDTH - 2 * ROOM_PADDING - 100);
      const y = ROOM_PADDING + 50 + Math.random() * (CANVAS_HEIGHT - 2 * ROOM_PADDING - 100);
      
      let type = 'slime';
      if (roomNumber > 2) {
        const rand = Math.random();
        if (rand < 0.3) type = 'goblin';
        else if (rand < 0.5 && roomNumber > 3) type = 'orc';
      }
      
      enemies.push(new Enemy(x, y, type));
    }
  }
  
  return enemies;
}