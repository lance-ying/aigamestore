// automated_testing_controller.js - Automated testing

import { 
  PHASE_PLAYING,
  PHASE_GAME_OVER_WIN,
  ROOM_OFFSET_X,
  ROOM_OFFSET_Y,
  ROOM_WIDTH,
  ROOM_HEIGHT
} from './globals.js';
import { distance } from './utils.js';

function getTestBasicAction(gameState) {
  // Basic movement test - explore rooms
  const action = {
    left: false,
    right: false,
    up: false,
    down: false,
    shoot: false,
    sprint: false,
    special: false
  };

  if (!gameState.player || !gameState.dungeon) return action;

  const player = gameState.player;
  const currentRoom = gameState.dungeon.getRoom(gameState.currentRoom.x, gameState.currentRoom.y);
  
  if (!currentRoom) return action;

  // Simple navigation pattern
  const centerX = ROOM_OFFSET_X + ROOM_WIDTH / 2;
  const centerY = ROOM_OFFSET_Y + ROOM_HEIGHT / 2;

  if (Math.abs(player.x - centerX) > 50) {
    action.left = player.x > centerX;
    action.right = player.x < centerX;
  }
  
  if (Math.abs(player.y - centerY) > 50) {
    action.up = player.y > centerY;
    action.down = player.y < centerY;
  }

  // Try to go through doors if room is cleared
  if (currentRoom.cleared) {
    if (currentRoom.doors.right && player.x < ROOM_OFFSET_X + ROOM_WIDTH - 50) {
      action.right = true;
    } else if (currentRoom.doors.bottom && player.y < ROOM_OFFSET_Y + ROOM_HEIGHT - 50) {
      action.down = true;
    }
  }

  return action;
}

function getTestWinAction(gameState) {
  // Optimal strategy to win the game
  const action = {
    left: false,
    right: false,
    up: false,
    down: false,
    shoot: false,
    sprint: false,
    special: false
  };

  if (!gameState.player || !gameState.dungeon) return action;

  const player = gameState.player;
  const currentRoom = gameState.dungeon.getRoom(gameState.currentRoom.x, gameState.currentRoom.y);
  
  if (!currentRoom) return action;

  // Priority 1: Fight enemies
  if (gameState.enemies.length > 0) {
    const activeEnemies = gameState.enemies.filter(e => e.active);
    
    if (activeEnemies.length > 0) {
      // Find nearest enemy
      let nearestEnemy = activeEnemies[0];
      let minDist = distance(player.x, player.y, nearestEnemy.x, nearestEnemy.y);
      
      for (const enemy of activeEnemies) {
        const dist = distance(player.x, player.y, enemy.x, enemy.y);
        if (dist < minDist) {
          minDist = dist;
          nearestEnemy = enemy;
        }
      }

      const dx = nearestEnemy.x - player.x;
      const dy = nearestEnemy.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Maintain optimal distance (100-150 pixels)
      const optimalDist = 120;
      
      if (dist > optimalDist + 30) {
        // Move towards enemy
        if (Math.abs(dx) > Math.abs(dy)) {
          action.right = dx > 0;
          action.left = dx < 0;
        } else {
          action.down = dy > 0;
          action.up = dy < 0;
        }
      } else if (dist < optimalDist - 30) {
        // Move away from enemy
        if (Math.abs(dx) > Math.abs(dy)) {
          action.left = dx > 0;
          action.right = dx < 0;
        } else {
          action.up = dy > 0;
          action.down = dy < 0;
        }
      } else {
        // Strafe
        if (Math.abs(dx) > Math.abs(dy)) {
          action.up = Math.sin(Date.now() * 0.01) > 0;
          action.down = !action.up;
        } else {
          action.left = Math.sin(Date.now() * 0.01) > 0;
          action.right = !action.left;
        }
      }

      // Always shoot at enemies
      action.shoot = true;

      // Use special when surrounded
      if (activeEnemies.length >= 3 && player.specialCooldown <= 0) {
        let nearbyCount = 0;
        for (const enemy of activeEnemies) {
          if (distance(player.x, player.y, enemy.x, enemy.y) < 100) {
            nearbyCount++;
          }
        }
        if (nearbyCount >= 2) {
          action.special = true;
        }
      }

      // Sprint if health is low and enemy is close
      if (player.health <= 2 && minDist < 80 && player.stamina > 20) {
        action.sprint = true;
      }

      return action;
    }
  }

  // Priority 2: Collect items and pickups
  const allPickups = [...gameState.items, ...gameState.pickups];
  if (allPickups.length > 0) {
    const target = allPickups[0];
    const dx = target.x - player.x;
    const dy = target.y - player.y;

    if (Math.abs(dx) > 10) {
      action.right = dx > 0;
      action.left = dx < 0;
    }
    if (Math.abs(dy) > 10) {
      action.down = dy > 0;
      action.up = dy < 0;
    }

    return action;
  }

  // Priority 3: Navigate to next room
  if (currentRoom.cleared) {
    // Navigate towards boss room or unexplored rooms
    const targetRooms = [];
    
    // Find boss room
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const room = gameState.dungeon.getRoom(x, y);
        if (room && room.type === 'boss' && !room.visited) {
          targetRooms.push({ x, y, priority: 10 });
        } else if (room && !room.visited) {
          targetRooms.push({ x, y, priority: 5 });
        } else if (room && room.type === 'treasure' && !room.cleared) {
          targetRooms.push({ x, y, priority: 7 });
        }
      }
    }

    if (targetRooms.length > 0) {
      // Sort by priority
      targetRooms.sort((a, b) => b.priority - a.priority);
      const target = targetRooms[0];

      const dx = target.x - gameState.currentRoom.x;
      const dy = target.y - gameState.currentRoom.y;

      // Move towards target room
      if (dx > 0 && currentRoom.doors.right) {
        action.right = true;
      } else if (dx < 0 && currentRoom.doors.left) {
        action.left = true;
      } else if (dy > 0 && currentRoom.doors.bottom) {
        action.down = true;
      } else if (dy < 0 && currentRoom.doors.top) {
        action.up = true;
      } else {
        // Take any available door
        if (currentRoom.doors.right) action.right = true;
        else if (currentRoom.doors.bottom) action.down = true;
        else if (currentRoom.doors.left) action.left = true;
        else if (currentRoom.doors.top) action.up = true;
      }
    }
  } else {
    // Move to center of room to trigger spawns
    const centerX = ROOM_OFFSET_X + ROOM_WIDTH / 2;
    const centerY = ROOM_OFFSET_Y + ROOM_HEIGHT / 2;

    if (Math.abs(player.x - centerX) > 20) {
      action.right = player.x < centerX;
      action.left = player.x > centerX;
    }
    if (Math.abs(player.y - centerY) > 20) {
      action.down = player.y < centerY;
      action.up = player.y > centerY;
    }
  }

  return action;
}

function getTestItemCollectionAction(gameState) {
  // Test item collection
  const action = {
    left: false,
    right: false,
    up: false,
    down: false,
    shoot: false,
    sprint: false,
    special: false
  };

  if (!gameState.player || !gameState.dungeon) return action;

  const player = gameState.player;
  const currentRoom = gameState.dungeon.getRoom(gameState.currentRoom.x, gameState.currentRoom.y);
  
  if (!currentRoom) return action;

  // Navigate to treasure rooms
  if (currentRoom.type === 'treasure') {
    // Collect items
    if (gameState.items.length > 0) {
      const item = gameState.items[0];
      const dx = item.x - player.x;
      const dy = item.y - player.y;

      action.right = dx > 5;
      action.left = dx < -5;
      action.down = dy > 5;
      action.up = dy < -5;
    }
  } else {
    // Find treasure room
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const room = gameState.dungeon.getRoom(x, y);
        if (room && room.type === 'treasure') {
          const dx = x - gameState.currentRoom.x;
          const dy = y - gameState.currentRoom.y;

          if (dx > 0 && currentRoom.doors.right) action.right = true;
          else if (dx < 0 && currentRoom.doors.left) action.left = true;
          else if (dy > 0 && currentRoom.doors.bottom) action.down = true;
          else if (dy < 0 && currentRoom.doors.top) action.up = true;
          
          return action;
        }
      }
    }
  }

  return action;
}

function getTestEnemyAIAction(gameState) {
  // Test by observing enemy behavior - move randomly
  const action = {
    left: false,
    right: false,
    up: false,
    down: false,
    shoot: false,
    sprint: false,
    special: false
  };

  const rand = Math.random();
  if (rand < 0.25) action.left = true;
  else if (rand < 0.5) action.right = true;
  else if (rand < 0.75) action.up = true;
  else action.down = true;

  if (gameState.enemies.length > 0) {
    action.shoot = true;
  }

  return action;
}

function getRandomAction(gameState) {
  return {
    left: Math.random() < 0.1,
    right: Math.random() < 0.1,
    up: Math.random() < 0.1,
    down: Math.random() < 0.1,
    shoot: Math.random() < 0.3,
    sprint: Math.random() < 0.05,
    special: Math.random() < 0.01
  };
}

export function get_automated_testing_action(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }

  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestItemCollectionAction(gameState);
    case "TEST_4":
      return getTestEnemyAIAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;