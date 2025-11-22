// automated_testing_controller.js - Automated testing
import { 
  gameState,
  KEY_LEFT,
  KEY_UP,
  KEY_RIGHT,
  KEY_DOWN,
  KEY_SPACE,
  KEY_SHIFT,
  KEY_Z,
  PHASE_PLAYING,
  ROOM_WIDTH,
  ROOM_HEIGHT
} from './globals.js';
import { distance } from './utils.js';

function getTestWinAction(gameState) {
  // TEST_2: Optimal strategy to win the game
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return { left: false, right: false, up: false, down: false, fire: false, skill: false, swap: false };
  }
  
  const player = gameState.player;
  if (!player) {
    return { left: false, right: false, up: false, down: false, fire: false, skill: false, swap: false };
  }
  
  // Track position to prevent stalling
  gameState.positionHistory = gameState.positionHistory || [];
  gameState.positionHistory.push({ x: player.x, y: player.y, frame: gameState.frameCount });
  if (gameState.positionHistory.length > 180) {
    gameState.positionHistory.shift();
  }
  
  // Find nearest enemy
  let nearestEnemy = null;
  let nearestDist = Infinity;
  
  for (const enemy of gameState.enemies) {
    if (!enemy.alive) continue;
    const dist = distance(player.x, player.y, enemy.x, enemy.y);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestEnemy = enemy;
    }
  }
  
  // Find nearest item
  let nearestItem = null;
  let nearestItemDist = Infinity;
  
  for (const item of gameState.items) {
    if (item.collected) continue;
    const dist = distance(player.x, player.y, item.x, item.y);
    if (dist < nearestItemDist && dist < 200) {
      nearestItemDist = dist;
      nearestItem = item;
    }
  }
  
  // Check if room is cleared and we should go to exit
  const room = gameState.currentRoomObj;
  const roomCleared = room && room.cleared;
  
  let targetX, targetY;
  let shouldFire = false;
  let shouldSkill = false;
  let shouldSwap = false;
  
  if (roomCleared && room) {
    // Go to exit
    targetX = room.exitPosition.x;
    targetY = room.exitPosition.y;
  } else if (nearestEnemy) {
    // Combat behavior
    const safeDistance = 150;
    const minDistance = 100;
    
    // Maintain safe distance
    if (nearestDist < minDistance) {
      // Too close, retreat
      const angle = Math.atan2(player.y - nearestEnemy.y, player.x - nearestEnemy.x);
      targetX = player.x + Math.cos(angle) * 100;
      targetY = player.y + Math.sin(angle) * 100;
    } else if (nearestDist > safeDistance) {
      // Too far, approach
      targetX = nearestEnemy.x;
      targetY = nearestEnemy.y;
    } else {
      // Good distance, strafe
      const angle = Math.atan2(nearestEnemy.y - player.y, nearestEnemy.x - player.x);
      const strafeAngle = angle + Math.PI / 2 + Math.sin(gameState.frameCount * 0.05) * Math.PI / 4;
      targetX = player.x + Math.cos(strafeAngle) * 50;
      targetY = player.y + Math.sin(strafeAngle) * 50;
    }
    
    // Always fire when enemy is in range
    if (nearestDist < 300) {
      shouldFire = true;
    }
    
    // Use skill against groups or elites/bosses
    const enemyCount = gameState.enemies.filter(e => e.alive).length;
    if (enemyCount > 3 || nearestEnemy.type !== "NORMAL") {
      shouldSkill = true;
    }
    
    // Swap to better weapon if available
    if (player.weapons.length > 1 && gameState.frameCount % 300 === 0) {
      shouldSwap = true;
    }
  } else if (nearestItem) {
    // Collect items
    targetX = nearestItem.x;
    targetY = nearestItem.y;
  } else {
    // Explore
    targetX = ROOM_WIDTH / 2;
    targetY = ROOM_HEIGHT / 2;
  }
  
  // Calculate movement direction
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  let left = false, right = false, up = false, down = false;
  
  if (dist > 20) {
    if (dx < -10) left = true;
    if (dx > 10) right = true;
    if (dy < -10) up = true;
    if (dy > 10) down = true;
  }
  
  // Avoid projectiles
  for (const proj of gameState.projectiles) {
    if (!proj.isEnemy) continue;
    const projDist = distance(player.x, player.y, proj.x, proj.y);
    if (projDist < 80) {
      // Dodge perpendicular to projectile direction
      const dodgeAngle = Math.atan2(proj.vy, proj.vx) + Math.PI / 2;
      const dodgeX = player.x + Math.cos(dodgeAngle) * 100;
      const dodgeY = player.y + Math.sin(dodgeAngle) * 100;
      
      if (dodgeX < player.x) left = true;
      if (dodgeX > player.x) right = true;
      if (dodgeY < player.y) up = true;
      if (dodgeY > player.y) down = true;
    }
  }
  
  return {
    left,
    right,
    up,
    down,
    fire: shouldFire,
    skill: shouldSkill,
    swap: shouldSwap
  };
}

function getBasicTestAction(gameState) {
  // TEST_1: Basic movement and shooting
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return { left: false, right: false, up: false, down: false, fire: false, skill: false, swap: false };
  }
  
  const player = gameState.player;
  if (!player) {
    return { left: false, right: false, up: false, down: false, fire: false, skill: false, swap: false };
  }
  
  // Simple patrol and shoot pattern
  const time = gameState.frameCount;
  
  let left = false, right = false, up = false, down = false;
  
  // Move in a pattern
  const pattern = Math.floor(time / 120) % 4;
  switch (pattern) {
    case 0: right = true; break;
    case 1: down = true; break;
    case 2: left = true; break;
    case 3: up = true; break;
  }
  
  // Fire frequently
  const fire = time % 15 < 10;
  
  // Use skill periodically
  const skill = time % 200 === 0;
  
  return { left, right, up, down, fire, skill, swap: false };
}

function getSkillTestAction(gameState) {
  // TEST_3: Test skill and weapon swap
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return { left: false, right: false, up: false, down: false, fire: false, skill: false, swap: false };
  }
  
  const player = gameState.player;
  if (!player) {
    return { left: false, right: false, up: false, down: false, fire: false, skill: false, swap: false };
  }
  
  // Move around
  const time = gameState.frameCount;
  const left = time % 200 < 100;
  const right = time % 200 >= 100;
  const up = time % 150 < 75;
  const down = time % 150 >= 75;
  
  // Fire continuously
  const fire = true;
  
  // Use skill whenever available
  const skill = time % 30 === 0;
  
  // Swap weapons regularly
  const swap = time % 90 === 0;
  
  return { left, right, up, down, fire, skill, swap };
}

function getEnemyTestAction(gameState) {
  // TEST_4: Test enemy AI
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return { left: false, right: false, up: false, down: false, fire: false, skill: false, swap: false };
  }
  
  const player = gameState.player;
  if (!player) {
    return { left: false, right: false, up: false, down: false, fire: false, skill: false, swap: false };
  }
  
  // Stand still and observe
  const time = gameState.frameCount;
  
  // Occasionally move to test enemy tracking
  let left = false, right = false, up = false, down = false;
  if (time % 300 < 50) {
    right = true;
  } else if (time % 300 < 100) {
    left = true;
  }
  
  // Fire to engage enemies
  const fire = time % 60 < 30;
  
  return { left, right, up, down, fire, skill: false, swap: false };
}

function getRandomAction(gameState) {
  return {
    left: Math.random() < 0.3,
    right: Math.random() < 0.3,
    up: Math.random() < 0.3,
    down: Math.random() < 0.3,
    fire: Math.random() < 0.5,
    skill: Math.random() < 0.1,
    swap: Math.random() < 0.05
  };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getSkillTestAction(gameState);
    case "TEST_4":
      return getEnemyTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;