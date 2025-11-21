import { LANE_X_POSITIONS, CANVAS_HEIGHT, OBSTACLE_TYPES } from './globals.js';

export class Obstacle {
  constructor(p, lane, type, speed) {
    this.p = p;
    this.lane = lane;
    this.x = LANE_X_POSITIONS[lane];
    this.type = type;
    this.speed = speed;
    this.active = true;
    
    if (type === OBSTACLE_TYPES.TRAIN) {
      this.y = 280;
      this.width = 50;
      this.height = 80;
    } else if (type === OBSTACLE_TYPES.LOW_BARRIER) {
      this.y = 320;
      this.width = 40;
      this.height = 25;
    } else if (type === OBSTACLE_TYPES.HIGH_BARRIER) {
      this.y = 270;
      this.width = 40;
      this.height = 50;
    }
  }

  update() {
    this.y += this.speed;
    if (this.y > CANVAS_HEIGHT + 100) {
      this.active = false;
    }
  }

  getHitbox() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height,
      width: this.width,
      height: this.height
    };
  }

  render() {
    this.p.push();
    
    if (this.type === OBSTACLE_TYPES.TRAIN) {
      this.renderTrain();
    } else if (this.type === OBSTACLE_TYPES.LOW_BARRIER) {
      this.renderLowBarrier();
    } else if (this.type === OBSTACLE_TYPES.HIGH_BARRIER) {
      this.renderHighBarrier();
    }
    
    this.p.pop();
  }

  renderTrain() {
    const p = this.p;
    
    // Main body
    p.fill(180, 50, 50);
    p.rect(this.x - 25, this.y - 80, 50, 70, 5);
    
    // Windows
    p.fill(100, 150, 200);
    p.rect(this.x - 18, this.y - 70, 15, 20, 2);
    p.rect(this.x + 3, this.y - 70, 15, 20, 2);
    
    // Bottom section
    p.fill(150, 40, 40);
    p.rect(this.x - 25, this.y - 10, 50, 10);
    
    // Warning stripes
    p.fill(255, 220, 0);
    p.rect(this.x - 25, this.y - 15, 50, 3);
  }

  renderLowBarrier() {
    const p = this.p;
    
    // Barrier base
    p.fill(100, 80, 60);
    p.rect(this.x - 20, this.y - 25, 40, 25, 3);
    
    // Warning stripes
    for (let i = 0; i < 3; i++) {
      p.fill(i % 2 === 0 ? 255 : 0, i % 2 === 0 ? 220 : 0, 0);
      p.rect(this.x - 20 + i * 13, this.y - 25, 13, 25);
    }
  }

  renderHighBarrier() {
    const p = this.p;
    
    // Barrier frame
    p.fill(80, 80, 80);
    p.rect(this.x - 3, this.y - 50, 6, 50);
    
    // Horizontal bar
    p.fill(200, 180, 50);
    p.rect(this.x - 20, this.y - 35, 40, 8, 4);
    
    // Warning signs
    p.fill(255, 50, 50);
    p.triangle(this.x - 15, this.y - 45, this.x - 10, this.y - 50, this.x - 5, this.y - 45);
    p.triangle(this.x + 5, this.y - 45, this.x + 10, this.y - 50, this.x + 15, this.y - 45);
  }
}

export class Coin {
  constructor(p, lane, speed) {
    this.p = p;
    this.lane = lane;
    this.x = LANE_X_POSITIONS[lane];
    this.y = -50;
    this.speed = speed;
    this.active = true;
    this.radius = 12;
    this.rotation = 0;
    this.collected = false;
  }

  update() {
    this.y += this.speed;
    this.rotation += 0.1;
    
    if (this.y > CANVAS_HEIGHT + 50) {
      this.active = false;
    }
  }

  getHitbox() {
    return {
      x: this.x,
      y: this.y,
      radius: this.radius
    };
  }

  render() {
    const p = this.p;
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotation);
    
    // Outer ring
    p.fill(255, 215, 0);
    p.stroke(180, 140, 0);
    p.strokeWeight(2);
    p.ellipse(0, 0, this.radius * 2, this.radius * 2);
    
    // Inner detail
    p.fill(255, 235, 100);
    p.noStroke();
    p.ellipse(0, 0, this.radius * 1.3, this.radius * 1.3);
    
    // Center
    p.fill(255, 215, 0);
    p.ellipse(0, 0, this.radius * 0.6, this.radius * 0.6);
    
    p.pop();
  }
}