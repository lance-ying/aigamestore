// player.js - Player entity (cursor controller)

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.gridX = 0;
    this.gridY = 0;
  }
  
  update(p, gameState) {
    // Player position represents the selected grid cell
    // Update based on keyboard input in HUMAN mode
    if (gameState.controlMode === 'HUMAN') {
      // Arrow key navigation handled in input.js
    }
  }
  
  render(p) {
    // Draw cursor indicator at selected position
    p.push();
    p.stroke(255, 255, 0);
    p.strokeWeight(3);
    p.noFill();
    p.rect(this.x, this.y, 60, 60);
    p.pop();
  }
}