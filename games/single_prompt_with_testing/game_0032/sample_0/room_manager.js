// room_manager.js - Room management and spawning

import { Enemy, Boss, Item, Pickup } from './entities.js';
import { ROOM_WIDTH, ROOM_HEIGHT, ROOM_OFFSET_X, ROOM_OFFSET_Y } from './globals.js';
import { randomChoice, randomRange } from './utils.js';

export function spawnEnemiesInRoom(room, floor, p, gameState) {
  if (room.type === 'start' || room.type === 'treasure' || room.cleared) {
    return;
  }

  gameState.enemies = [];

  if (room.type === 'boss') {
    const boss = new Boss(
      ROOM_OFFSET_X + ROOM_WIDTH / 2,
      ROOM_OFFSET_Y + ROOM_HEIGHT / 2,
      floor
    );
    gameState.enemies.push(boss);
  } else {
    const enemyCount = 3 + floor + Math.floor(p.random(2, 5));
    const types = ['basic', 'fly', 'shooter', 'charger'];
    
    for (let i = 0; i < enemyCount; i++) {
      const type = randomChoice(types, p);
      const x = randomRange(ROOM_OFFSET_X + 50, ROOM_OFFSET_X + ROOM_WIDTH - 50, p);
      const y = randomRange(ROOM_OFFSET_Y + 50, ROOM_OFFSET_Y + ROOM_HEIGHT - 50, p);
      gameState.enemies.push(new Enemy(x, y, type, floor));
    }
  }
}

export function spawnItemInRoom(room, p, gameState) {
  if (room.type === 'treasure' && room.items.length === 0) {
    const types = ['damage', 'speed', 'health', 'tears', 'range'];
    const type = randomChoice(types, p);
    const item = new Item(
      ROOM_OFFSET_X + ROOM_WIDTH / 2,
      ROOM_OFFSET_Y + ROOM_HEIGHT / 2,
      type
    );
    room.items.push(item);
    gameState.items.push(item);
  }
}

export function checkRoomCleared(room, gameState) {
  if (room.cleared) return true;
  
  if (gameState.enemies.length === 0 || gameState.enemies.every(e => !e.active)) {
    room.cleared = true;
    gameState.roomsCleared++;
    
    // Spawn reward
    if (room.type === 'normal' && Math.random() < 0.4) {
      const pickup = new Pickup(
        ROOM_OFFSET_X + ROOM_WIDTH / 2,
        ROOM_OFFSET_Y + ROOM_HEIGHT / 2,
        Math.random() < 0.7 ? 'heart' : 'coin'
      );
      room.pickups.push(pickup);
      gameState.pickups.push(pickup);
    }
    
    return true;
  }
  
  return false;
}

export function drawRoom(room, p, gameState) {
  // Floor
  p.fill(40, 35, 35);
  p.noStroke();
  p.rect(ROOM_OFFSET_X, ROOM_OFFSET_Y, ROOM_WIDTH, ROOM_HEIGHT);

  // Floor tiles
  p.stroke(50, 45, 45);
  p.strokeWeight(1);
  for (let x = ROOM_OFFSET_X; x < ROOM_OFFSET_X + ROOM_WIDTH; x += 40) {
    for (let y = ROOM_OFFSET_Y; y < ROOM_OFFSET_Y + ROOM_HEIGHT; y += 40) {
      p.noFill();
      p.rect(x, y, 40, 40);
    }
  }

  // Walls
  p.fill(60, 50, 50);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, ROOM_OFFSET_Y);
  p.rect(0, ROOM_OFFSET_Y + ROOM_HEIGHT, CANVAS_WIDTH, ROOM_OFFSET_Y);
  p.rect(0, 0, ROOM_OFFSET_X, CANVAS_HEIGHT);
  p.rect(ROOM_OFFSET_X + ROOM_WIDTH, 0, ROOM_OFFSET_X, CANVAS_HEIGHT);

  // Doors
  const doorWidth = 40;
  const doorHeight = 40;
  const isCleared = room.cleared || gameState.enemies.every(e => !e.active);

  if (room.doors.top) {
    p.fill(isCleared ? [80, 70, 60] : [30, 25, 25]);
    p.rect(ROOM_OFFSET_X + ROOM_WIDTH / 2 - doorWidth / 2, 0, doorWidth, ROOM_OFFSET_Y);
  }
  if (room.doors.bottom) {
    p.fill(isCleared ? [80, 70, 60] : [30, 25, 25]);
    p.rect(ROOM_OFFSET_X + ROOM_WIDTH / 2 - doorWidth / 2, ROOM_OFFSET_Y + ROOM_HEIGHT, doorWidth, ROOM_OFFSET_Y);
  }
  if (room.doors.left) {
    p.fill(isCleared ? [80, 70, 60] : [30, 25, 25]);
    p.rect(0, ROOM_OFFSET_Y + ROOM_HEIGHT / 2 - doorHeight / 2, ROOM_OFFSET_X, doorHeight);
  }
  if (room.doors.right) {
    p.fill(isCleared ? [80, 70, 60] : [30, 25, 25]);
    p.rect(ROOM_OFFSET_X + ROOM_WIDTH, ROOM_OFFSET_Y + ROOM_HEIGHT / 2 - doorHeight / 2, ROOM_OFFSET_X, doorHeight);
  }

  // Room type indicator
  if (room.type === 'boss') {
    p.fill(200, 50, 50, 100);
    p.noStroke();
    p.rect(ROOM_OFFSET_X, ROOM_OFFSET_Y, ROOM_WIDTH, ROOM_HEIGHT);
  } else if (room.type === 'treasure') {
    p.fill(200, 200, 50, 100);
    p.noStroke();
    p.rect(ROOM_OFFSET_X, ROOM_OFFSET_Y, ROOM_WIDTH, ROOM_HEIGHT);
  }
}