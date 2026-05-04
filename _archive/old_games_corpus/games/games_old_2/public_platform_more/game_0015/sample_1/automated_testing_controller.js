// automated_testing_controller.js - Automated testing

import { gameState, LOCATIONS, PUZZLES } from './globals.js';

let testState = {
  step: 0,
  waitFrames: 0,
  positionHistory: [],
  lastAction: null
};

function getTestWinAction(gameState) {
  // Strategy: Complete optimal path to win the game
  // 1. Get decoder key from office phone
  // 2. Talk to witness in park to get coded note
  // 3. Get photo from park trash
  // 4. Talk more to unlock dock
  // 5. Go to dock, get footprint cast and witness statement
  // 6. Unlock warehouse
  // 7. Combine items to solve puzzles
  // 8. Confront suspect with evidence
  
  // Wait a bit between actions
  if (testState.waitFrames > 0) {
    testState.waitFrames--;
    return null;
  }
  
  const currentLoc = gameState.currentLocation;
  const inventory = gameState.inventory || [];
  const hasDecoderKey = inventory.includes("decoder_key");
  const hasCodedNote = inventory.includes("coded_note");
  const hasPhoto = inventory.includes("photo");
  const hasFootprint = inventory.includes("footprint_cast");
  const hasStatement = inventory.includes("witness_statement");
  
  // Step-by-step strategy
  if (testState.step === 0) {
    // Start: Get decoder key from office
    if (currentLoc !== "office") {
      testState.step = 1; // Move to getting note
    } else if (!hasDecoderKey) {
      // Navigate to phone hotspot
      if (gameState.hoveredHotspot === null) {
        testState.waitFrames = 5;
        return { keyCode: 39 }; // Start navigation
      }
      
      const location = LOCATIONS[currentLoc];
      const currentHotspot = location.hotspots[gameState.hoveredHotspot];
      
      if (currentHotspot.id === "phone") {
        testState.waitFrames = 10;
        testState.step = 1;
        return { keyCode: 32 }; // Interact
      } else {
        return { keyCode: 39 }; // Cycle
      }
    } else {
      testState.step = 1;
    }
  }
  
  if (testState.step === 1) {
    // Go to park
    if (currentLoc !== "park") {
      // Find exit to park
      const location = LOCATIONS[currentLoc];
      if (gameState.hoveredHotspot === null) {
        testState.waitFrames = 5;
        return { keyCode: 39 };
      }
      
      const currentHotspot = location.hotspots[gameState.hoveredHotspot];
      if (currentHotspot.type === "travel" && currentHotspot.target === "park") {
        testState.waitFrames = 10;
        return { keyCode: 32 };
      } else {
        return { keyCode: 39 };
      }
    } else {
      testState.step = 2;
    }
  }
  
  if (testState.step === 2) {
    // Get coded note from witness
    if (!hasCodedNote) {
      const location = LOCATIONS[currentLoc];
      if (gameState.hoveredHotspot === null) {
        testState.waitFrames = 5;
        return { keyCode: 39 };
      }
      
      const currentHotspot = location.hotspots[gameState.hoveredHotspot];
      
      if (currentHotspot.id === "witness1") {
        if (gameState.currentDialogue) {
          // In dialogue
          if (!gameState.dialogueHistory["witness1_initial"]) {
            testState.waitFrames = 5;
            return { keyCode: 32 }; // Advance dialogue
          } else {
            // Select first choice (Can I see the note?)
            testState.waitFrames = 10;
            return { keyCode: 32 }; // Confirm
          }
        } else {
          testState.waitFrames = 10;
          return { keyCode: 32 }; // Start dialogue
        }
      } else {
        return { keyCode: 39 };
      }
    } else {
      testState.step = 3;
    }
  }
  
  if (testState.step === 3) {
    // Get photo from trash
    if (!hasPhoto) {
      const location = LOCATIONS[currentLoc];
      if (gameState.hoveredHotspot === null) {
        testState.waitFrames = 5;
        return { keyCode: 39 };
      }
      
      const currentHotspot = location.hotspots[gameState.hoveredHotspot];
      
      if (currentHotspot.id === "trashcan") {
        testState.waitFrames = 10;
        testState.step = 4;
        return { keyCode: 32 };
      } else {
        return { keyCode: 39 };
      }
    } else {
      testState.step = 4;
    }
  }
  
  if (testState.step === 4) {
    // Solve decode puzzle
    if (!gameState.hasDecodedMessage && hasCodedNote && hasDecoderKey) {
      // Open inventory
      if (!gameState.showInventory) {
        testState.waitFrames = 10;
        return { keyCode: 90 }; // Z
      }
      
      // Select coded_note
      const noteIndex = inventory.indexOf("coded_note");
      if (gameState.selectedInventoryIndex !== noteIndex) {
        if (gameState.selectedInventoryIndex < noteIndex) {
          return { keyCode: 39 }; // Right
        } else {
          return { keyCode: 37 }; // Left
        }
      } else {
        // Combine
        testState.waitFrames = 15;
        testState.step = 5;
        return { keyCode: 32 };
      }
    } else {
      testState.step = 5;
    }
  }
  
  if (testState.step === 5) {
    // Close inventory and talk to witness again to unlock dock
    if (gameState.showInventory) {
      testState.waitFrames = 5;
      return { keyCode: 90 };
    }
    
    if (!LOCATIONS.dock.unlocked) {
      const location = LOCATIONS[currentLoc];
      if (gameState.hoveredHotspot === null) {
        testState.waitFrames = 5;
        return { keyCode: 39 };
      }
      
      const currentHotspot = location.hotspots[gameState.hoveredHotspot];
      
      if (currentHotspot.id === "witness1") {
        if (gameState.currentDialogue) {
          // Navigate to "Tell me more" option
          if (gameState.currentDialogue.choiceIndex === 0) {
            testState.waitFrames = 5;
            return { keyCode: 40 }; // Down to second choice
          } else {
            testState.waitFrames = 15;
            return { keyCode: 32 }; // Confirm
          }
        } else {
          testState.waitFrames = 10;
          return { keyCode: 32 };
        }
      } else {
        return { keyCode: 39 };
      }
    } else {
      testState.step = 6;
    }
  }
  
  if (testState.step === 6) {
    // Go to dock
    if (currentLoc !== "dock") {
      const location = LOCATIONS[currentLoc];
      if (gameState.hoveredHotspot === null) {
        testState.waitFrames = 5;
        return { keyCode: 39 };
      }
      
      const currentHotspot = location.hotspots[gameState.hoveredHotspot];
      if (currentHotspot.type === "travel" && currentHotspot.target === "dock") {
        testState.waitFrames = 10;
        return { keyCode: 32 };
      } else {
        return { keyCode: 39 };
      }
    } else {
      testState.step = 7;
    }
  }
  
  if (testState.step === 7) {
    // Get items from dock
    if (!hasFootprint || !hasStatement) {
      const location = LOCATIONS[currentLoc];
      if (gameState.hoveredHotspot === null) {
        testState.waitFrames = 5;
        return { keyCode: 39 };
      }
      
      const currentHotspot = location.hotspots[gameState.hoveredHotspot];
      
      if (currentHotspot.id === "witness2") {
        if (gameState.currentDialogue) {
          testState.waitFrames = 5;
          return { keyCode: 32 };
        } else {
          testState.waitFrames = 10;
          return { keyCode: 32 };
        }
      } else {
        return { keyCode: 39 };
      }
    } else {
      testState.step = 8;
    }
  }
  
  if (testState.step === 8) {
    // Combine evidence items
    if (!gameState.hasCombinedEvidence && hasPhoto && hasFootprint && hasStatement) {
      if (!gameState.showInventory) {
        testState.waitFrames = 10;
        return { keyCode: 90 };
      }
      
      const photoIndex = inventory.indexOf("photo");
      if (gameState.selectedInventoryIndex !== photoIndex) {
        if (gameState.selectedInventoryIndex < photoIndex) {
          return { keyCode: 39 };
        } else {
          return { keyCode: 37 };
        }
      } else {
        testState.waitFrames = 15;
        testState.step = 9;
        return { keyCode: 32 };
      }
    } else {
      testState.step = 9;
    }
  }
  
  if (testState.step === 9) {
    // Close inventory
    if (gameState.showInventory) {
      testState.waitFrames = 5;
      return { keyCode: 90 };
    }
    
    // Go to warehouse
    if (!LOCATIONS.warehouse.unlocked) {
      // Need to unlock it first by talking to fisherman
      const location = LOCATIONS[currentLoc];
      if (gameState.hoveredHotspot === null) {
        testState.waitFrames = 5;
        return { keyCode: 39 };
      }
      
      const currentHotspot = location.hotspots[gameState.hoveredHotspot];
      if (currentHotspot.id === "witness2") {
        if (gameState.currentDialogue) {
          testState.waitFrames = 5;
          return { keyCode: 32 };
        } else {
          testState.waitFrames = 10;
          return { keyCode: 32 };
        }
      } else {
        return { keyCode: 39 };
      }
    }
    
    if (currentLoc !== "warehouse") {
      const location = LOCATIONS[currentLoc];
      if (gameState.hoveredHotspot === null) {
        testState.waitFrames = 5;
        return { keyCode: 39 };
      }
      
      const currentHotspot = location.hotspots[gameState.hoveredHotspot];
      if (currentHotspot.type === "travel" && currentHotspot.target === "warehouse") {
        testState.waitFrames = 10;
        return { keyCode: 32 };
      } else {
        return { keyCode: 39 };
      }
    } else {
      testState.step = 10;
    }
  }
  
  if (testState.step === 10) {
    // Confront suspect
    const location = LOCATIONS[currentLoc];
    if (gameState.hoveredHotspot === null) {
      testState.waitFrames = 5;
      return { keyCode: 39 };
    }
    
    const currentHotspot = location.hotspots[gameState.hoveredHotspot];
    
    if (currentHotspot.id === "suspect") {
      if (gameState.currentDialogue) {
        // Advance through dialogue
        testState.waitFrames = 5;
        return { keyCode: 32 };
      } else {
        testState.waitFrames = 10;
        return { keyCode: 32 };
      }
    } else {
      return { keyCode: 39 };
    }
  }
  
  // Default: cycle through hotspots
  testState.waitFrames = 5;
  return { keyCode: 39 };
}

function getBasicTestAction(gameState) {
  // Test basic navigation and interaction
  if (testState.waitFrames > 0) {
    testState.waitFrames--;
    return null;
  }
  
  const actions = [39, 39, 32, 39, 32, 90, 90, 37, 39];
  const actionIndex = testState.step % actions.length;
  
  testState.step++;
  testState.waitFrames = 10;
  
  return { keyCode: actions[actionIndex] };
}

export function get_automated_testing_action(gameState) {
  if (gameState.gamePhase !== "PLAYING") {
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

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;