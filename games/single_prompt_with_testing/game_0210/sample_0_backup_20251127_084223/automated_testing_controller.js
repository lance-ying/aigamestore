// Automated testing controller
import { gameState, KEY_LEFT, KEY_RIGHT, KEY_SPACE } from './globals.js';

// Pathfinding helper
function findNearestTarget(fromX, fromY, targets) {
  let nearest = null;
  let minDist = Infinity;
  
  for (const target of targets) {
    if (target.collected) continue;
    
    const dx = target.x - fromX;
    const dy = target.y - fromY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < minDist) {
      minDist = dist;
      nearest = target;
    }
  }
  
  return nearest;
}

function getTestWinAction(gameState) {
  if (!gameState.player) return null;
  
  const player = gameState.player;
  
  // Priority 1: Collect crew members
  if (gameState.crewMembers.length > 0) {
    const target = findNearestTarget(player.x, player.y, gameState.crewMembers);
    
    if (target) {
      const dx = target.x - player.x;
      const dy = target.y - player.y;
      
      // Determine action based on position
      if (Math.abs(dx) > 20) {
        // Move horizontally towards target
        return { keyCode: dx > 0 ? KEY_RIGHT : KEY_LEFT };
      } else if (Math.abs(dy) > 30) {
        // Flip gravity if target is above/below
        const needFlip = (dy < 0 && player.gravityDirection === 1) ||
                        (dy > 0 && player.gravityDirection === -1);
        if (needFlip && player.flipCooldown === 0) {
          return { keyCode: KEY_SPACE };
        }
      }
      
      // Default: move towards target
      return { keyCode: dx > 0 ? KEY_RIGHT : KEY_LEFT };
    }
  }
  
  // Priority 2: Explore (move right when no target)
  if (Math.random() < 0.7) {
    return { keyCode: KEY_RIGHT };
  } else {
    // Occasionally flip gravity to explore
    if (player.flipCooldown === 0 && Math.random() < 0.3) {
      return { keyCode: KEY_SPACE };
    }
    return { keyCode: KEY_LEFT };
  }
}

function getRandomAction(gameState) {
  if (!gameState.player) return null;
  
  const actions = [KEY_LEFT, KEY_RIGHT, KEY_SPACE];
  const weights = [0.3, 0.3, 0.4]; // Slightly favor space for testing gravity
  
  const rand = Math.random();
  let cumulative = 0;
  
  for (let i = 0; i < actions.length; i++) {
    cumulative += weights[i];
    if (rand < cumulative) {
      return { keyCode: actions[i] };
    }
  }
  
  return { keyCode: KEY_RIGHT };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getRandomAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return null;
  }
}

window.get_automated_testing_action = get_automated_testing_action;