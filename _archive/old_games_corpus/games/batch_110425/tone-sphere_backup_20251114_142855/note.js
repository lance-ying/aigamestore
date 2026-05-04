// note.js - Note entity class

import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  NOTE_TYPE_REGULAR,
  NOTE_TYPE_ARROW,
  NOTE_TYPE_HOLD,
  NOTE_TYPE_SPECIAL,
  TARGET_RADIUS,
  PERFECT_RANGE,
  GREAT_RANGE,
  GOOD_RANGE,
  HIT_PERFECT,
  HIT_GREAT,
  HIT_GOOD,
  HIT_MISS
} from './globals.js';

export class Note {
  constructor(p, type, lane, spawnDistance, requiredKey = null, holdDuration = 0) {
    this.p = p;
    this.type = type;
    this.lane = lane; // 0-7 for different angles around the circle
    this.distance = spawnDistance;
    this.speed = 2 + (spawnDistance / 200) * 0.5;
    this.angle = (lane * p.TWO_PI) / 8;
    this.requiredKey = requiredKey;
    this.holdDuration = holdDuration;
    this.holdProgress = 0;
    this.isBeingHeld = false;
    this.hit = false;
    this.missed = false;
    this.alive = true;
    this.size = 20;
    this.pulsePhase = p.random(p.TWO_PI);
    
    // Visual properties - distinct colors per note type
    if (this.type === NOTE_TYPE_REGULAR) {
      // Blue for regular/circle notes (space)
      this.hue = 200;
      this.saturation = 80;
    } else if (this.type === NOTE_TYPE_SPECIAL) {
      // Gold for special/star notes (z)
      this.hue = 45;
      this.saturation = 100;
    } else if (this.type === NOTE_TYPE_HOLD) {
      // Purple for hold notes (shift)
      this.hue = 280;
      this.saturation = 70;
    } else {
      // Fallback to lane-based hue
      this.hue = (lane * 360) / 8;
      this.saturation = 70;
    }
    this.brightness = 200;
    this.glowIntensity = 0;
  }

  update() {
    if (!this.alive) return;

    // Move towards center
    this.distance -= this.speed;
    
    // Update hold note progress
    if (this.type === NOTE_TYPE_HOLD && this.isBeingHeld) {
      this.holdProgress += 1;
      if (this.holdProgress >= this.holdDuration) {
        this.hit = true;
        this.alive = false;
      }
    }

    // Check if note passed the target zone
    if (this.distance < -GOOD_RANGE && !this.hit) {
      this.missed = true;
      this.alive = false;
    }

    // Update visual effects
    this.glowIntensity = this.p.max(0, this.glowIntensity - 0.05);
  }

  checkHit(keyPressed) {
    if (this.hit || this.missed || !this.alive) return null;
    
    const distFromTarget = this.p.abs(this.distance - TARGET_RADIUS);
    
    // Check if the correct key was pressed
    if (this.requiredKey !== null && this.requiredKey !== keyPressed) {
      return null;
    }

    // For hold notes, start holding when the HEAD touches the target ring
    if (this.type === NOTE_TYPE_HOLD) {
      // Only start holding when the front edge is at or past the target radius
      if (this.distance <= TARGET_RADIUS + PERFECT_RANGE && this.distance >= TARGET_RADIUS - PERFECT_RANGE) {
        this.isBeingHeld = true;
        this.glowIntensity = 1;
        return null; // Don't score until hold is complete
      }
      return null;
    }

    // Regular hit detection
    if (distFromTarget <= PERFECT_RANGE) {
      this.hit = true;
      this.alive = false;
      return HIT_PERFECT;
    } else if (distFromTarget <= GREAT_RANGE) {
      this.hit = true;
      this.alive = false;
      return HIT_GREAT;
    } else if (distFromTarget <= GOOD_RANGE) {
      this.hit = true;
      this.alive = false;
      return HIT_GOOD;
    }
    
    return null;
  }

  releaseHold() {
    if (this.type === NOTE_TYPE_HOLD && this.isBeingHeld) {
      // Check if hold was completed
      if (this.holdProgress >= this.holdDuration * 0.9) {
        this.hit = true;
        this.alive = false;
        return HIT_PERFECT;
      } else if (this.holdProgress >= this.holdDuration * 0.7) {
        this.hit = true;
        this.alive = false;
        return HIT_GREAT;
      } else {
        this.missed = true;
        this.alive = false;
        return HIT_MISS;
      }
    }
    return null;
  }

  getPosition() {
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    const x = centerX + this.p.cos(this.angle) * this.distance;
    const y = centerY + this.p.sin(this.angle) * this.distance;
    return { x, y };
  }

  render() {
    if (!this.alive) return;

    const pos = this.getPosition();
    this.p.push();
    this.p.translate(pos.x, pos.y);
    this.p.rotate(this.angle);

    // Pulsing effect
    const pulse = 1 + this.p.sin(this.p.frameCount * 0.1 + this.pulsePhase) * 0.1;
    const size = this.size * pulse;

    // Glow effect
    if (this.glowIntensity > 0) {
      this.p.noStroke();
      this.p.fill(this.hue, 80, 100, this.glowIntensity * 0.3);
      this.p.circle(0, 0, size * 2.5);
    }

    // Main note body
    this.p.colorMode(this.p.HSB);
    
    switch (this.type) {
      case NOTE_TYPE_REGULAR:
        this.renderRegularNote(size);
        break;
      case NOTE_TYPE_ARROW:
        this.renderArrowNote(size);
        break;
      case NOTE_TYPE_HOLD:
        this.renderHoldNote(size);
        break;
      case NOTE_TYPE_SPECIAL:
        this.renderSpecialNote(size);
        break;
    }

    this.p.colorMode(this.p.RGB);
    this.p.pop();
  }

  renderRegularNote(size) {
    // Blue circular note
    this.p.fill(this.hue, this.saturation, this.brightness);
    this.p.stroke(this.hue, this.saturation + 20, 255);
    this.p.strokeWeight(3);
    this.p.circle(0, 0, size);
    
    // Inner detail
    this.p.fill(this.hue, this.saturation - 20, 255);
    this.p.circle(0, 0, size * 0.4);
  }

  renderArrowNote(size) {
    this.p.fill(this.hue, 80, this.brightness);
    this.p.stroke(this.hue, 90, 255);
    this.p.strokeWeight(2);
    
    // Arrow shape
    this.p.beginShape();
    this.p.vertex(size * 0.6, 0);
    this.p.vertex(-size * 0.3, -size * 0.4);
    this.p.vertex(-size * 0.3, -size * 0.15);
    this.p.vertex(-size * 0.6, -size * 0.15);
    this.p.vertex(-size * 0.6, size * 0.15);
    this.p.vertex(-size * 0.3, size * 0.15);
    this.p.vertex(-size * 0.3, size * 0.4);
    this.p.endShape(this.p.CLOSE);
  }

  renderHoldNote(size) {
    const progress = this.holdProgress / this.holdDuration;
    
    // Calculate visual length based on hold duration
    // This represents the length of the note that needs to pass through
    const visualLength = this.holdDuration * this.speed * 1.2; // Length based on how long it takes to hold
    const width = size * 1.2;
    
    // Draw the long trailing bar (the "tail" of the hold note)
    // This extends backwards (away from center) along the radial direction
    if (!this.isBeingHeld || this.holdProgress < this.holdDuration) {
      const remainingLength = this.isBeingHeld 
        ? visualLength * (1 - progress) 
        : visualLength;
      
      // Outer glow for the trail - extends in +X direction (radially outward)
      this.p.noStroke();
      this.p.fill(this.hue, this.saturation * 0.4, this.brightness * 0.5, 0.3);
      this.p.rect(0, -width * 0.6, remainingLength, width * 1.2, 4);
      
      // Main trail body - extends in +X direction (radially outward)
      this.p.fill(this.hue, this.saturation * 0.6, this.brightness * 0.7, 0.6);
      this.p.rect(0, -width * 0.5, remainingLength, width, 3);
      
      // Gradient effect - multiple segments for depth
      for (let i = 0; i < 5; i++) {
        const segmentX = (remainingLength / 5) * i;
        const segmentWidth = remainingLength / 5;
        const alpha = 0.3 + (i / 5) * 0.4; // Fade as it goes back
        this.p.fill(this.hue, this.saturation * 0.7, this.brightness * 0.8, alpha);
        this.p.rect(segmentX, -width * 0.45, segmentWidth, width * 0.9, 2);
      }
      
      // Add visual markers along the length
      const numMarkers = Math.min(8, Math.floor(remainingLength / 20));
      for (let i = 1; i <= numMarkers; i++) {
        const markerX = (remainingLength / (numMarkers + 1)) * i;
        this.p.fill(this.hue, this.saturation + 20, 255, 0.5);
        this.p.rect(markerX - 1, -width * 0.5, 2, width);
      }
    }
    
    // Main hold note HEAD (the part that hits the target)
    // Positioned at the front (negative X, toward center)
    this.p.fill(this.hue, this.saturation, this.brightness);
    this.p.stroke(this.hue, this.saturation + 20, 255);
    this.p.strokeWeight(3);
    this.p.rect(-size * 0.6, -width * 0.5, size * 1.2, width, 5);
    
    // Progress bar (when being held)
    if (this.isBeingHeld) {
      // Background for progress
      this.p.fill(this.hue, this.saturation * 0.3, this.brightness * 0.5);
      this.p.noStroke();
      this.p.rect(-size * 0.45, -width * 0.4, size * 0.9, width * 0.8, 3);
      
      // Progress fill
      this.p.fill(this.hue + 20, this.saturation + 30, 255);
      this.p.rect(-size * 0.45, -width * 0.4, size * 0.9 * progress, width * 0.8, 3);
      
      // Pulsing glow when holding
      const holdPulse = this.p.sin(this.p.frameCount * 0.2) * 0.3 + 0.7;
      this.p.noFill();
      this.p.stroke(this.hue, this.saturation + 20, 255, 200 * holdPulse);
      this.p.strokeWeight(3);
      this.p.rect(-size * 0.6, -width * 0.5, size * 1.2, width, 5);
      
      // Extra glow around the head
      this.p.noStroke();
      this.p.fill(this.hue, this.saturation, 255, 0.2 * holdPulse);
      this.p.rect(-size * 0.8, -width * 0.7, size * 1.6, width * 1.4, 8);
    } else {
      // When not held yet, add a subtle pulse to the head
      const approachPulse = this.p.sin(this.p.frameCount * 0.15) * 0.2 + 0.8;
      this.p.noFill();
      this.p.stroke(this.hue, this.saturation + 20, 255, 150 * approachPulse);
      this.p.strokeWeight(2);
      this.p.rect(-size * 0.6, -width * 0.5, size * 1.2, width, 5);
    }
    
    // Hold indicator icon/text on the head
    this.p.fill(255, 255, 255);
    this.p.noStroke();
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(10);
    this.p.text("HOLD", 0, 0);
    
    // Add small triangular arrow pointing to center (showing direction)
    this.p.fill(this.hue, this.saturation + 30, 255, 200);
    this.p.triangle(
      -size * 0.7, -width * 0.2,
      -size * 0.7, width * 0.2,
      -size * 0.5, 0
    );
  }

  renderSpecialNote(size) {
    // Golden star note
    this.p.fill(this.hue, this.saturation, this.brightness);
    this.p.stroke(this.hue, this.saturation, 255);
    this.p.strokeWeight(3);
    
    // Star shape
    this.p.beginShape();
    for (let i = 0; i < 5; i++) {
      const angle = (i * this.p.TWO_PI) / 5 - this.p.HALF_PI;
      const x = this.p.cos(angle) * size * 0.6;
      const y = this.p.sin(angle) * size * 0.6;
      this.p.vertex(x, y);
      
      const angleInner = angle + this.p.TWO_PI / 10;
      const xInner = this.p.cos(angleInner) * size * 0.25;
      const yInner = this.p.sin(angleInner) * size * 0.25;
      this.p.vertex(xInner, yInner);
    }
    this.p.endShape(this.p.CLOSE);
    
    // Inner glow for extra visibility
    this.p.fill(this.hue, this.saturation - 20, 255);
    this.p.noStroke();
    this.p.circle(0, 0, size * 0.3);
  }
}