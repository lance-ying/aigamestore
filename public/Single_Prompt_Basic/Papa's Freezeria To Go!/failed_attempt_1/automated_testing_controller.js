import { KEYS, STATIONS, SETTINGS, FLAVORS, TOPPINGS } from './globals.js';

// Helper function to get random action with sticky behavior
function getStickyKeysAction(gameState) {
  // Create a position history for the player to detect if they're stuck
  if (!gameState.positionHistory) {
    gameState.positionHistory = [];
    gameState.stuckCounter = 0;
    gameState.lastActionTime = 0;
    gameState.currentAction = null;
    gameState.actionDuration = 0;
  }
  
  // Record current position
  gameState.positionHistory.push({
    station: gameState.player.currentStation,
    option: gameState.player.selectedOption,
    time: Date.now()
  });
  
  // Keep only last 100 positions
  if (gameState.positionHistory.length > 100) {
    gameState.positionHistory.shift();
  }
  
  // Check if we're stuck (no progress for 3 seconds)
  const now = Date.now();
  if (gameState.positionHistory.length > 30) {
    const recentPositions = gameState.positionHistory.slice(-30);
    const uniqueStations = new Set(recentPositions.map(p => p.station));
    const uniqueOptions = new Set(recentPositions.map(p => p.option));
    
    // If we've been in the same station with same options for too long
    if (uniqueStations.size === 1 && uniqueOptions.size === 1 && now - gameState.lastActionTime > 3000) {
      gameState.stuckCounter++;
      gameState.lastActionTime = now;
      
      // Reset action to try something new
      gameState.currentAction = null;
    }
  }
  
  // Choose a new action if needed
  if (!gameState.currentAction || now - gameState.lastActionTime > gameState.actionDuration) {
    const possibleActions = [KEYS.LEFT, KEYS.RIGHT, KEYS.UP, KEYS.DOWN, KEYS.SPACE, KEYS.Z];
    
    // Weight actions based on current station
    let actionWeights = [1, 1, 1, 1, 3, 1]; // Default weights
    
    switch (gameState.player.currentStation) {
      case STATIONS.ORDER:
        // Prefer SPACE to take orders
        actionWeights = [1, 3, 0, 0, 5, 0];
        break;
      case STATIONS.BUILD:
        // Prefer UP/DOWN to select, Z to pour, SPACE to confirm
        actionWeights = [0, 3, 2, 2, 3, 5];
        break;
      case STATIONS.BLEND:
        // Prefer SPACE to blend, then confirm
        actionWeights = [0, 3, 1, 1, 5, 0];
        break;
      case STATIONS.TOP:
        // Prefer placing toppings and serving
        actionWeights = [0, 3, 2, 2, 5, 0];
        break;
    }
    
    // If stuck, randomize more
    if (gameState.stuckCounter > 3) {
      actionWeights = [3, 3, 3, 3, 3, 3];
      gameState.stuckCounter = 0;
    }
    
    // Choose action based on weights
    let totalWeight = actionWeights.reduce((a, b) => a + b, 0);
    let randomValue = Math.random() * totalWeight;
    let actionIndex = 0;
    
    for (let i = 0; i < actionWeights.length; i++) {
      randomValue -= actionWeights[i];
      if (randomValue <= 0) {
        actionIndex = i;
        break;
      }
    }
    
    gameState.currentAction = possibleActions[actionIndex];
    gameState.actionDuration = Math.random() * 1000 + 500; // Hold for 0.5-1.5 seconds
    gameState.lastActionTime = now;
  }
  
  return gameState.currentAction;
}

// Helper function to get optimal action for winning
function getTestWinAction(gameState) {
  // Initialize tracking variables if needed
  if (!gameState.testWinState) {
    gameState.testWinState = {
      lastStation: null,
      lastOption: null,
      pourTimer: 0,
      blendTimer: 0,
      toppingsAdded: 0,
      waitTime: 0
    };
  }
  
  const state = gameState.testWinState;
  let action = null;
  
  // Track if we changed state
  const stationChanged = state.lastStation !== gameState.player.currentStation;
  const optionChanged = state.lastOption !== gameState.player.selectedOption;
  
  // Update tracking
  state.lastStation = gameState.player.currentStation;
  state.lastOption = gameState.player.selectedOption;
  
  // Decrement wait time if we're waiting
  if (state.waitTime > 0) {
    state.waitTime--;
    return null; // No action while waiting
  }
  
  // Handle based on current station
  switch (gameState.player.currentStation) {
    case STATIONS.ORDER:
      // If there are customers and we haven't taken an order
      if (gameState.customers.length > 0 && !gameState.currentOrder) {
        // If not on the take order button, move to it
        if (gameState.player.selectedOption !== 0) {
          action = KEYS.UP; // Move to take order button
        } else {
          action = KEYS.SPACE; // Take the order
        }
      } else if (gameState.currentOrder) {
        // Move to build station
        action = KEYS.RIGHT;
      }
      break;
      
    case STATIONS.BUILD:
      if (!gameState.stationProgress[STATIONS.BUILD]) {
        if (gameState.currentSundae && gameState.currentSundae.flavor.name !== gameState.currentOrder.flavor.name) {
          // Need to select the right flavor
          const flavorIndex = FLAVORS.findIndex(f => f.name === gameState.currentOrder.flavor.name);
          
          if (gameState.player.selectedOption > flavorIndex) {
            action = KEYS.UP;
          } else if (gameState.player.selectedOption < flavorIndex) {
            action = KEYS.DOWN;
          } else {
            action = KEYS.SPACE; // Select the flavor
          }
        } else if (gameState.player.selectedOption !== FLAVORS.length) {
          // Move to pour button
          action = KEYS.DOWN;
        } else if (gameState.currentSundae && gameState.currentSundae.amount < gameState.currentOrder.amount) {
          // Pour until we reach the target amount
          action = KEYS.Z;
          state.pourTimer++;
          
          // Stop pouring if we're getting close to avoid overfilling
          if (gameState.currentSundae.amount >= gameState.currentOrder.amount - 2) {
            action = KEYS.DOWN; // Move to confirm
          }
        } else if (gameState.player.selectedOption !== FLAVORS.length + 1) {
          // Move to confirm button
          action = KEYS.DOWN;
        } else {
          // Confirm and move to next station
          action = KEYS.SPACE;
          state.waitTime = 5; // Wait a bit before next action
        }
      } else {
        // Move to blend station
        action = KEYS.RIGHT;
      }
      break;
      
    case STATIONS.BLEND:
      if (!gameState.stationProgress[STATIONS.BLEND]) {
        if (gameState.player.selectedOption !== 0) {
          // Move to blend button
          action = KEYS.UP;
        } else if (gameState.currentSundae && gameState.currentSundae.blendTime < gameState.currentOrder.blendTime) {
          // Blend until we reach the target blend time
          action = KEYS.SPACE;
          state.blendTimer++;
          
          // Stop blending if we're getting close to avoid over-blending
          if (gameState.currentSundae.blendTime >= gameState.currentOrder.blendTime - 2) {
            action = KEYS.DOWN; // Move to confirm
          }
        } else if (gameState.player.selectedOption !== 1) {
          // Move to confirm button
          action = KEYS.DOWN;
        } else {
          // Confirm and move to next station
          action = KEYS.SPACE;
          state.waitTime = 5; // Wait a bit before next action
        }
      } else {
        // Move to top station
        action = KEYS.RIGHT;
      }
      break;
      
    case STATIONS.TOP:
      if (!gameState.stationProgress[STATIONS.TOP]) {
        if (gameState.currentOrder && gameState.currentOrder.toppings.length > state.toppingsAdded) {
          // Need to add more toppings
          const nextTopping = gameState.currentOrder.toppings[state.toppingsAdded];
          const toppingIndex = TOPPINGS.findIndex(t => t.name === nextTopping.name);
          
          if (toppingIndex >= 0) {
            if (gameState.player.selectedOption > toppingIndex) {
              action = KEYS.UP;
            } else if (gameState.player.selectedOption < toppingIndex) {
              action = KEYS.DOWN;
            } else {
              // Select the topping
              action = KEYS.SPACE;
              state.waitTime = 3;
              
              // Move to place button
              gameState.player.selectedOption = TOPPINGS.length;
              state.waitTime = 5;
            }
          } else if (gameState.player.selectedOption !== TOPPINGS.length) {
            // Move to place button
            action = KEYS.DOWN;
          } else {
            // Place the topping
            action = KEYS.SPACE;
            state.toppingsAdded++;
            state.waitTime = 5;
          }
        } else if (gameState.player.selectedOption !== TOPPINGS.length + 1) {
          // Move to serve button
          action = KEYS.DOWN;
        } else {
          // Serve the sundae
          action = KEYS.SPACE;
          state.toppingsAdded = 0; // Reset for next order
          state.waitTime = 10; // Wait a bit before next customer
        }
      } else {
        // Reset and go back to order station
        action = KEYS.LEFT;
        action = KEYS.LEFT;
        action = KEYS.LEFT;
      }
      break;
  }
  
  return action;
}

// Test customer patience mechanics
function getTestPatience(gameState) {
  // Initialize tracking variables if needed
  if (!gameState.testPatienceState) {
    gameState.testPatienceState = {
      phase: 'takeOrder',
      delayTimer: 0,
      delayAmount: 300, // Frames to delay
      lastStation: null
    };
  }
  
  const state = gameState.testPatienceState;
  let action = null;
  
  // Track if we changed state
  state.lastStation = gameState.player.currentStation;
  
  // Different phases of the test
  switch (state.phase) {
    case 'takeOrder':
      // Take an order but then delay before moving on
      if (gameState.player.currentStation !== STATIONS.ORDER) {
        action = KEYS.LEFT; // Go to order station
      } else if (gameState.customers.length > 0 && !gameState.currentOrder) {
        if (gameState.player.selectedOption !== 0) {
          action = KEYS.UP; // Move to take order button
        } else {
          action = KEYS.SPACE; // Take the order
          state.phase = 'delay';
        }
      }
      break;
      
    case 'delay':
      // Intentionally delay to test patience
      state.delayTimer++;
      
      if (state.delayTimer > state.delayAmount) {
        state.delayTimer = 0;
        state.phase = 'continue';
      }
      
      // No action during delay
      return null;
      
    case 'continue':
      // Continue with the order normally
      action = getTestWinAction(gameState);
      
      // If we've served a customer, go back to take order phase
      if (gameState.player.currentStation === STATIONS.ORDER && !gameState.currentOrder) {
        state.phase = 'takeOrder';
      }
      break;
  }
  
  return action;
}

// Test accuracy mechanics
function getTestAccuracy(gameState) {
  // Initialize tracking variables if needed
  if (!gameState.testAccuracyState) {
    gameState.testAccuracyState = {
      phase: 'takeOrder',
      errorType: 'flavor', // Types: flavor, amount, blend, toppings
      lastStation: null,
      errorCount: 0
    };
  }
  
  const state = gameState.testAccuracyState;
  let action = null;
  
  // Track if we changed state
  state.lastStation = gameState.player.currentStation;
  
  // Different phases of the test
  switch (state.phase) {
    case 'takeOrder':
      // Take an order
      if (gameState.player.currentStation !== STATIONS.ORDER) {
        action = KEYS.LEFT; // Go to order station
      } else if (gameState.customers.length > 0 && !gameState.currentOrder) {
        if (gameState.player.selectedOption !== 0) {
          action = KEYS.UP; // Move to take order button
        } else {
          action = KEYS.SPACE; // Take the order
          
          // Choose a different error type each time
          state.errorCount++;
          const errorTypes = ['flavor', 'amount', 'blend', 'toppings'];
          state.errorType = errorTypes[state.errorCount % errorTypes.length];
          
          state.phase = 'makeError';
        }
      }
      break;
      
    case 'makeError':
      // Intentionally make an error based on the selected type
      if (state.errorType === 'flavor' && gameState.player.currentStation === STATIONS.BUILD) {
        // Select wrong flavor
        if (gameState.player.selectedOption >= FLAVORS.length) {
          action = KEYS.UP; // Move up to flavors
        } else {
          // Choose a flavor different from the order
          const orderFlavorIndex = FLAVORS.findIndex(f => f.name === gameState.currentOrder.flavor.name);
          const wrongFlavorIndex = (orderFlavorIndex + 1) % FLAVORS.length;
          
          if (gameState.player.selectedOption === wrongFlavorIndex) {
            action = KEYS.SPACE; // Select wrong flavor
            state.phase = 'continue';
          } else if (gameState.player.selectedOption < wrongFlavorIndex) {
            action = KEYS.DOWN;
          } else {
            action = KEYS.UP;
          }
        }
      } else if (state.errorType === 'amount' && gameState.player.currentStation === STATIONS.BUILD) {
        // Pour wrong amount (too much)
        if (gameState.player.selectedOption !== FLAVORS.length) {
          action = KEYS.DOWN; // Move to pour button
        } else if (gameState.currentSundae && gameState.currentSundae.amount < gameState.currentOrder.amount + 30) {
          action = KEYS.Z; // Pour too much
        } else {
          action = KEYS.DOWN; // Move to confirm
          state.phase = 'continue';
        }
      } else if (state.errorType === 'blend' && gameState.player.currentStation === STATIONS.BLEND) {
        // Blend wrong amount (too little)
        if (gameState.player.selectedOption !== 0) {
          action = KEYS.UP; // Move to blend button
        } else if (gameState.currentSundae && gameState.currentSundae.blendTime < gameState.currentOrder.blendTime - 50) {
          action = KEYS.SPACE; // Blend a little
        } else {
          action = KEYS.DOWN; // Move to confirm
          state.phase = 'continue';
        }
      } else if (state.errorType === 'toppings' && gameState.player.currentStation === STATIONS.TOP) {
        // Add wrong toppings
        if (gameState.player.selectedOption >= TOPPINGS.length) {
          action = KEYS.UP; // Move up to toppings
        } else {
          // Choose a topping different from any in the order
          const orderToppingNames = gameState.currentOrder.toppings.map(t => t.name);
          const availableToppings = TOPPINGS.filter(t => !orderToppingNames.includes(t.name));
          
          if (availableToppings.length > 0) {
            const wrongToppingIndex = TOPPINGS.findIndex(t => t.name === availableToppings[0].name);
            
            if (gameState.player.selectedOption === wrongToppingIndex) {
              action = KEYS.SPACE; // Select wrong topping
              
              // Move to place button
              gameState.player.selectedOption = TOPPINGS.length;
              state.phase = 'placeWrongTopping';
            } else if (gameState.player.selectedOption < wrongToppingIndex) {
              action = KEYS.DOWN;
            } else {
              action = KEYS.UP;
            }
          } else {
            // Skip adding toppings entirely
            if (gameState.player.selectedOption !== TOPPINGS.length + 1) {
              action = KEYS.DOWN; // Move to serve button
            } else {
              action = KEYS.SPACE; // Serve without toppings
              state.phase = 'takeOrder';
            }
          }
        }
      } else {
        // Move to the appropriate station for the error
        if (state.errorType === 'flavor' || state.errorType === 'amount') {
          if (gameState.player.currentStation < STATIONS.BUILD) {
            action = KEYS.RIGHT;
          } else if (gameState.player.currentStation > STATIONS.BUILD) {
            action = KEYS.LEFT;
          }
        } else if (state.errorType === 'blend') {
          if (gameState.player.currentStation < STATIONS.BLEND) {
            action = KEYS.RIGHT;
          } else if (gameState.player.currentStation > STATIONS.BLEND) {
            action = KEYS.LEFT;
          }
        } else if (state.errorType === 'toppings') {
          if (gameState.player.currentStation < STATIONS.TOP) {
            action = KEYS.RIGHT;
          } else if (gameState.player.currentStation > STATIONS.TOP) {
            action = KEYS.LEFT;
          }
        }
      }
      break;
      
    case 'placeWrongTopping':
      if (gameState.player.selectedOption === TOPPINGS.length) {
        action = KEYS.SPACE; // Place the wrong topping
        state.phase = 'continue';
      } else {
        action = KEYS.DOWN; // Move to place button
      }
      break;
      
    case 'continue':
      // Continue with the order normally
      action = getTestWinAction(gameState);
      
      // If we've served a customer, go back to take order phase
      if (gameState.player.currentStation === STATIONS.ORDER && !gameState.currentOrder) {
        state.phase = 'takeOrder';
      }
      break;
  }
  
  return action;
}

// Test difficulty progression
function getTestProgression(gameState) {
  // This test is essentially the win test but focused on observing
  // the difficulty changes as the game progresses
  return getTestWinAction(gameState);
}

export function game_testing_controller(gameState) {
  // Only run tests when in PLAYING mode
  if (gameState.gamePhase !== "PLAYING") {
    return null;
  }
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getStickyKeysAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestPatience(gameState);
    case "TEST_4":
      return getTestAccuracy(gameState);
    case "TEST_5":
      return getTestProgression(gameState);
    default:
      return null; // Human control
  }
}

// Expose the game_testing_controller function globally
window.game_testing_controller = game_testing_controller;
export default game_testing_controller;