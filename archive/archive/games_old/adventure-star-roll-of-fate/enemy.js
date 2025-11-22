// enemy.js - Enemy entity with turn-based movement AI

import { GRID_CONFIG } from './globals.js';

export class Enemy {
  constructor(gridX, gridY, level, type = "NORMAL") {
    this.gridX = gridX;
    this.gridY = gridY;
    this.level = level;
    this.type = type;
    this.direction = Math.floor(Math.random() * 4); // 0=left, 1=right, 2=up, 3=down
    this.active = true;
    
    // Set stats based on type
    this.setStats();
  }

  setStats() {
    switch (this.type) {
      case "FAST":
        this.damage = 10 + this.level * 2;
        this.hp = 1;
        this.maxHp = 1;
        this.moveChance = 0.8; // Moves 80% of turns
        this.color = [255, 150, 50];
        this.name = "Fast";
        break;
      case "TANK":
        this.damage = 20 + this.level * 4;
        this.hp = 4;
        this.maxHp = 4;
        this.moveChance = 0.3; // Moves 30% of turns
        this.color = [100, 255, 100];
        this.name = "Tank";
        break;
      case "RANGED":
        this.damage = 12 + this.level * 3;
        this.hp = 2;
        this.maxHp = 2;
        this.moveChance = 0.4; // Moves 40% of turns
        this.color = [150, 100, 255];
        this.name = "Ranged";
        this.shootCooldown = 0;
        this.shootDelay = 5; // Shoots every 5 turns
        break;
      default: // NORMAL
        this.damage = 15 + this.level * 3;
        this.hp = 2;
        this.maxHp = 2;
        this.moveChance = 0.5; // Moves 50% of turns
        this.color = [255, 50, 50];
        this.name = "Normal";
        break;
    }
  }

  getScreenX() {
    return GRID_CONFIG.offsetX + this.gridX * GRID_CONFIG.tileSize + GRID_CONFIG.tileSize / 2;
  }

  getScreenY() {
    return GRID_CONFIG.offsetY + this.gridY * GRID_CONFIG.tileSize + GRID_CONFIG.tileSize / 2;
  }

  canMoveTo(gridX, gridY, map) {
    if (gridX < 0 || gridX >= map.width || gridY < 0 || gridY >= map.height) {
      return false;
    }
    const tile = map.tiles[gridY][gridX];
    return tile.type !== 'WALL';
  }

  // Turn-based movement - only called when player moves
  takeTurn(map, player, projectiles) {
    if (!this.active) return;

    // Ranged enemies can shoot
    if (this.type === "RANGED") {
      this.shootCooldown--;
      if (this.shootCooldown <= 0) {
        this.shootAtPlayer(player, projectiles, map);
        this.shootCooldown = this.shootDelay;
      }
    }

    // Move based on moveChance
    if (Math.random() > this.moveChance) {
      return; // Skip this turn
    }

    // Simple AI: move toward player with some randomness
    const dx = player.gridX - this.gridX;
    const dy = player.gridY - this.gridY;
    const distToPlayer = Math.abs(dx) + Math.abs(dy);

    // 70% chance to move toward player, 30% random
    if (Math.random() < 0.7 && distToPlayer > 0) {
      // Move toward player
      if (Math.abs(dx) > Math.abs(dy)) {
        this.direction = dx > 0 ? 1 : 0; // right or left
      } else {
        this.direction = dy > 0 ? 3 : 2; // down or up
      }
    } else {
      // Random movement
      this.direction = Math.floor(Math.random() * 4);
    }

    this.tryMove(map);

    // Check if adjacent to player (not on same tile)
    const newDx = Math.abs(player.gridX - this.gridX);
    const newDy = Math.abs(player.gridY - this.gridY);
    const isAdjacent = (newDx === 1 && newDy === 0) || (newDx === 0 && newDy === 1);
    
    if (isAdjacent) {
      this.attackPlayer(player);
    }
  }

  shootAtPlayer(player, projectiles, map) {
    // Determine direction to player
    const dx = player.gridX - this.gridX;
    const dy = player.gridY - this.gridY;
    
    let direction;
    if (Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? 1 : 0; // right or left
    } else {
      direction = dy > 0 ? 3 : 2; // down or up
    }

    // Create enemy projectile
    const projectile = new EnemyProjectile(this.gridX, this.gridY, direction, this.damage / 2);
    projectiles.push(projectile);
  }

  tryMove(map) {
    let newX = this.gridX;
    let newY = this.gridY;

    switch (this.direction) {
      case 0: newX--; break; // left
      case 1: newX++; break; // right
      case 2: newY--; break; // up
      case 3: newY++; break; // down
    }

    if (this.canMoveTo(newX, newY, map)) {
      this.gridX = newX;
      this.gridY = newY;
      return true;
    }
    return false;
  }

  attackPlayer(player) {
    if (this.active) {
      player.takeDamage(this.damage);
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.active = false;
    }
  }

  render(p) {
    if (!this.active) return;

    const x = this.getScreenX();
    const y = this.getScreenY();
    const size = GRID_CONFIG.tileSize * 0.65;

    p.push();
    
    // Enemy body - pulsing with type color
    const pulse = Math.sin(p.frameCount * 0.1) * 0.15 + 0.85;
    p.fill(this.color[0] * pulse, this.color[1] * pulse, this.color[2] * pulse);
    p.stroke(this.color[0] * 0.6, this.color[1] * 0.6, this.color[2] * 0.6);
    p.strokeWeight(2);
    
    // Different shapes for different types
    if (this.type === "FAST") {
      p.triangle(x, y - size * 0.5, x - size * 0.4, y + size * 0.4, x + size * 0.4, y + size * 0.4);
    } else if (this.type === "TANK") {
      p.rectMode(p.CENTER);
      p.rect(x, y, size, size);
    } else {
      p.ellipse(x, y, size, size);
    }
    
    // Eyes
    p.fill(255, 255, 0);
    p.noStroke();
    p.ellipse(x - size * 0.15, y - size * 0.1, size * 0.2, size * 0.2);
    p.ellipse(x + size * 0.15, y - size * 0.1, size * 0.2, size * 0.2);
    
    // Pupils
    p.fill(0);
    p.ellipse(x - size * 0.15, y - size * 0.1, size * 0.1, size * 0.1);
    p.ellipse(x + size * 0.15, y - size * 0.1, size * 0.1, size * 0.1);
    
    // Health bar
    const barWidth = size * 1.2;
    const barHeight = 5;
    const barX = x - barWidth / 2;
    const barY = y - size * 0.6 - 8;
    
    // Background
    p.fill(60, 60, 60);
    p.noStroke();
    p.rect(barX, barY, barWidth, barHeight);
    
    // Health fill
    const hpPercent = this.hp / this.maxHp;
    const hpColor = hpPercent > 0.5 ? [100, 255, 100] : hpPercent > 0.25 ? [255, 200, 50] : [255, 50, 50];
    p.fill(...hpColor);
    p.rect(barX, barY, barWidth * hpPercent, barHeight);
    
    // Border
    p.noFill();
    p.stroke(200, 200, 200);
    p.strokeWeight(1);
    p.rect(barX, barY, barWidth, barHeight);
    
    p.pop();
  }
}

export class EnemyProjectile {
  constructor(gridX, gridY, direction, damage) {
    this.x = gridX;
    this.y = gridY;
    this.direction = direction;
    this.damage = damage;
    this.active = true;
    this.moveDelay = 0;
    this.moveSpeed = 4;
    this.isEnemyProjectile = true;
  }

  update(map, player) {
    if (!this.active) return;

    this.moveDelay++;
    if (this.moveDelay >= this.moveSpeed) {
      this.moveDelay = 0;
      
      // Move in direction
      let newX = this.x;
      let newY = this.y;
      
      switch (this.direction) {
        case 0: newX--; break; // left
        case 1: newX++; break; // right
        case 2: newY--; break; // up
        case 3: newY++; break; // down
      }

      // Check if hit wall or out of bounds
      if (newX < 0 || newX >= map.width || newY < 0 || newY >= map.height) {
        this.active = false;
        return;
      }

      const tile = map.tiles[newY][newX];
      if (tile.type === 'WALL') {
        this.active = false;
        return;
      }

      this.x = newX;
      this.y = newY;

      // Check if hit player
      if (player && player.gridX === this.x && player.gridY === this.y) {
        player.takeDamage(this.damage);
        this.active = false;
      }
    }
  }

  getScreenX() {
    return GRID_CONFIG.offsetX + this.x * GRID_CONFIG.tileSize + GRID_CONFIG.tileSize / 2;
  }

  getScreenY() {
    return GRID_CONFIG.offsetY + this.y * GRID_CONFIG.tileSize + GRID_CONFIG.tileSize / 2;
  }

  render(p) {
    if (!this.active) return;

    const x = this.getScreenX();
    const y = this.getScreenY();

    p.push();
    p.fill(255, 100, 100);
    p.stroke(200, 0, 0);
    p.strokeWeight(2);
    p.ellipse(x, y, 10, 10);
    p.pop();
  }
}

// Factory function to create random enemy type
export function createRandomEnemy(gridX, gridY, level) {
  const types = ["NORMAL", "FAST", "TANK", "RANGED"];
  const rand = Math.random();
  let type;
  
  if (rand < 0.4) {
    type = "NORMAL";
  } else if (rand < 0.6) {
    type = "FAST";
  } else if (rand < 0.8) {
    type = "TANK";
  } else {
    type = "RANGED";
  }
  
  return new Enemy(gridX, gridY, level, type);
}