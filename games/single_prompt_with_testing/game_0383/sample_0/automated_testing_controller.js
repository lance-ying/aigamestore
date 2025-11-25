// automated_testing_controller.js
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, ITEMS_NEEDED_TO_WIN } from './globals.js';

let testState = {
  positionHistory: [],
  currentTarget: null,
  stuckCounter: 0,
  phase: "EXPLORE"
};

function getTestWinAction(gameState) {
  if (!gameState.player) return null;
  
  const p = window.gameInstance;
  
  // Track position to detect if stuck
  testState.positionHistory.push({ x: gameState.player.x, y: gameState.player.y });
  if (testState.positionHistory.length > 60) {
    testState.positionHistory.shift();
  }
  
  // Check if stuck
  if (testState.positionHistory.length >= 60) {
    const recent = testState.positionHistory.slice(-30);
    const avgX = recent.reduce((sum, pos) => sum + pos.x, 0) / recent.length;
    const avgY = recent.reduce((sum, pos) => sum + pos.y, 0) / recent.length;
    const variance = recent.reduce((sum, pos) => 
      sum + Math.pow(pos.x - avgX, 2) + Math.pow(pos.y - avgY, 2), 0) / recent.length;
    
    if (variance < 100) {
      testState.stuckCounter++;
      if (testState.stuckCounter > 30) {
        // Try random direction to get unstuck
        testState.stuckCounter = 0;
        testState.currentTarget = null;
      }
    } else {
      testState.stuckCounter = 0;
    }
  }
  
  // Determine strategy based on game progress
  if (gameState.itemsCollected >= ITEMS_NEEDED_TO_WIN && gameState.exitZone) {
    testState.phase = "EXIT";
    testState.currentTarget = { 
      x: gameState.exitZone.x + gameState.exitZone.w / 2, 
      y: gameState.exitZone.y + gameState.exitZone.h / 2,
      type: "exit"
    };
  } else {
    // Find nearest uncollected item
    let nearestItem = null;
    let minDist = Infinity;
    
    for (const item of gameState.items) {
      if (!item.collected) {
        const dist = p.dist(gameState.player.x, gameState.player.y, item.x, item.y);
        if (dist < minDist) {
          minDist = dist;
          nearestItem = item;
        }
      }
    }
    
    if (nearestItem && (!testState.currentTarget || testState.currentTarget.type !== "item")) {
      testState.currentTarget = { x: nearestItem.x, y: nearestItem.y, type: "item" };
    }
  }
  
  const actions = [];
  
  // Move towards target
  if (testState.currentTarget) {
    const dx = testState.currentTarget.x - gameState.player.x;
    const dy = testState.currentTarget.y - gameState.player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 20) {
      // Close to target, try to interact
      actions.push(32); // SPACE
      testState.currentTarget = null;
    } else {
      // Move towards target
      if (Math.abs(dx) > Math.abs(dy)) {
        actions.push(dx > 0 ? 39 : 37); // RIGHT or LEFT
      } else {
        actions.push(dy > 0 ? 40 : 38); // DOWN or UP
      }
      
      // Use sprint
      actions.push(16); // SHIFT
    }
  }
  
  // Avoid guards
  for (const guard of gameState.guards) {
    const dist = p.dist(gameState.player.x, gameState.player.y, guard.x, guard.y);
    if (dist < 80 && guard.isChasing) {
      // Use gadget if available
      if (gameState.player.hasGadget) {
        actions.push(90); // Z
      }
      
      // Run away from guard
      const dx = gameState.player.x - guard.x;
      const dy = gameState.player.y - guard.y;
      
      if (Math.abs(dx) > Math.abs(dy)) {
        actions.push(dx > 0 ? 39 : 37);
      } else {
        actions.push(dy > 0 ? 40 : 38);
      }
      
      actions.push(16); // Sprint
      break;
    }
  }
  
  return actions.length > 0 ? actions : null;
}

function getBasicMovementTest(gameState) {
  if (!gameState.player) return null;
  
  // Simple movement test - move in a pattern
  const frame = gameState.frameCount % 240;
  const actions = [];
  
  if (frame < 60) {
    actions.push(39); // RIGHT
  } else if (frame < 120) {
    actions.push(40); // DOWN
  } else if (frame < 180) {
    actions.push(37); // LEFT
  } else {
    actions.push(38); // UP
  }
  
  // Test sprint occasionally
  if (frame % 60 < 30) {
    actions.push(16); // SHIFT
  }
  
  return actions;
}

function getInteractionTest(gameState) {
  if (!gameState.player) return null;
  
  const p = window.gameInstance;
  const actions = [];
  
  // Find nearest NPC or item
  let nearestEntity = null;
  let minDist = Infinity;
  
  for (const npc of gameState.npcs) {
    if (!npc.hasInteracted) {
      const dist = p.dist(gameState.player.x, gameState.player.y, npc.x, npc.y);
      if (dist < minDist) {
        minDist = dist;
        nearestEntity = npc;
      }
    }
  }
  
  for (const item of gameState.items) {
    if (!item.collected) {
      const dist = p.dist(gameState.player.x, gameState.player.y, item.x, item.y);
      if (dist < minDist) {
        minDist = dist;
        nearestEntity = item;
      }
    }
  }
  
  if (nearestEntity) {
    const dx = nearestEntity.x - gameState.player.x;
    const dy = nearestEntity.y - gameState.player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 30) {
      actions.push(32); // SPACE to interact
    } else {
      if (Math.abs(dx) > Math.abs(dy)) {
        actions.push(dx > 0 ? 39 : 37);
      } else {
        actions.push(dy > 0 ? 40 : 38);
      }
    }
  }
  
  return actions.length > 0 ? actions : null;
}

function getGuardTest(gameState) {
  if (!gameState.player || gameState.guards.length === 0) return null;
  
  const p = window.gameInstance;
  const actions = [];
  
  // Move towards a guard to test detection
  const guard = gameState.guards[0];
  const dx = guard.x - gameState.player.x;
  const dy = guard.y - gameState.player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist > 50) {
    // Move towards guard
    if (Math.abs(dx) > Math.abs(dy)) {
      actions.push(dx > 0 ? 39 : 37);
    } else {
      actions.push(dy > 0 ? 40 : 38);
    }
  } else {
    // Close to guard - test evasion
    actions.push(dx > 0 ? 37 : 39);
    actions.push(16); // Sprint
  }
  
  return actions;
}

function getRandomAction(gameState) {
  const actions = [37, 38, 39, 40]; // Arrow keys
  const randomKey = actions[Math.floor(Math.random() * actions.length)];
  return [randomKey];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicMovementTest(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getInteractionTest(gameState);
    case "TEST_4":
      return getGuardTest(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;