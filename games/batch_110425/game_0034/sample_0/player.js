// player.js - Player entity

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 20;
    this.color = [255, 100, 100];
    this.targetX = x;
    this.targetY = y;
  }
  
  update() {
    // Smooth movement
    const speed = 0.15;
    this.x += (this.targetX - this.x) * speed;
    this.y += (this.targetY - this.y) * speed;
  }
  
  moveTo(x, y) {
    this.targetX = x;
    this.targetY = y;
  }
  
  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Shadow
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.ellipse(2, 2, this.size * 1.2, this.size * 0.5);
    
    // Body
    p.fill(...this.color);
    p.stroke(50);
    p.strokeWeight(2);
    p.circle(0, 0, this.size);
    
    // Face
    p.fill(255);
    p.noStroke();
    p.circle(-4, -3, 4);
    p.circle(4, -3, 4);
    
    p.fill(50);
    p.circle(-4, -3, 2);
    p.circle(4, -3, 2);
    
    // Smile
    p.noFill();
    p.stroke(50);
    p.strokeWeight(1.5);
    p.arc(0, 2, 10, 6, 0, Math.PI);
    
    p.pop();
  }
}