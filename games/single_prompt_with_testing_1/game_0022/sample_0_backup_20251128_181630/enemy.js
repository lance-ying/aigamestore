// enemy.js
import { 
  ENEMY_SPEED, 
  ENEMY_ATTACK_RANGE, 
  ENEMY_ATTACK_DAMAGE,
  ENEMY_HEALTH,
  ENEMY_DETECTION_RANGE
} from './globals.js';

export class Enemy {
  constructor(x, y, p) {
    this.x = x;
    this.y = y;
    this.health = ENEMY_HEALTH;
    this.angle = p.random(0, Math.PI * 2);
    this.state = 'idle'; // idle, chase, attack
    this.attackCooldown = 0;
    this.dead = false;
    this.wanderTimer = 0;
    this.wanderAngle = 0;
  }
  
  update(player, p) {
    if (this.dead) return;
    
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // State machine
    if (dist < ENEMY_DETECTION_RANGE) {
      if (dist < ENEMY_ATTACK_RANGE) {
        this.state = 'attack';
      } else {
        this.state = 'chase';
      }
    } else {
      this.state = 'idle';
    }
    
    // Behavior
    if (this.state === 'chase') {
      this.angle = Math.atan2(dy, dx);
      this.x += Math.cos(this.angle) * ENEMY_SPEED;
      this.y += Math.sin(this.angle) * ENEMY_SPEED;
    } else if (this.state === 'idle') {
      // Wander behavior
      this.wanderTimer--;
      if (this.wanderTimer <= 0) {
        this.wanderAngle = p.random(0, Math.PI * 2);
        this.wanderTimer = Math.floor(p.random(60, 120));
      }
      this.x += Math.cos(this.wanderAngle) * ENEMY_SPEED * 0.3;
      this.y += Math.sin(this.wanderAngle) * ENEMY_SPEED * 0.3;
    } else if (this.state === 'attack') {
      if (this.attackCooldown === 0) {
        player.takeDamage(ENEMY_ATTACK_DAMAGE);
        this.attackCooldown = 60;
      }
    }
    
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }
  }
  
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.dead = true;
    }
  }
  
  checkHit(attackX, attackY, range) {
    const dx = this.x - attackX;
    const dy = this.y - attackY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < range;
  }
}