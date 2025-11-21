import { TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, gameState, ITEMS, REALMS } from './globals.js';
import { Enemy, Boss, Obstacle, ItemPickup } from './entities.js';

export function generateRoom(p, roomX, roomY) {
  const roomKey = `${roomX},${roomY}`;
  
  if (gameState.roomData[roomKey]) {
    return gameState.roomData[roomKey];
  }

  const room = {
    obstacles: [],
    enemies: [],
    items: [],
    isBossRoom: false,
    cleared: false
  };

  // Starting room
  if (roomX === 0 && roomY === 0) {
    // Simple starting area
    room.obstacles = createWalls(p);
    gameState.roomData[roomKey] = room;
    return room;
  }

  // Boss rooms
  if ((roomX === 2 && roomY === 0) || (roomX === -2 && roomY === 0)) {
    room.isBossRoom = true;
    room.obstacles = createWalls(p);
    const boss = new Boss(p, CANVAS_WIDTH / 2 - 20, CANVAS_HEIGHT / 2 - 20);
    room.enemies.push(boss);
    gameState.roomData[roomKey] = room;
    return room;
  }

  // Regular rooms
  room.obstacles = createWalls(p);
  
  // Add some obstacles
  const obstacleCount = p.floor(p.random(3, 8));
  for (let i = 0; i < obstacleCount; i++) {
    const ox = p.floor(p.random(2, 28)) * TILE_SIZE;
    const oy = p.floor(p.random(2, 18)) * TILE_SIZE;
    const types = ['BLOCK', 'PIT', 'BREAKABLE'];
    const type = types[p.floor(p.random(types.length))];
    room.obstacles.push(new Obstacle(p, ox, oy, type));
  }

  // Add enemies
  const enemyCount = p.floor(p.random(2, 5));
  for (let i = 0; i < enemyCount; i++) {
    const ex = p.random(60, CANVAS_WIDTH - 60);
    const ey = p.random(60, CANVAS_HEIGHT - 60);
    const types = ['SOLDIER', 'ARCHER', 'BEETLE', 'BEAMOS'];
    const type = types[p.floor(p.random(types.length))];
    room.enemies.push(new Enemy(p, ex, ey, type));
  }

  // Add items
  if (p.random() < 0.3) {
    const itemTypes = [ITEMS.DASH_BOOTS, ITEMS.HOOKSHOT, ITEMS.BOW, ITEMS.HAMMER, ITEMS.REALM_MIRROR];
    const unownedItems = itemTypes.filter(item => !gameState.inventory.includes(item));
    if (unownedItems.length > 0) {
      const itemType = unownedItems[p.floor(p.random(unownedItems.length))];
      room.items.push(new ItemPickup(p, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, itemType));
    }
  }

  gameState.roomData[roomKey] = room;
  return room;
}

function createWalls(p) {
  const walls = [];
  
  // Top and bottom walls
  for (let x = 0; x < CANVAS_WIDTH; x += TILE_SIZE) {
    walls.push(new Obstacle(p, x, 0, 'WALL'));
    walls.push(new Obstacle(p, x, CANVAS_HEIGHT - TILE_SIZE, 'WALL'));
  }
  
  // Left and right walls (with gaps for doors)
  for (let y = TILE_SIZE; y < CANVAS_HEIGHT - TILE_SIZE; y += TILE_SIZE) {
    if (y < CANVAS_HEIGHT / 2 - 40 || y > CANVAS_HEIGHT / 2 + 20) {
      walls.push(new Obstacle(p, 0, y, 'WALL'));
      walls.push(new Obstacle(p, CANVAS_WIDTH - TILE_SIZE, y, 'WALL'));
    }
  }
  
  return walls;
}

export function loadRoom(p, roomX, roomY) {
  const room = generateRoom(p, roomX, roomY);
  
  gameState.entities = [];
  gameState.projectiles = [];
  
  // Add player
  gameState.entities.push(gameState.player);
  
  // Position player at entry point
  if (roomX > gameState.currentRoom.x) {
    gameState.player.x = 40;
    gameState.player.y = CANVAS_HEIGHT / 2;
  } else if (roomX < gameState.currentRoom.x) {
    gameState.player.x = CANVAS_WIDTH - 60;
    gameState.player.y = CANVAS_HEIGHT / 2;
  } else if (roomY > gameState.currentRoom.y) {
    gameState.player.x = CANVAS_WIDTH / 2;
    gameState.player.y = 40;
  } else if (roomY < gameState.currentRoom.y) {
    gameState.player.x = CANVAS_WIDTH / 2;
    gameState.player.y = CANVAS_HEIGHT - 60;
  }
  
  // Add obstacles
  for (const obstacle of room.obstacles) {
    gameState.entities.push(obstacle);
  }
  
  // Add enemies if not cleared
  if (!room.cleared) {
    for (const enemy of room.enemies) {
      gameState.entities.push(enemy);
    }
  }
  
  // Add items
  for (const item of room.items) {
    gameState.entities.push(item);
  }
  
  gameState.currentRoom = { x: roomX, y: roomY };
}

export function checkRoomTransition(p) {
  const player = gameState.player;
  
  // Check for room transitions at edges
  if (player.x < 20) {
    loadRoom(p, gameState.currentRoom.x - 1, gameState.currentRoom.y);
  } else if (player.x > CANVAS_WIDTH - 40) {
    loadRoom(p, gameState.currentRoom.x + 1, gameState.currentRoom.y);
  } else if (player.y < 20) {
    loadRoom(p, gameState.currentRoom.x, gameState.currentRoom.y - 1);
  } else if (player.y > CANVAS_HEIGHT - 40) {
    loadRoom(p, gameState.currentRoom.x, gameState.currentRoom.y + 1);
  }
}

export function switchRealm(p) {
  if (gameState.inventory.includes(ITEMS.REALM_MIRROR)) {
    gameState.currentRealm = gameState.currentRealm === REALMS.LIGHT ? REALMS.DARK : REALMS.LIGHT;
    
    // Regenerate current room with different seed
    const roomKey = `${gameState.currentRoom.x},${gameState.currentRoom.y}`;
    delete gameState.roomData[roomKey];
    loadRoom(p, gameState.currentRoom.x, gameState.currentRoom.y);
  }
}