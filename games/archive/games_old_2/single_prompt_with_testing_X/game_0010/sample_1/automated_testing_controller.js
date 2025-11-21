// automated_testing_controller.js
import { gameState } from './globals.js';

function getOptimalAction(gameState) {
  if (!gameState.player) return null;
  
  const player = gameState.player;
  const rings = gameState.rings;
  const obstacles = gameState.obstacles;
  
  // Priority 1: Check upcoming obstacles
  const upcomingObstacle = obstacles.find(obs => 
    !obs.passed && !obs.failed && obs.y < player.y + 100 && obs.y > player.y - 50
  );
  
  if (upcomingObstacle && gameState.neckLength < upcomingObstacle.minNeck) {
    // Need to collect matching rings urgently
    const matchingRings = rings.filter(r => 
      !r.collected && 
      r.color === gameState.currentColor && 
      r.y < player.y + 150 && 
      r.y > 0
    );
    
    if (matchingRings.length === 0) {
      // Change color to find available rings
      return { space: true };
    }
    
    // Move towards closest matching ring
    const closest = matchingRings.reduce((a, b) => 
      Math.abs(a.x - player.x) < Math.abs(b.x - player.x) ? a : b
    );
    
    if (closest.x < player.x - 10) {
      return { left: true };
    } else if (closest.x > player.x + 10) {
      return { right: true };
    }
  }
  
  // Priority 2: Collect nearby matching rings
  const nearbyRings = rings.filter(r => 
    !r.collected && 
    r.y < player.y + 100 && 
    r.y > player.y - 30
  );
  
  const matchingRings = nearbyRings.filter(r => r.color === gameState.currentColor);
  
  if (matchingRings.length > 0) {
    const closest = matchingRings.reduce((a, b) => 
      Math.abs(a.x - player.x) < Math.abs(b.x - player.x) ? a : b
    );
    
    if (Math.abs(closest.x - player.x) < 5) {
      return null; // Already aligned
    } else if (closest.x < player.x) {
      return { left: true };
    } else {
      return { right: true };
    }
  }
  
  // Priority 3: Avoid wrong color rings
  const wrongRings = nearbyRings.filter(r => r.color !== gameState.currentColor);
  
  if (wrongRings.length > 0) {
    const dangerous = wrongRings.find(r => 
      Math.abs(r.x - player.x) < 30 && r.y < player.y + 50
    );
    
    if (dangerous) {
      if (dangerous.x < player.x) {
        return { right: true };
      } else {
        return { left: true };
      }
    }
  }
  
  // Priority 4: Look ahead for matching rings
  const aheadRings = rings.filter(r => 
    !r.collected && 
    r.color === gameState.currentColor &&
    r.y < player.y + 200 && 
    r.y > player.y
  );
  
  if (aheadRings.length > 0) {
    const target = aheadRings[0];
    if (target.x < player.x - 15) {
      return { left: true };
    } else if (target.x > player.x + 15) {
      return { right: true };
    }
  }
  
  // Priority 5: Position for upcoming rings
  const futureRings = rings.filter(r => 
    !r.collected && 
    r.y < 100 && 
    r.y > -50
  );
  
  if (futureRings.length > 0) {
    const avgX = futureRings.reduce((sum, r) => sum + r.x, 0) / futureRings.length;
    
    if (avgX < player.x - 20) {
      return { left: true };
    } else if (avgX > player.x + 20) {
      return { right: true };
    }
  }
  
  return null;
}

function getBasicTestAction(gameState) {
  if (!gameState.player) return null;
  
  const player = gameState.player;
  const rings = gameState.rings;
  
  // Simple strategy: collect nearest ring
  const nearbyRings = rings.filter(r => 
    !r.collected && 
    r.y < player.y + 120 && 
    r.y > 0
  );
  
  if (nearbyRings.length > 0) {
    const closest = nearbyRings.reduce((a, b) => 
      Math.abs(a.x - player.x) + Math.abs(a.y - player.y) < 
      Math.abs(b.x - player.x) + Math.abs(b.y - player.y) ? a : b
    );
    
    if (closest.color !== gameState.currentColor) {
      return { space: true };
    }
    
    if (closest.x < player.x - 10) {
      return { left: true };
    } else if (closest.x > player.x + 10) {
      return { right: true };
    }
  }
  
  return null;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getOptimalAction(gameState);
    default:
      return null;
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;