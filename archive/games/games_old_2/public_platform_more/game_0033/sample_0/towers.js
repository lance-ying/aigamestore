// towers.js - Tower combat system
import { gameState, TILE_TYPES, TILE_SIZE } from './globals.js';

export class Projectile {
  constructor(x, y, target, damage, speed, color) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.damage = damage;
    this.speed = speed;
    this.color = color;
    this.active = true;
  }
  
  update() {
    if (!this.target || !gameState.enemies.includes(this.target)) {
      this.active = false;
      return;
    }
    
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < this.speed) {
      const isDead = this.target.takeDamage(this.damage);
      if (isDead) {
        gameState.coins += this.target.value;
        gameState.score += this.target.value * 10;
        
        const idx = gameState.enemies.indexOf(this.target);
        if (idx !== -1) gameState.enemies.splice(idx, 1);
        
        const entIdx = gameState.entities.indexOf(this.target);
        if (entIdx !== -1) gameState.entities.splice(entIdx, 1);
      }
      this.active = false;
    } else {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }
  
  render(p) {
    p.fill(...this.color);
    p.noStroke();
    p.ellipse(this.x, this.y, 6, 6);
  }
}

export function updateTowers(p, frameCount) {
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const tile = gameState.grid[y][x];
      
      if (tile.type === TILE_TYPES.TOWER || 
          tile.type === TILE_TYPES.ARCHER || 
          tile.type === TILE_TYPES.CANNON || 
          tile.type === TILE_TYPES.MAGIC) {
        
        const towerKey = `${x},${y}`;
        const tower = tile.data;
        
        if (!gameState.towerCooldowns[towerKey]) {
          gameState.towerCooldowns[towerKey] = 0;
        }
        
        if (gameState.towerCooldowns[towerKey] > 0) {
          gameState.towerCooldowns[towerKey]--;
          continue;
        }
        
        // Find target
        const towerCenterX = 50 + x * TILE_SIZE + TILE_SIZE / 2;
        const towerCenterY = 50 + y * TILE_SIZE + TILE_SIZE / 2;
        
        let closestEnemy = null;
        let closestDist = Infinity;
        
        for (let enemy of gameState.enemies) {
          const dx = enemy.x - towerCenterX;
          const dy = enemy.y - towerCenterY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < tower.range * TILE_SIZE && dist < closestDist) {
            closestDist = dist;
            closestEnemy = enemy;
          }
        }
        
        if (closestEnemy) {
          const projectile = new Projectile(
            towerCenterX,
            towerCenterY,
            closestEnemy,
            tower.damage,
            5,
            tower.color
          );
          gameState.projectiles.push(projectile);
          gameState.towerCooldowns[towerKey] = tower.cooldown;
        }
      }
    }
  }
  
  // Update projectiles
  for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
    const proj = gameState.projectiles[i];
    proj.update();
    if (!proj.active) {
      gameState.projectiles.splice(i, 1);
    }
  }
}