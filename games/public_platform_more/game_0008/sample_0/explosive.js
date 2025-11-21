// explosive.js - Explosive barrels

export class ExplosiveBarrel {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.active = true;
    this.radius = 15;
    this.blastRadius = 60;
    this.pulsePhase = 0;
  }
  
  update() {
    if (this.active) {
      this.pulsePhase += 0.05;
    }
  }
  
  explode() {
    if (!this.active) return false;
    this.active = false;
    return true;
  }
  
  isHit(x, y) {
    if (!this.active) return false;
    const dist = Math.sqrt((x - this.x) ** 2 + (y - this.y) ** 2);
    return dist <= this.radius;
  }
  
  draw(p) {
    if (!this.active) return;
    
    p.push();
    
    // Barrel body
    const pulse = Math.sin(this.pulsePhase) * 5;
    p.fill(150, 50, 50);
    p.stroke(100, 30, 30);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(this.x, this.y, this.radius * 2 + pulse, this.radius * 2.5 + pulse, 3);
    
    // Warning symbol
    p.fill(255, 200, 0);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text("!", this.x, this.y);
    
    p.pop();
  }
}