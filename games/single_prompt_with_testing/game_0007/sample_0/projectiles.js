// projectiles.js - Projectile implementations

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class PlayerProjectile {
  constructor(p, x, y, angle) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = 10;
    this.radius = 6;
    this.velocityX = Math.cos(angle) * this.speed;
    this.velocityY = Math.sin(angle) * this.speed;
    this.damage = 10;
    this.active = true;
    this.trailPoints = [];
  }

  update() {
    this.x += this.velocityX;
    this.y += this.velocityY;
    
    // Add trail
    this.trailPoints.push({ x: this.x, y: this.y });
    if (this.trailPoints.length > 5) {
      this.trailPoints.shift();
    }
    
    // Check bounds
    if (this.x < -10 || this.x > CANVAS_WIDTH + 10 || 
        this.y < -10 || this.y > CANVAS_HEIGHT + 10) {
      this.active = false;
    }
  }

  render() {
    const p = this.p;
    
    p.push();
    
    // Trail
    p.noStroke();
    for (let i = 0; i < this.trailPoints.length; i++) {
      const alpha = (i / this.trailPoints.length) * 150;
      p.fill(255, 200, 100, alpha);
      const size = (i / this.trailPoints.length) * this.radius;
      p.ellipse(this.trailPoints[i].x, this.trailPoints[i].y, size, size);
    }
    
    // Main projectile
    p.fill(255, 220, 100);
    p.stroke(255, 150, 50);
    p.strokeWeight(2);
    p.ellipse(this.x, this.y, this.radius * 2, this.radius * 2);
    
    // Glow
    p.noStroke();
    p.fill(255, 255, 200, 100);
    p.ellipse(this.x, this.y, this.radius * 3, this.radius * 3);
    
    p.pop();
  }

  getHitbox() {
    return {
      x: this.x - this.radius,
      y: this.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2,
      radius: this.radius
    };
  }
}

export class BossProjectile {
  constructor(p, x, y, velocityX, velocityY, type = 'normal') {
    this.p = p;
    this.x = x;
    this.y = y;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.type = type;
    this.radius = type === 'large' ? 12 : 8;
    this.damage = type === 'large' ? 15 : 10;
    this.active = true;
    this.rotationAngle = 0;
    this.pulsePhase = this.p.random(1000);
  }

  update() {
    this.x += this.velocityX;
    this.y += this.velocityY;
    
    // Apply slight gravity for some projectile types
    if (this.type === 'normal') {
      this.velocityY += 0.1;
    }
    
    this.rotationAngle += 0.1;
    this.pulsePhase += 0.15;
    
    // Check bounds
    if (this.x < -20 || this.x > CANVAS_WIDTH + 20 || 
        this.y > CANVAS_HEIGHT + 20) {
      this.active = false;
    }
  }

  render() {
    const p = this.p;
    const pulse = Math.sin(this.pulsePhase) * 0.2 + 1;
    
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotationAngle);
    
    // Glow
    p.noStroke();
    p.fill(200, 50, 100, 80);
    p.ellipse(0, 0, this.radius * 3 * pulse, this.radius * 3 * pulse);
    
    // Main projectile
    if (this.type === 'large') {
      p.fill(180, 30, 60);
      p.stroke(255, 100, 150);
      p.strokeWeight(2);
      p.star(0, 0, this.radius * 0.6, this.radius, 8);
    } else {
      p.fill(200, 50, 80);
      p.stroke(255, 100, 150);
      p.strokeWeight(2);
      p.star(0, 0, this.radius * 0.5, this.radius, 5);
    }
    
    p.pop();
  }

  getHitbox() {
    return {
      x: this.x - this.radius,
      y: this.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2,
      radius: this.radius
    };
  }
}

// Helper function to draw a star
if (!window.p5.prototype.star) {
  window.p5.prototype.star = function(x, y, radius1, radius2, npoints) {
    const angle = this.TWO_PI / npoints;
    const halfAngle = angle / 2.0;
    this.beginShape();
    for (let a = -this.PI / 2; a < this.TWO_PI - this.PI / 2; a += angle) {
      let sx = x + this.cos(a) * radius2;
      let sy = y + this.sin(a) * radius2;
      this.vertex(sx, sy);
      sx = x + this.cos(a + halfAngle) * radius1;
      sy = y + this.sin(a + halfAngle) * radius1;
      this.vertex(sx, sy);
    }
    this.endShape(this.CLOSE);
  };
}