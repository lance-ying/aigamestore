// note.js - Note entities
import { 
  JUDGMENT_LINE_Y, 
  NOTE_SPEED, 
  NOTE_SIZE, 
  LANE_WIDTH,
  NOTE_TYPE_SINGLE,
  NOTE_TYPE_HOLD,
  NOTE_TYPE_SWIPE,
  PERFECT_TIMING,
  GREAT_TIMING,
  GOOD_TIMING
} from './globals.js';

export class Note {
  constructor(p, lane, type = NOTE_TYPE_SINGLE, holdDuration = 0) {
    this.p = p;
    this.lane = lane;
    this.x = lane * LANE_WIDTH + LANE_WIDTH / 2;
    this.y = -50;
    this.type = type;
    this.speed = NOTE_SPEED;
    this.size = NOTE_SIZE;
    this.active = true;
    this.hit = false;
    this.holdDuration = holdDuration; // frames to hold
    this.holdProgress = 0;
    this.isHolding = false;
    this.holdComplete = false;
  }

  update() {
    if (!this.hit) {
      this.y += this.speed;
    }

    // Check if note passed judgment line
    if (this.y > JUDGMENT_LINE_Y + GOOD_TIMING && !this.hit) {
      this.active = false;
    }
  }

  canHit() {
    const distance = Math.abs(this.y - JUDGMENT_LINE_Y);
    return distance <= GOOD_TIMING;
  }

  getHitTiming() {
    const distance = Math.abs(this.y - JUDGMENT_LINE_Y);
    if (distance <= PERFECT_TIMING) return "Perfect";
    if (distance <= GREAT_TIMING) return "Great";
    if (distance <= GOOD_TIMING) return "Good";
    return "Miss";
  }

  startHold() {
    if (this.type === NOTE_TYPE_HOLD && this.canHit()) {
      this.isHolding = true;
      this.hit = true;
      return true;
    }
    return false;
  }

  updateHold() {
    if (this.isHolding && !this.holdComplete) {
      this.holdProgress++;
      if (this.holdProgress >= this.holdDuration) {
        this.holdComplete = true;
        this.active = false;
        return true;
      }
    }
    return false;
  }

  releaseHold() {
    if (this.isHolding) {
      this.isHolding = false;
      return this.holdComplete;
    }
    return false;
  }

  render() {
    const p = this.p;
    p.push();

    if (this.type === NOTE_TYPE_SINGLE) {
      this.renderSingleNote();
    } else if (this.type === NOTE_TYPE_HOLD) {
      this.renderHoldNote();
    } else if (this.type === NOTE_TYPE_SWIPE) {
      this.renderSwipeNote();
    }

    p.pop();
  }

  renderSingleNote() {
    const p = this.p;
    
    // Outer glow
    p.noStroke();
    p.fill(255, 100, 150, 100);
    p.ellipse(this.x, this.y, this.size * 1.2, this.size * 1.2);

    // Main circle
    p.stroke(255, 255, 255);
    p.strokeWeight(2);
    p.fill(255, 50, 100);
    p.ellipse(this.x, this.y, this.size, this.size);

    // Inner detail
    p.noStroke();
    p.fill(255, 150, 180);
    p.ellipse(this.x, this.y, this.size * 0.4, this.size * 0.4);
  }

  renderHoldNote() {
    const p = this.p;

    // Hold trail
    if (this.isHolding) {
      p.noStroke();
      const trailLength = this.holdDuration * this.speed;
      const progress = this.holdProgress / this.holdDuration;
      p.fill(100, 255, 100, 150);
      p.rect(this.x - 15, this.y, 30, trailLength * (1 - progress));
    }

    // Outer glow
    p.noStroke();
    p.fill(100, 255, 100, 100);
    p.rect(this.x - this.size * 0.7, this.y - this.size * 0.7, this.size * 1.4, this.size * 1.4, 5);

    // Main square
    p.stroke(255, 255, 255);
    p.strokeWeight(2);
    p.fill(50, 200, 50);
    p.rect(this.x - this.size * 0.5, this.y - this.size * 0.5, this.size, this.size, 5);

    // Hold indicator
    if (!this.hit) {
      p.noStroke();
      p.fill(150, 255, 150);
      p.rect(this.x - 10, this.y - 5, 20, 10, 2);
    }
  }

  renderSwipeNote() {
    const p = this.p;

    // Outer glow
    p.noStroke();
    p.fill(255, 200, 50, 100);
    for (let i = 0; i < 3; i++) {
      const offset = i * 15 - 15;
      p.ellipse(this.x + offset, this.y, this.size * 0.8, this.size * 0.8);
    }

    // Main circles
    p.stroke(255, 255, 255);
    p.strokeWeight(2);
    p.fill(255, 180, 0);
    for (let i = 0; i < 3; i++) {
      const offset = i * 15 - 15;
      p.ellipse(this.x + offset, this.y, this.size * 0.6, this.size * 0.6);
    }

    // Arrow indicator
    p.noStroke();
    p.fill(255, 220, 100);
    p.triangle(
      this.x + 20, this.y,
      this.x + 10, this.y - 8,
      this.x + 10, this.y + 8
    );
  }
}