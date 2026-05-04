// player.js - Player class and related functions

import { 
  PLAYER_SIZE, PLAYER_SPEED, ATTACK_RANGE, 
  ROOM_PADDING, CANVAS_WIDTH, CANVAS_HEIGHT,
  gameState
} from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.maxHp = 100;
    this.hp = 100;
    this.attack = 10;
    this.defense = 5;
    this.size = PLAYER_SIZE;
    this.speed = PLAYER_SPEED;
    this.facingDirection = 0; // 0: down, 1: left, 2: up, 3: right
    this.animationFrame = 0;
    this.equipment = {
      weapon: null,
      armor: null,
      shield: null
    };
  }

  move(dx, dy) {
    const newX = this.x + dx * this.speed;
    const newY = this.y + dy * this.speed;
    
    // Keep within room bounds
    const minX = ROOM_PADDING + this.size / 2;
    const maxX = CANVAS_WIDTH - ROOM_PADDING - this.size / 2;
    const minY = ROOM_PADDING + this.size / 2;
    const maxY = CANVAS_HEIGHT - ROOM_PADDING - this.size / 2;
    
    this.x = Math.max(minX, Math.min(maxX, newX));
    this.y = Math.max(minY, Math.min(maxY, newY));
    
    // Update facing direction
    if (dx < 0) this.facingDirection = 1;
    else if (dx > 0) this.facingDirection = 3;
    else if (dy < 0) this.facingDirection = 2;
    else if (dy > 0) this.facingDirection = 0;
    
    this.animationFrame++;
  }

  takeDamage(damage) {
    const actualDamage = Math.max(1, damage - this.defense);
    this.hp = Math.max(0, this.hp - actualDamage);
    return actualDamage;
  }

  heal(amount) {
    const oldHp = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    return this.hp - oldHp;
  }

  equipItem(item) {
    if (item.type === 'weapon') {
      this.equipment.weapon = item;
      this.attack += item.attackBonus;
    } else if (item.type === 'armor') {
      this.equipment.armor = item;
      this.defense += item.defenseBonus;
      this.maxHp += item.hpBonus;
      this.hp += item.hpBonus;
    } else if (item.type === 'shield') {
      this.equipment.shield = item;
      this.defense += item.defenseBonus;
    }
  }

  getAttackDamage() {
    return this.attack;
  }

  isAlive() {
    return this.hp > 0;
  }

  getTotalStats() {
    return {
      hp: this.hp,
      maxHp: this.maxHp,
      attack: this.attack,
      defense: this.defense
    };
  }
}

export function createPlayer(x, y) {
  const player = new Player(x, y);
  gameState.player = player;
  return player;
}