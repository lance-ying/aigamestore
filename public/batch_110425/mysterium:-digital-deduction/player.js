// player.js - Player entity

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 30;
    this.color = [100, 150, 255];
  }
  
  update() {
    // Player is static in this game
  }
  
  draw(p) {
    p.push();
    
    // Draw psychic character
    p.fill(...this.color);
    p.noStroke();
    p.circle(this.x, this.y - 10, 20); // Head
    
    // Body
    p.fill(80, 100, 180);
    p.rect(this.x - 10, this.y, 20, 25, 3);
    
    // Eyes
    p.fill(255);
    p.circle(this.x - 5, this.y - 12, 4);
    p.circle(this.x + 5, this.y - 12, 4);
    
    p.fill(0);
    p.circle(this.x - 5, this.y - 12, 2);
    p.circle(this.x + 5, this.y - 12, 2);
    
    // Mystical aura
    p.noFill();
    p.stroke(150, 100, 255, 100);
    p.strokeWeight(2);
    p.circle(this.x, this.y + 5, 40 + p.sin(p.frameCount * 0.1) * 5);
    
    p.pop();
  }
}