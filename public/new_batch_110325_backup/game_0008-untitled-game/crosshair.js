// crosshair.js - Crosshair/scope entity

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Crosshair {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.baseSpeed = 3;
    this.zoomSpeed = 1.5;
  }
  
  update(keys, zoomLevel) {
    const speed = zoomLevel > 1 ? this.zoomSpeed : this.baseSpeed;
    
    if (keys.left) this.x -= speed;
    if (keys.right) this.x += speed;
    if (keys.up) this.y -= speed;
    if (keys.down) this.y += speed;
    
    // Keep crosshair on screen
    this.x = Math.max(20, Math.min(CANVAS_WIDTH - 20, this.x));
    this.y = Math.max(20, Math.min(CANVAS_HEIGHT - 20, this.y));
  }
  
  draw(p, zoomLevel) {
    p.push();
    p.stroke(255, 0, 0);
    p.strokeWeight(2);
    p.noFill();
    
    // Outer circle
    const outerSize = 30 / zoomLevel;
    p.circle(this.x, this.y, outerSize);
    
    // Crosshair lines
    const lineLen = 15 / zoomLevel;
    p.line(this.x - lineLen, this.y, this.x - 5 / zoomLevel, this.y);
    p.line(this.x + 5 / zoomLevel, this.y, this.x + lineLen, this.y);
    p.line(this.x, this.y - lineLen, this.x, this.y - 5 / zoomLevel);
    p.line(this.x, this.y + 5 / zoomLevel, this.x, this.y + lineLen);
    
    // Center dot
    p.fill(255, 0, 0);
    p.noStroke();
    p.circle(this.x, this.y, 3 / zoomLevel);
    
    p.pop();
  }
}