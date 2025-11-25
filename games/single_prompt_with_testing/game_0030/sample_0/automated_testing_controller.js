// automated_testing_controller.js - Automated testing AI

import { gameState, CANVAS_WIDTH, SPIRIT_STATE_WAITING, SPIRIT_STATE_ON_BOAT } from './globals.js';

let testState = {
  targetSpirit: null,
  targetIsland: null,
  phase: 'collect_spirits', // 'collect_spirits', 'gather_resources', 'feed_spirits', 'release_spirits'
  positionHistory: [],
  stuckCounter: 0
};

function getTestWinAction(gameState) {
  const action = { left: false, right: false, jump: false, interact: false, cook: false };
  
  const player = gameState.player;
  const boat = gameState.boat;
  
  // Track position to detect if stuck
  testState.positionHistory.push({ x: player.x, y: player.y });
  if (testState.positionHistory.length > 60) {
    testState.positionHistory.shift();
  }
  
  // Check if stuck
  if (testState.positionHistory.length >= 60) {
    const recent = testState.positionHistory.slice(-30);
    const avgX = recent.reduce((sum, p) => sum + p.x, 0) / recent.length;
    if (Math.abs(player.x - avgX) < 5) {
      testState.stuckCounter++;
      if (testState.stuckCounter > 30) {
        action.jump = true;
        testState.stuckCounter = 0;
      }
    } else {
      testState.stuckCounter = 0;
    }
  }
  
  // Phase 1: Collect all spirits
  const waitingSpirits = gameState.spirits.filter(s => s.state === SPIRIT_STATE_WAITING);
  if (waitingSpirits.length > 0) {
    testState.phase = 'collect_spirits';
    const target = waitingSpirits[0];
    
    const distX = target.x - player.x;
    const distY = target.y - player.y;
    
    if (Math.abs(distX) < 40 && Math.abs(distY) < 50) {
      action.interact = true;
    } else {
      if (distX < -10) action.left = true;
      else if (distX > 10) action.right = true;
      
      if (Math.abs(distX) < 100 && distY < -20 && player.onGround) {
        action.jump = true;
      }
    }
    return action;
  }
  
  // Phase 2: Gather resources if needed
  const needResources = gameState.resources.fish < 6 || gameState.resources.plants < 6;
  if (needResources && !gameState.everdoorReached) {
    testState.phase = 'gather_resources';
    
    const activeIslands = gameState.islands.filter(island => island.active && island.resourceCount > 0);
    if (activeIslands.length > 0) {
      // Prioritize the type we need most
      let target = activeIslands[0];
      if (gameState.resources.fish < gameState.resources.plants) {
        const fishIslands = activeIslands.filter(i => i.type === 'fish');
        if (fishIslands.length > 0) target = fishIslands[0];
      } else {
        const plantIslands = activeIslands.filter(i => i.type === 'plant');
        if (plantIslands.length > 0) target = plantIslands[0];
      }
      
      const distX = (target.x + target.width / 2) - player.x;
      const distY = target.y - player.y;
      
      if (Math.abs(distX) < 50 && Math.abs(distY) < 60) {
        action.interact = true;
      } else {
        if (distX < -10) action.left = true;
        else if (distX > 10) action.right = true;
        
        if (Math.abs(distX) < 120 && distY < -10 && player.onGround) {
          action.jump = true;
        }
      }
      return action;
    }
  }
  
  // Phase 3: Cook meals if we have ingredients
  if (gameState.resources.fish > 0 && gameState.resources.plants > 0 && gameState.cookingCooldown === 0) {
    testState.phase = 'feed_spirits';
    action.cook = true;
    return action;
  }
  
  // Phase 4: Wait for everdoor and release spirits
  if (gameState.everdoorReached) {
    testState.phase = 'release_spirits';
    
    // Find a ready spirit
    const readySpirits = gameState.spirits.filter(s => s.state === SPIRIT_STATE_ON_BOAT && s.isReady());
    if (readySpirits.length > 0) {
      const everdoor = gameState.everdoor;
      const distX = everdoor.x - player.x;
      const distY = everdoor.y - player.y;
      
      if (Math.abs(distX) < 80 && Math.abs(distY) < 100) {
        action.interact = true;
      } else {
        if (distX < -10) action.left = true;
        else if (distX > 10) action.right = true;
      }
    }
  }
  
  return action;
}

function getTestMovementAction(gameState) {
  const action = { left: false, right: false, jump: false, interact: false, cook: false };
  
  const player = gameState.player;
  
  // Simple movement test: move left and right, jump occasionally
  const time = Math.floor(gameState.frameCount / 60);
  
  if (time % 4 < 2) {
    action.right = true;
  } else {
    action.left = true;
  }
  
  if (time % 3 === 0 && player.onGround) {
    action.jump = true;
  }
  
  return action;
}

function getTestInteractionAction(gameState) {
  const action = { left: false, right: false, jump: false, interact: false, cook: false };
  
  const player = gameState.player;
  
  // Test interactions: move to nearest island or spirit and interact
  const activeIslands = gameState.islands.filter(i => i.active);
  const waitingSpirits = gameState.spirits.filter(s => s.state === SPIRIT_STATE_WAITING);
  
  let target = null;
  let minDist = Infinity;
  
  for (let island of activeIslands) {
    const dist = Math.abs(island.x - player.x);
    if (dist < minDist) {
      minDist = dist;
      target = { x: island.x + island.width / 2, y: island.y };
    }
  }
  
  for (let spirit of waitingSpirits) {
    const dist = Math.abs(spirit.x - player.x);
    if (dist < minDist) {
      minDist = dist;
      target = { x: spirit.x, y: spirit.y };
    }
  }
  
  if (target) {
    const distX = target.x - player.x;
    const distY = target.y - player.y;
    
    if (Math.abs(distX) < 50) {
      action.interact = true;
    } else {
      if (distX < 0) action.left = true;
      else action.right = true;
    }
    
    if (Math.abs(distX) < 100 && distY < -20 && player.onGround) {
      action.jump = true;
    }
  }
  
  // Cook if possible
  if (gameState.resources.fish > 0 && gameState.resources.plants > 0) {
    action.cook = true;
  }
  
  return action;
}

function getRandomAction(gameState) {
  const actions = ['left', 'right', 'jump', 'interact', 'cook', 'none'];
  const chosen = actions[Math.floor(Math.random() * actions.length)];
  
  return {
    left: chosen === 'left',
    right: chosen === 'right',
    jump: chosen === 'jump',
    interact: chosen === 'interact',
    cook: chosen === 'cook'
  };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestMovementAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestInteractionAction(gameState);
    case "TEST_4":
      return getRandomAction(gameState);
    default:
      return { left: false, right: false, jump: false, interact: false, cook: false };
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;