// automated_testing_controller.js - Automated testing AI
import { gameState, CANVAS_WIDTH } from './globals.js';

let moveHistory = [];
let stuckCounter = 0;
let lastX = 0;

function getTestMovementAction(gameState) {
  // Test basic movement
  const frameCount = gameState.framesSurvived || 0;
  const cycle = Math.floor(frameCount / 60) % 4;
  
  if (cycle === 0 || cycle === 1) {
    return { key: 'ArrowLeft', keyCode: 37 };
  } else {
    return { key: 'ArrowRight', keyCode: 39 };
  }
}

function getTestWinAction(gameState) {
  if (!gameState.player || gameState.snakeSegments.length === 0) {
    return { key: null, keyCode: null };
  }
  
  const head = gameState.snakeSegments[0];
  const playerX = head.x;
  
  // Check if stuck
  if (Math.abs(playerX - lastX) < 1) {
    stuckCounter++;
  } else {
    stuckCounter = 0;
  }
  lastX = playerX;
  
  // If stuck, try opposite direction
  if (stuckCounter > 30) {
    stuckCounter = 0;
    return { key: playerX < CANVAS_WIDTH / 2 ? 'ArrowRight' : 'ArrowLeft', 
             keyCode: playerX < CANVAS_WIDTH / 2 ? 39 : 37 };
  }
  
  // Strategy: Look ahead for threats and opportunities
  const lookAheadDistance = 150;
  const dangerZone = 100;
  
  // Find nearby blocks and orbs
  const nearbyBlocks = gameState.blocks.filter(b => 
    b.active && !b.hit && b.y < head.y && b.y > head.y - lookAheadDistance
  );
  
  const nearbyOrbs = gameState.orbs.filter(o => 
    o.active && !o.collected && o.y < head.y && o.y > head.y - lookAheadDistance
  );
  
  // Priority 1: Collect orbs if snake is short
  if (gameState.snakeLength < 15 && nearbyOrbs.length > 0) {
    const closestOrb = nearbyOrbs.reduce((closest, orb) => {
      const dist = Math.hypot(orb.x - playerX, orb.y - head.y);
      const closestDist = Math.hypot(closest.x - playerX, closest.y - head.y);
      return dist < closestDist ? orb : closest;
    });
    
    if (closestOrb.x < playerX - 10) {
      return { key: 'ArrowLeft', keyCode: 37 };
    } else if (closestOrb.x > playerX + 10) {
      return { key: 'ArrowRight', keyCode: 39 };
    }
  }
  
  // Priority 2: Avoid dangerous blocks
  const dangerousBlocks = nearbyBlocks.filter(b => 
    b.value >= gameState.snakeLength * 0.7 && b.y > head.y - dangerZone
  );
  
  if (dangerousBlocks.length > 0) {
    // Find safe direction
    const leftDanger = dangerousBlocks.filter(b => 
      Math.abs(b.x - (playerX - 50)) < 40
    ).length;
    const rightDanger = dangerousBlocks.filter(b => 
      Math.abs(b.x - (playerX + 50)) < 40
    ).length;
    
    if (leftDanger < rightDanger) {
      return { key: 'ArrowLeft', keyCode: 37 };
    } else {
      return { key: 'ArrowRight', keyCode: 39 };
    }
  }
  
  // Priority 3: Target low-value blocks or orbs
  if (nearbyOrbs.length > 0) {
    const targetOrb = nearbyOrbs[0];
    if (targetOrb.x < playerX - 10) {
      return { key: 'ArrowLeft', keyCode: 37 };
    } else if (targetOrb.x > playerX + 10) {
      return { key: 'ArrowRight', keyCode: 39 };
    }
  }
  
  // Priority 4: Find gaps in blocks
  if (nearbyBlocks.length > 0) {
    const immediateBlocks = nearbyBlocks.filter(b => b.y > head.y - 80);
    
    if (immediateBlocks.length > 0) {
      // Find largest gap
      const blockXPositions = immediateBlocks.map(b => b.x).sort((a, b) => a - b);
      
      let largestGap = { x: CANVAS_WIDTH / 2, size: 0 };
      
      // Check left edge
      if (blockXPositions[0] > 80) {
        largestGap = { x: blockXPositions[0] / 2, size: blockXPositions[0] };
      }
      
      // Check gaps between blocks
      for (let i = 0; i < blockXPositions.length - 1; i++) {
        const gap = blockXPositions[i + 1] - blockXPositions[i];
        if (gap > largestGap.size && gap > 70) {
          largestGap = { x: (blockXPositions[i] + blockXPositions[i + 1]) / 2, size: gap };
        }
      }
      
      // Check right edge
      if (CANVAS_WIDTH - blockXPositions[blockXPositions.length - 1] > 80) {
        const gap = CANVAS_WIDTH - blockXPositions[blockXPositions.length - 1];
        if (gap > largestGap.size) {
          largestGap = { x: (CANVAS_WIDTH + blockXPositions[blockXPositions.length - 1]) / 2, size: gap };
        }
      }
      
      // Move towards gap
      if (largestGap.x < playerX - 15) {
        return { key: 'ArrowLeft', keyCode: 37 };
      } else if (largestGap.x > playerX + 15) {
        return { key: 'ArrowRight', keyCode: 39 };
      }
    }
  }
  
  // Default: Stay centered
  if (playerX < CANVAS_WIDTH / 2 - 30) {
    return { key: 'ArrowRight', keyCode: 39 };
  } else if (playerX > CANVAS_WIDTH / 2 + 30) {
    return { key: 'ArrowLeft', keyCode: 37 };
  }
  
  return { key: null, keyCode: null };
}

function getTestCollisionAction(gameState) {
  if (!gameState.player || gameState.snakeSegments.length === 0) {
    return { key: null, keyCode: null };
  }
  
  const head = gameState.snakeSegments[0];
  const playerX = head.x;
  
  // Intentionally hit blocks
  const nearbyBlocks = gameState.blocks.filter(b => 
    b.active && !b.hit && b.y < head.y && b.y > head.y - 100
  );
  
  if (nearbyBlocks.length > 0) {
    const targetBlock = nearbyBlocks[0];
    if (targetBlock.x < playerX - 10) {
      return { key: 'ArrowLeft', keyCode: 37 };
    } else if (targetBlock.x > playerX + 10) {
      return { key: 'ArrowRight', keyCode: 39 };
    }
  }
  
  return { key: null, keyCode: null };
}

function getTestOrbCollectionAction(gameState) {
  if (!gameState.player || gameState.snakeSegments.length === 0) {
    return { key: null, keyCode: null };
  }
  
  const head = gameState.snakeSegments[0];
  const playerX = head.x;
  
  // Actively collect orbs
  const nearbyOrbs = gameState.orbs.filter(o => 
    o.active && !o.collected && o.y < head.y && o.y > head.y - 120
  );
  
  if (nearbyOrbs.length > 0) {
    const closestOrb = nearbyOrbs.reduce((closest, orb) => {
      const dist = Math.hypot(orb.x - playerX, orb.y - head.y);
      const closestDist = Math.hypot(closest.x - playerX, closest.y - head.y);
      return dist < closestDist ? orb : closest;
    });
    
    if (closestOrb.x < playerX - 5) {
      return { key: 'ArrowLeft', keyCode: 37 };
    } else if (closestOrb.x > playerX + 5) {
      return { key: 'ArrowRight', keyCode: 39 };
    }
  }
  
  return { key: null, keyCode: null };
}

function getTestProgressionAction(gameState) {
  // Same as win strategy but runs longer to test difficulty scaling
  return getTestWinAction(gameState);
}

function getRandomAction(gameState) {
  const rand = Math.random();
  if (rand < 0.33) {
    return { key: 'ArrowLeft', keyCode: 37 };
  } else if (rand < 0.66) {
    return { key: 'ArrowRight', keyCode: 39 };
  } else {
    return { key: null, keyCode: null };
  }
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestMovementAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestCollisionAction(gameState);
    case "TEST_4":
      return getTestOrbCollectionAction(gameState);
    case "TEST_5":
      return getTestProgressionAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;