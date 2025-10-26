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
      // Area attack visual
      p.fill(100, 100, 255, 100 + Math.sin(this.timer * 0.3) * 50);
      p.noStroke();
      p.rect(screenX, this.y, this.width, this.height, 5);
      
      // Energy particles
      for (let i = 0; i < 3; i++) {
        const offset = Math.sin(this.timer * 0.2 + i) * 20;
        p.fill(150, 150, 255, 150);
        p.ellipse(screenX + this.width/2 + offset, this.y + this.height/2, 5, 5);
      }
    } else {
      // Projectile
      if (this.owner === 'player') {
        p.fill(255, 0, 255);
        p.noStroke();
        p.ellipse(screenX + this.width/2, this.y + this.height/2, this.width, this.height);
        // Glow
        p.fill(255, 100, 255, 100);
        p.ellipse(screenX + this.width/2, this.y + this.height/2, this.width * 1.5, this.height * 1.5);
      } else {
        p.fill(0, 255, 0);
        p.noStroke();
        p.ellipse(screenX + this.width/2, this.y + this.height/2, this.width, this.height);
      }
    }
    
    p.pop();
  }
}