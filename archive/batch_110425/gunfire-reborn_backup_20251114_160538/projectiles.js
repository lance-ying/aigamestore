// projectiles.js - Projectile system
import { gameState, ROOM_WIDTH, ROOM_HEIGHT } from './globals.js';
import { distance } from './utils.js';

export class Projectile {
  constructor(x, y, vx, vy, damage, radius, color, isEnemy = false, element = null) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.radius = radius;
    this.color = color;
    this.isEnemy = isEnemy;
    this.element = element;
    this.alive = true;
    this.age = 0;
    this.maxAge = 180; // 3 seconds
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.age++;
    
    // Remove if out of bounds or too old
    if (this.x < 0 || this.x > ROOM_WIDTH || this.y < 0 || this.y > ROOM_HEIGHT || this.age > this.maxAge) {
      this.alive = false;
    }
    
    // Check collisions
    if (this.isEnemy) {
      // Enemy projectile - check player collision
      const player = gameState.player;
      if (player && distance(this.x, this.y, player.x, player.y) < this.radius + player.radius) {
        player.takeDamage(this.damage);
        this.alive = false;
      }
    } else {
      // Player projectile - check enemy collisions
      for (const enemy of gameState.enemies) {
        if (!enemy.alive) continue;
        
        if (distance(this.x, this.y, enemy.x, enemy.y) < this.radius + enemy.radius) {
          const killed = enemy.takeDamage(this.damage);
          this.alive = false;
          
          if (killed) {
            handleEnemyKilled(enemy);
          }
          break;
        }
      }
    }
  }
  
  draw(p) {
    if (!this.alive) return;
    
    const screenPos = this.getScreenPosition();
    
    p.push();
    
    // Trail effect
    if (this.element === "fire") {
      p.noStroke();
      p.fill(...this.color, 100);
      p.circle(screenPos.x - this.vx * 2, screenPos.y - this.vy * 2, this.radius * 2);
    }
    
    // Main projectile
    p.fill(...this.color);
    p.noStroke();
    p.circle(screenPos.x, screenPos.y, this.radius * 2);
    
    // Highlight
    p.fill(255, 255, 255, 150);
    p.circle(screenPos.x - this.radius / 3, screenPos.y - this.radius / 3, this.radius);
    
    p.pop();
  }
  
  getScreenPosition() {
    return {
      x: this.x - gameState.cameraX + 300,
      y: this.y - gameState.cameraY + 200
    };
  }
}

function handleEnemyKilled(enemy) {
  gameState.enemiesKilled++;
  gameState.score += enemy.expDrop;
  
  // Drop items
  const items = [];
  
  // Always drop gold
  items.push({ type: "gold", value: enemy.goldDrop });
  
  // Chance for weapon drop
  if (Math.random() < 0.15) {
    items.push({ type: "weapon" });
  }
  
  // Chance for scroll drop
  if (Math.random() < 0.2) {
    items.push({ type: "scroll" });
  }
  
  // Chance for health drop
  if (Math.random() < 0.1) {
    items.push({ type: "health" });
  }
  
  // Create item entities
  const { createGoldDrop, createWeaponDrop, createScrollDrop, createHealthDrop } = require('./items.js');
  
  for (let i = 0; i < items.length; i++) {
    const angle = (Math.PI * 2 * i) / items.length;
    const dist = 30;
    const x = enemy.x + Math.cos(angle) * dist;
    const y = enemy.y + Math.sin(angle) * dist;
    
    let item;
    switch (items[i].type) {
      case "gold":
        item = createGoldDrop(x, y, items[i].value);
        break;
      case "weapon":
        item = createWeaponDrop(x, y);
        break;
      case "scroll":
        item = createScrollDrop(x, y);
        break;
      case "health":
        item = createHealthDrop(x, y);
        break;
    }
    
    if (item) {
      gameState.items.push(item);
    }
  }
  
  // Give exp to player
  if (gameState.player) {
    gameState.player.addExp(enemy.expDrop);
  }
}