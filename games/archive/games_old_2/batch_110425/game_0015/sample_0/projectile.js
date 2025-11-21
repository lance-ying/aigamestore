// projectile.js - Projectile system for skills

import { PROJECTILE_SIZE, PROJECTILE_SPEED } from './globals.js';

export class Projectile {
  constructor(x, y, direction, damage, owner = 'player') {
    this.x = x;
    this.y = y;
    this.direction = direction; // angle in radians
    this.damage = damage;
    this.owner = owner;
    this.size = PROJECTILE_SIZE;
    this.speed = PROJECTILE_SPEED;
    this.active = true;
    this.lifetime = 180; // 3 seconds at 60 FPS
  }

  update() {
    this.x += Math.cos(this.direction) * this.speed;
    this.y += Math.sin(this.direction) * this.speed;
    this.lifetime--;
    
    if (this.lifetime <= 0) {
      this.active = false;
    }
    
    // Check if out of bounds
    if (this.x < 0 || this.x > 600 || this.y < 0 || this.y > 400) {
      this.active = false;
    }
  }
}

export function createFireball(player) {
  // Calculate direction based on player facing
  let angle = 0;
  switch(player.facingDirection) {
    case 0: angle = Math.PI / 2; break; // down
    case 1: angle = Math.PI; break; // left
    case 2: angle = -Math.PI / 2; break; // up
    case 3: angle = 0; break; // right
  }
  
  const damage = player.getAttackDamage() * 2;
  return new Projectile(player.x, player.y, angle, damage, 'player');
}