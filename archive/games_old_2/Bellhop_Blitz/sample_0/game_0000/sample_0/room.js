// room.js - Room class and management
import { GRID_SIZE, ROOM_CLEAN, ROOM_DIRTY, ROOM_OCCUPIED } from './globals.js';

let roomIdCounter = 0;

export class Room {
  constructor(x, y, w, h) {
    this.id = roomIdCounter++;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.status = ROOM_CLEAN;
    this.occupyingGuestId = null;
  }

  draw(p) {
    p.push();
    p.strokeWeight(2);
    p.stroke(80, 60, 40);

    const colors = {
      [ROOM_CLEAN]: [200, 255, 200],
      [ROOM_DIRTY]: [160, 130, 100],
      [ROOM_OCCUPIED]: [200, 220, 255]
    };

    p.fill(...colors[this.status]);
    p.rect(
      this.x * GRID_SIZE,
      this.y * GRID_SIZE,
      this.w * GRID_SIZE,
      this.h * GRID_SIZE
    );

    // Room number
    p.fill(60);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text(
      this.id + 1,
      this.x * GRID_SIZE + this.w * GRID_SIZE / 2,
      this.y * GRID_SIZE + this.h * GRID_SIZE / 2
    );

    // Dirty indicator
    if (this.status === ROOM_DIRTY) {
      p.fill(100, 80, 60, 150);
      for (let i = 0; i < 3; i++) {
        const offsetX = (i - 1) * 10;
        const offsetY = 10;
        p.circle(
          this.x * GRID_SIZE + this.w * GRID_SIZE / 2 + offsetX,
          this.y * GRID_SIZE + this.h * GRID_SIZE / 2 + offsetY,
          6
        );
      }
    }

    p.pop();
  }
}