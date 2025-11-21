import { gameState, NOTE_SPEED_BASE, NOTE_SIZE, HIT_ZONE_X, HIT_ZONE_WIDTH, CANVAS_WIDTH } from './globals.js';

export class Note {
  constructor(p, lane, type = 'normal') {
    this.p = p;
    this.lane = lane; // 0 or 1
    this.type = type; // 'normal', 'hold', 'special'
    this.x = CANVAS_WIDTH;
    this.size = NOTE_SIZE;
    this.speed = NOTE_SPEED_BASE * gameState.difficulty;
    this.hit = false;
    this.missed = false;
    this.active = true;
    
    // Visual properties
    this.rotation = 0;
    this.rotationSpeed = 0.05;
    this.pulsePhase = this.p.random(this.p.TWO_PI);
    
    // Type-specific properties
    if (type === 'hold') {
      this.holdDuration = 30;
      this.holdTimer = 0;
      this.isHolding = false;
      this.color = [255, 150, 255];
    } else if (type === 'special') {
      this.color = [255, 215, 0];
      this.scoreValue = 200;
    } else {
      this.color = [255, 100, 100];
      this.scoreValue = 100;
    }
  }

  update() {
    this.x -= this.speed;
    this.rotation += this.rotationSpeed;
    this.pulsePhase += 0.1;
    
    // Check if note passed the hit zone without being hit
    if (!this.hit && !this.missed && this.x < HIT_ZONE_X - HIT_ZONE_WIDTH) {
      this.missed = true;
      this.active = false;
      gameState.missedNotes++;
      gameState.combo = 0;
      return;
    }
    
    // Remove if off screen
    if (this.x < -this.size) {
      this.active = false;
    }
  }

  isInHitZone() {
    const hitZoneCenter = HIT_ZONE_X;
    const distance = Math.abs(this.x - hitZoneCenter);
    return distance < HIT_ZONE_WIDTH / 2;
  }

  getHitAccuracy() {
    const hitZoneCenter = HIT_ZONE_X;
    const distance = Math.abs(this.x - hitZoneCenter);
    const perfectRange = HIT_ZONE_WIDTH / 4;
    const goodRange = HIT_ZONE_WIDTH / 2;
    
    if (distance < perfectRange) return 'perfect';
    if (distance < goodRange) return 'good';
    return 'ok';
  }

  attemptHit() {
    if (this.hit || this.missed) return false;
    
    if (this.isInHitZone()) {
      this.hit = true;
      this.active = false; // Clear the note when hit
      const accuracy = this.getHitAccuracy();
      
      let scoreBonus = 1.0;
      if (accuracy === 'perfect') {
        scoreBonus = 1.5;
        gameState.perfectHits++;
      } else if (accuracy === 'good') {
        scoreBonus = 1.2;
      }
      
      const finalScore = Math.floor(this.scoreValue * scoreBonus * gameState.scoreMultiplier);
      gameState.score += finalScore;
      gameState.combo++;
      gameState.notesHit++;
      
      if (gameState.combo > gameState.maxCombo) {
        gameState.maxCombo = gameState.combo;
      }
      
      // Build special meter
      gameState.specialMeter = Math.min(100, gameState.specialMeter + 5);
      
      return accuracy;
    }
    return false;
  }

  draw() {
    if (!this.active || this.hit) return;
    
    this.p.push();
    this.p.translate(this.x, 0);
    
    // Note glow
    const pulseSize = this.size + this.p.sin(this.pulsePhase) * 3;
    this.p.noStroke();
    this.p.fill(...this.color, 50);
    
    if (this.lane === 0) {
      this.p.ellipse(0, 150, pulseSize * 1.3, pulseSize * 1.3);
    } else {
      this.p.ellipse(0, 250, pulseSize * 1.3, pulseSize * 1.3);
    }
    
    // Main note
    this.p.fill(...this.color);
    this.p.stroke(255);
    this.p.strokeWeight(2);
    
    this.p.push();
    if (this.lane === 0) {
      this.p.translate(0, 150);
    } else {
      this.p.translate(0, 250);
    }
    this.p.rotate(this.rotation);
    
    if (this.type === 'hold') {
      this.p.rect(-this.size/2, -this.size/2, this.size, this.size);
    } else if (this.type === 'special') {
      this.p.beginShape();
      for (let i = 0; i < 5; i++) {
        const angle = (i * this.p.TWO_PI / 5) - this.p.PI / 2;
        const radius = i % 2 === 0 ? this.size / 2 : this.size / 4;
        this.p.vertex(this.p.cos(angle) * radius, this.p.sin(angle) * radius);
      }
      this.p.endShape(this.p.CLOSE);
    } else {
      this.p.ellipse(0, 0, this.size, this.size);
    }
    
    this.p.pop();
    this.p.pop();
  }
}