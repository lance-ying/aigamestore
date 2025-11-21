// automated_testing_controller.js - Automated testing

import { gameState, GAME_PHASES, ENTITY_TYPES } from './globals.js';

// Helper to find nearest entity of a type
function findNearestEntity(type) {
  const player = gameState.player;
  if (!player) return null;
  
  const entities = gameState.entities.filter(e => e.type === type && e.active);
  if (entities.length === 0) return null;
  
  let nearest = null;
  let minDist = Infinity;
  
  entities.forEach(entity => {
    const dx = entity.x - player.x;
    const dy = entity.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < minDist) {
      minDist = dist;
      nearest = entity;
    }
  });
  
  return nearest;
}

// Helper to check if player can reach a target
function canReachTarget(targetX) {
  const player = gameState.player;
  if (!player) return false;
  
  const dx = Math.abs(targetX - player.x);
  return dx < 50;
}

// TEST_1: Basic movement and interaction testing
function getTest1Action(gameState) {
  const player = gameState.player;
  if (!player) return {};
  
  const action = {
    left: false,
    right: false,
    jump: false,
    interact: false
  };
  
  // Simple test pattern: move right, interact with objects
  if (player.x < 200) {
    action.right = true;
    if (Math.random() > 0.7) action.jump = true;
  } else if (player.x < 250) {
    const crate = findNearestEntity(ENTITY_TYPES.CRATE);
    if (crate && canReachTarget(crate.x)) {
      action.interact = true;
      action.right = true;
    }
  } else if (player.x < 700) {
    action.right = true;
    if (player.onGround && Math.random() > 0.8) action.jump = true;
  } else if (player.x < 800) {
    const lever = findNearestEntity(ENTITY_TYPES.LEVER);
    if (lever && canReachTarget(lever.x)) {
      action.interact = true;
    }
    action.right = true;
  }
  
  return action;
}

// TEST_2: Optimal strategy to win the game
function getTest2Action(gameState) {
  const player = gameState.player;
  if (!player) return {};
  
  const action = {
    left: false,
    right: false,
    jump: false,
    interact: false
  };
  
  const px = player.x;
  const py = player.y;
  
  // Section 1: Push first crate, reach platform, navigate spikes
  if (px < 140) {
    action.right = true;
  } else if (px < 190 && py > 300) {
    // Push crate
    action.right = true;
    action.interact = true;
  } else if (px < 250) {
    action.right = true;
  } else if (px < 260 && player.onGround) {
    // Jump onto platform
    action.jump = true;
    action.right = true;
  } else if (px < 350) {
    action.right = true;
  } else if (px < 360 && player.onGround) {
    // Jump over spikes
    action.jump = true;
    action.right = true;
  } else if (px < 550) {
    action.right = true;
  } else if (px < 590 && py > 300) {
    // Push second crate
    action.right = true;
    action.interact = true;
  } else if (px < 650) {
    action.right = true;
  }
  // Section 2: Activate lever, pass gate
  else if (px < 720 && py > 300) {
    action.right = true;
    const lever = findNearestEntity(ENTITY_TYPES.LEVER);
    if (lever && !lever.activated && canReachTarget(lever.x)) {
      action.interact = true;
    }
  } else if (px < 850) {
    action.right = true;
    if (px > 800 && px < 830 && player.onGround) {
      action.jump = true;
    }
  }
  // Section 3: Platform jumps
  else if (px < 950) {
    action.right = true;
  } else if (px < 960 && player.onGround) {
    action.jump = true;
    action.right = true;
  } else if (px < 1070) {
    action.right = true;
  } else if (px < 1090 && player.onGround) {
    action.jump = true;
    action.right = true;
  } else if (px < 1200) {
    action.right = true;
  } else if (px < 1220 && player.onGround) {
    action.jump = true;
    action.right = true;
  } else if (px < 1400) {
    action.right = true;
  }
  // Section 4: Crate stacking
  else if (px < 1490) {
    action.right = true;
  } else if (px < 1540 && py > 300) {
    // Push first crate to stack
    action.right = true;
    action.interact = true;
  } else if (px < 1580 && py > 300) {
    // Push second crate
    action.right = true;
    action.interact = true;
  } else if (px < 1650) {
    action.right = true;
  } else if (px < 1660 && player.onGround) {
    action.jump = true;
    action.right = true;
  } else if (px < 1720) {
    action.right = true;
    const lever = findNearestEntity(ENTITY_TYPES.LEVER);
    if (lever && !lever.activated) {
      action.interact = true;
    }
  } else if (px < 2000) {
    action.right = true;
  }
  // Section 5: Moving platform
  else if (px < 2050) {
    action.right = true;
  } else if (px < 2100) {
    // Wait for platform and jump on
    const platform = findNearestEntity(ENTITY_TYPES.MOVING_PLATFORM);
    if (platform && Math.abs(platform.x - px) < 30 && player.onGround) {
      action.jump = true;
    }
  } else if (px < 2350) {
    // Stay on platform
    if (py < 280) {
      action.right = true;
    }
  } else if (px < 2400) {
    if (player.onGround) {
      action.jump = true;
      action.right = true;
    }
  }
  // Section 6: Final spike navigation
  else if (px < 2540) {
    action.right = true;
  } else if (px < 2560 && player.onGround) {
    action.jump = true;
    action.right = true;
  } else if (px < 2650) {
    action.right = true;
  } else if (px < 2670 && player.onGround) {
    action.jump = true;
    action.right = true;
  } else if (px < 2750) {
    action.right = true;
  } else if (px < 2770 && player.onGround) {
    action.jump = true;
    action.right = true;
  } else {
    action.right = true;
  }
  
  return action;
}

// Random action for fallback
function getRandomAction(gameState) {
  return {
    left: Math.random() > 0.7,
    right: Math.random() > 0.5,
    jump: Math.random() > 0.8,
    interact: Math.random() > 0.9
  };
}

export function get_automated_testing_action(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return {};
  }
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTest1Action(gameState);
    case "TEST_2":
      return getTest2Action(gameState);
    default:
      return {};
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;