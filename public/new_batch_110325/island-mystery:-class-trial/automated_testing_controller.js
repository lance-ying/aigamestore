// Automated testing controller
import { gameState, PLAY_PHASES } from './globals.js';

function getTestBasicAction(gameState) {
  // Test basic navigation and interaction
  const currentLoc = gameState.locations[gameState.currentLocation];
  const player = gameState.player;
  
  if (!player) return null;
  
  // Find unexamined interactables
  const unexamined = currentLoc.interactables.find(obj => !obj.examined);
  
  if (unexamined) {
    // Move towards unexamined object
    if (Math.abs(player.x - unexamined.x) > 40) {
      return { keyCode: player.x < unexamined.x ? 39 : 37 }; // RIGHT or LEFT
    } else if (Math.abs(player.y - unexamined.y) > 40) {
      return { keyCode: player.y < unexamined.y ? 40 : 38 }; // DOWN or UP
    } else {
      return { keyCode: 32 }; // SPACE to examine
    }
  } else {
    // Move to next location
    if (gameState.framesSinceAction > 30) {
      gameState.framesSinceAction = 0;
      return { keyCode: 16 }; // SHIFT for quick travel
    }
  }
  
  return null;
}

function getTestWinAction(gameState) {
  // Optimal strategy to win
  if (gameState.playPhase === PLAY_PHASES.INVESTIGATION) {
    return getInvestigationWinAction(gameState);
  } else {
    return getTrialWinAction(gameState);
  }
}

function getInvestigationWinAction(gameState) {
  const currentLoc = gameState.locations[gameState.currentLocation];
  const player = gameState.player;
  
  if (!player) return null;
  
  // Priority locations with key evidence
  const priorityLocations = [2, 3, 1]; // Restaurant, Library, Hotel
  
  // Find unexamined in current location
  const unexamined = currentLoc.interactables.find(obj => !obj.examined);
  
  if (unexamined) {
    // Move efficiently towards object
    const dx = unexamined.x - player.x;
    const dy = unexamined.y - player.y;
    
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
      return { keyCode: dx > 0 ? 39 : 37 }; // RIGHT or LEFT
    } else if (Math.abs(dy) > 30) {
      return { keyCode: dy > 0 ? 40 : 38 }; // DOWN or UP
    } else {
      return { keyCode: 32 }; // SPACE to examine
    }
  } else {
    // Move to priority location
    if (gameState.evidence.length >= 5) {
      return { keyCode: 32 }; // Start trial
    }
    
    const nextLoc = priorityLocations.find(loc => 
      gameState.locations[loc].interactables.some(obj => !obj.examined)
    );
    
    if (nextLoc !== undefined && nextLoc !== gameState.currentLocation) {
      if (gameState.framesSinceAction > 20) {
        gameState.framesSinceAction = 0;
        return { keyCode: 16 }; // Quick travel
      }
    }
  }
  
  return null;
}

function getTrialWinAction(gameState) {
  if (gameState.currentStatement >= gameState.trialStatements.length) {
    return null;
  }
  
  const statement = gameState.trialStatements[gameState.currentStatement];
  const correctEvidenceId = statement.correctEvidence;
  
  // Find correct evidence index
  const correctIndex = gameState.evidence.findIndex(ev => ev.id === correctEvidenceId);
  
  if (correctIndex === -1) return null;
  
  // Navigate to correct evidence
  if (gameState.cursorPosition < correctIndex) {
    return { keyCode: 40 }; // DOWN
  } else if (gameState.cursorPosition > correctIndex) {
    return { keyCode: 38 }; // UP
  } else {
    // Fire evidence
    if (gameState.framesSinceAction > 10) {
      gameState.framesSinceAction = 0;
      return { keyCode: 90 }; // Z
    }
  }
  
  return null;
}

function getTestLoseAction(gameState) {
  // Deliberately make mistakes to test lose condition
  if (gameState.playPhase === PLAY_PHASES.INVESTIGATION) {
    return getInvestigationWinAction(gameState); // Collect evidence normally
  } else {
    // Select wrong evidence
    if (gameState.currentStatement < gameState.trialStatements.length) {
      const statement = gameState.trialStatements[gameState.currentStatement];
      const correctEvidenceId = statement.correctEvidence;
      
      // Find any wrong evidence
      const wrongIndex = gameState.evidence.findIndex(ev => ev.id !== correctEvidenceId);
      
      if (wrongIndex === -1) return null;
      
      // Navigate to wrong evidence
      if (gameState.cursorPosition !== wrongIndex) {
        return { keyCode: gameState.cursorPosition < wrongIndex ? 40 : 38 };
      } else {
        if (gameState.framesSinceAction > 10) {
          gameState.framesSinceAction = 0;
          return { keyCode: 90 }; // Z to fire wrong evidence
        }
      }
    }
  }
  
  return null;
}

function getRandomAction(gameState) {
  const actions = [37, 38, 39, 40, 32]; // Arrow keys and Space
  const randomKey = actions[Math.floor(Math.random() * actions.length)];
  return { keyCode: randomKey };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestLoseAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;