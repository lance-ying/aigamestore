// player.js - Player entity and logic

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.gameX = x;
    this.gameY = y;
    this.width = 20;
    this.height = 20;
  }
  
  update() {
    // Player position updated through game logic
  }
  
  render(p) {
    p.push();
    p.fill(100, 150, 255);
    p.stroke(255);
    p.strokeWeight(2);
    p.rect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
    p.pop();
  }
}