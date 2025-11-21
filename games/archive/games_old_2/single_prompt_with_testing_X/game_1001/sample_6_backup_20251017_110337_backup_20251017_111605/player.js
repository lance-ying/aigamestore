import { gameState, PLAYER_SIZE, HIT_ZONE_X, LANE_Y_POSITIONS, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(p) {
    this.p = p;
    this.x = HIT_ZONE_X;
    this.y = LANE_Y_POSITIONS[0];
    this.targetY = this.y;
    this.size = PLAYER_SIZE;
    this.color = [100, 200, 255];
    this.animationFrame = 0;
    this.isHitting = false;
    this.hitAnimationTimer = 0;
  }

  update() {
    // Smooth lane transition
    const lerpSpeed = 0.2;
    this.targetY = LANE_Y_POSITIONS[gameState.currentLane];
    this.y = this.p.lerp(this.y, this.targetY, lerpSpeed);
    
    this.animationFrame += 0.1;
    
    if (this.hitAnimationTimer > 0) {
      this.hitAnimationTimer--;
    } else {
      this.isHitting = false;
    }
  }

  hit() {
    this.isHitting = true;
    this.hitAnimationTimer = 10;
  }

  draw() {
    this.p.push();
    this.p.translate(this.x, this.y);
    
    // Character body with glow effect
    if (gameState.specialActive) {
      this.p.fill(255, 255, 100, 100);
      this.p.noStroke();
      this.p.ellipse(0, 0, this.size * 1.5, this.size * 1.5);
    }
    
    // Main body
    const pulseSize = this.isHitting ? this.size * 1.2 : this.size;
    this.p.fill(...(gameState.specialActive ? [255, 255, 100] : this.color));
    this.p.noStroke();
    this.p.ellipse(0, 0, pulseSize, pulseSize);
    
    // Eyes
    const bobOffset = this.p.sin(this.animationFrame) * 2;
    this.p.fill(255);
    this.p.ellipse(-8, bobOffset - 5, 10, 12);
    this.p.ellipse(8, bobOffset - 5, 10, 12);
    
    this.p.fill(0);
    this.p.ellipse(-8, bobOffset - 3, 5, 6);
    this.p.ellipse(8, bobOffset - 3, 5, 6);
    
    // Mouth
    this.p.noFill();
    this.p.stroke(0);
    this.p.strokeWeight(2);
    if (this.isHitting) {
      this.p.arc(0, 5, 15, 15, 0, this.p.PI);
    } else {
      this.p.line(-5, 10, 5, 10);
    }
    
    this.p.pop();
  }
}