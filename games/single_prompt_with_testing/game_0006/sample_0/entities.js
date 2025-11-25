import { gameState } from './globals.js';

export class Platform {
  constructor(x, y, width, height, p) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.p = p;
  }
  
  display() {
    this.p.push();
    this.p.fill(80, 120, 80);
    this.p.stroke(100, 150, 100);
    this.p.strokeWeight(2);
    this.p.rect(this.x, this.y, this.width, this.height, 2);
    
    // Add texture
    this.p.stroke(100, 150, 100, 100);
    this.p.strokeWeight(1);
    for (let i = 0; i < this.width; i += 10) {
      this.p.line(this.x + i, this.y, this.x + i, this.y + this.height);
    }
    this.p.pop();
  }
}

export class Spike {
  constructor(x, y, width, height, p) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.p = p;
  }
  
  display() {
    this.p.push();
    this.p.fill(200, 50, 50);
    this.p.stroke(150, 30, 30);
    this.p.strokeWeight(2);
    
    // Draw spikes as triangles
    const spikeCount = Math.floor(this.width / 15);
    const spikeWidth = this.width / spikeCount;
    
    for (let i = 0; i < spikeCount; i++) {
      const x1 = this.x + i * spikeWidth;
      const x2 = this.x + (i + 1) * spikeWidth;
      const xMid = (x1 + x2) / 2;
      
      this.p.triangle(x1, this.y + this.height, xMid, this.y, x2, this.y + this.height);
    }
    this.p.pop();
  }
}

export class Key {
  constructor(x, y, id, p) {
    this.x = x;
    this.y = y;
    this.id = id;
    this.p = p;
    this.size = 15;
    this.collected = false;
    this.floatOffset = 0;
  }
  
  update() {
    if (!this.collected) {
      this.floatOffset = this.p.sin(this.p.frameCount * 0.05) * 3;
    }
  }
  
  display() {
    if (this.collected) return;
    
    this.p.push();
    this.p.translate(this.x, this.y + this.floatOffset);
    
    // Glow effect
    this.p.fill(255, 215, 0, 50);
    this.p.noStroke();
    this.p.ellipse(0, 0, this.size * 2, this.size * 2);
    
    // Key body
    this.p.fill(255, 215, 0);
    this.p.stroke(200, 170, 0);
    this.p.strokeWeight(2);
    this.p.ellipse(0, -3, this.size, this.size);
    this.p.rect(-3, 0, 6, 12, 2);
    
    // Key teeth
    this.p.rect(3, 8, 4, 3);
    this.p.rect(3, 4, 4, 3);
    
    this.p.pop();
  }
}

export class Door {
  constructor(x, y, width, height, requiredKeys, p) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.requiredKeys = requiredKeys;
    this.p = p;
    this.locked = true;
  }
  
  update() {
    if (gameState.keysCollected >= this.requiredKeys) {
      this.locked = false;
    }
  }
  
  display() {
    this.p.push();
    
    if (this.locked) {
      this.p.fill(120, 60, 40);
      this.p.stroke(80, 40, 20);
    } else {
      this.p.fill(60, 120, 60, 100);
      this.p.stroke(40, 80, 40);
    }
    
    this.p.strokeWeight(3);
    this.p.rect(this.x, this.y, this.width, this.height, 3);
    
    if (this.locked) {
      // Draw lock
      this.p.fill(150, 150, 150);
      this.p.stroke(100, 100, 100);
      this.p.strokeWeight(2);
      const lockX = this.x + this.width / 2;
      const lockY = this.y + this.height / 2;
      this.p.rect(lockX - 8, lockY, 16, 12, 2);
      this.p.arc(lockX, lockY, 10, 12, this.p.PI, 0);
      
      // Key requirement text
      this.p.fill(255);
      this.p.noStroke();
      this.p.textAlign(this.p.CENTER, this.p.CENTER);
      this.p.textSize(10);
      this.p.text(`${this.requiredKeys}`, lockX, lockY + 6);
    } else {
      // Open door indication
      this.p.fill(255, 255, 255, 150);
      this.p.noStroke();
      this.p.textAlign(this.p.CENTER, this.p.CENTER);
      this.p.textSize(12);
      this.p.text("OPEN", this.x + this.width/2, this.y + this.height/2);
    }
    
    this.p.pop();
  }
  
  blocksMovement() {
    return this.locked;
  }
}

export class Exit {
  constructor(x, y, size, p) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.p = p;
    this.particles = [];
  }
  
  update() {
    // Create particles
    if (this.p.frameCount % 10 === 0) {
      this.particles.push({
        x: this.x + this.p.random(-this.size/2, this.size/2),
        y: this.y + this.size/2,
        vy: this.p.random(-2, -1),
        life: 60
      });
    }
    
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.y += particle.vy;
      particle.life--;
      
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
  
  display() {
    this.p.push();
    
    // Draw particles
    for (let particle of this.particles) {
      const alpha = (particle.life / 60) * 255;
      this.p.fill(100, 200, 255, alpha);
      this.p.noStroke();
      this.p.ellipse(particle.x, particle.y, 4, 4);
    }
    
    // Portal glow
    this.p.fill(100, 200, 255, 50);
    this.p.noStroke();
    this.p.ellipse(this.x, this.y, this.size * 1.5, this.size * 1.5);
    
    // Portal
    this.p.fill(50, 150, 255);
    this.p.stroke(100, 200, 255);
    this.p.strokeWeight(3);
    this.p.ellipse(this.x, this.y, this.size, this.size);
    
    // Inner portal
    this.p.fill(150, 220, 255);
    this.p.noStroke();
    this.p.ellipse(this.x, this.y, this.size * 0.6, this.size * 0.6);
    
    // Rotating effect
    const angle = this.p.frameCount * 0.05;
    this.p.stroke(255, 255, 255, 150);
    this.p.strokeWeight(2);
    this.p.noFill();
    for (let i = 0; i < 3; i++) {
      const r = this.size * 0.3 + i * 5;
      const x1 = this.x + this.p.cos(angle + i * this.p.TWO_PI / 3) * r;
      const y1 = this.y + this.p.sin(angle + i * this.p.TWO_PI / 3) * r;
      this.p.ellipse(x1, y1, 4, 4);
    }
    
    this.p.pop();
  }
}