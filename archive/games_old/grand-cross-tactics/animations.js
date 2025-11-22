// animations.js - Animation and visual effects
import { gameState } from './globals.js';

export class DamageNumber {
  constructor(p, x, y, value, isHeal = false) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.value = value;
    this.isHeal = isHeal;
    this.life = 800; // milliseconds
    this.startTime = Date.now();
    this.startY = y;
  }

  update() {
    const elapsed = Date.now() - this.startTime;
    return elapsed < this.life;
  }

  render() {
    const p = this.p;
    const elapsed = Date.now() - this.startTime;
    const progress = elapsed / this.life;
    const alpha = 255 * (1 - progress);
    const yOffset = -40 * progress;

    p.push();
    p.fill(this.isHeal ? 50 : 255, this.isHeal ? 205 : 69, this.isHeal ? 50 : 0, alpha);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    p.text(this.value, this.x, this.startY + yOffset);
    p.pop();
  }
}

export class AttackAnimation {
  constructor(p, fromX, fromY, toX, toY) {
    this.p = p;
    this.fromX = fromX;
    this.fromY = fromY;
    this.toX = toX;
    this.toY = toY;
    this.life = 100; // milliseconds
    this.startTime = Date.now();
  }

  update() {
    const elapsed = Date.now() - this.startTime;
    return elapsed < this.life;
  }

  render() {
    const p = this.p;
    
    p.push();
    p.stroke(255, 215, 0);
    p.strokeWeight(3);
    p.line(this.fromX, this.fromY, this.toX, this.toY);
    
    // Flash on target
    p.fill(255, 215, 0, 100);
    p.noStroke();
    p.circle(this.toX, this.toY, 30);
    p.pop();
  }
}

export function updateAnimations(p) {
  // Update turn animations
  for (let i = gameState.turnAnimations.length - 1; i >= 0; i--) {
    if (!gameState.turnAnimations[i].update()) {
      gameState.turnAnimations.splice(i, 1);
    } else {
      gameState.turnAnimations[i].render();
    }
  }

  // Update damage numbers
  for (let i = gameState.damageNumbers.length - 1; i >= 0; i--) {
    if (!gameState.damageNumbers[i].update()) {
      gameState.damageNumbers.splice(i, 1);
    } else {
      gameState.damageNumbers[i].render();
    }
  }
}