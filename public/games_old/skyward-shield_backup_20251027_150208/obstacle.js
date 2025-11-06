import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Obstacle {
  constructor(p, type, x, y, config = {}) {
    this.p = p;
    this.type = type;
    this.x = x;
    this.y = y;
    this.vx = config.vx || 0;
    this.vy = config.vy || 1;
    this.rotation = 0;
    this.rotationSpeed = config.rotationSpeed || 0;
    this.removed = false;
    
    switch (type) {
      case 'block':
        this.width = config.width || 50;
        this.height = config.height || 50;
        break;
      case 'beam':
        this.width = config.width || 150;
        this.height = config.height || 20;
        break;
      case 'triangle':
        this.size = config.size || 40;
        break;
    }
  }

  update(scrollSpeed) {
    this.x += this.vx;
    this.y += this.vy + scrollSpeed;
    this.rotation += this.rotationSpeed;
    
    // Check if off screen
    if (this.y > CANVAS_HEIGHT + 100 || 
        this.x < -100 || 
        this.x > CANVAS_WIDTH + 100) {
      this.removed = true;
    }
  }

  draw(scrollOffset) {
    const p = this.p;
    const screenY = this.y + scrollOffset;
    
    p.push();
    p.translate(this.x, screenY);
    p.rotate(this.rotation);
    
    p.fill(60, 60, 60);
    p.stroke(40, 40, 40);
    p.strokeWeight(2);
    
    switch (this.type) {
      case 'block':
        p.rectMode(p.CENTER);
        p.rect(0, 0, this.width, this.height);
        break;
      case 'beam':
        p.rectMode(p.CENTER);
        p.rect(0, 0, this.width, this.height);
        break;
      case 'triangle':
        p.triangle(
          0, -this.size / 2,
          -this.size / 2, this.size / 2,
          this.size / 2, this.size / 2
        );
        break;
    }
    
    p.pop();
  }

  getBounds() {
    switch (this.type) {
      case 'block':
      case 'beam':
        return {
          x: this.x,
          y: this.y,
          width: this.width,
          height: this.height,
          type: 'rect'
        };
      case 'triangle':
        return {
          x: this.x,
          y: this.y,
          radius: this.size / 2,
          type: 'circle'
        };
    }
  }

  // Custom collision detection functions
  collideCircleRect(cx, cy, diameter, rx, ry, rw, rh) {
    const radius = diameter / 2;
    
    // Find the closest point on the rectangle to the circle
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    
    // Calculate distance between circle center and closest point
    const dx = cx - closestX;
    const dy = cy - closestY;
    const distanceSquared = dx * dx + dy * dy;
    
    return distanceSquared < (radius * radius);
  }

  collideCircleCircle(x1, y1, d1, x2, y2, d2) {
    const r1 = d1 / 2;
    const r2 = d2 / 2;
    const dx = x1 - x2;
    const dy = y1 - y2;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance < (r1 + r2);
  }

  collideRectRect(x1, y1, w1, h1, x2, y2, w2, h2) {
    return !(x1 + w1 < x2 || 
             x1 > x2 + w2 || 
             y1 + h1 < y2 || 
             y1 > y2 + h2);
  }

  collideRectCircle(rx, ry, rw, rh, cx, cy, diameter) {
    return this.collideCircleRect(cx, cy, diameter, rx, ry, rw, rh);
  }

  checkCollisionWithBalloon(balloon) {
    const balloonBounds = balloon.getBounds();
    const obstacleBounds = this.getBounds();
    
    if (obstacleBounds.type === 'rect') {
      return this.collideCircleRect(
        balloonBounds.x, balloonBounds.y, balloonBounds.radius * 2,
        obstacleBounds.x - obstacleBounds.width / 2,
        obstacleBounds.y - obstacleBounds.height / 2,
        obstacleBounds.width,
        obstacleBounds.height
      );
    } else {
      return this.collideCircleCircle(
        balloonBounds.x, balloonBounds.y, balloonBounds.radius * 2,
        obstacleBounds.x, obstacleBounds.y, obstacleBounds.radius * 2
      );
    }
  }

  checkCollisionWithShield(shield) {
    const shieldBounds = shield.getBounds();
    const obstacleBounds = this.getBounds();
    
    if (obstacleBounds.type === 'rect') {
      return this.collideRectRect(
        shieldBounds.x - shieldBounds.width / 2,
        shieldBounds.y - shieldBounds.height / 2,
        shieldBounds.width,
        shieldBounds.height,
        obstacleBounds.x - obstacleBounds.width / 2,
        obstacleBounds.y - obstacleBounds.height / 2,
        obstacleBounds.width,
        obstacleBounds.height
      );
    } else {
      return this.collideRectCircle(
        shieldBounds.x - shieldBounds.width / 2,
        shieldBounds.y - shieldBounds.height / 2,
        shieldBounds.width,
        shieldBounds.height,
        obstacleBounds.x,
        obstacleBounds.y,
        obstacleBounds.radius * 2
      );
    }
  }

  pushAway(shield) {
    const dx = this.x - shield.x;
    const dy = this.y - shield.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      const force = 8;
      this.vx += (dx / dist) * force;
      this.vy += (dy / dist) * force;
    }
  }
}