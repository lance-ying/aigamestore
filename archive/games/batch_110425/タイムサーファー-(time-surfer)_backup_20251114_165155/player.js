import { gameState, CANVAS_HEIGHT, GROUND_HEIGHT } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = 3;
    this.vy = 0;
    this.radius = 12;
    this.diving = false;
    this.gravity = 0.4;
    this.maxVy = 12;
    this.alive = true;
    this.color = [100, 200, 255];
    this.trail = [];
    this.trailMaxLength = 15;
  }

  update() {
    if (!this.alive) return;

    // Apply gravity
    if (this.diving) {
      this.vy += this.gravity * 1.5;
      this.vx = 3 + this.p.abs(this.vy) * 0.3; // Speed boost when diving
    } else {
      this.vy -= this.gravity * 0.8; // Rise when not diving
      this.vx = 3;
    }

    // Clamp vertical velocity
    this.vy = this.p.constrain(this.vy, -this.maxVy, this.maxVy);

    // Update position
    this.y += this.vy;

    // Constrain to canvas bounds
    if (this.y < this.radius) {
      this.y = this.radius;
      this.vy = 0;
    }
    if (this.y > CANVAS_HEIGHT - this.radius) {
      this.y = CANVAS_HEIGHT - this.radius;
      this.vy = 0;
    }

    // Update trail
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.trailMaxLength) {
      this.trail.shift();
    }

    // Log player info
    if (this.p.frameCount % 30 === 0) {
      this.p.logs.player_info.push({
        screen_x: this.x,
        screen_y: this.y,
        game_x: this.x + gameState.scrollOffset,
        game_y: this.y,
        framecount: this.p.frameCount
      });
    }
  }

  draw() {
    const p = this.p;
    
    // Draw trail
    p.push();
    p.noFill();
    for (let i = 0; i < this.trail.length - 1; i++) {
      const alpha = p.map(i, 0, this.trail.length - 1, 0, 150);
      p.stroke(this.color[0], this.color[1], this.color[2], alpha);
      p.strokeWeight(p.map(i, 0, this.trail.length - 1, 2, 8));
      p.line(this.trail[i].x, this.trail[i].y, this.trail[i + 1].x, this.trail[i + 1].y);
    }
    p.pop();

    // Draw player body
    p.push();
    p.fill(...this.color);
    p.stroke(255);
    p.strokeWeight(2);
    p.circle(this.x, this.y, this.radius * 2);
    
    // Draw direction indicator
    const angle = this.p.atan2(this.vy, this.vx);
    const indicatorLength = this.radius * 1.5;
    p.stroke(255, 255, 100);
    p.strokeWeight(3);
    p.line(
      this.x,
      this.y,
      this.x + p.cos(angle) * indicatorLength,
      this.y + p.sin(angle) * indicatorLength
    );
    
    // Draw eyes
    p.fill(255);
    p.noStroke();
    p.circle(this.x - 4, this.y - 3, 4);
    p.circle(this.x + 4, this.y - 3, 4);
    p.fill(0);
    p.circle(this.x - 4, this.y - 3, 2);
    p.circle(this.x + 4, this.y - 3, 2);
    p.pop();
  }

  dive() {
    this.diving = true;
  }

  rise() {
    this.diving = false;
  }

  getState() {
    return {
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      diving: this.diving
    };
  }

  setState(state) {
    this.x = state.x;
    this.y = state.y;
    this.vx = state.vx;
    this.vy = state.vy;
    this.diving = state.diving;
  }
}