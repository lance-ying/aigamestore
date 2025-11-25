// physics.js - Physics simulation for wobbly characters

export class Joint {
  constructor(x, y, radius = 8) {
    this.x = x;
    this.y = y;
    this.px = x;
    this.py = y;
    this.radius = radius;
    this.mass = 1;
  }

  update(gravity, damping) {
    const vx = (this.x - this.px) * damping;
    const vy = (this.y - this.py) * damping;
    
    this.px = this.x;
    this.py = this.y;
    
    this.x += vx;
    this.y += vy + gravity;
  }

  constrain(minY) {
    if (this.y > minY) {
      this.y = minY;
      this.py = minY;
    }
  }
}

export class Stick {
  constructor(p1, p2, length = null) {
    this.p1 = p1;
    this.p2 = p2;
    this.length = length || this.getDistance();
    this.stiffness = 0.8;
  }

  getDistance() {
    const dx = this.p2.x - this.p1.x;
    const dy = this.p2.y - this.p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  constrain() {
    const dx = this.p2.x - this.p1.x;
    const dy = this.p2.y - this.p1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const diff = this.length - dist;
    const percent = (diff / dist) * this.stiffness;
    const offsetX = dx * percent * 0.5;
    const offsetY = dy * percent * 0.5;

    this.p1.x -= offsetX;
    this.p1.y -= offsetY;
    this.p2.x += offsetX;
    this.p2.y += offsetY;
  }
}

export function checkJointCollision(j1, j2) {
  const dx = j2.x - j1.x;
  const dy = j2.y - j1.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minDist = j1.radius + j2.radius;
  
  if (dist < minDist && dist > 0) {
    const overlap = minDist - dist;
    const nx = dx / dist;
    const ny = dy / dist;
    
    j1.x -= nx * overlap * 0.5;
    j1.y -= ny * overlap * 0.5;
    j2.x += nx * overlap * 0.5;
    j2.y += ny * overlap * 0.5;
    
    return true;
  }
  return false;
}