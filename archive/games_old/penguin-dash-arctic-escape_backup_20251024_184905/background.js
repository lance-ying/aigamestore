// background.js - Background and environment rendering

import { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, LANE_Y_POSITIONS } from './globals.js';

export class Background {
  constructor(p) {
    this.p = p;
    this.mountainOffset = 0;
    this.icebergOffset = 0;
    this.groundOffset = 0;
  }

  update(scrollSpeed) {
    this.mountainOffset -= scrollSpeed * 0.2;
    this.icebergOffset -= scrollSpeed * 0.5;
    this.groundOffset -= scrollSpeed;

    if (this.groundOffset <= -100) {
      this.groundOffset = 0;
    }
  }

  draw() {
    const p = this.p;

    // Sky
    p.fill(180, 220, 255);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, GROUND_Y);

    // Mountains (parallax)
    p.fill(220, 230, 240);
    for (let i = 0; i < 4; i++) {
      const x = (i * 200 + this.mountainOffset) % (CANVAS_WIDTH + 200) - 100;
      p.triangle(x, GROUND_Y, x + 80, GROUND_Y - 100, x + 160, GROUND_Y);
    }

    // Icebergs (parallax)
    p.fill(200, 220, 240);
    for (let i = 0; i < 3; i++) {
      const x = (i * 300 + this.icebergOffset) % (CANVAS_WIDTH + 300) - 150;
      p.triangle(x, GROUND_Y, x + 60, GROUND_Y - 60, x + 120, GROUND_Y);
    }

    // Ground/ice
    p.fill(240, 250, 255);
    p.rect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

    // Ground texture (scrolling ice pattern)
    p.stroke(220, 235, 245);
    p.strokeWeight(1);
    for (let i = 0; i < 8; i++) {
      const x = (i * 100 + this.groundOffset) % (CANVAS_WIDTH + 100);
      p.line(x, GROUND_Y, x + 50, GROUND_Y + (CANVAS_HEIGHT - GROUND_Y));
    }

    // Lane dividers
    p.stroke(200, 220, 240);
    p.strokeWeight(2);
    for (let i = 0; i < LANE_Y_POSITIONS.length - 1; i++) {
      const y = LANE_Y_POSITIONS[i] + 40;
      p.line(0, y, CANVAS_WIDTH, y);
    }
  }

  reset() {
    this.mountainOffset = 0;
    this.icebergOffset = 0;
    this.groundOffset = 0;
  }
}