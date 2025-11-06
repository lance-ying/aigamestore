// player.js - Player entity

import { gameState, GRID_CONFIG } from './globals.js';
import { triggerEvent } from './events.js';

export class Player {
  constructor(gridX, gridY, maxHP) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.maxHP = maxHP;
    this.hp = maxHP;
    this.damageFlashTimer = 0;
    this.moveDelay = 0;
    this.moveDelayMax = 8; // frames between moves
  }

  getScreenX() {
    return GRID_CONFIG.offsetX + this.gridX * GRID_CONFIG.tileSize + GRID_CONFIG.tileSize / 2;
  }

  getScreenY() {
    return GRID_CONFIG.offsetY + this.gridY * GRID_CONFIG.tileSize + GRID_CONFIG.tileSize / 2;
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp < 0) this.hp = 0;
    this.damageFlashTimer = 15; // flash for 15 frames
  }

  heal(amount) {
    this.hp += amount;
    if (this.hp > this.maxHP) this.hp = this.maxHP;
  }

  canMoveTo(gridX, gridY, map) {
    if (gridX < 0 || gridX >= map.width || gridY < 0 || gridY >= map.height) {
      return false;
    }
    const tile = map.tiles[gridY][gridX];
    return tile.type !== 'WALL';
  }

  moveTo(gridX, gridY, map) {
    if (this.canMoveTo(gridX, gridY, map)) {
      this.gridX = gridX;
      this.gridY = gridY;
      
      const tile = map.tiles[gridY][gridX];
      
      // Auto-collect treasures (stars) when walking over them
      if (tile.type === 'EVENT_TREASURE' && !tile.interacted) {
        // Use a mock p5 object with random function for event triggering
        const mockP5 = {
          random: () => Math.random()
        };
        const message = triggerEvent(tile, gameState.currentLevel, mockP5);
        gameState.eventMessage = message;
        gameState.eventMessageTimer = gameState.eventMessageDuration;
        gameState.needsInteraction = false;
      }
      
      if (!tile.visited && tile.type === 'EMPTY') {
        tile.visited = true;
        gameState.score += 5; // points for exploring
      }
    }
  }

  update(p) {
    if (this.damageFlashTimer > 0) {
      this.damageFlashTimer--;
    }
    if (this.moveDelay > 0) {
      this.moveDelay--;
    }
  }

  render(p) {
    const x = this.getScreenX();
    const y = this.getScreenY();
    const size = GRID_CONFIG.tileSize * 0.7;

    // Draw player
    p.push();
    if (this.damageFlashTimer > 0 && this.damageFlashTimer % 6 < 3) {
      p.fill(255, 100, 100);
    } else {
      p.fill(50, 150, 255);
    }
    p.stroke(0);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(x, y, size, size, 5);
    
    // Draw "A" for Adventure
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(size * 0.6);
    p.text('A', x, y);
    p.pop();
  }
}