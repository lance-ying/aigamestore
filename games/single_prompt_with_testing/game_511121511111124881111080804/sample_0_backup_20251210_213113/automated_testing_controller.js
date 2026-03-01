// automated_testing_controller.js - Automated testing strategies

import {
  gameState,
  KEY_LEFT,
  KEY_RIGHT,
  KEY_SPACE,
  KEY_Z,
  distance
} from './globals.js';

// TEST_1: Basic movement and collision testing
function getTest1Action() {
  if (!gameState.player) return null;
  
  const frameCount = gameState.frameCount;
  
  // Alternate between left, right, and jump
  if (frameCount % 180 < 60) {
    return { keyCode: KEY_RIGHT };
  } else if (frameCount % 180 < 120) {
    return { keyCode: KEY_LEFT };
  } else {
    // Jump every 3 seconds
    if (gameState.player.onGround) {
      return { keyCode: KEY_SPACE };
    }
  }
  
  return null;
}

// TEST_2: Grappling mechanics testing
function getTest2Action() {
  if (!gameState.player) return null;
  
  // Find nearest grapple point
  let nearestGrapple = null;
  let minDist = Infinity;
  
  for (const point of gameState.grapplePoints) {
    const dist = distance(
      gameState.player.x,
      gameState.player.y,
      point.x,
      point.y
    );
    if (dist < minDist) {
      minDist = dist;
      nearestGrapple = point;
    }
  }
  
  // If grappling, maintain it
  if (gameState.isGrappling) {
    // Add swing momentum
    if (gameState.player.x < gameState.grappleTarget.x) {
      return { keyCode: KEY_RIGHT };
    } else {
      return { keyCode: KEY_LEFT };
    }
  }
  
  // Try to grapple if near a point
  if (nearestGrapple && minDist < 200) {
    return { keyCode: KEY_Z, hold: true };
  }
  
  // Move toward nearest grapple point
  if (nearestGrapple) {
    if (gameState.player.x < nearestGrapple.x - 20) {
      return { keyCode: KEY_RIGHT };
    } else if (gameState.player.x > nearestGrapple.x + 20) {
      return { keyCode: KEY_LEFT };
    }
  }
  
  return null;
}

// TEST_3: Platform crumbling and timing
function getTest3Action() {
  if (!gameState.player) return null;
  
  // Stay on platforms to test decay
  if (gameState.frameCount % 240 < 120) {
    // Stand still for 2 seconds
    return null;
  } else {
    // Move to next platform
    return { keyCode: KEY_RIGHT };
  }
}

// TEST_4: Collectible gathering
function getTest4Action() {
  if (!gameState.player) return null;
  
  // Find nearest collectible
  let nearestStar = null;
  let minDist = Infinity;
  
  for (const star of gameState.collectibles) {
    const dist = distance(
      gameState.player.x,
      gameState.player.y,
      star.x,
      star.y
    );
    if (dist < minDist) {
      minDist = dist;
      nearestStar = star;
    }
  }
  
  if (!nearestStar) {
    // All stars collected, head to goal
    return getTest5Action();
  }
  
  const dx = nearestStar.x - gameState.player.x;
  const dy = nearestStar.y - gameState.player.y;
  
  // Move horizontally toward star
  if (Math.abs(dx) > 10) {
    return dx > 0 ? { keyCode: KEY_RIGHT } : { keyCode: KEY_LEFT };
  }
  
  // Jump to reach star if above
  if (dy < -20 && gameState.player.onGround) {
    return { keyCode: KEY_SPACE };
  }
  
  // Try grappling if star is far above
  if (dy < -50) {
    let nearestGrapple = null;
    let minGrappleDist = Infinity;
    
    for (const point of gameState.grapplePoints) {
      const dist = distance(
        gameState.player.x,
        gameState.player.y,
        point.x,
        point.y
      );
      if (dist < minGrappleDist && dist < 200) {
        minGrappleDist = dist;
        nearestGrapple = point;
      }
    }
    
    if (nearestGrapple) {
      return { keyCode: KEY_Z, hold: true };
    }
  }
  
  return null;
}

// TEST_5: Optimal path to goal
function getTest5Action() {
  if (!gameState.player || !gameState.goalPlatform) return null;
  
  const goal = gameState.goalPlatform;
  const dx = (goal.x + goal.width / 2) - gameState.player.x;
  const dy = (goal.y - 10) - gameState.player.y;
  
  // If grappling, use momentum
  if (gameState.isGrappling) {
    if (dx > 0) {
      return { keyCode: KEY_RIGHT };
    } else if (dx < 0) {
      return { keyCode: KEY_LEFT };
    }
    return { keyCode: KEY_Z, hold: true };
  }
  
  // If close horizontally, jump to reach
  if (Math.abs(dx) < 50 && dy < -20 && gameState.player.onGround) {
    return { keyCode: KEY_SPACE };
  }
  
  // Move toward goal horizontally
  if (Math.abs(dx) > 20) {
    return dx > 0 ? { keyCode: KEY_RIGHT } : { keyCode: KEY_LEFT };
  }
  
  // Try grappling if goal is above
  if (dy < -40) {
    let nearestGrapple = null;
    let minDist = Infinity;
    
    for (const point of gameState.grapplePoints) {
      const dist = distance(
        gameState.player.x,
        gameState.player.y,
        point.x,
        point.y
      );
      // Prioritize grapple points near goal
      const goalDist = distance(
        point.x,
        point.y,
        goal.x + goal.width / 2,
        goal.y
      );
      const combinedDist = dist + goalDist * 0.5;
      
      if (combinedDist < minDist && dist < 200) {
        minDist = combinedDist;
        nearestGrapple = point;
      }
    }
    
    if (nearestGrapple) {
      return { keyCode: KEY_Z, hold: true };
    }
  }
  
  return null;
}

// TEST_6: Intentional falling test
function getTest6Action() {
  if (!gameState.player) return null;
  
  // Move to edge and fall
  if (gameState.player.x < CANVAS_WIDTH - 50) {
    return { keyCode: KEY_RIGHT };
  }
  
  // Fall off right edge
  return null;
}

// TEST_7: Complete optimal playthrough
function getTest7Action() {
  if (!gameState.player) return null;
  
  // Priority 1: Collect nearby stars efficiently
  let nearestStar = null;
  let minStarDist = Infinity;
  
  for (const star of gameState.collectibles) {
    const dist = distance(
      gameState.player.x,
      gameState.player.y,
      star.x,
      star.y
    );
    if (dist < minStarDist && dist < 150) {
      minStarDist = dist;
      nearestStar = star;
    }
  }
  
  if (nearestStar) {
    const dx = nearestStar.x - gameState.player.x;
    const dy = nearestStar.y - gameState.player.y;
    
    // Use grapple for efficiency if available
    if (Math.abs(dy) > 40) {
      for (const point of gameState.grapplePoints) {
        const pointDist = distance(
          gameState.player.x,
          gameState.player.y,
          point.x,
          point.y
        );
        if (pointDist < 180) {
          return { keyCode: KEY_Z, hold: true };
        }
      }
    }
    
    if (Math.abs(dx) > 10) {
      return dx > 0 ? { keyCode: KEY_RIGHT } : { keyCode: KEY_LEFT };
    }
    
    if (dy < -20 && gameState.player.onGround) {
      return { keyCode: KEY_SPACE };
    }
  }
  
  // Priority 2: Head to goal
  return getTest5Action();
}

// Main automated testing function
export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTest1Action();
    case "TEST_2":
      return getTest2Action();
    case "TEST_3":
      return getTest3Action();
    case "TEST_4":
      return getTest4Action();
    case "TEST_5":
      return getTest5Action();
    case "TEST_6":
      return getTest6Action();
    case "TEST_7":
      return getTest7Action();
    default:
      return null;
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;