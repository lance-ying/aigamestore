// symbol.js - Symbol entity class
import { CANVAS_WIDTH, SYMBOL_TYPES } from './globals.js';

export class Symbol {
  constructor(p, type, y, speed) {
    this.p = p;
    this.type = type;
    this.x = p.random(50, CANVAS_WIDTH - 50);
    this.y = y;
    this.speed = speed;
    this.size = 50;
    this.active = true;
  }

  update() {
    this.y += this.speed;
  }

  isInHitZone(hitZone) {
    const centerY = this.y;
    return centerY >= hitZone.y && centerY <= hitZone.y + hitZone.height;
  }

  hasPassed(hitZone) {
    return this.y > hitZone.y + hitZone.height;
  }

  draw() {
    const p = this.p;
    p.push();
    p.translate(this.x, this.y);
    
    switch (this.type) {
      case SYMBOL_TYPES.CIRCLE:
        p.fill(255, 0, 0);
        p.noStroke();
        p.circle(0, 0, this.size);
        break;
        
      case SYMBOL_TYPES.SQUARE:
        p.fill(0, 0, 255);
        p.noStroke();
        p.rectMode(p.CENTER);
        p.square(0, 0, this.size);
        break;
        
      case SYMBOL_TYPES.TRIANGLE:
        p.fill(0, 255, 0);
        p.noStroke();
        this.drawTriangle(this.size);
        break;
        
      case SYMBOL_TYPES.STAR:
        p.fill(255, 255, 0);
        p.noStroke();
        this.drawStar(0, 0, this.size / 4, this.size / 2, 5);
        break;
        
      case SYMBOL_TYPES.DECOY:
        p.fill(128, 0, 128);
        p.noStroke();
        this.drawCross(this.size);
        break;
    }
    
    p.pop();
  }

  drawTriangle(size) {
    const p = this.p;
    const h = size * 0.866; // height of equilateral triangle
    p.beginShape();
    p.vertex(0, -h / 2);
    p.vertex(-size / 2, h / 2);
    p.vertex(size / 2, h / 2);
    p.endShape(p.CLOSE);
  }

  drawStar(x, y, radius1, radius2, npoints) {
    const p = this.p;
    const angle = p.TWO_PI / npoints;
    const halfAngle = angle / 2.0;
    p.beginShape();
    for (let a = -p.PI / 2; a < p.TWO_PI - p.PI / 2; a += angle) {
      let sx = x + p.cos(a) * radius2;
      let sy = y + p.sin(a) * radius2;
      p.vertex(sx, sy);
      sx = x + p.cos(a + halfAngle) * radius1;
      sy = y + p.sin(a + halfAngle) * radius1;
      p.vertex(sx, sy);
    }
    p.endShape(p.CLOSE);
  }

  drawCross(size) {
    const p = this.p;
    const thickness = size / 5;
    p.rectMode(p.CENTER);
    p.rect(0, 0, size, thickness);
    p.rect(0, 0, thickness, size);
  }
}