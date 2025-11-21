import { MINI_GAMES } from './globals.js';

let testState = {
  initialized: false,
  currentStep: 0,
  waitFrames: 0,
  gamesVisited: 0,
  actionQueue: []
};

function getTestMenuNavigationAction(gameState) {
  if (!testState.initialized) {
    testState.initialized = true;
    testState.currentStep = 0;
    testState.gamesVisited = 0;
  }
  
  if (gameState.gamePhase === "START") {
    if (testState.waitFrames > 0) {
      testState.waitFrames--;
      return null;
    }
    
    // Navigate through all games
    if (testState.gamesVisited < 12) {
      if (testState.currentStep === 0) {
        // Select game
        testState.currentStep = 1;
        return { keyCode: 32, release: true }; // Space to select
      } else if (testState.currentStep === 1) {
        // Start game
        testState.currentStep = 2;
        testState.waitFrames = 10;
        return { keyCode: 13, release: true }; // Enter
      } else if (testState.currentStep === 2) {
        // Return to menu
        testState.currentStep = 3;
        testState.waitFrames = 30;
        return { keyCode: 82, release: true }; // R
      } else if (testState.currentStep === 3) {
        // Navigate to next game
        testState.gamesVisited++;
        testState.currentStep = 0;
        testState.waitFrames = 10;
        return { keyCode: 39, release: true }; // Right arrow
      }
    }
  } else if (gameState.gamePhase === "PLAYING") {
    testState.waitFrames = 60;
  }
  
  return null;
}

function getTestWinAction(gameState) {
  if (!testState.initialized) {
    testState.initialized = true;
    testState.currentStep = 0;
    testState.waitFrames = 0;
  }
  
  if (gameState.gamePhase === "START") {
    if (testState.currentStep === 0) {
      // Select Hoop Fever (game 0)
      if (gameState.currentMiniGame !== 0) {
        if (gameState.menuSelection !== 0) {
          return { keyCode: 37, release: true }; // Navigate left
        } else {
          return { keyCode: 32, release: true }; // Select
        }
      } else {
        testState.currentStep = 1;
        return { keyCode: 13, release: true }; // Start
      }
    }
  } else if (gameState.gamePhase === "PLAYING") {
    if (gameState.miniGameState && gameState.miniGameState.state) {
      const state = gameState.miniGameState.state;
      
      // Hoop Fever strategy
      if (gameState.currentMiniGame === 0) {
        if (!state.charging && state.ballsRemaining > 0 && state.balls.length === 0) {
          testState.waitFrames = 5;
          return { keyCode: 32, release: false }; // Start charging
        } else if (state.charging && state.powerMeter >= 65 && state.powerMeter <= 80) {
          return { keyCode: 32, release: true }; // Release at optimal power
        }
      }
    }
  }
  
  return null;
}

function getTestDifficultyAction(gameState) {
  if (!testState.initialized) {
    testState.initialized = true;
    testState.currentStep = 0;
  }
  
  if (gameState.gamePhase === "START") {
    if (testState.currentStep === 0) {
      // Select Formula Race (game 1)
      if (gameState.currentMiniGame !== 1) {
        if (gameState.menuSelection < 1) {
          return { keyCode: 39, release: true }; // Navigate right
        } else if (gameState.menuSelection > 1) {
          return { keyCode: 37, release: true }; // Navigate left
        } else {
          return { keyCode: 32, release: true }; // Select
        }
      } else {
        testState.currentStep = 1;
        return { keyCode: 13, release: true }; // Start
      }
    }
  } else if (gameState.gamePhase === "PLAYING") {
    if (gameState.miniGameState && gameState.miniGameState.state) {
      const state = gameState.miniGameState.state;
      
      // Formula Race - try to survive and observe difficulty scaling
      const obstacles = state.obstacles || [];
      const opponents = state.opponents || [];
      
      // Simple avoidance AI
      let nearestObstacle = null;
      let minDist = Infinity;
      
      for (const obs of obstacles) {
        if (obs.y > state.playerY - 100 && obs.y < state.playerY + 50) {
          const dist = Math.abs(obs.x - state.playerX);
          if (dist < minDist) {
            minDist = dist;
            nearestObstacle = obs;
          }
        }
      }
      
      for (const opp of opponents) {
        if (opp.y > state.playerY - 100 && opp.y < state.playerY + 50) {
          const dist = Math.abs(opp.x - state.playerX);
          if (dist < minDist) {
            minDist = dist;
            nearestObstacle = opp;
          }
        }
      }
      
      if (nearestObstacle) {
        if (nearestObstacle.x < state.playerX - 20) {
          return { keyCode: 39, release: true }; // Move right
        } else if (nearestObstacle.x > state.playerX + 20) {
          return { keyCode: 37, release: true }; // Move left
        }
      }
      
      // Random movement if no obstacles nearby
      if (Math.random() > 0.95) {
        return { keyCode: Math.random() > 0.5 ? 37 : 39, release: true };
      }
    }
  }
  
  return null;
}

function getRandomAction(gameState) {
  const actions = [37, 38, 39, 40, 32, 90];
  const randomKey = actions[Math.floor(Math.random() * actions.length)];
  return { keyCode: randomKey, release: Math.random() > 0.5 };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestMenuNavigationAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestDifficultyAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;