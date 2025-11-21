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
    this.tailTiming = null; // Store timing when tail crosses judgment line
    // Calculate visual length for hold notes
    this.holdLength = holdDuration * NOTE_SPEED;
  }

  update() {
    if (!this.hit || this.type === NOTE_TYPE_HOLD) {
      this.y += this.speed;
    }

    // Check if note passed judgment line
    if (this.type === NOTE_TYPE_HOLD) {
      // For hold notes, check if the tail (top) has passed
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
    // For hold notes, check timing based on tail position
    const tailY = this.y - this.holdLength;
    const distance = Math.abs(tailY - JUDGMENT_LINE_Y);
    if (distance <= PERFECT_TIMING) return "Perfect";
    if (distance <= GREAT_TIMING) return "Great";
    if (distance <= GOOD_TIMING) return "Good";
    return "Miss";
  }

  canRelease() {
    // Check if tail is in release range
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
      // Check if the tail of the note has passed beyond the good timing window
      const tailY = this.y - this.holdLength;
      if (tailY > JUDGMENT_LINE_Y + GOOD_TIMING) {
        // Auto-release if player held too long
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
      // Check if release timing is good
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

    // Calculate the tail position (top of the hold bar)
    const tailY = this.y - this.holdLength;
    
    // Render the long bar (the hold trail that extends upward)
    p.noStroke();
    
    // If holding, show which part has been held
    if (this.isHolding) {
      // Held portion (green)
      const heldLength = this.holdProgress * this.speed;
      if (heldLength > 0) {
        p.fill(100, 255, 100, 200);
        p.rect(this.x - 15, this.y - heldLength, 30, heldLength, 5, 5, 0, 0);
      }
      
      // Remaining portion (lighter green)
      const remainingLength = this.holdLength - heldLength;
      if (remainingLength > 0) {
        p.fill(100, 200, 100, 150);
        p.rect(this.x - 15, tailY, 30, remainingLength, 0, 0, 5, 5);
      }
    } else {
      // Not holding yet - show full bar in light green
      p.fill(100, 200, 100, 180);
      p.rect(this.x - 15, tailY, 30, this.holdLength, 5);
    }

    // Render tail dot (release point)
    // Outer glow on the tail (top circle)
    p.noStroke();
    p.fill(100, 255, 100, 100);
    p.ellipse(this.x, tailY, this.size * 1.2, this.size * 1.2);

    // Main circle at the tail (top)
    p.stroke(255, 255, 255);
    p.strokeWeight(2);
    p.fill(50, 200, 50);
    p.ellipse(this.x, tailY, this.size, this.size);

    // Inner detail on tail
    p.noStroke();
    p.fill(150, 255, 150);
    p.ellipse(this.x, tailY, this.size * 0.4, this.size * 0.4);

    // Release indicator text on the tail
    if (this.isHolding) {
      p.noStroke();
      p.fill(255);
      p.textSize(10);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("RELEASE", this.x, tailY);
    }

    // Outer glow on the head (bottom circle)
    p.noStroke();
    p.fill(100, 255, 100, 100);
    p.ellipse(this.x, this.y, this.size * 1.2, this.size * 1.2);

    // Main circle at the head (bottom)
    p.stroke(255, 255, 255);
    p.strokeWeight(2);
    p.fill(50, 200, 50);
    p.ellipse(this.x, this.y, this.size, this.size);

    // Hold indicator text on the head
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

    // Render as a special single note with distinct visual
    // Outer glow
    p.noStroke();
    p.fill(255, 200, 50, 100);
    p.ellipse(this.x, this.y, this.size * 1.3, this.size * 1.3);

    // Main circle with gradient effect
    p.stroke(255, 255, 255);
    p.strokeWeight(2);
    p.fill(255, 180, 0);
    p.ellipse(this.x, this.y, this.size, this.size);

    // Inner circles for visual flair
    p.noStroke();
    p.fill(255, 220, 100, 200);
    p.ellipse(this.x - 8, this.y, this.size * 0.3, this.size * 0.3);
    p.ellipse(this.x + 8, this.y, this.size * 0.3, this.size * 0.3);
    
    // Center indicator
    p.fill(255, 240, 150);
    p.ellipse(this.x, this.y, this.size * 0.25, this.size * 0.25);
  }
}