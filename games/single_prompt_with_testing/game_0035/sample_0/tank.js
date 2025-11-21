// tank.js - Tank entity

import { clamp } from './utils.js';
import { CANVAS_WIDTH } from './globals.js';

export class Tank {
  constructor(p, x, terrain, isPlayer = false) {
    this.p = p;
    this.x = x;
    this.terrain = terrain;
    this.y = terrain.getHeight(x) - 15;
    this.isPlayer = isPlayer;
    this.hp = 100;
    this.maxHp = 100;
    this.angle = isPlayer ? 45 : 135;
    this.width = 24;
    this.height = 12;
    this.turretLength = 18;
    this.color = isPlayer ? [50, 150, 255] : [255, 50, 50];
    this.alive = true;
  }

  update() {
    // Update position to follow terrain
    this.y = this.terrain.getHeight(this.x) - 15;
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
  }

  getTurretEnd() {
    const p = this.p;
    const rad = this.angle * p.PI / 180;
    return {
      x: this.x + p.cos(rad) * this.turretLength,
      y: this.y + p.sin(rad) * this.turretLength
    };
  }

  draw() {
    const p = this.p;
    
    if (!this.alive) return;

    p.push();
    
    // Draw tank body
    p.fill(...this.color);
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(this.x, this.y, this.width, this.height, 2);
    
    // Draw turret
    p.stroke(...this.color);
    p.strokeWeight(4);
    const turretEnd = this.getTurretEnd();
    p.line(this.x, this.y - 2, turretEnd.x, turretEnd.y);
    
    // Draw health bar
    const barWidth = 30;
    const barHeight = 4;
    const barY = this.y - 25;
    
    p.noStroke();
    p.fill(50);
    p.rect(this.x, barY, barWidth, barHeight);
    
    const healthWidth = (this.hp / this.maxHp) * barWidth;
    p.fill(this.hp > 30 ? 100 : 255, this.hp > 30 ? 255 : 100, 50);
    p.rectMode(p.CORNER);
    p.rect(this.x - barWidth / 2, barY - barHeight / 2, healthWidth, barHeight);
    
    p.pop();
  }

  getPosition() {
    return { x: this.x, y: this.y };
  }
}