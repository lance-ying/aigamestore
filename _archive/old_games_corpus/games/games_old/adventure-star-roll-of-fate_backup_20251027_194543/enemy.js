// enemy.js - Enemy entity with turn-based movement AI

import { GRID_CONFIG } from './globals.js';

export class Enemy {
  constructor(gridX, gridY, level) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.level = level;
    this.direction = Math.floor(Math.random() * 4); // 0=left, 1=right, 2=up, 3=down
    this.damage = 15 + level * 3; // Damage increases with level
    this.active = true;
    this.hp = 2; // Enemies can take 2 hits
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
  takeTurn(map, player) {
    if (!this.active) return;

    // 50% chance to move each turn (makes enemies slower)
    if (Math.random() > 0.5) {
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

    // Check collision with player
    if (this.gridX === player.gridX && this.gridY === player.gridY) {
      this.collideWithPlayer(player);
    }
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

  collideWithPlayer(player) {
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
    
    // Enemy body - pulsing red
    const pulse = Math.sin(p.frameCount * 0.1) * 0.15 + 0.85;
    p.fill(255 * pulse, 50, 50);
    p.stroke(150, 0, 0);
    p.strokeWeight(2);
    p.ellipse(x, y, size, size);
    
    // Eyes
    p.fill(255, 255, 0);
    p.noStroke();
    p.ellipse(x - size * 0.15, y - size * 0.1, size * 0.2, size * 0.2);
    p.ellipse(x + size * 0.15, y - size * 0.1, size * 0.2, size * 0.2);
    
    // Pupils
    p.fill(0);
    p.ellipse(x - size * 0.15, y - size * 0.1, size * 0.1, size * 0.1);
    p.ellipse(x + size * 0.15, y - size * 0.1, size * 0.1, size * 0.1);
    
    // HP indicator
    if (this.hp < 2) {
      p.fill(255, 255, 255);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(10);
      p.text(`HP:${this.hp}`, x, y + size * 0.5 + 8);
    }
    
    p.pop();
  }
}