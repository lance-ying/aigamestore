// automated_testing_controller.js - Automated testing

import { gameState, COLOR_PINK, COLOR_YELLOW } from './globals.js';

function getTestWinAction(gameState) {
  const player = gameState.player;
  if (!player) return null;
  
  // Look ahead for upcoming platforms
  const lookAheadDistance = 200;
  const playerFrontX = player.x + 50;
  
  let nextPlatform = null;
  let minDistance = Infinity;
  
  for (const platform of gameState.platforms) {
    if (platform.x > playerFrontX && platform.x < playerFrontX + lookAheadDistance) {
      const distance = platform.x - playerFrontX;
      if (distance < minDistance) {
        minDistance = distance;
        nextPlatform = platform;
      }
    }
  }
  
  // Switch color proactively
  if (nextPlatform && player.color !== nextPlatform.color) {
    if (nextPlatform.color === COLOR_PINK) {
      return { keyCode: 37 }; // LEFT
    } else {
      return { keyCode: 39 }; // RIGHT
    }
  }
  
  // Check if we need to jump
  const needsJump = !player.isGrounded || minDistance < 100;
  
  // Jump if falling or gap approaching
  if (needsJump && player.isGrounded) {
    return { keyCode: 38 }; // UP
  }
  
  return null;
}

function getBasicTestAction(gameState) {
  const player = gameState.player;
  if (!player) return null;
  
  const frame = gameState.levelTime;
  
  // Test sequence: jump, switch colors, jump, etc.
  if (frame % 60 === 0 && player.isGrounded) {
    return { keyCode: 38 }; // Jump
  }
  
  if (frame % 90 === 30) {
    return { keyCode: 37 }; // Switch to Pink
  }
  
  if (frame % 90 === 60) {
    return { keyCode: 39 }; // Switch to Yellow
  }
  
  return null;
}

function getTokenCollectionAction(gameState) {
  const player = gameState.player;
  if (!player) return null;
  
  // Find nearest uncollected token
  let nearestToken = null;
  let minDistance = Infinity;
  
  for (const token of gameState.tokens) {
    if (!token.collected) {
      const distance = Math.abs(token.x - player.x);
      if (distance < minDistance && token.x > player.x - 50) {
        minDistance = distance;
        nearestToken = token;
      }
    }
  }
  
  // Jump to collect token
  if (nearestToken && minDistance < 100 && player.isGrounded) {
    const heightDiff = player.y - nearestToken.y;
    if (heightDiff > 20) {
      return { keyCode: 38 }; // Jump
    }
  }
  
  // Color switching for platforms
  const lookAhead = 150;
  for (const platform of gameState.platforms) {
    if (platform.x > player.x && platform.x < player.x + lookAhead) {
      if (player.color !== platform.color) {
        return { keyCode: platform.color === COLOR_PINK ? 37 : 39 };
      }
      break;
    }
  }
  
  return null;
}

function getFailureTestAction(gameState) {
  const player = gameState.player;
  if (!player) return null;
  
  const frame = gameState.levelTime;
  
  // Intentionally land on wrong color after some time
  if (frame > 120 && frame < 180) {
    // Don't switch color - let mismatch happen
    if (player.isGrounded && frame % 60 === 0) {
      return { keyCode: 38 }; // Jump without switching
    }
  }
  
  return null;
}

function getRandomAction(gameState) {
  const player = gameState.player;
  if (!player) return null;
  
  const rand = Math.random();
  
  if (rand < 0.1 && player.isGrounded) {
    return { keyCode: 38 }; // Jump
  } else if (rand < 0.15) {
    return { keyCode: 37 }; // Left
  } else if (rand < 0.2) {
    return { keyCode: 39 }; // Right
  }
  
  return null;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTokenCollectionAction(gameState);
    case "TEST_4":
      return getFailureTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;