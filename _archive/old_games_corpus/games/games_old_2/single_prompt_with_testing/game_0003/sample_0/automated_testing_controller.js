// automated_testing_controller.js - Automated testing AI

let testState = {
  step: 0,
  waitFrames: 0,
  targetX: 0,
  lastAction: null
};

function getTestWinAction(gameState) {
  const player = gameState.player;
  
  // Wait if in transition or dialogue
  if (gameState.transitioning || gameState.dialogueActive) {
    testState.waitFrames++;
    if (testState.waitFrames > 100) {
      testState.waitFrames = 0;
      testState.step++;
    }
    return null;
  }
  
  testState.waitFrames = 0;
  
  // Optimal win sequence
  switch (testState.step) {
    case 0: // Move to newspaper in cafe
      if (gameState.currentScene === "cafe") {
        if (Math.abs(player.x - 110) > 5) {
          return { keyCode: player.x < 110 ? 39 : 37, key: player.x < 110 ? 'ArrowRight' : 'ArrowLeft' };
        } else {
          testState.step++;
        }
      }
      break;
      
    case 1: // Pick up newspaper
      return { keyCode: 32, key: ' ' };
      
    case 2: // Move to waiter
      if (Math.abs(player.x - 470) > 5) {
        return { keyCode: player.x < 470 ? 39 : 37, key: player.x < 470 ? 'ArrowRight' : 'ArrowLeft' };
      } else {
        testState.step++;
      }
      break;
      
    case 3: // Talk to waiter
      return { keyCode: 32, key: ' ' };
      
    case 4: // Move to door
      if (Math.abs(player.x - 50) > 5) {
        return { keyCode: 37, key: 'ArrowLeft' };
      } else {
        testState.step++;
      }
      break;
      
    case 5: // Exit to street
      return { keyCode: 32, key: ' ' };
      
    case 6: // Move to trash bin in street
      if (gameState.currentScene === "street") {
        if (Math.abs(player.x - 155) > 5) {
          return { keyCode: player.x < 155 ? 39 : 37, key: player.x < 155 ? 'ArrowRight' : 'ArrowLeft' };
        } else {
          testState.step++;
        }
      }
      break;
      
    case 7: // Search trash bin for key
      return { keyCode: 32, key: ' ' };
      
    case 8: // Move to locked building
      if (Math.abs(player.x - 290) > 5) {
        return { keyCode: player.x < 290 ? 39 : 37, key: player.x < 290 ? 'ArrowRight' : 'ArrowLeft' };
      } else {
        testState.step++;
      }
      break;
      
    case 9: // Open inventory to select key
      if (!gameState.inventoryOpen) {
        return { keyCode: 90, key: 'z' };
      } else {
        // Select key (should be index 1)
        if (gameState.selectedInventoryIndex !== 1) {
          return { keyCode: 39, key: 'ArrowRight' };
        } else {
          testState.step++;
        }
      }
      break;
      
    case 10: // Close inventory with key selected
      return { keyCode: 90, key: 'z' };
      
    case 11: // Use key on building
      return { keyCode: 32, key: ' ' };
      
    case 12: // Wait for gallery transition
      if (gameState.currentScene === "gallery") {
        testState.step++;
      }
      break;
      
    case 13: // Move to painting1 in gallery
      if (Math.abs(player.x - 160) > 5) {
        return { keyCode: player.x < 160 ? 39 : 37, key: player.x < 160 ? 'ArrowRight' : 'ArrowLeft' };
      } else {
        testState.step++;
      }
      break;
      
    case 14: // Examine painting1
      return { keyCode: 32, key: ' ' };
      
    case 15: // Move to painting2
      if (Math.abs(player.x - 410) > 5) {
        return { keyCode: 39, key: 'ArrowRight' };
      } else {
        testState.step++;
      }
      break;
      
    case 16: // Examine painting2
      return { keyCode: 32, key: ' ' };
      
    case 17: // Move to pedestal
      if (Math.abs(player.x - 300) > 5) {
        return { keyCode: 37, key: 'ArrowLeft' };
      } else {
        testState.step++;
      }
      break;
      
    case 18: // Get map from pedestal
      return { keyCode: 32, key: ' ' };
      
    case 19: // Open inventory
      if (!gameState.inventoryOpen) {
        return { keyCode: 90, key: 'z' };
      } else {
        testState.step++;
      }
      break;
      
    case 20: // Combine newspaper and photograph
      // Navigate to photograph (index 2)
      if (gameState.selectedInventoryIndex < 2) {
        return { keyCode: 39, key: 'ArrowRight' };
      } else if (gameState.selectedInventoryIndex > 2) {
        return { keyCode: 37, key: 'ArrowLeft' };
      } else {
        return { keyCode: 32, key: ' ' }; // Combine
      }
      
    case 21: // Navigate to map
      if (gameState.selectedInventoryIndex < 3) {
        return { keyCode: 39, key: 'ArrowRight' };
      } else {
        return { keyCode: 32, key: ' ' }; // Combine with clue
      }
      
    case 22: // Close inventory
      return { keyCode: 90, key: 'z' };
      
    case 23: // Move to secret door
      if (Math.abs(player.x - 540) > 5) {
        return { keyCode: 39, key: 'ArrowRight' };
      } else {
        testState.step++;
      }
      break;
      
    case 24: // Enter secret door
      return { keyCode: 32, key: ' ' };
      
    case 25: // Wait for final room
      if (gameState.currentScene === "finalroom") {
        testState.step++;
      }
      break;
      
    case 26: // Move to artifact
      if (Math.abs(player.x - 300) > 5) {
        return { keyCode: player.x < 300 ? 39 : 37, key: player.x < 300 ? 'ArrowRight' : 'ArrowLeft' };
      } else {
        testState.step++;
      }
      break;
      
    case 27: // Open inventory for master key
      if (!gameState.inventoryOpen) {
        return { keyCode: 90, key: 'z' };
      } else {
        // Find masterkey
        const mkIndex = gameState.inventory.findIndex(i => i.id === "masterkey");
        if (mkIndex >= 0) {
          if (gameState.selectedInventoryIndex !== mkIndex) {
            return { keyCode: gameState.selectedInventoryIndex < mkIndex ? 39 : 37, 
                    key: gameState.selectedInventoryIndex < mkIndex ? 'ArrowRight' : 'ArrowLeft' };
          } else {
            testState.step++;
          }
        }
      }
      break;
      
    case 28: // Close inventory with master key
      return { keyCode: 90, key: 'z' };
      
    case 29: // Use master key on artifact
      return { keyCode: 32, key: ' ' };
      
    default:
      // Win achieved, wait
      return null;
  }
  
  return null;
}

function getBasicTestAction(gameState) {
  // Simple movement test
  const player = gameState.player;
  
  if (testState.waitFrames > 0) {
    testState.waitFrames--;
    return null;
  }
  
  switch (testState.step % 4) {
    case 0:
      testState.waitFrames = 30;
      testState.step++;
      return { keyCode: 39, key: 'ArrowRight' };
    case 1:
      testState.waitFrames = 30;
      testState.step++;
      return { keyCode: 37, key: 'ArrowLeft' };
    case 2:
      testState.waitFrames = 30;
      testState.step++;
      return { keyCode: 32, key: ' ' };
    case 3:
      testState.waitFrames = 30;
      testState.step++;
      return { keyCode: 90, key: 'z' };
  }
  
  return null;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return null;
  }
}

// Reset test state when control mode changes
window.addEventListener('controlModeChange', () => {
  testState = {
    step: 0,
    waitFrames: 0,
    targetX: 0,
    lastAction: null
  };
});

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;