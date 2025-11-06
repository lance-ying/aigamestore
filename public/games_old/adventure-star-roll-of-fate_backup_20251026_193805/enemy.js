// enemy.js - Enemy entity with movement AI

import { GRID_CONFIG } from './globals.js';

export class Enemy {
  constructor(gridX, gridY, level) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.level = level;
    this.moveDelay = 0;
    this.moveDelayMax = 15 + Math.floor(Math.random() * 10); // Random speed
    this.direction = Math.floor(Math.random() * 4); // 0=left, 1=right, 2=up, 3=down
    this.changeDirectionTimer = 0;
    this.damage = 15 + level * 3; // Damage increases with level
    this.active = true;
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

  update(map, player) {
    if (!this.active) return;

    this.moveDelay--;
    this.changeDirectionTimer--;

    if (this.moveDelay <= 0) {
      // Change direction occasionally or when hitting wall
      if (this.changeDirectionTimer <= 0 || !this.tryMove(map)) {
        this.direction = Math.floor(Math.random() * 4);
        this.changeDirectionTimer = 30 + Math.floor(Math.random() * 60);
      }

      this.tryMove(map);
      this.moveDelay = this.moveDelayMax;
    }

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
      // Knock back the enemy to prevent continuous damage
      this.knockBack();
    }
  }

  knockBack() {
    // Move enemy in opposite direction
    switch (this.direction) {
      case 0: this.direction = 1; break;
      case 1: this.direction = 0; break;
      case 2: this.direction = 3; break;
      case 3: this.direction = 2; break;
    }
    this.moveDelay = this.moveDelayMax * 2; // Add delay after collision
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
    
    p.pop();
  }
}