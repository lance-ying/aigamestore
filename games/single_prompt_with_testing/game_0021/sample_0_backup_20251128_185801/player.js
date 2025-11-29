// player.js
import { TILE_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, DIRECTIONS } from './globals.js';

export class Player {
  constructor(gridX, gridY) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.screenX = GRID_OFFSET_X + gridX * TILE_SIZE;
    this.screenY = GRID_OFFSET_Y + gridY * TILE_SIZE;
    this.direction = DIRECTIONS.DOWN;
    this.animFrame = 0;
    this.health = 3;
  }

  getScreenX() {
    return GRID_OFFSET_X + this.gridX * TILE_SIZE;
  }

  getScreenY() {
    return GRID_OFFSET_Y + this.gridY * TILE_SIZE;
  }

  setGridPosition(x, y) {
    this.gridX = x;
    this.gridY = y;
    this.screenX = this.getScreenX();
    this.screenY = this.getScreenY();
  }

  setDirection(dir) {
    this.direction = dir;
  }

  render(p) {
    const x = this.getScreenX();
    const y = this.getScreenY();
    
    // Draw player character (sharply dressed demon hunter)
    p.push();
    p.translate(x + TILE_SIZE / 2, y + TILE_SIZE / 2);
    
    // Body (suit)
    p.fill(40, 40, 40);
    p.rect(-10, -5, 20, 25);
    
    // Head
    p.fill(255, 220, 180);
    p.ellipse(0, -15, 18, 18);
    
    // Hair
    p.fill(80, 50, 30);
    p.arc(0, -15, 18, 18, p.PI, 0);
    
    // Eyes
    p.fill(0);
    p.ellipse(-4, -15, 3, 3);
    p.ellipse(4, -15, 3, 3);
    
    // Tie
    p.fill(200, 50, 50);
    p.triangle(-3, -5, 3, -5, 0, 5);
    
    // Arms
    p.stroke(40, 40, 40);
    p.strokeWeight(4);
    p.line(-10, 0, -15, 10);
    p.line(10, 0, 15, 10);
    p.noStroke();
    
    // Legs
    p.fill(40, 40, 40);
    p.rect(-8, 20, 6, 10);
    p.rect(2, 20, 6, 10);
    
    // Direction indicator
    p.fill(255, 100, 100);
    if (this.direction === DIRECTIONS.UP) {
      p.triangle(0, -25, -5, -20, 5, -20);
    } else if (this.direction === DIRECTIONS.DOWN) {
      p.triangle(0, 35, -5, 30, 5, 30);
    } else if (this.direction === DIRECTIONS.LEFT) {
      p.triangle(-18, 10, -13, 5, -13, 15);
    } else if (this.direction === DIRECTIONS.RIGHT) {
      p.triangle(18, 10, 13, 5, 13, 15);
    }
    
    p.pop();
  }
}