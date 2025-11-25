// automated_testing_controller.js - Automated testing functions

import { gameState } from './globals.js';

function getTestWinAction(gameState) {
  const player = gameState.player;
  if (!player) return getIdleAction();
  
  const action = {
    left: false,
    right: false,
    up: false,
    jump: false,
    dash: false,
    groundPound: false
  };
  
  // Strategy: Navigate to collect orbs in order, then reach goal
  const redOrbPos = { x: 250, y: 130 };
  const blueOrbPos = { x: 310, y: -50 };
  const yellowOrbPos = { x: 280, y: -230 };
  const goalPos = { x: 300, y: -420 };
  
  let targetX, targetY;
  
  // Determine current objective
  if (!gameState.abilities.doubleJump) {
    targetX = redOrbPos.x;
    targetY = redOrbPos.y;
  } else if (!gameState.abilities.groundPound) {
    targetX = blueOrbPos.x;
    targetY = blueOrbPos.y;
  } else if (!gameState.abilities.dash) {
    targetX = yellowOrbPos.x;
    targetY = yellowOrbPos.y;
  } else {
    targetX = goalPos.x;
    targetY = goalPos.y;
  }
  
  // Horizontal movement
  if (player.x < targetX - 20) {
    action.right = true;
  } else if (player.x > targetX + 20) {
    action.left = true;
  }
  
  // Jumping logic
  if (player.y > targetY + 30 && player.onGround) {
    action.jump = true;
  }
  
  // Use double jump to reach higher
  if (player.y > targetY + 50 && !player.onGround && gameState.abilities.doubleJump && !player.hasDoubleJumped) {
    action.jump = true;
  }
  
  // Use dash to cross gaps
  if (gameState.abilities.dash && !player.onGround && Math.abs(player.x - targetX) > 100) {
    action.dash = true;
  }
  
  // Use ground pound to break fragile platforms
  if (gameState.abilities.groundPound && !player.onGround && player.y < -10 && !gameState.abilities.dash) {
    action.groundPound = true;
  }
  
  return action;
}

function getBasicTestAction(gameState) {
  const player = gameState.player;
  if (!player) return getIdleAction();
  
  const action = {
    left: false,
    right: false,
    up: false,
    jump: false,
    dash: false,
    groundPound: false
  };
  
  // Simple movement pattern: move right, jump occasionally
  if (Math.random() < 0.7) {
    action.right = true;
  } else if (Math.random() < 0.3) {
    action.left = true;
  }
  
  if (player.onGround && Math.random() < 0.1) {
    action.jump = true;
  }
  
  return action;
}

function getAbilityTestAction(gameState) {
  const player = gameState.player;
  if (!player) return getIdleAction();
  
  const action = {
    left: false,
    right: false,
    up: false,
    jump: false,
    dash: false,
    groundPound: false
  };
  
  // Test each ability when available
  action.right = true;
  
  if (player.onGround && Math.random() < 0.15) {
    action.jump = true;
  }
  
  if (gameState.abilities.doubleJump && !player.onGround && !player.hasDoubleJumped && Math.random() < 0.3) {
    action.jump = true;
  }
  
  if (gameState.abilities.dash && Math.random() < 0.05) {
    action.dash = true;
  }
  
  if (gameState.abilities.groundPound && !player.onGround && Math.random() < 0.05) {
    action.groundPound = true;
  }
  
  return action;
}

function getEnvironmentTestAction(gameState) {
  const player = gameState.player;
  if (!player) return getIdleAction();
  
  const action = {
    left: false,
    right: false,
    up: false,
    jump: false,
    dash: false,
    groundPound: false
  };
  
  // Test boundaries and visual feedback
  if (player.x < 100) {
    action.right = true;
  } else if (player.x > 500) {
    action.left = true;
  } else {
    action.right = Math.random() < 0.5;
    action.left = !action.right;
  }
  
  action.up = Math.random() < 0.1;
  
  if (player.onGround && Math.random() < 0.2) {
    action.jump = true;
  }
  
  return action;
}

function getBoundaryTestAction(gameState) {
  const player = gameState.player;
  if (!player) return getIdleAction();
  
  const action = {
    left: false,
    right: false,
    up: false,
    jump: false,
    dash: false,
    groundPound: false
  };
  
  // Rapid input changes and boundary testing
  const phase = Math.floor(Date.now() / 100) % 4;
  
  switch(phase) {
    case 0: action.left = true; break;
    case 1: action.right = true; break;
    case 2: action.jump = true; action.right = true; break;
    case 3: 
      if (gameState.abilities.dash) action.dash = true;
      break;
  }
  
  return action;
}

function getIdleAction() {
  return {
    left: false,
    right: false,
    up: false,
    jump: false,
    dash: false,
    groundPound: false
  };
}

export function get_automated_testing_action(gameState) {
  if (gameState.gamePhase !== "PLAYING") {
    return getIdleAction();
  }
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getAbilityTestAction(gameState);
    case "TEST_4":
      return getEnvironmentTestAction(gameState);
    case "TEST_5":
      return getBoundaryTestAction(gameState);
    default:
      return getIdleAction();
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;