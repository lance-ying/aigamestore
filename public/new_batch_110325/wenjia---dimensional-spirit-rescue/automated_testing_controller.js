// automated_testing_controller.js
import { WORLD_MATERIAL, WORLD_ENERGY } from './globals.js';

let positionHistory = [];
let stuckCounter = 0;
let lastShiftFrame = 0;

function getTestWinAction(gameState, p) {
  if (!gameState.player || !gameState.spirit) {
    return { left: false, right: false, jump: false, shift: false };
  }

  const player = gameState.player;
  const spirit = gameState.spirit;
  const currentWorld = gameState.currentWorld;
  
  // Track position to detect if stuck
  positionHistory.push({ x: player.x, y: player.y, frame: p.frameCount });
  if (positionHistory.length > 60) {
    positionHistory.shift();
  }
  
  // Check if stuck
  if (positionHistory.length >= 60) {
    const recent = positionHistory.slice(-60);
    const xVariance = Math.max(...recent.map(p => p.x)) - Math.min(...recent.map(p => p.x));
    const yVariance = Math.max(...recent.map(p => p.y)) - Math.min(...recent.map(p => p.y));
    
    if (xVariance < 20 && yVariance < 20) {
      stuckCounter++;
      if (stuckCounter > 120) {
        // Try jumping and shifting if stuck
        stuckCounter = 0;
        return { left: false, right: false, jump: true, shift: p.frameCount - lastShiftFrame > 20 };
      }
    } else {
      stuckCounter = 0;
    }
  }

  const action = { left: false, right: false, jump: false, shift: false };
  
  // Calculate direction to spirit
  const dx = spirit.x - (player.x + player.width / 2);
  const dy = spirit.y - (player.y + player.height / 2);
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Check if there's a platform in current world ahead
  const playerCenterX = player.x + player.width / 2;
  const playerBottom = player.y + player.height;
  
  let hasPathInCurrentWorld = false;
  let needsWorldShift = false;
  
  // Look for platforms ahead
  for (const platform of gameState.platforms) {
    if (platform.world === currentWorld || platform.world === 'BOTH') {
      const platformCenterX = platform.x + platform.width / 2;
      const directionToSpirit = dx > 0 ? 1 : -1;
      const platformInDirection = directionToSpirit > 0 ? 
        platformCenterX > playerCenterX : 
        platformCenterX < playerCenterX;
      
      if (platformInDirection && Math.abs(platformCenterX - playerCenterX) < 200) {
        hasPathInCurrentWorld = true;
        break;
      }
    }
  }
  
  // Check for enemies in the path
  let enemyAhead = false;
  for (const enemy of gameState.enemies) {
    if (enemy.world === currentWorld) {
      const enemyDx = enemy.x - player.x;
      if (Math.abs(enemyDx) < 100 && Math.abs(enemy.y - player.y) < 50) {
        if ((dx > 0 && enemyDx > 0) || (dx < 0 && enemyDx < 0)) {
          enemyAhead = true;
          needsWorldShift = true;
          break;
        }
      }
    }
  }
  
  // Check if player is on a platform
  let onPlatform = false;
  for (const platform of gameState.platforms) {
    if (platform.world === currentWorld || platform.world === 'BOTH') {
      const onHorizontally = player.x + player.width > platform.x && 
                            player.x < platform.x + platform.width;
      const onVertically = Math.abs(playerBottom - platform.y) < 5;
      if (onHorizontally && onVertically) {
        onPlatform = true;
        break;
      }
    }
  }
  
  // Decision logic
  
  // If enemy ahead or no path, try shifting
  if ((needsWorldShift || !hasPathInCurrentWorld) && 
      p.frameCount - lastShiftFrame > 30 && onPlatform) {
    action.shift = true;
    lastShiftFrame = p.frameCount;
    return action;
  }
  
  // Move towards spirit
  if (Math.abs(dx) > 10) {
    if (dx > 0) {
      action.right = true;
    } else {
      action.left = true;
    }
  }
  
  // Jump logic
  if (dy < -20 && player.onGround) {
    action.jump = true;
  } else if (!onPlatform && !player.onGround) {
    // In air, might need to jump when landing
    action.jump = false;
  } else if (Math.abs(dx) < 100 && dy < -10 && player.onGround) {
    action.jump = true;
  }
  
  // Jump over gaps
  let gapAhead = true;
  const lookAheadDist = 50;
  const lookAheadX = player.x + (action.right ? lookAheadDist : action.left ? -lookAheadDist : 0);
  
  for (const platform of gameState.platforms) {
    if (platform.world === currentWorld || platform.world === 'BOTH') {
      if (lookAheadX >= platform.x && lookAheadX <= platform.x + platform.width) {
        if (Math.abs(platform.y - playerBottom) < 80) {
          gapAhead = false;
          break;
        }
      }
    }
  }
  
  if (gapAhead && (action.left || action.right) && player.onGround) {
    action.jump = true;
  }
  
  return action;
}

function getBasicTestAction(gameState, p) {
  // Basic movement test - move right, jump occasionally, shift worlds
  const frameNum = p.frameCount;
  const action = { left: false, right: false, jump: false, shift: false };
  
  // Move in patterns
  if ((frameNum % 200) < 100) {
    action.right = true;
  } else {
    action.left = true;
  }
  
  // Jump every 60 frames
  if (frameNum % 60 === 0) {
    action.jump = true;
  }
  
  // Shift worlds every 90 frames
  if (frameNum % 90 === 0) {
    action.shift = true;
  }
  
  return action;
}

export function get_automated_testing_action(gameState) {
  const p = window.gameInstance;
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState, p);
    case "TEST_2":
      return getTestWinAction(gameState, p);
    default:
      return { left: false, right: false, jump: false, shift: false };
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;