// board.js
import { CANVAS_WIDTH, CANVAS_HEIGHT, BOARD_SPACES, SPACE_TYPES, gameState } from './globals.js';

export class Board {
  constructor() {
    this.setupBoard();
  }
  
  setupBoard() {
    // Create a winding path through the island
    const pathPoints = [];
    const margin = 60;
    const startX = 50;
    const startY = CANVAS_HEIGHT - 50;
    
    pathPoints.push({ x: startX, y: startY });
    
    // Create a snake-like path
    const rows = 5;
    const spacesPerRow = Math.ceil(BOARD_SPACES / rows);
    
    for (let i = 1; i <= BOARD_SPACES; i++) {
      const row = Math.floor((i - 1) / spacesPerRow);
      const col = (i - 1) % spacesPerRow;
      
      let x, y;
      if (row % 2 === 0) {
        // Even rows: left to right
        x = startX + col * ((CANVAS_WIDTH - 2 * margin) / (spacesPerRow - 1));
      } else {
        // Odd rows: right to left
        x = startX + (spacesPerRow - 1 - col) * ((CANVAS_WIDTH - 2 * margin) / (spacesPerRow - 1));
      }
      
      y = startY - row * 60;
      pathPoints.push({ x, y });
    }
    
    gameState.boardPath = pathPoints;
    
    // Assign space types
    const types = [];
    for (let i = 0; i <= BOARD_SPACES; i++) {
      if (i === 0) {
        types.push(SPACE_TYPES.NORMAL); // Start
      } else if (i === BOARD_SPACES) {
        types.push(SPACE_TYPES.FINISH);
      } else if (i % 7 === 0) {
        types.push(SPACE_TYPES.MINIGAME);
      } else if (i % 5 === 0) {
        types.push(SPACE_TYPES.SOUVENIR);
      } else if (i % 4 === 0) {
        types.push(SPACE_TYPES.PHOTO);
      } else if (i % 8 === 0) {
        types.push(SPACE_TYPES.BONUS);
      } else {
        types.push(SPACE_TYPES.NORMAL);
      }
    }
    gameState.spaceTypes = types;
  }
  
  draw(p) {
    // Draw island background
    this.drawIsland(p);
    
    // Draw path connections
    p.push();
    p.stroke(220, 200, 150);
    p.strokeWeight(3);
    p.noFill();
    for (let i = 0; i < gameState.boardPath.length - 1; i++) {
      const pos1 = gameState.boardPath[i];
      const pos2 = gameState.boardPath[i + 1];
      p.line(pos1.x, pos1.y, pos2.x, pos2.y);
    }
    p.pop();
    
    // Draw spaces
    for (let i = 0; i <= BOARD_SPACES; i++) {
      this.drawSpace(p, i);
    }
  }
  
  drawIsland(p) {
    // Sky gradient
    for (let y = 0; y < CANVAS_HEIGHT; y++) {
      const inter = y / CANVAS_HEIGHT;
      const c = p.lerpColor(p.color(135, 206, 235), p.color(255, 250, 205), inter);
      p.stroke(c);
      p.line(0, y, CANVAS_WIDTH, y);
    }
    
    // Ocean waves at bottom
    p.push();
    p.noStroke();
    p.fill(64, 164, 223, 100);
    for (let i = 0; i < 5; i++) {
      p.ellipse(CANVAS_WIDTH / 2, CANVAS_HEIGHT + 20 + i * 15, CANVAS_WIDTH * 1.5, 40);
    }
    p.pop();
    
    // Palm trees decoration
    this.drawPalmTree(p, 520, 350);
    this.drawPalmTree(p, 80, 100);
  }
  
  drawPalmTree(p, x, y) {
    p.push();
    // Trunk
    p.fill(139, 90, 43);
    p.noStroke();
    for (let i = 0; i < 5; i++) {
      p.ellipse(x, y - i * 8, 12, 10);
    }
    
    // Leaves
    p.fill(34, 139, 34);
    for (let a = 0; a < p.TWO_PI; a += p.TWO_PI / 6) {
      p.push();
      p.translate(x, y - 40);
      p.rotate(a);
      p.ellipse(0, -15, 8, 30);
      p.pop();
    }
    p.pop();
  }
  
  drawSpace(p, index) {
    const pos = gameState.boardPath[index];
    const type = gameState.spaceTypes[index];
    
    p.push();
    
    // Space background
    if (index === gameState.currentSpace) {
      p.fill(255, 215, 0);
      p.stroke(255, 165, 0);
    } else {
      p.fill(255, 248, 220);
      p.stroke(139, 69, 19);
    }
    p.strokeWeight(2);
    p.circle(pos.x, pos.y, 24);
    
    // Space icon
    p.noStroke();
    if (type === SPACE_TYPES.FINISH) {
      p.fill(255, 0, 0);
      p.triangle(pos.x, pos.y - 8, pos.x - 6, pos.y + 8, pos.x + 6, pos.y + 8);
    } else if (type === SPACE_TYPES.SOUVENIR) {
      p.fill(255, 105, 180);
      p.rect(pos.x - 4, pos.y - 4, 8, 8);
    } else if (type === SPACE_TYPES.PHOTO) {
      p.fill(70, 130, 180);
      p.rect(pos.x - 5, pos.y - 4, 10, 8);
      p.fill(255);
      p.circle(pos.x, pos.y, 4);
    } else if (type === SPACE_TYPES.MINIGAME) {
      p.fill(255, 140, 0);
      p.star(pos.x, pos.y, 4, 8, 5);
    } else if (type === SPACE_TYPES.BONUS) {
      p.fill(0, 255, 0);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(12);
      p.text("+", pos.x, pos.y);
    }
    
    p.pop();
  }
  
  getSpacePosition(index) {
    if (index < 0) return gameState.boardPath[0];
    if (index >= gameState.boardPath.length) return gameState.boardPath[gameState.boardPath.length - 1];
    return gameState.boardPath[index];
  }
}

// Helper function to draw star
if (typeof window.p5 !== 'undefined') {
  window.p5.prototype.star = function(x, y, radius1, radius2, npoints) {
    let angle = this.TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    this.beginShape();
    for (let a = -this.PI / 2; a < this.TWO_PI - this.PI / 2; a += angle) {
      let sx = x + this.cos(a) * radius2;
      let sy = y + this.sin(a) * radius2;
      this.vertex(sx, sy);
      sx = x + this.cos(a + halfAngle) * radius1;
      sy = y + this.sin(a + halfAngle) * radius1;
      this.vertex(sx, sy);
    }
    this.endShape(this.CLOSE);
  };
}