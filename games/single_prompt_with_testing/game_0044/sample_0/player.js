// player.js - Player avatar entity

import { CANVAS_WIDTH, CANVAS_HEIGHT, EXPRESSIONS } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.size = 80;
    this.expression = "NEUTRAL";
    this.expressionIndex = 0;
    this.isPerformingAction = false;
    this.actionTimer = 0;
    this.actionDuration = 30; // frames
    this.zoomed = false;
    this.moveSpeed = 4;
    this.bobOffset = 0;
    this.bobSpeed = 0.1;
  }

  update(p) {
    // Smooth movement towards target
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    
    if (Math.abs(dx) > 0.5) {
      this.x += dx * 0.15;
    } else {
      this.x = this.targetX;
    }
    
    if (Math.abs(dy) > 0.5) {
      this.y += dy * 0.15;
    } else {
      this.y = this.targetY;
    }

    // Bob animation
    this.bobOffset += this.bobSpeed;

    // Update action timer
    if (this.isPerformingAction) {
      this.actionTimer--;
      if (this.actionTimer <= 0) {
        this.isPerformingAction = false;
      }
    }
  }

  moveUp() {
    this.targetY = Math.max(this.size, this.targetY - 40);
  }

  moveDown() {
    this.targetY = Math.min(CANVAS_HEIGHT - this.size, this.targetY + 40);
  }

  moveLeft() {
    this.targetX = Math.max(this.size, this.targetX - 40);
  }

  moveRight() {
    this.targetX = Math.min(CANVAS_WIDTH - this.size, this.targetX + 40);
  }

  changeExpression() {
    this.expressionIndex = (this.expressionIndex + 1) % EXPRESSIONS.length;
    this.expression = EXPRESSIONS[this.expressionIndex];
  }

  setExpression(expr) {
    this.expression = expr;
    this.expressionIndex = EXPRESSIONS.indexOf(expr);
  }

  performAction() {
    this.isPerformingAction = true;
    this.actionTimer = this.actionDuration;
  }

  toggleZoom() {
    this.zoomed = !this.zoomed;
  }

  draw(p) {
    p.push();
    
    const displaySize = this.zoomed ? this.size * 1.5 : this.size;
    const yOffset = Math.sin(this.bobOffset) * 3;
    
    // Action effect
    if (this.isPerformingAction) {
      const actionProgress = this.actionTimer / this.actionDuration;
      p.push();
      p.noFill();
      p.stroke(255, 150, 255, 200 * actionProgress);
      p.strokeWeight(3);
      const rippleSize = displaySize * (1.5 - actionProgress * 0.5);
      p.ellipse(this.x, this.y + yOffset, rippleSize, rippleSize);
      p.pop();
    }

    // Shadow
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.ellipse(this.x, CANVAS_HEIGHT - 10, displaySize * 0.8, 15);

    // Body
    p.fill(255, 220, 200);
    p.stroke(50);
    p.strokeWeight(2);
    p.ellipse(this.x, this.y + yOffset + displaySize * 0.3, displaySize * 0.7, displaySize * 0.8);

    // Head
    p.fill(255, 230, 210);
    p.ellipse(this.x, this.y + yOffset, displaySize, displaySize);

    // Hair
    p.fill(100, 60, 180);
    p.noStroke();
    p.arc(this.x, this.y + yOffset - displaySize * 0.1, displaySize, displaySize * 0.9, p.PI, p.TWO_PI);
    // Hair decorations
    p.fill(255, 150, 200);
    p.ellipse(this.x - displaySize * 0.3, this.y + yOffset - displaySize * 0.2, displaySize * 0.15);
    p.ellipse(this.x + displaySize * 0.3, this.y + yOffset - displaySize * 0.2, displaySize * 0.15);

    // Eyes
    this.drawEyes(p, displaySize, yOffset);

    // Mouth
    this.drawMouth(p, displaySize, yOffset);

    // Blush
    if (this.expression === "HAPPY" || this.expression === "SURPRISED") {
      p.fill(255, 150, 150, 100);
      p.noStroke();
      p.ellipse(this.x - displaySize * 0.25, this.y + yOffset + displaySize * 0.1, displaySize * 0.15, displaySize * 0.1);
      p.ellipse(this.x + displaySize * 0.25, this.y + yOffset + displaySize * 0.1, displaySize * 0.15, displaySize * 0.1);
    }

    p.pop();
  }

  drawEyes(p, size, yOffset) {
    p.push();
    p.fill(255);
    p.stroke(50);
    p.strokeWeight(2);

    const eyeSize = size * 0.15;
    const eyeY = this.y + yOffset - size * 0.1;

    if (this.expression === "SURPRISED") {
      // Wide eyes
      p.ellipse(this.x - size * 0.2, eyeY, eyeSize * 1.3, eyeSize * 1.5);
      p.ellipse(this.x + size * 0.2, eyeY, eyeSize * 1.3, eyeSize * 1.5);
      p.fill(50);
      p.noStroke();
      p.ellipse(this.x - size * 0.2, eyeY, eyeSize * 0.8, eyeSize * 0.8);
      p.ellipse(this.x + size * 0.2, eyeY, eyeSize * 0.8, eyeSize * 0.8);
    } else if (this.expression === "SAD") {
      // Sad eyes
      p.arc(this.x - size * 0.2, eyeY, eyeSize, eyeSize, p.PI, p.TWO_PI);
      p.arc(this.x + size * 0.2, eyeY, eyeSize, eyeSize, p.PI, p.TWO_PI);
      p.fill(50);
      p.noStroke();
      p.ellipse(this.x - size * 0.2, eyeY - eyeSize * 0.2, eyeSize * 0.5, eyeSize * 0.5);
      p.ellipse(this.x + size * 0.2, eyeY - eyeSize * 0.2, eyeSize * 0.5, eyeSize * 0.5);
    } else {
      // Normal/Happy eyes
      p.ellipse(this.x - size * 0.2, eyeY, eyeSize, eyeSize);
      p.ellipse(this.x + size * 0.2, eyeY, eyeSize, eyeSize);
      p.fill(50);
      p.noStroke();
      p.ellipse(this.x - size * 0.2, eyeY, eyeSize * 0.6, eyeSize * 0.6);
      p.ellipse(this.x + size * 0.2, eyeY, eyeSize * 0.6, eyeSize * 0.6);
      
      // Highlights
      p.fill(255);
      p.ellipse(this.x - size * 0.18, eyeY - eyeSize * 0.15, eyeSize * 0.2, eyeSize * 0.2);
      p.ellipse(this.x + size * 0.22, eyeY - eyeSize * 0.15, eyeSize * 0.2, eyeSize * 0.2);
    }

    p.pop();
  }

  drawMouth(p, size, yOffset) {
    p.push();
    const mouthY = this.y + yOffset + size * 0.25;

    p.noFill();
    p.stroke(50);
    p.strokeWeight(2);

    if (this.expression === "HAPPY") {
      p.arc(this.x, mouthY, size * 0.3, size * 0.2, 0, p.PI);
    } else if (this.expression === "SAD") {
      p.arc(this.x, mouthY + size * 0.1, size * 0.3, size * 0.2, p.PI, p.TWO_PI);
    } else if (this.expression === "SURPRISED") {
      p.fill(50);
      p.ellipse(this.x, mouthY, size * 0.15, size * 0.2);
    } else {
      p.line(this.x - size * 0.15, mouthY, this.x + size * 0.15, mouthY);
    }

    p.pop();
  }
}