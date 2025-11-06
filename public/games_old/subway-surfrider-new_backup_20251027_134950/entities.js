// entities.js - Game entities (obstacles, coins, powerups)
import { CANVAS_HEIGHT, LANE_POSITIONS } from './globals.js';

export class Obstacle {
  constructor(p, type, lanes, z) {
    this.p = p;
    this.type = type; // 'train', 'jump', 'slide'
    this.lanes = lanes; // Array of lane indices this obstacle occupies
    this.z = z;
    this.active = true;
  }
  
  update(speed) {
    this.z -= speed;
    if (this.z < -50) {
      this.active = false;
    }
  }
  
  getScreenPosition() {
    const p = this.p;
    const scale = p.max(0.1, 1000 / (this.z + 1000));
    // Fixed: Objects spawn at horizon (y=160) and move toward ground (y=280)
    const horizonY = CANVAS_HEIGHT * 0.4;
    const groundY = CANVAS_HEIGHT * 0.7;
    const screenY = horizonY + (groundY - horizonY) * scale;
    return { scale, screenY };
  }
  
  getBoundingBoxes() {
    const { scale, screenY } = this.getScreenPosition();
    const boxes = [];
    
    for (const laneIndex of this.lanes) {
      const x = LANE_POSITIONS[laneIndex];
      
      if (this.type === 'train') {
        boxes.push({
          x: x - 40 * scale,
          y: screenY - 100 * scale,
          width: 80 * scale,
          height: 100 * scale
        });
      } else if (this.type === 'jump') {
        boxes.push({
          x: x - 30 * scale,
          y: screenY - 20 * scale,
          width: 60 * scale,
          height: 20 * scale
        });
      } else if (this.type === 'slide') {
        boxes.push({
          x: x - 30 * scale,
          y: screenY - 80 * scale,
          width: 60 * scale,
          height: 15 * scale
        });
      }
    }
    
    return boxes;
  }
  
  render() {
    const p = this.p;
    const { scale, screenY } = this.getScreenPosition();
    
    if (scale < 0.1) return;
    
    p.push();
    
    for (const laneIndex of this.lanes) {
      const x = LANE_POSITIONS[laneIndex];
      
      if (this.type === 'train') {
        // Draw train
        p.fill(120, 120, 120);
        p.stroke(80, 80, 80);
        p.strokeWeight(2);
        p.rect(x - 40 * scale, screenY - 100 * scale, 80 * scale, 100 * scale, 5);
        
        // Train windows
        p.fill(50, 150, 200);
        p.noStroke();
        p.rect(x - 25 * scale, screenY - 80 * scale, 20 * scale, 25 * scale);
        p.rect(x + 5 * scale, screenY - 80 * scale, 20 * scale, 25 * scale);
      } else if (this.type === 'jump') {
        // Draw low barrier
        p.fill(255, 220, 0);
        p.stroke(0);
        p.strokeWeight(2);
        p.rect(x - 30 * scale, screenY - 20 * scale, 60 * scale, 20 * scale);
        
        // Hazard stripes
        p.fill(0);
        for (let i = 0; i < 3; i++) {
          p.rect(x - 30 * scale + i * 20 * scale, screenY - 20 * scale, 10 * scale, 20 * scale);
        }
      } else if (this.type === 'slide') {
        // Draw high barrier
        p.fill(200, 50, 50);
        p.stroke(150, 30, 30);
        p.strokeWeight(2);
        p.rect(x - 30 * scale, screenY - 80 * scale, 60 * scale, 15 * scale);
      }
    }
    
    p.pop();
  }
}

export class Coin {
  constructor(p, lane, z, yOffset = 0) {
    this.p = p;
    this.lane = lane;
    this.x = LANE_POSITIONS[lane];
    this.z = z;
    this.yOffset = yOffset;
    this.active = true;
    this.collected = false;
  }
  
  update(speed) {
    this.z -= speed;
    if (this.z < -50) {
      this.active = false;
    }
  }
  
  getScreenPosition() {
    const p = this.p;
    const scale = p.max(0.1, 1000 / (this.z + 1000));
    // Fixed: Objects spawn at horizon (y=160) and move toward ground (y=280)
    const horizonY = CANVAS_HEIGHT * 0.4;
    const groundY = CANVAS_HEIGHT * 0.7;
    const screenY = horizonY + (groundY - horizonY) * scale - this.yOffset * scale;
    return { scale, screenY };
  }
  
  getBoundingBox() {
    const { scale, screenY } = this.getScreenPosition();
    const size = 15 * scale;
    return {
      x: this.x - size / 2,
      y: screenY - size / 2,
      width: size,
      height: size
    };
  }
  
  render() {
    const p = this.p;
    if (this.collected) return;
    
    const { scale, screenY } = this.getScreenPosition();
    
    if (scale < 0.1) return;
    
    p.push();
    
    // Coin glow
    p.noStroke();
    p.fill(255, 220, 100, 100);
    p.circle(this.x, screenY, 20 * scale);
    
    // Coin
    p.fill(255, 215, 0);
    p.stroke(200, 170, 0);
    p.strokeWeight(2);
    p.circle(this.x, screenY, 15 * scale);
    
    // Highlight
    p.fill(255, 255, 200);
    p.noStroke();
    p.circle(this.x - 3 * scale, screenY - 3 * scale, 5 * scale);
    
    p.pop();
  }
}

export class Powerup {
  constructor(p, type, lane, z) {
    this.p = p;
    this.type = type; // 'jetpack', 'hoverboard', 'magnet'
    this.lane = lane;
    this.x = LANE_POSITIONS[lane];
    this.z = z;
    this.active = true;
    this.collected = false;
  }
  
  update(speed) {
    this.z -= speed;
    if (this.z < -50) {
      this.active = false;
    }
  }
  
  getScreenPosition() {
    const p = this.p;
    const scale = p.max(0.1, 1000 / (this.z + 1000));
    // Fixed: Objects spawn at horizon (y=160) and move toward ground (y=280)
    const horizonY = CANVAS_HEIGHT * 0.4;
    const groundY = CANVAS_HEIGHT * 0.7;
    const screenY = horizonY + (groundY - horizonY) * scale - 50 * scale;
    return { scale, screenY };
  }
  
  getBoundingBox() {
    const { scale, screenY } = this.getScreenPosition();
    const size = 30 * scale;
    return {
      x: this.x - size / 2,
      y: screenY - size / 2,
      width: size,
      height: size
    };
  }
  
  render() {
    const p = this.p;
    if (this.collected) return;
    
    const { scale, screenY } = this.getScreenPosition();
    
    if (scale < 0.1) return;
    
    p.push();
    
    const size = 30 * scale;
    
    // Background circle
    p.noStroke();
    p.fill(255, 255, 255, 150);
    p.circle(this.x, screenY, size * 1.3);
    
    if (this.type === 'jetpack') {
      // Green rocket
      p.fill(50, 200, 50);
      p.stroke(30, 150, 30);
      p.strokeWeight(2);
      p.triangle(
        this.x, screenY - size * 0.4,
        this.x - size * 0.3, screenY + size * 0.4,
        this.x + size * 0.3, screenY + size * 0.4
      );
      p.fill(255, 100, 0);
      p.noStroke();
      p.triangle(
        this.x - size * 0.15, screenY + size * 0.4,
        this.x, screenY + size * 0.6,
        this.x + size * 0.15, screenY + size * 0.4
      );
    } else if (this.type === 'hoverboard') {
      // Orange board
      p.fill(255, 150, 0);
      p.stroke(200, 100, 0);
      p.strokeWeight(2);
      p.rect(this.x - size * 0.4, screenY - size * 0.15, size * 0.8, size * 0.3, 5);
      
      // Wheels
      p.fill(50);
      p.circle(this.x - size * 0.25, screenY + size * 0.2, size * 0.15);
      p.circle(this.x + size * 0.25, screenY + size * 0.2, size * 0.15);
    } else if (this.type === 'magnet') {
      // Purple magnet
      p.fill(150, 50, 200);
      p.stroke(100, 30, 150);
      p.strokeWeight(2);
      p.rect(this.x - size * 0.35, screenY - size * 0.4, size * 0.25, size * 0.8, 5);
      p.rect(this.x + size * 0.1, screenY - size * 0.4, size * 0.25, size * 0.8, 5);
      
      p.fill(255, 100, 100);
      p.noStroke();
      p.rect(this.x - size * 0.35, screenY - size * 0.4, size * 0.25, size * 0.3);
      
      p.fill(100, 100, 255);
      p.rect(this.x + size * 0.1, screenY - size * 0.4, size * 0.25, size * 0.3);
    }
    
    p.pop();
  }
}