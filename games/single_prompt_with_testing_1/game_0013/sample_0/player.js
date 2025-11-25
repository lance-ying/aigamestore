// player.js - Player class

export class Player {
  constructor(id, x, y, color, isAI = false) {
    this.id = id;
    this.boardX = x; // Grid position
    this.boardY = y;
    this.screenX = 0; // Pixel position (for animation)
    this.screenY = 0;
    this.color = color;
    this.isAI = isAI;
    this.isActive = true; // false when eliminated
    this.entryDirection = -1; // Direction entered current cell
    this.aiPersonality = isAI ? Math.floor(Math.random() * 3) : 0; // 0=aggressive, 1=defensive, 2=random
  }
  
  draw(p, cellSize, offsetX, offsetY) {
    if (!this.isActive) return;
    
    p.push();
    p.fill(...this.color);
    p.stroke(0);
    p.strokeWeight(2);
    const px = offsetX + this.screenX * cellSize + cellSize / 2;
    const py = offsetY + this.screenY * cellSize + cellSize / 2;
    p.circle(px, py, cellSize * 0.4);
    p.pop();
  }
  
  updateScreenPosition() {
    this.screenX = this.boardX;
    this.screenY = this.boardY;
  }
}