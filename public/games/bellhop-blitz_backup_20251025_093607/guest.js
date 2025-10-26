// guest.js - Guest class and management
import { GRID_SIZE, gameState, GUEST_WAITING, GUEST_CHECKED_IN, GUEST_CHECKING_OUT, getCurrentLevelConfig, ROOM_DIRTY } from './globals.js';

export class Guest {
  constructor(x, y, p) {
    this.id = gameState.guestIdCounter++;
    this.status = GUEST_WAITING;
    this.waitX = x;
    this.waitY = y;
    this.x = x;
    this.y = y;
    this.assignedRoomId = null;
    this.satisfaction = 100;
    this.arrivalTime = Date.now();
    this.checkoutTime = null;
    this.color = [
      p.random([255, 200, 100]),
      p.random([200, 255, 100]),
      p.random([100, 200, 255])
    ];
  }

  update(p) {
    if (this.status === GUEST_WAITING) {
      const config = getCurrentLevelConfig();
      this.satisfaction -= config.guestImpatience * p.deltaTime / 1000;
      if (this.satisfaction <= 0) {
        this.status = 'LEFT_UNHAPPY';
        gameState.unhappyGuestCount++;
      }
    } else if (this.status === GUEST_CHECKED_IN) {
      if (Date.now() >= this.checkoutTime) {
        this.status = GUEST_CHECKING_OUT;
        const room = gameState.rooms.find(r => r.id === this.assignedRoomId);
        if (room) {
          room.status = ROOM_DIRTY;
          room.occupyingGuestId = null;
        }
      }
    }
  }

  draw(p) {
    if (this.status === 'PAID' || this.status === 'LEFT_UNHAPPY') return;

    p.push();
    
    let drawX, drawY;
    if (this.status === GUEST_WAITING) {
      drawX = this.waitX * GRID_SIZE;
      drawY = this.waitY * GRID_SIZE;
    } else if (this.status === GUEST_CHECKING_OUT) {
      drawX = this.x * GRID_SIZE + 2 * GRID_SIZE;
      drawY = this.y * GRID_SIZE + 1.5 * GRID_SIZE;
    } else {
      return;
    }

    p.fill(...this.color);
    p.noStroke();
    p.circle(drawX, drawY, 14);

    // Satisfaction bar
    if (this.status === GUEST_WAITING) {
      const barWidth = 20;
      const satPercent = this.satisfaction / 100;
      p.fill(50);
      p.rect(drawX - barWidth / 2, drawY - 20, barWidth, 3);
      p.fill(...(satPercent > 0.5 ? [100, 200, 100] : satPercent > 0.25 ? [200, 200, 100] : [200, 100, 100]));
      p.rect(drawX - barWidth / 2, drawY - 20, barWidth * satPercent, 3);
    }

    // $ sign for checkout
    if (this.status === GUEST_CHECKING_OUT) {
      p.fill(255, 220, 0);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(16);
      p.text('$', drawX, drawY - 15);
    }

    p.pop();
  }
}