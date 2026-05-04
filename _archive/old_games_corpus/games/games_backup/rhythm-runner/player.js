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
    this.isDamaged = false;
    this.damageTimer = 0;
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
    
    if (this.damageTimer > 0) {
      this.damageTimer--;
    } else {
      this.isDamaged = false;
    }
  }

  hit() {
    this.isHitting = true;
    this.hitAnimationTimer = 10;
  }

  takeDamage() {
    this.isDamaged = true;
    this.damageTimer = 30;
  }

  draw() {
    this.p.push();
    this.p.translate(this.x, this.y);
    
    // Damage flash effect
    if (this.isDamaged && this.damageTimer % 6 < 3) {
      this.p.fill(255, 50, 50, 150);
      this.p.noStroke();
      this.p.ellipse(0, 0, this.size * 1.8, this.size * 1.8);
    }
    
    // Character body with glow effect
    if (gameState.specialActive) {
      this.p.fill(255, 255, 100, 100);
      this.p.noStroke();
      this.p.ellipse(0, 0, this.size * 1.5, this.size * 1.5);
    }
    
    // Main body
    const pulseSize = this.isHitting ? this.size * 1.2 : this.size;
    
    // Change color when damaged
    let bodyColor = this.color;
    if (this.isDamaged && this.damageTimer % 6 < 3) {
      bodyColor = [255, 100, 100];
    } else if (gameState.specialActive) {
      bodyColor = [255, 255, 100];
    }
    
    this.p.fill(...bodyColor);
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
    
    // Mouth - show pain expression when damaged
    this.p.noFill();
    this.p.stroke(0);
    this.p.strokeWeight(2);
    if (this.isDamaged) {
      // Frown when damaged
      this.p.arc(0, 15, 15, 10, this.p.PI, 0);
    } else if (this.isHitting) {
      // Smile when hitting
      this.p.arc(0, 5, 15, 15, 0, this.p.PI);
    } else {
      // Neutral
      this.p.line(-5, 10, 5, 10);
    }
    
    this.p.pop();
  }
}