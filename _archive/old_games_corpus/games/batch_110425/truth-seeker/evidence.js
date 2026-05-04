// evidence.js
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class EvidencePoint {
  constructor(x, y, id, name, description) {
    this.x = x;
    this.y = y;
    this.id = id;
    this.name = name;
    this.description = description;
    this.width = 40;
    this.height = 40;
    this.collected = false;
    this.pulseAnim = 0;
    this.type = 'evidence';
  }

  update(p) {
    if (!this.collected) {
      this.pulseAnim += 0.1;
    }
  }

  draw(p) {
    if (this.collected) return;

    p.push();
    p.translate(this.x, this.y);
    
    // Pulsing glow effect
    const pulseSize = p.sin(this.pulseAnim) * 5 + 5;
    p.fill(255, 200, 0, 100);
    p.noStroke();
    p.ellipse(0, 0, this.width + pulseSize, this.height + pulseSize);
    
    // Evidence icon
    p.fill(255, 220, 0);
    p.stroke(200, 150, 0);
    p.strokeWeight(2);
    p.beginShape();
    p.vertex(0, -15);
    p.vertex(10, -5);
    p.vertex(15, 5);
    p.vertex(5, 15);
    p.vertex(-5, 15);
    p.vertex(-15, 5);
    p.vertex(-10, -5);
    p.endShape(p.CLOSE);
    
    // Exclamation mark
    p.fill(0);
    p.noStroke();
    p.rect(-2, -8, 4, 10);
    p.ellipse(0, 6, 4, 4);
    
    p.pop();
  }

  checkCollection(player) {
    if (this.collected) return false;
    
    const distance = Math.sqrt(
      Math.pow(this.x - player.x, 2) + 
      Math.pow(this.y - player.y, 2)
    );
    
    return distance < 40;
  }
}

export class TruthBullet {
  constructor(id, name, description) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.active = false;
    this.size = 12;
  }

  fire(startX, startY, targetX, targetY) {
    this.x = startX;
    this.y = startY;
    this.active = true;
    
    const angle = Math.atan2(targetY - startY, targetX - startX);
    const speed = 15;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update() {
    if (!this.active) return;
    
    this.x += this.vx;
    this.y += this.vy;
    
    // Deactivate if off screen
    if (this.x < 0 || this.x > CANVAS_WIDTH || this.y < 0 || this.y > CANVAS_HEIGHT) {
      this.active = false;
    }
  }

  draw(p) {
    if (!this.active) return;
    
    p.push();
    p.translate(this.x, this.y);
    
    // Bullet trail
    p.stroke(255, 200, 0, 150);
    p.strokeWeight(3);
    p.line(0, 0, -this.vx * 2, -this.vy * 2);
    
    // Bullet
    p.fill(255, 220, 0);
    p.noStroke();
    p.ellipse(0, 0, this.size, this.size);
    
    p.fill(255, 255, 100);
    p.ellipse(0, 0, this.size * 0.6, this.size * 0.6);
    
    p.pop();
  }
}