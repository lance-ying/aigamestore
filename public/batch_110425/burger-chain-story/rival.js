// rival.js - Rival shop entity

export class Rival {
  constructor(p, name, area, strength) {
    this.p = p;
    this.name = name;
    this.area = area;
    this.strength = strength;
    this.reputation = 50 + strength * 10;
    this.active = true;
  }
  
  update(playerReputation) {
    // Rival shops slowly gain or lose reputation
    if (this.active) {
      const reputationDiff = playerReputation - this.reputation;
      this.reputation += (reputationDiff > 0 ? -0.1 : 0.1) * this.strength;
      
      // Defeated if player reputation is much higher
      if (playerReputation > this.reputation + 30) {
        this.active = false;
      }
    }
  }
  
  render(p, x, y, index) {
    p.push();
    p.translate(x, y);
    
    // Draw rival shop
    const alpha = this.active ? 255 : 100;
    p.fill(255, 100, 100, alpha);
    p.rect(-20, -15, 40, 30, 5);
    
    p.fill(255, alpha);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text(this.name, 0, -5);
    
    p.textSize(8);
    p.text(`Rep: ${Math.floor(this.reputation)}`, 0, 5);
    
    if (!this.active) {
      p.stroke(255, 0, 0);
      p.strokeWeight(3);
      p.line(-15, -10, 15, 10);
      p.line(15, -10, -15, 10);
    }
    
    p.pop();
  }
}