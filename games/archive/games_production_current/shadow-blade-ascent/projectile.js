// projectile.js

export class Projectile {
  constructor(data) {
    this.x = data.x;
    this.y = data.y;
    this.vx = data.vx;
    this.vy = data.vy;
    this.width = data.width;
    this.height = data.height;
    this.damage = data.damage;
    this.owner = data.owner;
    this.type = data.type || 'projectile';
    this.duration = data.duration || -1;
    this.timer = 0;
    this.dead = false;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.timer++;
    
    if (this.duration > 0 && this.timer >= this.duration) {
      this.dead = true;
    }
    
    // Remove if off screen
    if (this.x < -100 || this.x > 3000 || this.y < -100 || this.y > 600) {
      this.dead = true;
    }
  }
  
  draw(p, cameraX) {
    p.push();
    const screenX = this.x - cameraX;
    
    if (this.type === 'aoe') {
      // Much more visible AoE attack - BRIGHT and DRAMATIC
      const pulseIntensity = Math.sin(this.timer * 0.4) * 0.3 + 0.7;
      
      // Outer energy field - bright cyan/blue
      p.fill(100, 200, 255, 180 * pulseIntensity);
      p.noStroke();
      p.rect(screenX - 10, this.y - 10, this.width + 20, this.height + 20, 15);
      
      // Middle layer - brighter
      p.fill(150, 220, 255, 200 * pulseIntensity);
      p.rect(screenX - 5, this.y - 5, this.width + 10, this.height + 10, 10);
      
      // Core bright area
      p.fill(200, 240, 255, 220 * pulseIntensity);
      p.rect(screenX, this.y, this.width, this.height, 8);
      
      // Energy waves radiating outward
      for (let i = 0; i < 3; i++) {
        const waveOffset = (this.timer * 3 + i * 20) % 60;
        const waveAlpha = 200 * (1 - waveOffset / 60);
        p.fill(180, 230, 255, waveAlpha);
        p.rect(screenX - waveOffset/2, this.y - waveOffset/2, 
               this.width + waveOffset, this.height + waveOffset, 10);
      }
      
      // Bright energy particles spinning around
      for (let i = 0; i < 8; i++) {
        const angle = (this.timer * 0.15 + i * Math.PI / 4);
        const radius = 40 + Math.sin(this.timer * 0.2 + i) * 15;
        const px = screenX + this.width/2 + Math.cos(angle) * radius;
        const py = this.y + this.height/2 + Math.sin(angle) * radius;
        
        // Outer glow
        p.fill(150, 220, 255, 150);
        p.ellipse(px, py, 12, 12);
        
        // Inner bright core
        p.fill(220, 245, 255, 250);
        p.ellipse(px, py, 6, 6);
      }
      
      // Central explosion effect
      const centralPulse = Math.sin(this.timer * 0.3) * 20 + 30;
      p.fill(255, 255, 255, 150 * pulseIntensity);
      p.ellipse(screenX + this.width/2, this.y + this.height/2, 
                centralPulse, centralPulse);
      
      // Lightning bolts
      if (this.timer % 3 === 0) {
        p.stroke(255, 255, 255, 200);
        p.strokeWeight(2);
        for (let i = 0; i < 4; i++) {
          const boltAngle = Math.random() * Math.PI * 2;
          const boltLength = 30 + Math.random() * 20;
          p.line(
            screenX + this.width/2, this.y + this.height/2,
            screenX + this.width/2 + Math.cos(boltAngle) * boltLength,
            this.y + this.height/2 + Math.sin(boltAngle) * boltLength
          );
        }
        p.noStroke();
      }
      
    } else {
      // Projectile
      if (this.owner === 'player') {
        // Bright magenta/purple projectile with trail
        p.fill(255, 100, 255, 200);
        p.noStroke();
        p.ellipse(screenX + this.width/2, this.y + this.height/2, this.width * 1.4, this.height * 1.4);
        
        p.fill(255, 150, 255, 150);
        p.ellipse(screenX + this.width/2, this.y + this.height/2, this.width, this.height);
        
        // Bright core
        p.fill(255, 200, 255);
        p.ellipse(screenX + this.width/2, this.y + this.height/2, this.width * 0.6, this.height * 0.6);
        
        // Glow trail
        for (let i = 1; i <= 3; i++) {
          const trailAlpha = 100 * (1 - i/3);
          p.fill(255, 100, 255, trailAlpha);
          const trailX = screenX + this.width/2 - this.vx * i * 0.3;
          const trailY = this.y + this.height/2 - this.vy * i * 0.3;
          p.ellipse(trailX, trailY, this.width * (1 - i*0.2), this.height * (1 - i*0.2));
        }
      } else {
        p.fill(100, 255, 100);
        p.noStroke();
        p.ellipse(screenX + this.width/2, this.y + this.height/2, this.width, this.height);
        
        // Glow
        p.fill(150, 255, 150, 100);
        p.ellipse(screenX + this.width/2, this.y + this.height/2, this.width * 1.5, this.height * 1.5);
      }
    }
    
    p.pop();
  }
}