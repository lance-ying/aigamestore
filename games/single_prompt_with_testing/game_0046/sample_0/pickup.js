// pickup.js

export class Pickup {
  constructor(p, x, y, type) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.type = type; // 'warrior', 'mage', 'health'
    this.width = 24;
    this.height = 24;
    this.collected = false;
    this.bobOffset = 0;
    this.bobSpeed = 0.1;
  }
  
  update() {
    this.bobOffset += this.bobSpeed;
  }
  
  draw(p, cameraX) {
    if (this.collected) return;
    
    const screenX = this.x - cameraX;
    const bobY = this.y + this.p.sin(this.bobOffset) * 5;
    
    p.push();
    
    // Glow
    p.fill(255, 255, 200, 100);
    p.noStroke();
    p.circle(screenX + this.width / 2, bobY + this.height / 2, this.width + 10);
    
    // Item
    if (this.type === 'warrior') {
      // Red skull with helmet
      p.fill(200, 80, 80);
      p.circle(screenX + this.width / 2, bobY + this.height / 2, this.width);
      p.fill(100, 100, 120);
      p.arc(screenX + this.width / 2, bobY + this.height / 2 - 3, this.width, 16, p.PI, p.TWO_PI);
    } else if (this.type === 'mage') {
      // Blue skull with hat
      p.fill(100, 150, 255);
      p.circle(screenX + this.width / 2, bobY + this.height / 2, this.width);
      p.fill(50, 30, 80);
      p.triangle(screenX + 4, bobY + 12, screenX + 20, bobY + 12, screenX + 12, bobY - 2);
    } else if (this.type === 'health') {
      // Health potion
      p.fill(255, 100, 100);
      p.rect(screenX + 6, bobY + 4, 12, 16, 4);
      p.fill(255, 150, 150);
      p.rect(screenX + 8, bobY + 6, 8, 8);
    }
    
    p.pop();
  }
}