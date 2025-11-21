// obstacles.js - Obstacles that damage the stack

import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, LANE_WIDTH, NUM_LANES,
  OBSTACLE_BARRIER, OBSTACLE_SPILL, OBSTACLE_WIND
} from './globals.js';

export class Obstacle {
  constructor(lane, y, type, damage = 1) {
    this.lane = lane;
    this.x = (lane + 0.5) * LANE_WIDTH;
    this.y = y;
    this.type = type;
    this.damage = damage;
    this.hit = false;
    this.animOffset = 0;
  }

  update(p, scrollSpeed) {
    this.y += scrollSpeed;
    this.animOffset += 0.15;
  }

  render(p, scrollOffset) {
    p.push();
    
    const screenY = this.y - scrollOffset;
    
    // Warning glow
    if (!this.hit) {
      p.noStroke();
      p.fill(255, 50, 50, 30 + Math.sin(this.animOffset) * 20);
      p.ellipse(this.x, screenY, 50, 50);
    }
    
    // Render based on type
    switch (this.type) {
      case OBSTACLE_BARRIER:
        this.renderBarrier(p, this.x, screenY);
        break;
      case OBSTACLE_SPILL:
        this.renderSpill(p, this.x, screenY);
        break;
      case OBSTACLE_WIND:
        this.renderWind(p, this.x, screenY);
        break;
    }
    
    p.pop();
  }

  renderBarrier(p, x, y) {
    // Construction barrier
    p.fill(255, 200, 0);
    p.stroke(200, 150, 0);
    p.strokeWeight(2);
    
    // Diagonal stripes
    for (let i = -20; i < 20; i += 8) {
      p.fill(i % 16 === 0 ? [255, 200, 0] : [50, 50, 50]);
      p.quad(
        x + i - 20, y - 15,
        x + i - 12, y - 15,
        x + i + 12, y + 15,
        x + i + 4, y + 15
      );
    }
    
    // Frame
    p.noFill();
    p.stroke(150, 100, 0);
    p.strokeWeight(3);
    p.rect(x - 20, y - 15, 40, 30, 2);
  }

  renderSpill(p, x, y) {
    // Coffee spill puddle
    p.noStroke();
    p.fill(101, 67, 33, 200);
    
    // Irregular puddle shape
    p.beginShape();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * p.TWO_PI;
      const radius = 18 + Math.sin(angle * 3 + this.animOffset) * 4;
      p.vertex(
        x + Math.cos(angle) * radius,
        y + Math.sin(angle) * radius * 0.5
      );
    }
    p.endShape(p.CLOSE);
    
    // Splatter drops
    p.fill(80, 50, 25);
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * p.TWO_PI;
      const dist = 20 + i * 3;
      p.ellipse(
        x + Math.cos(angle) * dist,
        y + Math.sin(angle) * dist * 0.3,
        4, 4
      );
    }
  }

  renderWind(p, x, y) {
    // Wind gust
    p.noFill();
    p.strokeWeight(3);
    
    // Multiple wind lines
    for (let i = 0; i < 4; i++) {
      const offset = i * 10 - 15;
      const alpha = 150 - i * 30;
      p.stroke(150, 200, 255, alpha);
      
      const curve = Math.sin(this.animOffset + i) * 5;
      p.bezier(
        x - 25, y + offset,
        x - 10 + curve, y + offset - 5,
        x + 10 + curve, y + offset + 5,
        x + 25, y + offset
      );
    }
    
    // Swirl particles
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * p.TWO_PI + this.animOffset;
      const radius = 15;
      p.fill(200, 230, 255, 150);
      p.noStroke();
      p.ellipse(
        x + Math.cos(angle) * radius,
        y + Math.sin(angle) * radius * 0.5,
        3, 3
      );
    }
  }

  isOffScreen(scrollOffset) {
    return this.y - scrollOffset > CANVAS_HEIGHT + 50;
  }

  getBounds(scrollOffset) {
    const screenY = this.y - scrollOffset;
    return {
      x: this.x - 22,
      y: screenY - 18,
      width: 44,
      height: 36
    };
  }
}