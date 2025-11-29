// cursor.js - Cursor entity class
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Cursor {
  constructor() {
    this.x = CANVAS_WIDTH / 2;
    this.y = CANVAS_HEIGHT / 2;
    this.size = 30;
    this.pulsePhase = 0;
  }
  
  move(dx, dy) {
    this.x += dx * 40;
    this.y += dy * 40;
    
    // Clamp to canvas bounds
    this.x = Math.max(this.size, Math.min(CANVAS_WIDTH - this.size, this.x));
    this.y = Math.max(this.size, Math.min(CANVAS_HEIGHT - this.size, this.y));
    
    gameState.cursorPosition.x = this.x;
    gameState.cursorPosition.y = this.y;
  }
  
  update(p) {
    this.pulsePhase += 0.05;
  }
  
  draw(p) {
    p.push();
    
    const pulse = Math.sin(this.pulsePhase) * 0.2 + 0.8;
    
    p.noFill();
    p.stroke(100, 200, 255, 180 * pulse);
    p.strokeWeight(3);
    p.rectMode(p.CENTER);
    p.rect(this.x, this.y, this.size, this.size);
    
    // Corner markers
    p.stroke(100, 200, 255, 255 * pulse);
    p.strokeWeight(2);
    const cornerSize = 8;
    const offset = this.size / 2;
    
    // Top-left
    p.line(this.x - offset, this.y - offset, this.x - offset + cornerSize, this.y - offset);
    p.line(this.x - offset, this.y - offset, this.x - offset, this.y - offset + cornerSize);
    
    // Top-right
    p.line(this.x + offset, this.y - offset, this.x + offset - cornerSize, this.y - offset);
    p.line(this.x + offset, this.y - offset, this.x + offset, this.y - offset + cornerSize);
    
    // Bottom-left
    p.line(this.x - offset, this.y + offset, this.x - offset + cornerSize, this.y + offset);
    p.line(this.x - offset, this.y + offset, this.x - offset, this.y + offset - cornerSize);
    
    // Bottom-right
    p.line(this.x + offset, this.y + offset, this.x + offset - cornerSize, this.y + offset);
    p.line(this.x + offset, this.y + offset, this.x + offset, this.y + offset - cornerSize);
    
    p.pop();
  }
  
  getHoveredScrew() {
    for (let screw of gameState.screws) {
      if (screw.state === "REMOVED" || screw.isRemoving) continue;
      
      const dist = Math.sqrt(
        Math.pow(this.x - screw.x, 2) + 
        Math.pow(this.y - screw.y, 2)
      );
      
      if (dist < screw.radius + this.size / 2) {
        return screw;
      }
    }
    return null;
  }
}