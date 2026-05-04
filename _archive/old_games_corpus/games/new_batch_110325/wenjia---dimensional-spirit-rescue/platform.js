// platform.js
export class Platform {
  constructor(x, y, width, height, world) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.world = world; // 'MATERIAL', 'ENERGY', or 'BOTH'
  }

  render(p, currentWorld) {
    if (this.world === currentWorld || this.world === 'BOTH') {
      p.push();
      
      if (this.world === 'MATERIAL' || (this.world === 'BOTH' && currentWorld === 'MATERIAL')) {
        // Material world platforms - solid stone
        p.fill(100, 80, 60);
        p.stroke(70, 60, 50);
        p.strokeWeight(2);
        p.rect(this.x, this.y, this.width, this.height, 2);
        
        // Stone texture
        p.noStroke();
        p.fill(120, 100, 80, 100);
        for (let i = 0; i < this.width; i += 15) {
          p.rect(this.x + i + 2, this.y + 2, 8, 4);
        }
      } else if (this.world === 'ENERGY' || (this.world === 'BOTH' && currentWorld === 'ENERGY')) {
        // Energy world platforms - glowing ethereal
        p.noStroke();
        
        // Glow effect
        for (let i = 3; i >= 0; i--) {
          const alpha = 40 - i * 8;
          p.fill(100, 200, 255, alpha);
          p.rect(this.x - i * 2, this.y - i * 2, this.width + i * 4, this.height + i * 4, 4);
        }
        
        // Core platform
        p.fill(120, 210, 255, 180);
        p.rect(this.x, this.y, this.width, this.height, 2);
        
        // Energy particles
        const particleCount = Math.floor(this.width / 30);
        for (let i = 0; i < particleCount; i++) {
          const px = this.x + (i + 0.5) * (this.width / particleCount);
          const py = this.y + this.height / 2;
          const offset = Math.sin(p.frameCount * 0.1 + i) * 3;
          p.fill(180, 230, 255, 200);
          p.circle(px, py + offset, 6);
        }
      }
      
      p.pop();
    }
  }
}