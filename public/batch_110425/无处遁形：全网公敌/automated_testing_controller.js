import { gameState, CASE_DATA, GAME_PHASES } from './globals.js';

function getTestWinAction(gameState) {
  const caseData = CASE_DATA[gameState.currentCase];
  
  // State machine for optimal win strategy
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  // Step 1: Search in browser
  if (gameState.objectivesCompleted === 0) {
    if (gameState.openApp === null) {
      // Navigate to browser (index 0)
      if (gameState.selectedAppIndex !== 0) {
        return { keyCode: 37, key: "ArrowLeft" }; // Move left to browser
      }
      return { keyCode: 32, key: " " }; // Open browser
    } else if (gameState.openApp === "browser") {
      if (gameState.searchHistory.length === 0) {
        // Type search query
        if (gameState.browserSearchInput.length === 0) {
          return { keyCode: 83, key: "S" };
        } else if (gameState.browserSearchInput === "S") {
          return { keyCode: 97, key: "a" };
        } else if (gameState.browserSearchInput === "Sa") {
          return { keyCode: 114, key: "r" };
        } else if (gameState.browserSearchInput === "Sar") {
          return { keyCode: 97, key: "a" };
        } else if (gameState.browserSearchInput === "Sara") {
          return { keyCode: 104, key: "h" };
        } else if (gameState.browserSearchInput === "Sarah") {
          return { keyCode: 32, key: " " }; // Execute search
        }
      } else {
        return { keyCode: 90, key: "z" }; // Close browser
      }
    }
  }
  
  // Step 2: Query database
  if (gameState.objectivesCompleted === 1) {
    if (gameState.openApp === null) {
      if (gameState.selectedAppIndex !== 1) {
        return { keyCode: 39, key: "ArrowRight" }; // Move to database
      }
      return { keyCode: 32, key: " " }; // Open database
    } else if (gameState.openApp === "database") {
      if (gameState.databaseEntries.length === 0) {
        // Type query
        if (gameState.databaseQueryInput.length === 0) {
          return { keyCode: 67, key: "C" };
        } else if (gameState.databaseQueryInput === "C") {
          return { keyCode: 104, key: "h" };
        } else if (gameState.databaseQueryInput === "Ch") {
          return { keyCode: 101, key: "e" };
        } else if (gameState.databaseQueryInput === "Che") {
          return { keyCode: 110, key: "n" };
        } else if (gameState.databaseQueryInput === "Chen") {
          return { keyCode: 32, key: " " }; // Execute query
        }
      } else {
        return { keyCode: 90, key: "z" }; // Close database
      }
    }
  }
  
  // Step 3: Crack email password
  if (gameState.objectivesCompleted === 2) {
    if (gameState.openApp === null) {
      if (gameState.selectedAppIndex !== 3) {
        return { keyCode: 39, key: "ArrowRight" }; // Move to email
      }
      return { keyCode: 32, key: " " }; // Open email
    } else if (gameState.openApp === "email") {
      if (!gameState.crackedAccounts.includes(caseData.targetEmail)) {
        // Type password
        if (gameState.passwordInput.length === 0) {
          return { keyCode: 49, key: "1" };
        } else if (gameState.passwordInput === "1") {
          return { keyCode: 57, key: "9" };
        } else if (gameState.passwordInput === "19") {
          return { keyCode: 56, key: "8" };
        } else if (gameState.passwordInput === "198") {
          return { keyCode: 53, key: "5" };
        } else if (gameState.passwordInput === "1985") {
          return { keyCode: 32, key: " " }; // Attempt crack
        }
      } else {
        return { keyCode: 90, key: "z" }; // Close email
      }
    }
  }
  
  // Step 4: Use chat to social engineer
  if (gameState.objectivesCompleted === 4) {
    if (gameState.openApp === null) {
      if (gameState.selectedAppIndex !== 2) {
        return { keyCode: gameState.selectedAppIndex < 2 ? 39 : 37, key: "Arrow" };
      }
      return { keyCode: 32, key: " " }; // Open chat
    } else if (gameState.openApp === "chat") {
      if (gameState.chatMessages.length === 0 || gameState.chatMessages.length === 1) {
        // Select correct choice (index 1)
        if (gameState.selectedChoiceIndex !== 1) {
          return { keyCode: 40, key: "ArrowDown" };
        }
        return { keyCode: 32, key: " " }; // Submit choice
      } else {
        return { keyCode: 90, key: "z" }; // Close chat
      }
    }
  }
  
  return null;
}

function getBasicTestAction(gameState) {
  // Navigate through all apps and open/close them
  const cycle = Math.floor(gameState.frameCount / 60) % 8;
  
  if (gameState.openApp !== null) {
    return { keyCode: 90, key: "z" }; // Close any open app
  }
  
  if (cycle < 4) {
    // Navigate to app
    const targetIndex = cycle;
    if (gameState.selectedAppIndex < targetIndex) {
      return { keyCode: 39, key: "ArrowRight" };
    } else if (gameState.selectedAppIndex > targetIndex) {
      return { keyCode: 37, key: "ArrowLeft" };
    } else {
      return { keyCode: 32, key: " " }; // Open app
    }
  }
  
  return null;
}

function getRandomAction(gameState) {
  const actions = [
    { keyCode: 37, key: "ArrowLeft" },
    { keyCode: 39, key: "ArrowRight" },
    { keyCode: 32, key: " " },
    { keyCode: 90, key: "z" }
  ];
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;