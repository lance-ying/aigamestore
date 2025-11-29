// obstacle.js - Obstacle classes
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './globals.js';

export class Obstacle {
  constructor(p, x, gapY, gapSize, width) {
    this.p = p;
    this.x = x;
    this.gapY = gapY;
    this.gapSize = gapSize;
    this.width = width;
    this.passed = false;
    this.type = 'static';
    
    // Visual properties
    this.color = [60, 60, 80];
    this.highlightColor = [80, 80, 100];
  }
  
  update() {
    // Static obstacles don't move
  }
  
  draw(cameraOffsetX) {
    const p = this.p;
    const screenX = this.x - cameraOffsetX;
    
    // Only draw if on screen
    if (screenX < -this.width || screenX > CANVAS_WIDTH + this.width) {
      return;
    }
    
    p.push();
    
    // Draw top barrier
    p.fill(...this.color);
    p.stroke(...this.highlightColor);
    p.strokeWeight(2);
    p.rect(screenX, 0, this.width, this.gapY);
    
    // Draw bottom barrier
    p.rect(screenX, this.gapY + this.gapSize, this.width, 
           CANVAS_HEIGHT - (this.gapY + this.gapSize));
    
    // Draw edge highlights
    p.stroke(100, 100, 120);
    p.strokeWeight(1);
    p.line(screenX, 0, screenX, this.gapY);
    p.line(screenX, this.gapY + this.gapSize, screenX, CANVAS_HEIGHT);
    p.line(screenX + this.width, 0, screenX + this.width, this.gapY);
    p.line(screenX + this.width, this.gapY + this.gapSize, 
           screenX + this.width, CANVAS_HEIGHT);
    
    p.pop();
  }
  
  checkCollision(player) {
    const bounds = player.getBounds();
    
    // Check collision with top barrier
    if (this.p.collideRectRect(
      bounds.x, bounds.y, bounds.width, bounds.height,
      this.x, 0, this.width, this.gapY
    )) {
      return true;
    }
    
    // Check collision with bottom barrier
    if (this.p.collideRectRect(
      bounds.x, bounds.y, bounds.width, bounds.height,
      this.x, this.gapY + this.gapSize, this.width, 
      CANVAS_HEIGHT - (this.gapY + this.gapSize)
    )) {
      return true;
    }
    
    return false;
  }
}

export class MovingObstacle extends Obstacle {
  constructor(p, x, gapY, gapSize, width, speed, amplitude) {
    super(p, x, gapY, gapSize, width);
    this.type = 'moving';
    this.speed = speed;
    this.amplitude = amplitude;
    this.initialGapY = gapY;
    this.phase = 0;
    this.color = [80, 60, 60];
    this.highlightColor = [100, 80, 80];
  }
  
  update() {
    this.phase += this.speed;
    this.gapY = this.initialGapY + Math.sin(this.phase) * this.amplitude;
  }
}

export class Diamond {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.collected = false;
    this.size = 15;
    this.rotation = 0;
    this.rotationSpeed = 0.05;
    this.pulsePhase = 0;
    this.pulseSpeed = 0.1;
  }
  
  update() {
    if (!this.collected) {
      this.rotation += this.rotationSpeed;
      this.pulsePhase += this.pulseSpeed;
    }
  }
  
  draw(cameraOffsetX) {
    if (this.collected) return;
    
    const p = this.p;
    const screenX = this.x - cameraOffsetX;
    
    // Only draw if on screen
    if (screenX < -50 || screenX > CANVAS_WIDTH + 50) {
      return;
    }
    
    p.push();
    p.translate(screenX, this.y);
    p.rotate(this.rotation);
    
    // Pulse effect
    const pulse = 1 + p.sin(this.pulsePhase) * 0.2;
    const currentSize = this.size * pulse;
    
    // Draw diamond shape
    p.fill(100, 200, 255, 200);
    p.stroke(150, 220, 255);
    p.strokeWeight(2);
    p.beginShape();
    p.vertex(0, -currentSize / 2);
    p.vertex(currentSize / 2, 0);
    p.vertex(0, currentSize / 2);
    p.vertex(-currentSize / 2, 0);
    p.endShape(p.CLOSE);
    
    // Inner shine
    p.fill(255, 255, 255, 150);
    p.noStroke();
    p.beginShape();
    p.vertex(0, -currentSize / 4);
    p.vertex(currentSize / 4, 0);
    p.vertex(0, currentSize / 4);
    p.vertex(-currentSize / 4, 0);
    p.endShape(p.CLOSE);
    
    p.pop();
  }
  
  checkCollection(player) {
    if (this.collected) return false;
    
    const bounds = player.getBounds();
    const distance = this.p.dist(
      this.x, this.y,
      bounds.x + bounds.width / 2, 
      bounds.y + bounds.height / 2
    );
    
    if (distance < (this.size + bounds.width / 2)) {
      this.collected = true;
      return true;
    }
    
    return false;
  }
}