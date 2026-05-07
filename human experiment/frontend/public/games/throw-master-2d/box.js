// box.js - Breakable stun box

export class Box {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 20;
    this.active = true;
    this.breaking = false;
    this.breakTimer = 0;
    this.breakDuration = 15;
    this.stunRadius = 40;
  }

  break() {
    if (!this.active || this.breaking) return false;
    this.breaking = true;
    this.breakTimer = this.breakDuration;
    return true;
  }

  update() {
    if (this.breaking) {
      this.breakTimer--;
      if (this.breakTimer <= 0) {
        this.active = false;
      }
    }
  }

  draw(p) {
    if (!this.active && !this.breaking) return;
    
    p.push();
    
    if (this.breaking) {
      // Draw break effect
      const breakProgress = 1 - (this.breakTimer / this.breakDuration);
      
      // Flying splinters
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const dist = breakProgress * 30;
        const px = this.x + Math.cos(angle) * dist;
        const py = this.y + Math.sin(angle) * dist;
        const alpha = 255 * (1 - breakProgress);
        
        p.fill(139, 90, 43, alpha);
        p.noStroke();
        p.rect(px - 2, py - 2, 4, 4);
      }
      
      // Stun wave
      const waveRadius = this.stunRadius * breakProgress;
      const waveAlpha = 100 * (1 - breakProgress);
      p.fill(100, 200, 255, waveAlpha);
      p.noStroke();
      p.circle(this.x, this.y, waveRadius * 2);
    } else {
      // Draw box
      p.fill(139, 90, 43);
      p.stroke(80, 50, 20);
      p.strokeWeight(2);
      p.rect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
      
      // Wood texture lines
      p.stroke(100, 65, 30);
      p.strokeWeight(1);
      p.line(this.x - this.size / 2 + 5, this.y - this.size / 2, this.x - this.size / 2 + 5, this.y + this.size / 2);
      p.line(this.x + this.size / 2 - 5, this.y - this.size / 2, this.x + this.size / 2 - 5, this.y + this.size / 2);
    }
    
    p.pop();
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.size,
      height: this.size
    };
  }

  getStunBounds() {
    return {
      x: this.x,
      y: this.y,
      radius: this.stunRadius
    };
  }
}