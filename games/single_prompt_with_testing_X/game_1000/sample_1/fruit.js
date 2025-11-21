import { FRUIT_TYPES, CONTAINER_X, CONTAINER_Y, CONTAINER_WIDTH, CONTAINER_HEIGHT, GRAVITY, FRICTION, BOUNCE, DANGER_LINE_Y } from './globals.js';

export class Fruit {
  constructor(x, y, type, p) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.p = p;
    this.vx = 0;
    this.vy = 0;
    this.radius = FRUIT_TYPES[type].radius;
    this.color = FRUIT_TYPES[type].color;
    this.name = FRUIT_TYPES[type].name;
    this.points = FRUIT_TYPES[type].points;
    this.markedForMerge = false;
    this.mergePartner = null;
    this.settled = false;
    this.settledFrames = 0;
    this.id = Math.random();
  }

  update() {
    // Apply gravity
    this.vy += GRAVITY;
    
    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;
    
    // Apply friction
    this.vx *= FRICTION;
    this.vy *= FRICTION;
    
    // Container boundaries
    const minX = CONTAINER_X + this.radius;
    const maxX = CONTAINER_X + CONTAINER_WIDTH - this.radius;
    const maxY = CONTAINER_Y + CONTAINER_HEIGHT - this.radius;
    
    // Wall collisions
    if (this.x < minX) {
      this.x = minX;
      this.vx = -this.vx * BOUNCE;
    }
    if (this.x > maxX) {
      this.x = maxX;
      this.vx = -this.vx * BOUNCE;
    }
    
    // Floor collision
    if (this.y > maxY) {
      this.y = maxY;
      this.vy = -this.vy * BOUNCE;
      if (Math.abs(this.vy) < 0.5) {
        this.vy = 0;
      }
    }
    
    // Check if settled
    if (Math.abs(this.vx) < 0.1 && Math.abs(this.vy) < 0.1) {
      this.settledFrames++;
      if (this.settledFrames > 10) {
        this.settled = true;
      }
    } else {
      this.settledFrames = 0;
      this.settled = false;
    }
  }

  checkCollision(other) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDist = this.radius + other.radius;
    
    if (distance < minDist && distance > 0) {
      // Resolve collision
      const angle = Math.atan2(dy, dx);
      const targetX = other.x + Math.cos(angle) * minDist;
      const targetY = other.y + Math.sin(angle) * minDist;
      
      const ax = (targetX - this.x) * 0.5;
      const ay = (targetY - this.y) * 0.5;
      
      this.x += ax;
      this.y += ay;
      other.x -= ax;
      other.y -= ay;
      
      // Bounce velocity
      const dvx = this.vx - other.vx;
      const dvy = this.vy - other.vy;
      const dotProduct = dvx * dx + dvy * dy;
      
      if (dotProduct < 0) {
        const collisionScale = dotProduct / (distance * distance);
        const xCollision = dx * collisionScale;
        const yCollision = dy * collisionScale;
        
        this.vx -= xCollision * BOUNCE;
        this.vy -= yCollision * BOUNCE;
        other.vx += xCollision * BOUNCE;
        other.vy += yCollision * BOUNCE;
      }
      
      return true;
    }
    return false;
  }

  isOverDangerLine() {
    return this.y - this.radius < DANGER_LINE_Y;
  }

  draw() {
    this.p.push();
    
    // Shadow
    this.p.noStroke();
    this.p.fill(0, 0, 0, 30);
    this.p.ellipse(this.x, this.y + 2, this.radius * 2 - 4, this.radius * 2 - 4);
    
    // Main fruit body
    this.p.fill(...this.color);
    this.p.stroke(0, 0, 0, 50);
    this.p.strokeWeight(2);
    this.p.ellipse(this.x, this.y, this.radius * 2, this.radius * 2);
    
    // Highlight
    this.p.noStroke();
    this.p.fill(255, 255, 255, 120);
    this.p.ellipse(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.6, this.radius * 0.6);
    
    // Special watermelon stripes
    if (this.type === 9) {
      this.p.stroke(0, 50, 0);
      this.p.strokeWeight(3);
      this.p.noFill();
      for (let i = -1; i <= 1; i++) {
        const offset = i * this.radius * 0.4;
        this.p.arc(this.x + offset, this.y, this.radius * 1.5, this.radius * 1.8, 0, this.p.PI);
      }
    }
    
    // Merge indicator
    if (this.markedForMerge) {
      this.p.noFill();
      this.p.stroke(255, 255, 0);
      this.p.strokeWeight(3);
      this.p.ellipse(this.x, this.y, this.radius * 2 + 6, this.radius * 2 + 6);
    }
    
    this.p.pop();
  }
}