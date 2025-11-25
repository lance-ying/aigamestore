// request.js - Viewer request entity

import { CANVAS_WIDTH, REQUEST_TYPES } from './globals.js';

export class Request {
  constructor(p, type, y) {
    this.type = type;
    this.x = CANVAS_WIDTH + 50;
    this.y = y;
    this.targetY = y;
    this.speed = 1.5;
    this.size = 60;
    this.lifetime = 300; // frames
    this.age = 0;
    this.completed = false;
    this.missed = false;
    this.matchZone = 100; // x position where player needs to match
    this.p = p;
  }

  update() {
    this.x -= this.speed;
    this.age++;

    // Move towards target Y (for vertical spacing adjustments)
    if (Math.abs(this.y - this.targetY) > 0.5) {
      this.y += (this.targetY - this.y) * 0.1;
    }

    // Check if missed
    if (this.x < -this.size && !this.completed) {
      this.missed = true;
    }

    return !this.missed && this.x > -this.size;
  }

  isInMatchZone() {
    return this.x < this.matchZone && this.x > this.matchZone - 50;
  }

  checkMatch(player) {
    if (!this.isInMatchZone() || this.completed) {
      return false;
    }

    let matches = false;

    switch (this.type) {
      case REQUEST_TYPES.MOVE_UP:
        matches = player.y < 150;
        break;
      case REQUEST_TYPES.MOVE_DOWN:
        matches = player.y > 250;
        break;
      case REQUEST_TYPES.MOVE_LEFT:
        matches = player.x < 200;
        break;
      case REQUEST_TYPES.MOVE_RIGHT:
        matches = player.x > 400;
        break;
      case REQUEST_TYPES.EXPRESSION_HAPPY:
        matches = player.expression === "HAPPY";
        break;
      case REQUEST_TYPES.EXPRESSION_SAD:
        matches = player.expression === "SAD";
        break;
      case REQUEST_TYPES.EXPRESSION_SURPRISED:
        matches = player.expression === "SURPRISED";
        break;
      case REQUEST_TYPES.ACTION:
        matches = player.isPerformingAction;
        break;
    }

    if (matches) {
      this.completed = true;
    }

    return matches;
  }

  draw(p) {
    p.push();

    // Progress bar
    const progress = 1 - (this.age / this.lifetime);
    const barWidth = this.size * 0.8;
    const barHeight = 4;

    p.fill(40, 40, 60);
    p.noStroke();
    p.rect(this.x - barWidth / 2, this.y - this.size / 2 - 10, barWidth, barHeight);
    
    const barColor = progress > 0.5 ? [100, 255, 100] : progress > 0.25 ? [255, 200, 100] : [255, 100, 100];
    p.fill(...barColor);
    p.rect(this.x - barWidth / 2, this.y - this.size / 2 - 10, barWidth * progress, barHeight);

    // Request box
    if (this.completed) {
      p.fill(100, 255, 100, 200);
    } else {
      p.fill(255, 255, 255, 240);
    }
    p.stroke(80, 80, 120);
    p.strokeWeight(2);
    p.rect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size, 8);

    // Icon based on request type
    p.noStroke();
    p.fill(60, 60, 100);

    switch (this.type) {
      case REQUEST_TYPES.MOVE_UP:
        this.drawArrow(p, 0);
        break;
      case REQUEST_TYPES.MOVE_DOWN:
        this.drawArrow(p, 180);
        break;
      case REQUEST_TYPES.MOVE_LEFT:
        this.drawArrow(p, 270);
        break;
      case REQUEST_TYPES.MOVE_RIGHT:
        this.drawArrow(p, 90);
        break;
      case REQUEST_TYPES.EXPRESSION_HAPPY:
        this.drawEmoji(p, "HAPPY");
        break;
      case REQUEST_TYPES.EXPRESSION_SAD:
        this.drawEmoji(p, "SAD");
        break;
      case REQUEST_TYPES.EXPRESSION_SURPRISED:
        this.drawEmoji(p, "SURPRISED");
        break;
      case REQUEST_TYPES.ACTION:
        this.drawStar(p);
        break;
    }

    // Match zone indicator
    if (this.isInMatchZone() && !this.completed) {
      p.noFill();
      p.stroke(255, 200, 100);
      p.strokeWeight(3);
      p.rect(this.x - this.size / 2 - 3, this.y - this.size / 2 - 3, this.size + 6, this.size + 6, 10);
    }

    p.pop();
  }

  drawArrow(p, rotation) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(p.radians(rotation));
    
    p.fill(60, 60, 100);
    p.beginShape();
    p.vertex(0, -this.size * 0.25);
    p.vertex(this.size * 0.2, this.size * 0.1);
    p.vertex(this.size * 0.08, this.size * 0.1);
    p.vertex(this.size * 0.08, this.size * 0.25);
    p.vertex(-this.size * 0.08, this.size * 0.25);
    p.vertex(-this.size * 0.08, this.size * 0.1);
    p.vertex(-this.size * 0.2, this.size * 0.1);
    p.endShape(p.CLOSE);
    
    p.pop();
  }

  drawEmoji(p, type) {
    p.push();
    
    // Face
    p.fill(255, 220, 150);
    p.ellipse(this.x, this.y, this.size * 0.6, this.size * 0.6);

    // Eyes
    p.fill(60);
    if (type === "SURPRISED") {
      p.ellipse(this.x - this.size * 0.12, this.y - this.size * 0.08, this.size * 0.08, this.size * 0.1);
      p.ellipse(this.x + this.size * 0.12, this.y - this.size * 0.08, this.size * 0.08, this.size * 0.1);
    } else {
      p.ellipse(this.x - this.size * 0.12, this.y - this.size * 0.08, this.size * 0.06, this.size * 0.06);
      p.ellipse(this.x + this.size * 0.12, this.y - this.size * 0.08, this.size * 0.06, this.size * 0.06);
    }

    // Mouth
    p.noFill();
    p.stroke(60);
    p.strokeWeight(2);
    if (type === "HAPPY") {
      p.arc(this.x, this.y + this.size * 0.08, this.size * 0.2, this.size * 0.15, 0, p.PI);
    } else if (type === "SAD") {
      p.arc(this.x, this.y + this.size * 0.15, this.size * 0.2, this.size * 0.15, p.PI, p.TWO_PI);
    } else if (type === "SURPRISED") {
      p.fill(60);
      p.noStroke();
      p.ellipse(this.x, this.y + this.size * 0.1, this.size * 0.08, this.size * 0.1);
    }

    p.pop();
  }

  drawStar(p) {
    p.push();
    p.translate(this.x, this.y);
    
    p.fill(255, 200, 100);
    p.noStroke();
    p.beginShape();
    for (let i = 0; i < 5; i++) {
      const angle = (i * p.TWO_PI) / 5 - p.HALF_PI;
      const x = Math.cos(angle) * this.size * 0.25;
      const y = Math.sin(angle) * this.size * 0.25;
      p.vertex(x, y);
      
      const angle2 = ((i + 0.5) * p.TWO_PI) / 5 - p.HALF_PI;
      const x2 = Math.cos(angle2) * this.size * 0.12;
      const y2 = Math.sin(angle2) * this.size * 0.12;
      p.vertex(x2, y2);
    }
    p.endShape(p.CLOSE);
    
    p.pop();
  }

  getDescription() {
    const descriptions = {
      [REQUEST_TYPES.MOVE_UP]: "Move Up",
      [REQUEST_TYPES.MOVE_DOWN]: "Move Down",
      [REQUEST_TYPES.MOVE_LEFT]: "Move Left",
      [REQUEST_TYPES.MOVE_RIGHT]: "Move Right",
      [REQUEST_TYPES.EXPRESSION_HAPPY]: "Happy Face",
      [REQUEST_TYPES.EXPRESSION_SAD]: "Sad Face",
      [REQUEST_TYPES.EXPRESSION_SURPRISED]: "Surprised Face",
      [REQUEST_TYPES.ACTION]: "Action!"
    };
    return descriptions[this.type] || "Unknown";
  }
}