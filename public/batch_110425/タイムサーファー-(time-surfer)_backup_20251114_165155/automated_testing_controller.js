import { gameState } from './globals.js';

function getTestBasicAction(gs) {
  const player = gs.player;
  if (!player || !player.alive) return null;
  
  const playerWorldX = player.x + gs.scrollOffset;
  
  // Check for immediate dangers
  for (let obstacle of gs.obstacles) {
    const distToObstacle = obstacle.x - playerWorldX;
    if (distToObstacle > 0 && distToObstacle < 100) {
      if (obstacle.type === 'spike' && player.y > obstacle.y - 60) {
        return { key: ' ', keyCode: 32 }; // Dive to avoid spike
      }
      if (obstacle.type === 'gap') {
        return null; // Rise to jump over gap
      }
    }
  }
  
  // Check cosmic end distance
  const cosmicEndDist = playerWorldX - gs.cosmicEnd.x;
  if (cosmicEndDist < 150) {
    return { key: ' ', keyCode: 32 }; // Dive to gain speed
  }
  
  // Collect gems
  for (let gem of gs.gems) {
    if (!gem.collected) {
      const distToGem = gem.x - playerWorldX;
      if (distToGem > 0 && distToGem < 150) {
        if (player.y > gem.y) {
          return null; // Rise to collect gem
        } else {
          return { key: ' ', keyCode: 32 }; // Dive to collect gem
        }
      }
    }
  }
  
  // Default: maintain middle height
  if (player.y > 250) {
    return null; // Rise
  } else if (player.y < 150) {
    return { key: ' ', keyCode: 32 }; // Dive
  }
  
  return Math.random() > 0.7 ? { key: ' ', keyCode: 32 } : null;
}

function getTestWinAction(gs) {
  const player = gs.player;
  if (!player || !player.alive) return null;
  
  const playerWorldX = player.x + gs.scrollOffset;
  
  // Check for critical danger from cosmic end
  const cosmicEndDist = playerWorldX - gs.cosmicEnd.x;
  if (cosmicEndDist < 100 && gs.timeEnergy >= 30) {
    return { key: 'z', keyCode: 90 }; // Use rewind
  }
  
  // Check for immediate obstacles
  let nearestObstacle = null;
  let minDist = Infinity;
  for (let obstacle of gs.obstacles) {
    const distToObstacle = obstacle.x - playerWorldX;
    if (distToObstacle > 0 && distToObstacle < minDist) {
      minDist = distToObstacle;
      nearestObstacle = obstacle;
    }
  }
  
  if (nearestObstacle && minDist < 120) {
    if (nearestObstacle.type === 'spike') {
      // Jump over spike
      if (player.y > nearestObstacle.y - 80) {
        return null; // Rise
      }
    } else if (nearestObstacle.type === 'gap') {
      // Stay high over gap
      if (player.y > 200) {
        return null; // Rise
      }
    }
  }
  
  // Aggressive gem collection
  let nearestGem = null;
  let minGemDist = Infinity;
  for (let gem of gs.gems) {
    if (!gem.collected) {
      const distToGem = gem.x - playerWorldX;
      if (distToGem > 0 && distToGem < 200 && distToGem < minGemDist) {
        minGemDist = distToGem;
        nearestGem = gem;
      }
    }
  }
  
  if (nearestGem) {
    const verticalDist = Math.abs(player.y - nearestGem.y);
    if (verticalDist > 20) {
      if (player.y > nearestGem.y) {
        return null; // Rise toward gem
      } else {
        return { key: ' ', keyCode: 32 }; // Dive toward gem
      }
    }
  }
  
  // Keep moving fast and maintain safe height
  if (cosmicEndDist < 200) {
    return { key: ' ', keyCode: 32 }; // Dive for speed
  }
  
  // Stay in middle height range
  if (player.y > 280) {
    return null;
  } else if (player.y < 120) {
    return { key: ' ', keyCode: 32 };
  }
  
  return Math.random() > 0.6 ? { key: ' ', keyCode: 32 } : null;
}

function getRandomAction() {
  const rand = Math.random();
  if (rand < 0.3) {
    return { key: ' ', keyCode: 32 };
  }
  return null;
}

export function get_automated_testing_action(gs) {
  switch (gs.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gs);
    case "TEST_2":
      return getTestWinAction(gs);
    default:
      return getRandomAction();
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;