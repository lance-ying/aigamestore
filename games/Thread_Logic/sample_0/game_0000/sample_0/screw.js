// screw.js - Screw entity class
import { gameState } from './globals.js';

export class Screw {
  constructor(config) {
    this.id = config.id;
    this.pathCoordinates = config.pathCoordinates;
    this.color = config.color;
    this.blockingScrews = config.blockingScrews || [];
    this.blockedByScrews = config.blockedByScrews || [];
    
    this.positionOnPath = 0; // 0 = fully inserted, 1 = fully unscrewed
    this.state = "INSERTED";
    this.canRemove = false;
    
    this.x = config.startX;
    this.y = config.startY;
    
    // Visual properties
    this.radius = 12;
    this.glowAmount = 0;
    this.removeAnimation = 0;
    this.isRemoving = false;
  }
  
  getCurrentPosition() {
    if (this.pathCoordinates.length < 2) {
      return { x: this.pathCoordinates[0].x, y: this.pathCoordinates[0].y };
    }
    
    const t = this.positionOnPath;
    const start = this.pathCoordinates[0];
    const end = this.pathCoordinates[this.pathCoordinates.length - 1];
    
    return {
      x: start.x + (end.x - start.x) * t,
      y: start.y + (end.y - start.y) * t
    };
  }
  
  moveAlongPath(direction) {
    const step = 0.1;
    const newPos = this.positionOnPath + (direction * step);
    this.positionOnPath = Math.max(0, Math.min(1, newPos));
    
    const pos = this.getCurrentPosition();
    this.x = pos.x;
    this.y = pos.y;
    
    this.updateState();
  }
  
  updateState() {
    if (this.positionOnPath === 0) {
      this.state = "INSERTED";
    } else if (this.positionOnPath === 1) {
      this.state = "FULLY_UNSCREWED";
    } else {
      this.state = "PARTIALLY_UNSCREWED";
    }
    
    this.updateCanRemove();
  }
  
  updateCanRemove() {
    if (this.state !== "FULLY_UNSCREWED") {
      this.canRemove = false;
      return;
    }
    
    // Check if any blocking screws are still on board
    for (let blockerId of this.blockedByScrews) {
      const blocker = gameState.screws.find(s => s.id === blockerId);
      if (blocker && blocker.state !== "REMOVED") {
        this.canRemove = false;
        return;
      }
    }
    
    this.canRemove = true;
  }
  
  remove() {
    this.state = "REMOVED";
    this.isRemoving = true;
  }
  
  update(p) {
    // Update glow animation
    const isSelected = gameState.activeScrewId === this.id;
    if (isSelected) {
      this.glowAmount = Math.min(1, this.glowAmount + 0.1);
    } else {
      this.glowAmount = Math.max(0, this.glowAmount - 0.1);
    }
    
    // Update removal animation
    if (this.isRemoving) {
      this.removeAnimation += 0.05;
      if (this.removeAnimation >= 1) {
        // Remove from entities
        const index = gameState.entities.indexOf(this);
        if (index > -1) {
          gameState.entities.splice(index, 1);
        }
      }
    }
  }
  
  draw(p) {
    if (this.state === "REMOVED" && !this.isRemoving) return;
    
    p.push();
    
    if (this.isRemoving) {
      // Fall and fade
      const fallY = this.y + this.removeAnimation * 100;
      const alpha = 255 * (1 - this.removeAnimation);
      p.translate(this.x, fallY);
      
      // Draw screw with fading
      p.fill(...this.color, alpha);
      p.stroke(100, 100, 110, alpha);
      p.strokeWeight(2);
      p.circle(0, 0, this.radius * 2);
      
      // Cross head
      p.stroke(60, 60, 70, alpha);
      p.strokeWeight(2);
      p.line(-this.radius * 0.5, 0, this.radius * 0.5, 0);
      p.line(0, -this.radius * 0.5, 0, this.radius * 0.5);
    } else {
      p.translate(this.x, this.y);
      
      // Draw glow if selected
      if (this.glowAmount > 0) {
        p.noStroke();
        p.fill(255, 255, 100, this.glowAmount * 80);
        p.circle(0, 0, this.radius * 2 + 10);
      }
      
      // Draw screw body
      p.fill(...this.color);
      p.stroke(100, 100, 110);
      p.strokeWeight(2);
      p.circle(0, 0, this.radius * 2);
      
      // Cross head
      p.stroke(60, 60, 70);
      p.strokeWeight(2);
      p.line(-this.radius * 0.5, 0, this.radius * 0.5, 0);
      p.line(0, -this.radius * 0.5, 0, this.radius * 0.5);
      
      // Draw threaded pattern if partially unscrewed
      if (this.positionOnPath > 0 && this.positionOnPath < 1) {
        p.stroke(80, 80, 90, 150);
        p.strokeWeight(1);
        for (let i = 0; i < 3; i++) {
          const offset = (i - 1) * 6;
          p.line(-this.radius, offset, this.radius, offset);
        }
      }
    }
    
    p.pop();
  }
  
  drawPath(p) {
    if (this.state === "REMOVED" || this.isRemoving) return;
    
    if (gameState.activeScrewId === this.id && this.pathCoordinates.length >= 2) {
      p.push();
      p.stroke(255, 255, 150, 150);
      p.strokeWeight(2);
      p.drawingContext.setLineDash([5, 5]);
      
      for (let i = 0; i < this.pathCoordinates.length - 1; i++) {
        p.line(
          this.pathCoordinates[i].x,
          this.pathCoordinates[i].y,
          this.pathCoordinates[i + 1].x,
          this.pathCoordinates[i + 1].y
        );
      }
      
      p.drawingContext.setLineDash([]);
      p.pop();
    }
  }
}