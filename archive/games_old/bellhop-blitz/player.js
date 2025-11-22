// player.js - Player character class and logic
import { GRID_SIZE, gameState, ROOM_DIRTY, ROOM_CLEAN, GUEST_WAITING, GUEST_CHECKING_OUT } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.gridX = Math.floor(x / GRID_SIZE);
    this.gridY = Math.floor(y / GRID_SIZE);
    this.size = 16;
    this.speed = 3;
    this.isMoving = false;
    this.direction = 0; // 0: down, 1: right, 2: up, 3: left
    this.taskProgress = 0;
    this.taskDuration = 0;
    this.currentTask = null;
    this.interactRange = 1.5;
  }

  update(p) {
    if (this.currentTask) {
      this.taskProgress += p.deltaTime;
      if (this.taskProgress >= this.taskDuration) {
        this.completeTask(p);
      }
      return;
    }

    // Move towards target
    if (this.x !== this.targetX || this.y !== this.targetY) {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const moveSpeed = this.speed * gameState.upgrades.playerSpeed;

      if (dist < moveSpeed) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.isMoving = false;
        this.gridX = Math.floor(this.x / GRID_SIZE);
        this.gridY = Math.floor(this.y / GRID_SIZE);
      } else {
        this.x += (dx / dist) * moveSpeed;
        this.y += (dy / dist) * moveSpeed;
        this.isMoving = true;
      }
    }
  }

  moveTo(gridX, gridY, walls) {
    if (this.currentTask) return;

    const newGridX = Math.max(0, Math.min(gridX, Math.floor(600 / GRID_SIZE) - 1));
    const newGridY = Math.max(0, Math.min(gridY, Math.floor(400 / GRID_SIZE) - 1));

    if (!walls[newGridY] || !walls[newGridY][newGridX]) {
      this.targetX = newGridX * GRID_SIZE + GRID_SIZE / 2;
      this.targetY = newGridY * GRID_SIZE + GRID_SIZE / 2;
      
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      if (Math.abs(dx) > Math.abs(dy)) {
        this.direction = dx > 0 ? 1 : 3;
      } else {
        this.direction = dy > 0 ? 0 : 2;
      }
    }
  }

  startTask(type, target, duration) {
    this.currentTask = { type, target };
    this.taskProgress = 0;
    this.taskDuration = duration;
  }

  completeTask(p) {
    if (!this.currentTask) return;

    const { type, target } = this.currentTask;
    
    if (type === 'clean') {
      target.status = ROOM_CLEAN;
      gameState.currentMoney += 100;
      gameState.totalRevenueEarned += 100;
      gameState.score += 10;
      this.addFloatingText('+$100 +10pts', target.x * GRID_SIZE + target.w * GRID_SIZE / 2, target.y * GRID_SIZE);
    } else if (type === 'checkin') {
      const cleanRoom = gameState.rooms.find(r => r.status === ROOM_CLEAN);
      if (cleanRoom) {
        cleanRoom.status = 'OCCUPIED';
        cleanRoom.occupyingGuestId = target.id;
        target.status = 'CHECKED_IN';
        target.assignedRoomId = cleanRoom.id;
        target.x = cleanRoom.x;
        target.y = cleanRoom.y;
        target.checkoutTime = Date.now() + p.random(15000, 25000);
        gameState.currentMoney += 150;
        gameState.totalRevenueEarned += 150;
        gameState.score += 20;
        this.addFloatingText('+$150 +20pts', target.waitX * GRID_SIZE, target.waitY * GRID_SIZE);
      }
    } else if (type === 'payment') {
      gameState.currentMoney += 200;
      gameState.totalRevenueEarned += 200;
      gameState.score += 30;
      target.status = 'PAID';
      this.addFloatingText('+$200 +30pts', target.x * GRID_SIZE + 2 * GRID_SIZE, target.y * GRID_SIZE + 1.5 * GRID_SIZE);
    }

    this.currentTask = null;
  }

  addFloatingText(text, x, y) {
    gameState.floatingTexts.push({
      text,
      x,
      y,
      alpha: 255,
      life: 60
    });
  }

  getNearbyInteractable() {
    // Check dirty rooms
    for (const room of gameState.rooms) {
      if (room.status === ROOM_DIRTY) {
        const centerX = room.x + room.w / 2;
        const centerY = room.y + room.h / 2;
        const dist = Math.sqrt(
          Math.pow(this.gridX - centerX, 2) + Math.pow(this.gridY - centerY, 2)
        );
        if (dist < this.interactRange + Math.max(room.w, room.h) / 2) {
          return { type: 'clean', target: room };
        }
      }
    }

    // Check waiting guests
    for (const guest of gameState.guests) {
      if (guest.status === GUEST_WAITING) {
        const dist = Math.sqrt(
          Math.pow(this.gridX - guest.waitX, 2) + Math.pow(this.gridY - guest.waitY, 2)
        );
        if (dist < this.interactRange + 2) {
          return { type: 'checkin', target: guest };
        }
      } else if (guest.status === GUEST_CHECKING_OUT) {
        const dist = Math.sqrt(
          Math.pow(this.gridX - guest.x - 2, 2) + Math.pow(this.gridY - guest.y - 1.5, 2)
        );
        if (dist < this.interactRange + 2) {
          return { type: 'payment', target: guest };
        }
      }
    }

    return null;
  }

  draw(p) {
    p.push();
    p.fill(220, 50, 50);
    p.noStroke();
    p.circle(this.x, this.y, this.size);
    
    // Direction indicator
    p.fill(40);
    const dirAngles = [p.PI / 2, 0, -p.PI / 2, p.PI];
    const angle = dirAngles[this.direction];
    const tipX = this.x + Math.cos(angle) * this.size * 0.6;
    const tipY = this.y + Math.sin(angle) * this.size * 0.6;
    const base1X = this.x + Math.cos(angle + 2.5) * this.size * 0.3;
    const base1Y = this.y + Math.sin(angle + 2.5) * this.size * 0.3;
    const base2X = this.x + Math.cos(angle - 2.5) * this.size * 0.3;
    const base2Y = this.y + Math.sin(angle - 2.5) * this.size * 0.3;
    p.triangle(tipX, tipY, base1X, base1Y, base2X, base2Y);

    // Task progress bar
    if (this.currentTask) {
      const progress = this.taskProgress / this.taskDuration;
      p.fill(50);
      p.rect(this.x - 15, this.y - 25, 30, 4);
      p.fill(100, 200, 100);
      p.rect(this.x - 15, this.y - 25, 30 * progress, 4);
    }

    p.pop();
  }
}