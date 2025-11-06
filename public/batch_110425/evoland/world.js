// world.js - World generation and rendering
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, CHEST_TYPES } from './globals.js';
import { Chest } from './chest.js';
import { Enemy, Boss } from './enemies.js';

export class World {
  constructor(p) {
    this.p = p;
    this.tiles = [];
    this.decorations = [];
    this.generateWorld();
  }
  
  generateWorld() {
    // Generate basic tile grid for visual variety
    const tileSize = 32;
    for (let y = 0; y < gameState.worldHeight / tileSize; y++) {
      for (let x = 0; x < gameState.worldWidth / tileSize; x++) {
        this.tiles.push({
          x: x * tileSize,
          y: y * tileSize,
          shade: this.p.random(0.9, 1.1)
        });
      }
    }
    
    // Place evolution chests in order
    gameState.chests.push(new Chest(this.p, 250, 150, CHEST_TYPES.COLOR));
    gameState.chests.push(new Chest(this.p, 450, 200, CHEST_TYPES.SCROLLING));
    gameState.chests.push(new Chest(this.p, 650, 400, CHEST_TYPES.COMBAT));
    
    // Place treasure chests
    gameState.chests.push(new Chest(this.p, 200, 400, CHEST_TYPES.TREASURE));
    gameState.chests.push(new Chest(this.p, 550, 500, CHEST_TYPES.TREASURE));
    
    // Spawn initial enemies
    this.spawnEnemies();
  }
  
  spawnEnemies() {
    // Early enemies
    gameState.enemies.push(new Enemy(this.p, 300, 200));
    gameState.enemies.push(new Enemy(this.p, 350, 300));
    
    // Mid game enemies
    gameState.enemies.push(new Enemy(this.p, 500, 350));
    gameState.enemies.push(new Enemy(this.p, 550, 450));
    gameState.enemies.push(new Enemy(this.p, 600, 300));
    
    // Boss at the end
    gameState.enemies.push(new Boss(this.p, 700, 450));
  }
  
  render() {
    this.p.push();
    
    // Background
    if (gameState.hasColor) {
      this.p.background(60, 80, 50); // Green-ish
    } else {
      this.p.background(100); // Gray
    }
    
    if (gameState.hasScrolling) {
      this.p.translate(-gameState.cameraX, -gameState.cameraY);
    }
    
    // Draw tiles with slight variation
    this.p.noStroke();
    for (let tile of this.tiles) {
      const isVisible = !gameState.hasScrolling || (
        tile.x + 32 > gameState.cameraX && 
        tile.x < gameState.cameraX + CANVAS_WIDTH &&
        tile.y + 32 > gameState.cameraY && 
        tile.y < gameState.cameraY + CANVAS_HEIGHT
      );
      
      if (isVisible) {
        if (gameState.hasColor) {
          const c = 60 * tile.shade;
          const g = 80 * tile.shade;
          const b = 50 * tile.shade;
          this.p.fill(c, g, b);
        } else {
          this.p.fill(100 * tile.shade);
        }
        this.p.rect(tile.x, tile.y, 32, 32);
      }
    }
    
    // Draw world bounds
    this.p.noFill();
    this.p.stroke(gameState.hasColor ? [40, 60, 30] : [80]);
    this.p.strokeWeight(4);
    this.p.rect(2, 2, gameState.worldWidth - 4, gameState.worldHeight - 4);
    
    this.p.pop();
  }
}