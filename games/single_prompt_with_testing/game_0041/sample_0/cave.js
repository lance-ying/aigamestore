// cave.js - Cave generation and rendering
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class CaveSegment {
  constructor(y, leftWidth, rightWidth, p) {
    this.y = y;
    this.height = 50;
    this.leftWidth = leftWidth;
    this.rightWidth = rightWidth;
    
    // Add some variation
    const variation = p.random(-20, 20);
    this.leftWidth = Math.max(50, Math.min(250, this.leftWidth + variation));
    this.rightWidth = Math.max(50, Math.min(250, this.rightWidth + variation));
    
    // Ensure there's enough space
    if (this.leftWidth + this.rightWidth > CANVAS_WIDTH - 100) {
      const total = this.leftWidth + this.rightWidth;
      const scale = (CANVAS_WIDTH - 100) / total;
      this.leftWidth *= scale;
      this.rightWidth *= scale;
    }
    
    this.hasSpikes = p.random() < 0.3;
    this.spikePositions = [];
    
    if (this.hasSpikes) {
      const numSpikes = Math.floor(p.random(2, 5));
      for (let i = 0; i < numSpikes; i++) {
        const side = p.random() < 0.5 ? 'left' : 'right';
        const posY = this.y + p.random(0, this.height);
        this.spikePositions.push({ side, y: posY });
      }
    }
  }

  draw(p) {
    const screenY = this.y - gameState.cameraY;
    
    // Only draw if on screen
    if (screenY > CANVAS_HEIGHT + 50 || screenY < -this.height - 50) return;
    
    // Left wall
    p.fill(60, 50, 40);
    p.stroke(40, 30, 20);
    p.strokeWeight(2);
    p.rect(0, screenY, this.leftWidth, this.height);
    
    // Right wall
    p.rect(CANVAS_WIDTH - this.rightWidth, screenY, this.rightWidth, this.height);
    
    // Wall texture
    p.stroke(70, 60, 50);
    p.strokeWeight(1);
    for (let i = 0; i < 5; i++) {
      const tx = p.random(5, this.leftWidth - 5);
      const ty = screenY + p.random(0, this.height);
      p.point(tx, ty);
    }
    for (let i = 0; i < 5; i++) {
      const tx = CANVAS_WIDTH - this.rightWidth + p.random(5, this.rightWidth - 5);
      const ty = screenY + p.random(0, this.height);
      p.point(tx, ty);
    }
    
    // Spikes
    if (this.hasSpikes) {
      p.fill(80, 70, 60);
      p.stroke(50, 40, 30);
      p.strokeWeight(1);
      
      for (let spike of this.spikePositions) {
        const spikeScreenY = spike.y - gameState.cameraY;
        if (spike.side === 'left') {
          const baseX = this.leftWidth;
          p.triangle(baseX, spikeScreenY - 8, baseX, spikeScreenY + 8, baseX + 15, spikeScreenY);
        } else {
          const baseX = CANVAS_WIDTH - this.rightWidth;
          p.triangle(baseX, spikeScreenY - 8, baseX, spikeScreenY + 8, baseX - 15, spikeScreenY);
        }
      }
    }
  }

  checkCollision(player, p) {
    const points = player.getCollisionPoints();
    
    for (let point of points) {
      // Check left wall
      if (point.x < this.leftWidth && point.y > this.y && point.y < this.y + this.height) {
        return true;
      }
      
      // Check right wall
      if (point.x > CANVAS_WIDTH - this.rightWidth && point.y > this.y && point.y < this.y + this.height) {
        return true;
      }
      
      // Check spikes
      if (this.hasSpikes) {
        for (let spike of this.spikePositions) {
          if (spike.side === 'left') {
            const baseX = this.leftWidth;
            if (p.collidePointTriangle(point.x, point.y, baseX, spike.y - 8, baseX, spike.y + 8, baseX + 15, spike.y)) {
              return true;
            }
          } else {
            const baseX = CANVAS_WIDTH - this.rightWidth;
            if (p.collidePointTriangle(point.x, point.y, baseX, spike.y - 8, baseX, spike.y + 8, baseX - 15, spike.y)) {
              return true;
            }
          }
        }
      }
    }
    
    return false;
  }
}

export function generateCave(p) {
  gameState.caveSegments = [];
  
  let leftWidth = 80;
  let rightWidth = 80;
  
  // Surface area
  for (let y = 0; y < 200; y += 50) {
    const segment = new CaveSegment(y, 0, 0, p);
    segment.leftWidth = 0;
    segment.rightWidth = 0;
    segment.hasSpikes = false;
    gameState.caveSegments.push(segment);
  }
  
  // Cave segments
  for (let y = 200; y < 2000; y += 50) {
    const segment = new CaveSegment(y, leftWidth, rightWidth, p);
    gameState.caveSegments.push(segment);
    leftWidth = segment.leftWidth;
    rightWidth = segment.rightWidth;
  }
}