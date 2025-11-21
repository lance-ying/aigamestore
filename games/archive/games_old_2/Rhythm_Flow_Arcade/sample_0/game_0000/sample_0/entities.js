// entities.js - Game entities (Notes, Particles, etc.)

import { gameState, LANE_COLORS, NOTE_WIDTH, NOTE_HEIGHT, HIT_ZONE_Y, LANE_WIDTH, LANE_START_X } from './globals.js';

export class Note {
  constructor(time, lane, type, duration = 0) {
    this.id = Date.now() + Math.random();
    this.time = time;
    this.lane = lane;
    this.type = type; // 'tap' or 'hold'
    this.duration = duration;
    this.y = -NOTE_HEIGHT;
    this.status = 'active'; // 'active', 'hit', 'missed'
    this.holdPressed = false;
    this.holdStartTime = 0;
    this.holdScore = 0;
  }
  
  update(p, scrollSpeed) {
    if (this.status !== 'active') return;
    
    const timeSinceStart = gameState.songTimeElapsed;
    const timeUntilHit = this.time - timeSinceStart;
    
    // Calculate y position based on time until hit
    this.y = HIT_ZONE_Y - (timeUntilHit / 1000) * scrollSpeed;
    
    // Check if note passed hit zone (miss)
    if (this.y > HIT_ZONE_Y + 100 && this.status === 'active') {
      this.status = 'missed';
      return 'miss';
    }
    
    return null;
  }
  
  draw(p, scrollSpeed) {
    const x = LANE_START_X + this.lane * LANE_WIDTH + LANE_WIDTH / 2;
    const color = LANE_COLORS[this.lane];
    
    if (this.type === 'tap') {
      p.push();
      p.fill(...color);
      p.stroke(255);
      p.strokeWeight(2);
      p.rectMode(p.CENTER);
      p.rect(x, this.y, NOTE_WIDTH, NOTE_HEIGHT, 5);
      p.pop();
    } else if (this.type === 'hold') {
      const holdHeight = (this.duration / 1000) * scrollSpeed;
      p.push();
      p.fill(...color, 180);
      p.stroke(255);
      p.strokeWeight(2);
      p.rectMode(p.CENTER);
      p.rect(x, this.y + holdHeight / 2, NOTE_WIDTH, holdHeight + NOTE_HEIGHT, 5);
      
      // Draw hold head
      p.fill(...color);
      p.rect(x, this.y, NOTE_WIDTH, NOTE_HEIGHT, 5);
      
      // Draw hold tail
      p.rect(x, this.y + holdHeight, NOTE_WIDTH, NOTE_HEIGHT, 5);
      p.pop();
    }
  }
  
  checkHit(p, keyCode, timingWindow) {
    if (this.status !== 'active') return null;
    
    const laneKey = gameState.keyBindings[this.lane];
    if (keyCode !== laneKey) return null;
    
    const timeSinceStart = gameState.songTimeElapsed;
    const timeDiff = Math.abs(this.time - timeSinceStart);
    
    if (this.type === 'tap') {
      if (timeDiff <= timingWindow) {
        this.status = 'hit';
        
        // Determine accuracy
        if (timeDiff <= 50) return 'perfect';
        if (timeDiff <= 100) return 'great';
        if (timeDiff <= timingWindow) return 'good';
      }
    } else if (this.type === 'hold') {
      // Check if hold note head is in timing window
      if (timeDiff <= timingWindow && !this.holdPressed) {
        this.holdPressed = true;
        this.holdStartTime = timeSinceStart;
        return 'hold_start';
      }
    }
    
    return null;
  }
  
  updateHold(p, keyPressed) {
    if (this.type !== 'hold' || !this.holdPressed || this.status !== 'active') return null;
    
    const timeSinceStart = gameState.songTimeElapsed;
    const holdEnd = this.time + this.duration;
    
    if (!keyPressed) {
      // Released too early
      if (timeSinceStart < holdEnd - 100) {
        this.status = 'missed';
        return 'miss';
      } else {
        this.status = 'hit';
        return 'hold_complete';
      }
    }
    
    // Successfully completed hold
    if (timeSinceStart >= holdEnd) {
      this.status = 'hit';
      return 'hold_complete';
    }
    
    // Add score for holding
    const holdTime = timeSinceStart - this.holdStartTime;
    const intervals = Math.floor(holdTime / 100);
    if (intervals > this.holdScore) {
      this.holdScore = intervals;
      return 'hold_interval';
    }
    
    return null;
  }
}

export class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = (Math.random() - 0.5) * 4 - 2;
    this.life = 1.0;
    this.color = color;
    this.size = Math.random() * 6 + 4;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // Gravity
    this.life -= 0.02;
  }
  
  draw(p) {
    p.push();
    p.noStroke();
    p.fill(...this.color, this.life * 255);
    p.circle(this.x, this.y, this.size * this.life);
    p.pop();
  }
  
  isDead() {
    return this.life <= 0;
  }
}

export class HitFeedback {
  constructor(accuracy, x, y) {
    this.accuracy = accuracy;
    this.x = x;
    this.y = y;
    this.life = 1.0;
    this.offsetY = 0;
  }
  
  update() {
    this.life -= 0.05;
    this.offsetY -= 1;
  }
  
  draw(p) {
    const texts = {
      perfect: { text: 'PERFECT!', color: [255, 215, 0] },
      great: { text: 'GREAT!', color: [100, 255, 100] },
      good: { text: 'GOOD!', color: [150, 200, 255] },
      miss: { text: 'MISS!', color: [255, 80, 80] }
    };
    
    const info = texts[this.accuracy];
    if (!info) return;
    
    p.push();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(30);
    p.fill(...info.color, this.life * 255);
    p.strokeWeight(2);
    p.stroke(0, 0, 0, this.life * 200);
    p.text(info.text, this.x, this.y + this.offsetY);
    p.pop();
  }
  
  isDead() {
    return this.life <= 0;
  }
}