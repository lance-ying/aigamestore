import { KEYS, STATION_TYPES, GAME_PHASES } from './globals.js';

// Utility function to track positions to detect stalling
const positionHistory = {
  positions: [],
  maxLength: 120, // 2 seconds at 60fps
  isStalled: function(x, y, station) {
    // Add current position
    this.positions.push({ x, y, station });
    
    // Keep history at max length
    if (this.positions.length > this.maxLength) {
      this.positions.shift();
    }
    
    // Need enough history to determine stalling
    if (this.positions.length < this.maxLength) {
      return false;
    }
    
    // Check if position hasn't changed significantly
    const recentPositions = this.positions.slice(-60); // Last second
    const uniqueStations = new Set(recentPositions.map(p => p.station)).size;
    
    // If we haven't changed stations in the last second and should be moving
    return uniqueStations === 1;
  },
  reset: function() {
    this.positions = [];
  }
};

// TEST_1: Basic gameplay functionality test using sticky keys
function getStickyKeysAction(gameState) {
  // Reset position history when game is not playing
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    positionHistory.reset();
    return null;
  }
  
  // Check if we're stalled and need to try a different action
  const isStalled = positionHistory.isStalled(
    gameState.player.x,
    gameState.player.y,
    gameState.currentStation
  );
  
  // Randomly change action every 60 frames (1 second) or if stalled
  if (Math.random() < 0.016 || isStalled) {
    // Choose a random action with higher probability for useful actions
    const actions = [
      { key: KEYS.LEFT, weight: 2 },
      { key: KEYS.RIGHT, weight: 2 },
      { key: KEYS.UP, weight: 1 },
      { key: KEYS.DOWN, weight: 1 },
      { key: KEYS.SPACE, weight: 3 },
      { key: KEYS.Z, weight: 1 },
      { key: KEYS.SHIFT, weight: 1 }
    ];
    
    // Calculate total weight
    const totalWeight = actions.reduce((sum, action) => sum + action.weight, 0);
    
    // Choose random action based on weights
    let randomValue = Math.random() * totalWeight;
    let chosenAction = actions[0].key;
    
    for (const action of actions) {
      randomValue -= action.weight;
      if (randomValue <= 0) {
        chosenAction = action.key;
        break;
      }
    }
    
    return chosenAction;
  }
  
  // Continue with last action
  return null;
}

// TEST_2: Win strategy - efficiently complete orders
function getTestWinAction(gameState) {
  // Reset position history when game is not playing
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    positionHistory.reset();
    return null;
  }
  
  // Check if we're stalled
  const isStalled = positionHistory.isStalled(
    gameState.player.x,
    gameState.player.y,
    gameState.currentStation
  );
  
  // If we're stalled, try a different approach
  if (isStalled) {
    return KEYS.Z; // Cancel current action and try something else
  }
  
  // Get current station
  const currentStation = gameState.stations[gameState.currentStation];
  
  // If action is in progress, try to speed it up
  if (gameState.actionInProgress) {
    return KEYS.SHIFT;
  }
  
  // If no customer, go to order station
  if (!gameState.currentCustomer && gameState.waitingCustomers.length > 0) {
    if (gameState.currentStation === 0) {
      // At order station
      if (gameState.stationMenuOpen) {
        return KEYS.SPACE; // Select "Take Order"
      } else {
        return KEYS.SPACE; // Open menu
      }
    } else {
      return KEYS.LEFT; // Move left towards order station
    }
  }
  
  // If we have a customer but no flavor, go to build station
  if (gameState.currentCustomer && !gameState.currentSundae.flavor) {
    if (gameState.currentStation === 1) {
      // At build station
      if (gameState.stationMenuOpen) {
        // Find the flavor in the customer's order
        const flavorName = gameState.currentCustomer.order.flavor.name;
        const flavorIndex = currentStation.options.findIndex(option => option === flavorName);
        
        if (gameState.selectedOption === flavorIndex) {
          return KEYS.SPACE; // Select flavor
        } else if (gameState.selectedOption < flavorIndex) {
          return KEYS.DOWN; // Move down to flavor
        } else {
          return KEYS.UP; // Move up to flavor
        }
      } else {
        return KEYS.SPACE; // Open menu
      }
    } else {
      return KEYS.RIGHT; // Move right towards build station
    }
  }
  
  // If we have flavor but no mix-in, select mix-in at build station
  if (gameState.currentSundae.flavor && !gameState.currentSundae.mixins) {
    if (gameState.currentStation === 1) {
      // At build station
      if (gameState.stationMenuOpen) {
        // Find the mix-in in the customer's order
        const mixinName = gameState.currentCustomer.order.mixin.name;
        const mixinIndex = currentStation.options.findIndex(option => option === mixinName);
        
        if (gameState.selectedOption === mixinIndex) {
          return KEYS.SPACE; // Select mix-in
        } else if (gameState.selectedOption < mixinIndex) {
          return KEYS.DOWN; // Move down to mix-in
        } else {
          return KEYS.UP; // Move up to mix-in
        }
      } else {
        return KEYS.SPACE; // Open menu
      }
    } else {
      return KEYS.RIGHT; // Move right towards build station (or left if we've gone too far)
    }
  }
  
  // If we have mix-in but no blend level, go to blend station
  if (gameState.currentSundae.mixins && gameState.currentSundae.blendLevel === 0 && gameState.targetBlendLevel === 0) {
    if (gameState.currentStation === 2) {
      // At blend station
      if (gameState.stationMenuOpen) {
        // Find the blend level in the customer's order
        const blendLevel = gameState.currentCustomer.order.blendLevel;
        const blendOptions = ["Light Blend", "Medium Blend", "Heavy Blend"];
        const blendName = blendOptions[blendLevel];
        const blendIndex = currentStation.options.findIndex(option => option === blendName);
        
        if (gameState.selectedOption === blendIndex) {
          return KEYS.SPACE; // Select blend level
        } else if (gameState.selectedOption < blendIndex) {
          return KEYS.DOWN; // Move down to blend level
        } else {
          return KEYS.UP; // Move up to blend level
        }
      } else {
        return KEYS.SPACE; // Open menu
      }
    } else if (gameState.currentStation < 2) {
      return KEYS.RIGHT; // Move right towards blend station
    } else {
      return KEYS.LEFT; // Move left towards blend station
    }
  }
  
  // If we have blend level but need toppings, go to top station
  if (gameState.currentSundae.blendLevel !== undefined) {
    // Check if we need to add more toppings
    const currentToppingCount = gameState.currentSundae.toppings.length;
    const requiredToppingCount = gameState.currentCustomer.order.toppings.length;
    
    if (currentToppingCount < requiredToppingCount) {
      if (gameState.currentStation === 3) {
        // At top station
        if (gameState.stationMenuOpen) {
          // Find the next topping to add
          const addedToppingNames = gameState.currentSundae.toppings.map(t => t.name);
          const nextTopping = gameState.currentCustomer.order.toppings.find(
            t => !addedToppingNames.includes(t.name)
          );
          
          if (nextTopping) {
            const toppingIndex = currentStation.options.findIndex(option => option === nextTopping.name);
            
            if (gameState.selectedOption === toppingIndex) {
              return KEYS.SPACE; // Select topping
            } else if (gameState.selectedOption < toppingIndex) {
              return KEYS.DOWN; // Move down to topping
            } else {
              return KEYS.UP; // Move up to topping
            }
          } else {
            return KEYS.Z; // Cancel if no more toppings to add
          }
        } else {
          return KEYS.SPACE; // Open menu
        }
      } else if (gameState.currentStation < 3) {
        return KEYS.RIGHT; // Move right towards top station
      } else {
        return KEYS.LEFT; // Move left towards top station
      }
    }
  }
  
  // If sundae is complete, go to serve station
  if (gameState.currentSundae.toppings.length > 0 && 
      gameState.currentSundae.flavor && 
      gameState.currentSundae.mixins && 
      gameState.currentSundae.blendLevel !== undefined) {
    
    if (gameState.currentStation === 4) {
      // At serve station
      if (gameState.stationMenuOpen) {
        return KEYS.SPACE; // Select "Serve Customer"
      } else {
        return KEYS.SPACE; // Open menu
      }
    } else {
      return KEYS.RIGHT; // Move right towards serve station
    }
  }
  
  // Default: move right to progress through stations
  return KEYS.RIGHT;
}

// TEST_3: Order accuracy impact test
function getTestAccuracyAction(gameState) {
  // Reset position history when game is not playing
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    positionHistory.reset();
    return null;
  }
  
  // Check if we're stalled
  const isStalled = positionHistory.isStalled(
    gameState.player.x,
    gameState.player.y,
    gameState.currentStation
  );
  
  // If we're stalled, try a different approach
  if (isStalled) {
    return KEYS.Z; // Cancel current action
  }
  
  // Get current station
  const currentStation = gameState.stations[gameState.currentStation];
  
  // If action is in progress, try to speed it up
  if (gameState.actionInProgress) {
    return KEYS.SHIFT;
  }
  
  // Track which order number we're on to vary accuracy
  const orderNumber = gameState.servedCustomers;
  
  // For first order: Make a perfect order
  if (orderNumber === 0) {
    return getTestWinAction(gameState); // Use the win strategy for perfect accuracy
  }
  
  // For second order: Make an order with wrong flavor
  if (orderNumber === 1) {
    // If no customer, go to order station
    if (!gameState.currentCustomer && gameState.waitingCustomers.length > 0) {
      if (gameState.currentStation === 0) {
        if (gameState.stationMenuOpen) {
          return KEYS.SPACE; // Select "Take Order"
        } else {
          return KEYS.SPACE; // Open menu
        }
      } else {
        return KEYS.LEFT; // Move left towards order station
      }
    }
    
    // If we have a customer but no flavor, go to build station and select WRONG flavor
    if (gameState.currentCustomer && !gameState.currentSundae.flavor) {
      if (gameState.currentStation === 1) {
        if (gameState.stationMenuOpen) {
          // Find a flavor that's NOT in the customer's order
          const flavorName = gameState.currentCustomer.order.flavor.name;
          const wrongFlavorIndex = currentStation.options.findIndex(option => 
            option !== flavorName && option.includes("Vanilla"));
          
          if (gameState.selectedOption === wrongFlavorIndex) {
            return KEYS.SPACE; // Select wrong flavor
          } else if (gameState.selectedOption < wrongFlavorIndex) {
            return KEYS.DOWN; // Move down to wrong flavor
          } else {
            return KEYS.UP; // Move up to wrong flavor
          }
        } else {
          return KEYS.SPACE; // Open menu
        }
      } else {
        return KEYS.RIGHT; // Move right towards build station
      }
    }
    
    // For the rest of the order, follow the correct procedure
    return getTestWinAction(gameState);
  }
  
  // For third order: Make an order with wrong mix-in
  if (orderNumber === 2) {
    // If we have flavor but no mix-in, select WRONG mix-in
    if (gameState.currentSundae.flavor && !gameState.currentSundae.mixins) {
      if (gameState.currentStation === 1) {
        if (gameState.stationMenuOpen) {
          // Find a mix-in that's NOT in the customer's order
          const mixinName = gameState.currentCustomer.order.mixin.name;
          const wrongMixinIndex = currentStation.options.findIndex(option => 
            option !== mixinName && option.includes("Sprinkles"));
          
          if (gameState.selectedOption === wrongMixinIndex) {
            return KEYS.SPACE; // Select wrong mix-in
          } else if (gameState.selectedOption < wrongMixinIndex) {
            return KEYS.DOWN; // Move down to wrong mix-in
          } else {
            return KEYS.UP; // Move up to wrong mix-in
          }
        } else {
          return KEYS.SPACE; // Open menu
        }
      }
    }
    
    // For other steps, use the win strategy
    return getTestWinAction(gameState);
  }
  
  // For fourth order: Make an order with wrong blend level
  if (orderNumber === 3) {
    // If we need to set blend level, choose WRONG level
    if (gameState.currentSundae.mixins && gameState.currentSundae.blendLevel === 0 && gameState.targetBlendLevel === 0) {
      if (gameState.currentStation === 2) {
        if (gameState.stationMenuOpen) {
          // Choose opposite blend level
          const correctBlendLevel = gameState.currentCustomer.order.blendLevel;
          const wrongBlendLevel = correctBlendLevel === 0 ? 2 : 0;
          const blendOptions = ["Light Blend", "Medium Blend", "Heavy Blend"];
          const wrongBlendName = blendOptions[wrongBlendLevel];
          const wrongBlendIndex = currentStation.options.findIndex(option => option === wrongBlendName);
          
          if (gameState.selectedOption === wrongBlendIndex) {
            return KEYS.SPACE; // Select wrong blend level
          } else if (gameState.selectedOption < wrongBlendIndex) {
            return KEYS.DOWN; // Move down to wrong blend level
          } else {
            return KEYS.UP; // Move up to wrong blend level
          }
        } else {
          return KEYS.SPACE; // Open menu
        }
      }
    }
    
    // For other steps, use the win strategy
    return getTestWinAction(gameState);
  }
  
  // For fifth order: Make an order with wrong toppings
  if (orderNumber === 4) {
    // If we need to add toppings, choose WRONG ones
    if (gameState.currentSundae.blendLevel !== undefined && gameState.currentStation === 3) {
      if (gameState.stationMenuOpen) {
        // Add toppings that aren't in the order
        const requiredToppingNames = gameState.currentCustomer.order.toppings.map(t => t.name);
        const wrongToppingIndex = currentStation.options.findIndex(option => 
          !requiredToppingNames.includes(option));
        
        if (wrongToppingIndex >= 0) {
          if (gameState.selectedOption === wrongToppingIndex) {
            return KEYS.SPACE; // Select wrong topping
          } else if (gameState.selectedOption < wrongToppingIndex) {
            return KEYS.DOWN; // Move down to wrong topping
          } else {
            return KEYS.UP; // Move up to wrong topping
          }
        }
      } else {
        return KEYS.SPACE; // Open menu
      }
    }
    
    // For other steps, use the win strategy
    return getTestWinAction(gameState);
  }
  
  // For all other orders, use the win strategy
  return getTestWinAction(gameState);
}

// TEST_4: Time pressure test
function getTestTimeAction(gameState) {
  // Reset position history when game is not playing
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    positionHistory.reset();
    return null;
  }
  
  // Determine if we should delay based on order number
  const orderNumber = gameState.servedCustomers;
  
  // For even-numbered orders, introduce delays
  if (orderNumber % 2 === 0) {
    // Every 120 frames (2 seconds), do nothing for a brief period
    if (gameInstance.frameCount % 120 < 60) {
      return null; // Do nothing to introduce delay
    }
  }
  
  // Otherwise, use the win strategy
  return getTestWinAction(gameState);
}

// TEST_5: Station transition test
function getTestStationTransitionAction(gameState) {
  // Reset position history when game is not playing
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    positionHistory.reset();
    return null;
  }
  
  // Check if we're stalled
  const isStalled = positionHistory.isStalled(
    gameState.player.x,
    gameState.player.y,
    gameState.currentStation
  );
  
  // If we're stalled, try a different approach
  if (isStalled) {
    return KEYS.Z; // Cancel current action
  }
  
  // If action is in progress, try to speed it up
  if (gameState.actionInProgress) {
    return KEYS.SHIFT;
  }
  
  // Determine current phase of order process
  const hasCustomer = !!gameState.currentCustomer;
  const hasFlavor = !!gameState.currentSundae.flavor;
  const hasMixins = !!gameState.currentSundae.mixins;
  const hasBlend = gameState.currentSundae.blendLevel !== undefined && gameState.currentSundae.blendLevel !== 0;
  const hasToppings = gameState.currentSundae.toppings.length > 0;
  
  // Try to skip stations or go back and forth between stations
  if (!hasCustomer) {
    // If no customer, go to order station
    if (gameState.currentStation === 0) {
      if (gameState.stationMenuOpen) {
        return KEYS.SPACE; // Take order
      } else {
        return KEYS.SPACE; // Open menu
      }
    } else {
      return KEYS.LEFT; // Go to order station
    }
  } else if (!hasFlavor) {
    // Attempt to skip build station and go directly to blend
    if (gameState.currentStation === 2) {
      if (gameState.stationMenuOpen) {
        return KEYS.Z; // Cancel menu
      } else {
        return KEYS.SPACE; // Try to use blend station without flavor
      }
    } else if (gameState.currentStation < 1) {
      return KEYS.RIGHT; // Move right
    } else if (gameState.currentStation > 2) {
      return KEYS.LEFT; // Move left
    } else {
      // At build station, select flavor normally
      return getTestWinAction(gameState);
    }
  } else if (!hasMixins) {
    // Attempt to skip ahead to topping station
    if (gameState.currentStation === 3) {
      if (gameState.stationMenuOpen) {
        return KEYS.Z; // Cancel menu
      } else {
        return KEYS.SPACE; // Try to add toppings without mixins
      }
    } else if (gameState.currentStation < 1) {
      return KEYS.RIGHT; // Move right
    } else if (gameState.currentStation > 3) {
      return KEYS.LEFT; // Move left
    } else {
      // Complete mixins normally
      return getTestWinAction(gameState);
    }
  } else if (!hasBlend) {
    // Try to skip blend and go to toppings
    if (gameState.currentStation === 3) {
      if (gameState.stationMenuOpen) {
        return KEYS.Z; // Cancel menu
      } else {
        return KEYS.SPACE; // Try to add toppings without blending
      }
    } else {
      // Go back to blend station
      return getTestWinAction(gameState);
    }
  } else if (!hasToppings) {
    // Try to skip toppings and go to serve
    if (gameState.currentStation === 4) {
      if (gameState.stationMenuOpen) {
        return KEYS.SPACE; // Try to serve without toppings
      } else {
        return KEYS.SPACE; // Open menu
      }
    } else {
      // Go to topping station
      return getTestWinAction(gameState);
    }
  } else {
    // Ready to serve, go to serve station
    return getTestWinAction(gameState);
  }
}

export function game_testing_controller(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getStickyKeysAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestAccuracyAction(gameState);
    case "TEST_4":
      return getTestTimeAction(gameState);
    case "TEST_5":
      return getTestStationTransitionAction(gameState);
    default:
      return getStickyKeysAction(gameState);
  }
}

// Expose the game_testing_controller function globally
window.game_testing_controller = game_testing_controller;
export default game_testing_controller;