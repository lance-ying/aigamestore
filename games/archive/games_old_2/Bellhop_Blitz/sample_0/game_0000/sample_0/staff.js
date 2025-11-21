// staff.js - Staff class and AI
import { GRID_SIZE, gameState, STAFF_CLEANER, STAFF_RECEPTIONIST, ROOM_DIRTY, ROOM_CLEAN, GUEST_WAITING } from './globals.js';

export class Staff {
  constructor(type, x, y) {
    this.id = gameState.staffIdCounter++;
    this.type = type;
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.gridX = Math.floor(x / GRID_SIZE);
    this.gridY = Math.floor(y / GRID_SIZE);
    this.size = 14;
    this.speed = 2.5;
    this.currentTask = null;
    this.taskProgress = 0;
    this.taskDuration = 0;
    this.color = type === STAFF_CLEANER ? [255, 150, 50] : [50, 200, 200];
  }

  update(p, walls) {
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
      const moveSpeed = this.speed;

      if (dist < moveSpeed) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.gridX = Math.floor(this.x / GRID_SIZE);
        this.gridY = Math.floor(this.y / GRID_SIZE);
      } else {
        this.x += (dx / dist) * moveSpeed;
        this.y += (dy / dist) * moveSpeed;
      }
    } else {
      // Find new task
      this.findTask(walls);
    }
  }

  findTask(walls) {
    if (this.type === STAFF_CLEANER) {
      const dirtyRooms = gameState.rooms.filter(r => r.status === ROOM_DIRTY);
      if (dirtyRooms.length > 0) {
        const closest = dirtyRooms.reduce((closest, room) => {
          const centerX = room.x + room.w / 2;
          const centerY = room.y + room.h / 2;
          const dist = Math.sqrt(
            Math.pow(this.gridX - centerX, 2) + Math.pow(this.gridY - centerY, 2)
          );
          return (!closest || dist < closest.dist) ? { room, dist } : closest;
        }, null);

        if (closest) {
          const targetX = closest.room.x + closest.room.w / 2;
          const targetY = closest.room.y + closest.room.h / 2;
          
          if (closest.dist < 2) {
            const duration = 3000 / gameState.upgrades.staffCleanSpeed;
            this.startTask('clean', closest.room, duration);
          } else {
            this.moveTo(Math.floor(targetX), Math.floor(targetY), walls);
          }
        }
      }
    } else if (this.type === STAFF_RECEPTIONIST) {
      const waitingGuests = gameState.guests.filter(g => g.status === GUEST_WAITING);
      const cleanRooms = gameState.rooms.filter(r => r.status === ROOM_CLEAN);
      
      if (waitingGuests.length > 0 && cleanRooms.length > 0) {
        const closest = waitingGuests.reduce((closest, guest) => {
          const dist = Math.sqrt(
            Math.pow(this.gridX - guest.waitX, 2) + Math.pow(this.gridY - guest.waitY, 2)
          );
          return (!closest || dist < closest.dist) ? { guest, dist } : closest;
        }, null);

        if (closest) {
          if (closest.dist < 2) {
            const duration = 2500 / gameState.upgrades.staffCheckinSpeed;
            this.startTask('checkin', closest.guest, duration);
          } else {
            this.moveTo(closest.guest.waitX, closest.guest.waitY, walls);
          }
        }
      }
    }
  }

  moveTo(gridX, gridY, walls) {
    const newGridX = Math.max(0, Math.min(gridX, Math.floor(600 / GRID_SIZE) - 1));
    const newGridY = Math.max(0, Math.min(gridY, Math.floor(400 / GRID_SIZE) - 1));

    if (!walls[newGridY] || !walls[newGridY][newGridX]) {
      this.targetX = newGridX * GRID_SIZE + GRID_SIZE / 2;
      this.targetY = newGridY * GRID_SIZE + GRID_SIZE / 2;
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
      }
    }

    this.currentTask = null;
  }

  draw(p) {
    p.push();
    p.fill(...this.color);
    p.noStroke();
    p.circle(this.x, this.y, this.size);

    // Icon
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text(this.type === STAFF_CLEANER ? '🧹' : '📋', this.x, this.y - 18);

    // Task progress
    if (this.currentTask) {
      const progress = this.taskProgress / this.taskDuration;
      p.fill(50);
      p.rect(this.x - 12, this.y - 22, 24, 3);
      p.fill(100, 200, 100);
      p.rect(this.x - 12, this.y - 22, 24 * progress, 3);
    }

    p.pop();
  }
}