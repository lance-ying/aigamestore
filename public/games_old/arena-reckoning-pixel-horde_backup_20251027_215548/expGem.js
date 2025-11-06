// expGem.js - Experience gem class

export class ExpGem {
  constructor(x, y, expValue) {
    this.x = x;
    this.y = y;
    this.expValue = expValue;
    this.size = 5;
    this.isDead = false;
    this.age = 0;
    this.glowPhase = 0;
  }
  
  update(player) {
    this.age++;
    this.glowPhase = (this.glowPhase + 0.1) % (Math.PI * 2);
    
    // Move towards player when close
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 80) {
      const speed = 3;
      this.x += (dx / dist) * speed;
      this.y += (dy / dist) * speed;
    }
  }
  
  render(p) {
    p.push();
    
    const glow = Math.sin(this.glowPhase) * 50 + 200;
    p.fill(255, 220, 100, glow);
    p.noStroke();
    
    p.rectMode(p.CENTER);
    p.rect(this.x, this.y, this.size, this.size);
    
    p.pop();
  }
  
  collidesWith(x, y, radius) {
    const dx = this.x - x;
    const dy = this.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < (this.size + radius);
  }
}