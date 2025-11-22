// player.js - Player entity
import { CANVAS_WIDTH, JUDGMENT_LINE_Y, NUM_LANES, LANE_WIDTH } from './globals.js';

export class Player {
  constructor(p) {
    this.p = p;
    this.lane = Math.floor(NUM_LANES / 2); // Start in middle lane
    this.x = this.lane * LANE_WIDTH + LANE_WIDTH / 2;
    this.y = JUDGMENT_LINE_Y;
    this.targetX = this.x;
    this.moveSpeed = 15;
    this.size = 50;
    this.glowIntensity = 0;
  }

  moveLeft() {
    if (this.lane > 0) {
      this.lane--;
      this.targetX = this.lane * LANE_WIDTH + LANE_WIDTH / 2;
    }
  }

  moveRight() {
    if (this.lane < NUM_LANES - 1) {
      this.lane++;
      this.targetX = this.lane * LANE_WIDTH + LANE_WIDTH / 2;
    }
  }

  update() {
    // Smooth movement to target position
    if (Math.abs(this.x - this.targetX) > 1) {
      this.x += (this.targetX - this.x) * 0.3;
    } else {
      this.x = this.targetX;
    }

    // Update glow intensity
    this.glowIntensity *= 0.9;
  }

  triggerGlow() {
    this.glowIntensity = 1;
  }

  render() {
    const p = this.p;
    p.push();
    
    // Glow effect
    if (this.glowIntensity > 0) {
      p.noStroke();
      p.fill(100, 200, 255, this.glowIntensity * 100);
      p.ellipse(this.x, this.y, this.size * 2, this.size * 2);
    }

    // Player circle
    p.stroke(255, 255, 255);
    p.strokeWeight(3);
    p.fill(50, 150, 255);
    p.ellipse(this.x, this.y, this.size, this.size);

    // Inner detail
    p.noStroke();
    p.fill(150, 200, 255);
    p.ellipse(this.x, this.y, this.size * 0.5, this.size * 0.5);

    p.pop();
  }

  getScreenPosition() {
    return { x: this.x, y: this.y };
  }

  getGamePosition() {
    return { x: this.x, y: this.y };
  }
}