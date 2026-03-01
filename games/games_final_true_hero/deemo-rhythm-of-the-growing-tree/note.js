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
  constructor(p, lane, type = NOTE_TYPE_SINGLE, holdDuration = 0, speed = NOTE_SPEED) {
    this.p = p;
    this.lane = lane;
    this.x = lane * LANE_WIDTH + LANE_WIDTH / 2;
    this.y = -50;
    this.type = type;
    this.speed = speed || NOTE_SPEED;
    this.size = NOTE_SIZE;
    this.active = true;
    this.hit = false;
    this.holdDuration = holdDuration;
    this.holdProgress = 0;
    this.isHolding = false;
    this.holdComplete = false;
    this.tailTiming = null;
    this.holdLength = holdDuration * this.speed;
  }

  update() {
    if (!this.hit || this.type === NOTE_TYPE_HOLD) {
      this.y += this.speed;
    }

    if (this.type === NOTE_TYPE_HOLD) {
      const tailY = this.y - this.holdLength;
      if (this.y > JUDGMENT_LINE_Y + GOOD_TIMING && tailY > JUDGMENT_LINE_Y + GOOD_TIMING && !this.hit) {
        this.active = false;
      }
    } else {
      if (this.y > JUDGMENT_LINE_Y + GOOD_TIMING && !this.hit) {
        this.active = false;
      }
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

  getTailTiming() {
    const tailY = this.y - this.holdLength;
    const distance = Math.abs(tailY - JUDGMENT_LINE_Y);
    if (distance <= PERFECT_TIMING) return "Perfect";
    if (distance <= GREAT_TIMING) return "Great";
    if (distance <= GOOD_TIMING) return "Good";
    return "Miss";
  }

  getTailHitTiming() {
    const tailY = this.y - this.holdLength;
    const distance = Math.abs(tailY - JUDGMENT_LINE_Y);
    if (distance <= PERFECT_TIMING) return "Perfect";
    if (distance <= GREAT_TIMING) return "Great";
    if (distance <= GOOD_TIMING) return "Good";
    return "Miss";
  }

  canRelease() {
    const tailY = this.y - this.holdLength;
    const distance = Math.abs(tailY - JUDGMENT_LINE_Y);
    return distance <= GOOD_TIMING;
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
      const tailY = this.y - this.holdLength;
      if (tailY > JUDGMENT_LINE_Y + GOOD_TIMING) {
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
      const timing = this.getTailHitTiming();
      this.holdComplete = (timing !== "Miss");
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
    
    p.noStroke();
    p.fill(255, 100, 150, 100);
    p.ellipse(this.x, this.y, this.size * 1.2, this.size * 1.2);

    p.stroke(255, 255, 255);
    p.strokeWeight(2);
    p.fill(255, 50, 100);
    p.ellipse(this.x, this.y, this.size, this.size);

    p.noStroke();
    p.fill(255, 150, 180);
    p.ellipse(this.x, this.y, this.size * 0.4, this.size * 0.4);
  }

  renderHoldNote() {
    const p = this.p;

    const tailY = this.y - this.holdLength;
    
    p.noStroke();
    
    if (this.isHolding) {
      const heldLength = this.holdProgress * this.speed;
      if (heldLength > 0) {
        p.fill(100, 255, 100, 200);
        p.rect(this.x - 15, this.y - heldLength, 30, heldLength, 5, 5, 0, 0);
      }
      
      const remainingLength = this.holdLength - heldLength;
      if (remainingLength > 0) {
        p.fill(100, 200, 100, 150);
        p.rect(this.x - 15, tailY, 30, remainingLength, 0, 0, 5, 5);
      }
    } else {
      p.fill(100, 200, 100, 180);
      p.rect(this.x - 15, tailY, 30, this.holdLength, 5);
    }

    p.noStroke();
    p.fill(100, 255, 100, 100);
    p.ellipse(this.x, tailY, this.size * 1.2, this.size * 1.2);

    p.stroke(255, 255, 255);
    p.strokeWeight(2);
    p.fill(50, 200, 50);
    p.ellipse(this.x, tailY, this.size, this.size);

    p.noStroke();
    p.fill(150, 255, 150);
    p.ellipse(this.x, tailY, this.size * 0.4, this.size * 0.4);

    if (this.isHolding) {
      p.noStroke();
      p.fill(255);
      p.textSize(10);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("RELEASE", this.x, tailY);
    }

    p.noStroke();
    p.fill(100, 255, 100, 100);
    p.ellipse(this.x, this.y, this.size * 1.2, this.size * 1.2);

    p.stroke(255, 255, 255);
    p.strokeWeight(2);
    p.fill(50, 200, 50);
    p.ellipse(this.x, this.y, this.size, this.size);

    if (!this.hit) {
      p.noStroke();
      p.fill(255);
      p.textSize(12);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("HOLD", this.x, this.y);
    }
  }

  renderSwipeNote() {
    const p = this.p;

    p.noStroke();
    p.fill(255, 200, 50, 100);
    p.ellipse(this.x, this.y, this.size * 1.3, this.size * 1.3);

    p.stroke(255, 255, 255);
    p.strokeWeight(2);
    p.fill(255, 180, 0);
    p.ellipse(this.x, this.y, this.size, this.size);

    p.noStroke();
    p.fill(255, 220, 100, 200);
    p.ellipse(this.x - 8, this.y, this.size * 0.3, this.size * 0.3);
    p.ellipse(this.x + 8, this.y, this.size * 0.3, this.size * 0.3);
    
    p.fill(255, 240, 150);
    p.ellipse(this.x, this.y, this.size * 0.25, this.size * 0.25);
  }
}