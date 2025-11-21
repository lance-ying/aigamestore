// automated_testing_controller.js - Automated testing functions
import { PHASE_PLAYING, STATE_CLIENT_SELECT, STATE_DATE_SELECT, STATE_DATE_VENUE, STATE_MINIGAME, STATE_DATE_RESULT } from './globals.js';

function getTestWinAction(gameState) {
  // Optimal strategy: Match clients with highest compatibility dates
  // and select correct answers in mini-games
  
  if (gameState.playState === STATE_CLIENT_SELECT) {
    // Select first available client
    return { keyCode: 32, key: ' ' }; // Space to select
  } else if (gameState.playState === STATE_DATE_SELECT) {
    // Find best compatibility match
    let bestIndex = 0;
    let bestCompatibility = 0;
    
    for (let i = 0; i < Math.min(gameState.dates.length, 4); i++) {
      const compatibility = gameState.selectedClient.getCompatibility(gameState.dates[i]);
      if (compatibility > bestCompatibility) {
        bestCompatibility = compatibility;
        bestIndex = i;
      }
    }
    
    // Navigate to best match
    if (gameState.menuSelection < bestIndex) {
      return { keyCode: 40, key: 'ArrowDown' };
    } else if (gameState.menuSelection > bestIndex) {
      return { keyCode: 38, key: 'ArrowUp' };
    } else {
      return { keyCode: 32, key: ' ' };
    }
  } else if (gameState.playState === STATE_DATE_VENUE) {
    // Select first available venue
    return { keyCode: 32, key: ' ' };
  } else if (gameState.playState === STATE_MINIGAME) {
    const miniGame = gameState.currentMiniGame;
    
    if (!miniGame || miniGame.completed) {
      return null;
    }
    
    // Navigate to correct answer
    const correctAnswer = miniGame.correctAnswer;
    
    if (gameState.menuSelection < correctAnswer) {
      return { keyCode: 40, key: 'ArrowDown' };
    } else if (gameState.menuSelection > correctAnswer) {
      return { keyCode: 38, key: 'ArrowUp' };
    } else {
      return { keyCode: 32, key: ' ' };
    }
  } else if (gameState.playState === STATE_DATE_RESULT) {
    // Continue to next date
    return { keyCode: 32, key: ' ' };
  }
  
  return null;
}

function getBasicTestAction(gameState) {
  // Random valid actions for basic testing
  
  if (gameState.playState === STATE_CLIENT_SELECT) {
    const random = Math.random();
    if (random < 0.3) {
      return { keyCode: 40, key: 'ArrowDown' };
    } else if (random < 0.6) {
      return { keyCode: 38, key: 'ArrowUp' };
    } else {
      return { keyCode: 32, key: ' ' };
    }
  } else if (gameState.playState === STATE_DATE_SELECT) {
    const random = Math.random();
    if (random < 0.3) {
      return { keyCode: 40, key: 'ArrowDown' };
    } else if (random < 0.6) {
      return { keyCode: 38, key: 'ArrowUp' };
    } else {
      return { keyCode: 32, key: ' ' };
    }
  } else if (gameState.playState === STATE_DATE_VENUE) {
    return { keyCode: 32, key: ' ' };
  } else if (gameState.playState === STATE_MINIGAME) {
    const miniGame = gameState.currentMiniGame;
    if (!miniGame || miniGame.completed) {
      return null;
    }
    
    const random = Math.random();
    if (random < 0.4) {
      return { keyCode: 40, key: 'ArrowDown' };
    } else if (random < 0.7) {
      return { keyCode: 38, key: 'ArrowUp' };
    } else {
      return { keyCode: 32, key: ' ' };
    }
  } else if (gameState.playState === STATE_DATE_RESULT) {
    return { keyCode: 32, key: ' ' };
  }
  
  return null;
}

export function get_automated_testing_action(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return null;
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;

export default get_automated_testing_action;