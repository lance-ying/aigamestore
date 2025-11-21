import { CENTER_X, CENTER_Y } from './globals.js';

export class Projectile {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = 6;
    this.radius = 4;
    this.isActive = true;
    this.maxDistance = 200; // Max travel distance from center
    this.startX = x;
    this.startY = y;
  }

  update() {
    if (!this.isActive) return;

    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;

    // Check if too far from center
    const distFromCenter = Math.sqrt(
      Math.pow(this.x - CENTER_X, 2) + Math.pow(this.y - CENTER_Y, 2)
    );

    if (distFromCenter > CENTER_X || distFromCenter > CENTER_Y) {
      this.isActive = false;
    }
  }

  draw(p) {
    if (!this.isActive) return;

    p.push();
    p.fill(255, 255, 100);
    p.noStroke();
    p.circle(this.x, this.y, this.radius * 2);
    
    // Trail effect
    p.fill(255, 200, 100, 100);
    p.circle(this.x - Math.cos(this.angle) * 5, this.y - Math.sin(this.angle) * 5, this.radius);
    p.pop();
  }
}