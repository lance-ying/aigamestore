// automated_testing_controller.js - Automated testing

import { 
  gameState, 
  PHASE_PLAYING,
  KEY_SPACE,
  DUEL_BANG,
  DUEL_READY,
  DUEL_STEADY,
  DUEL_WAIT,
  DUEL_RESULT
} from './globals.js';

// Test counter for random actions
let testActionCounter = 0;

function getTestWinAction(gameState) {
  // Optimal strategy: Wait for BANG then draw immediately
  if (gameState.gamePhase === PHASE_PLAYING) {
    if (gameState.duelPhase === DUEL_BANG) {
      // Draw as soon as BANG appears
      if (!gameState.player.hasDrawn) {
        // Small random delay to simulate human reaction (150-250ms)
        const framesSinceBang = gameState.duelTimer;
        const reactionFrames = 9 + Math.floor(Math.random() * 6); // 150-250ms at 60fps
        
        if (framesSinceBang >= reactionFrames) {
          return { keyCode: KEY_SPACE };
        }
      }
    }
  }
  
  return null;
}

function getTestBasicAction(gameState) {
  // Test basic mechanics with various timings
  if (gameState.gamePhase === PHASE_PLAYING) {
    testActionCounter++;
    
    // Sometimes try to draw during different phases to test foul detection
    if (testActionCounter % 300 === 100) {
      // Test early draw during READY
      if (gameState.duelPhase === DUEL_READY) {
        return { keyCode: KEY_SPACE };
      }
    }
    
    if (testActionCounter % 300 === 200) {
      // Test early draw during STEADY
      if (gameState.duelPhase === DUEL_STEADY) {
        return { keyCode: KEY_SPACE };
      }
    }
    
    // Normal response after BANG
    if (gameState.duelPhase === DUEL_BANG) {
      if (!gameState.player.hasDrawn) {
        const framesSinceBang = gameState.duelTimer;
        // Slower reaction time for basic test (250-400ms)
        const reactionFrames = 15 + Math.floor(Math.random() * 10);
        
        if (framesSinceBang >= reactionFrames) {
          return { keyCode: KEY_SPACE };
        }
      }
    }
  }
  
  return null;
}

function getRandomAction(gameState) {
  // Random actions for fallback
  if (gameState.gamePhase === PHASE_PLAYING) {
    if (Math.random() < 0.02) { // 2% chance per frame
      return { keyCode: KEY_SPACE };
    }
  }
  return null;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;