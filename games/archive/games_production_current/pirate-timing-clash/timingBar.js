// timingBar.js - Timing bar for attack mechanic

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class TimingBar {
  constructor(p, speed, perfectWidth, greatWidth, goodWidth) {
    this.p = p;
    this.x = CANVAS_WIDTH / 2;
    this.y = CANVAS_HEIGHT - 60;
    this.width = 400;
    this.height = 40;
    this.baseSpeed = speed;
    this.speed = speed;
    
    // Base zone widths
    this.basePerfectWidth = perfectWidth;
    this.baseGreatWidth = greatWidth;
    this.baseGoodWidth = goodWidth;
    
    // Current zone widths (can be modified by abilities)
    this.perfectWidth = perfectWidth;
    this.greatWidth = greatWidth;
    this.goodWidth = goodWidth;
    
    // Target
    this.targetX = this.x - this.width / 2;
    this.targetWidth = 4;
    this.targetSpeed = speed;
    this.direction = 1;
    
    this.isActive = false;
    this.hasPressed = false;
    this.result = null;
    
    this.currentAbility = null;
  }

  reset() {
    this.targetX = this.x - this.width / 2;
    this.direction = 1;
    this.hasPressed = false;
    this.result = null;
  }

  activate(ability = null) {
    this.isActive = true;
    this.reset();
    
    // Apply ability modifiers
    if (ability) {
      this.currentAbility = ability;
      this.targetSpeed = this.baseSpeed * ability.timingSpeedMod;
      this.perfectWidth = this.basePerfectWidth * ability.perfectWidthMod;
      this.greatWidth = this.baseGreatWidth * ability.greatWidthMod;
      this.goodWidth = this.baseGoodWidth * ability.goodWidthMod;
    } else {
      this.targetSpeed = this.baseSpeed;
      this.perfectWidth = this.basePerfectWidth;
      this.greatWidth = this.baseGreatWidth;
      this.goodWidth = this.baseGoodWidth;
    }
  }

  deactivate() {
    this.isActive = false;
    this.currentAbility = null;
  }

  update() {
    if (!this.isActive || this.hasPressed) return;
    
    // Move target
    this.targetX += this.targetSpeed * this.direction;
    
    // Bounce at edges
    const leftEdge = this.x - this.width / 2;
    const rightEdge = this.x + this.width / 2;
    
    if (this.targetX <= leftEdge) {
      this.targetX = leftEdge;
      this.direction = 1;
    } else if (this.targetX >= rightEdge) {
      this.targetX = rightEdge;
      this.direction = -1;
    }
  }

  draw() {
    if (!this.isActive) return;
    
    const p = this.p;
    p.push();
    
    // Bar background
    p.fill(80, 80, 80);
    p.noStroke();
    p.rect(this.x - this.width / 2, this.y - this.height / 2, 
           this.width, this.height, 5);
    
    // Center line for zones
    const centerX = this.x;
    
    // GOOD zones (outermost, orange)
    p.fill(255, 150, 50, 150);
    p.rect(centerX - this.goodWidth / 2, this.y - this.height / 2,
           this.goodWidth, this.height, 5);
    
    // GREAT zones (middle, yellow)
    p.fill(255, 220, 50, 180);
    p.rect(centerX - this.greatWidth / 2, this.y - this.height / 2,
           this.greatWidth, this.height, 5);
    
    // PERFECT zone (center, green)
    p.fill(50, 255, 100, 200);
    p.rect(centerX - this.perfectWidth / 2, this.y - this.height / 2,
           this.perfectWidth, this.height, 5);
    
    // Target line
    p.fill(255, 255, 255);
    p.rect(this.targetX - this.targetWidth / 2, this.y - this.height / 2 - 5,
           this.targetWidth, this.height + 10);
    
    // Instruction text with ability name
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    const abilityText = this.currentAbility ? this.currentAbility.name : "Attack";
    p.text(`Press SPACE for ${abilityText}!`, this.x, this.y - this.height / 2 - 25);
    
    p.pop();
  }

  checkHit() {
    if (this.hasPressed) return null;
    
    this.hasPressed = true;
    
    const centerX = this.x;
    const distance = Math.abs(this.targetX - centerX);
    
    // Check zones from most accurate to least
    if (distance <= this.perfectWidth / 2) {
      this.result = "PERFECT";
      return { type: "PERFECT", damage: 1.5, gaugeAdd: 30 };
    } else if (distance <= this.greatWidth / 2) {
      this.result = "GREAT";
      return { type: "GREAT", damage: 1.2, gaugeAdd: 20 };
    } else if (distance <= this.goodWidth / 2) {
      this.result = "GOOD";
      return { type: "GOOD", damage: 1.0, gaugeAdd: 10 };
    } else {
      this.result = "MISS";
      return { type: "MISS", damage: 0, gaugeAdd: 0 };
    }
  }
}