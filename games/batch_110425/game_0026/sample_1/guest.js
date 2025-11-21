// guest.js - Guest entity

import { GRID_SIZE } from './globals.js';

export class Guest {
  constructor(p, targetAttraction) {
    this.x = p.random(50, 100);
    this.y = p.random(50, 100);
    this.targetAttraction = targetAttraction;
    this.state = "WALKING"; // WALKING, VISITING, LEAVING
    this.visitTime = 0;
    this.maxVisitTime = 180;
    this.speed = 0.5;
    this.color = [p.random(100, 255), p.random(100, 255), p.random(100, 255)];
    this.satisfactionGiven = false;
  }

  update(p, gameState) {
    if (this.state === "WALKING") {
      if (!this.targetAttraction || !this.targetAttraction.isBuilt) {
        this.state = "LEAVING";
        return;
      }

      const targetX = this.targetAttraction.gridX * GRID_SIZE + (this.targetAttraction.size * GRID_SIZE) / 2;
      const targetY = this.targetAttraction.gridY * GRID_SIZE + (this.targetAttraction.size * GRID_SIZE) / 2;

      const dx = targetX - this.x;
      const dy = targetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 5) {
        this.state = "VISITING";
        this.targetAttraction.visitorCount++;
      } else {
        this.x += (dx / dist) * this.speed * gameState.timescale;
        this.y += (dy / dist) * this.speed * gameState.timescale;
      }
    } else if (this.state === "VISITING") {
      this.visitTime++;
      if (this.visitTime >= this.maxVisitTime) {
        this.state = "LEAVING";
        if (this.targetAttraction) {
          this.targetAttraction.visitorCount--;
        }
        if (!this.satisfactionGiven) {
          gameState.satisfaction += this.targetAttraction.satisfaction;
          this.satisfactionGiven = true;
        }
      }
    } else if (this.state === "LEAVING") {
      this.x -= this.speed * gameState.timescale;
      this.y -= this.speed * gameState.timescale;
    }
  }

  render(p, cameraOffsetX, cameraOffsetY) {
    const screenX = this.x - cameraOffsetX;
    const screenY = this.y - cameraOffsetY;

    p.fill(...this.color);
    p.ellipse(screenX, screenY, 8, 8);

    if (this.state === "VISITING") {
      p.fill(255, 200, 0, 150);
      p.ellipse(screenX, screenY - 10, 6, 6);
    }
  }

  isDone() {
    return this.state === "LEAVING" && (this.x < 0 || this.y < 0);
  }
}