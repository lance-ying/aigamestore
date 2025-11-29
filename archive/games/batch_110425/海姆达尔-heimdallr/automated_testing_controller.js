// automated_testing_controller.js - Automated testing
import { gameState, KEY_SPACE, KEY_LEFT, KEY_RIGHT, KEY_SHIFT, KEY_Z,
         MODE_PUZZLE, MODE_PARKOUR, PHASE_PLAYING } from './globals.js';

function getTestBasicAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return [];
  }
  
  const actions = [];
  
  if (gameState.currentMode === MODE_PUZZLE) {
    // Simple puzzle solving - select items randomly until solved
    if (!gameState.puzzleSolved && gameState.puzzleItems.length > 0) {
      if (gameState.p.frameCount % 30 === 0) {
        actions.push(KEY_RIGHT);
      }
      if (gameState.p.frameCount % 45 === 0) {
        actions.push(KEY_SPACE);
      }
    }
  } else if (gameState.currentMode === MODE_PARKOUR) {
    // Basic movement
    actions.push(KEY_RIGHT);
    
    if (gameState.player) {
      // Jump occasionally
      if (gameState.player.grounded && gameState.p.frameCount % 60 === 10) {
        actions.push(KEY_SPACE);
      }
      
      // Slide occasionally
      if (gameState.player.grounded && gameState.p.frameCount % 90 === 45) {
        actions.push(KEY_Z);
      }
    }
  }
  
  return actions;
}

function getTestWinAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return [];
  }
  
  const actions = [];
  
  if (gameState.currentMode === MODE_PUZZLE) {
    // Optimal puzzle solving based on chapter
    const chapter = gameState.currentChapter;
    
    if (!gameState.puzzleSolved) {
      // Navigate to correct items and select them
      if (chapter === 0) {
        // Need items 0 and 1
        if (!gameState.selectedItems.includes(0)) {
          actions.push(KEY_LEFT);
          if (gameState.p.frameCount % 20 === 0) {
            actions.push(KEY_SPACE);
          }
        } else if (!gameState.selectedItems.includes(1)) {
          actions.push(KEY_RIGHT);
          if (gameState.p.frameCount % 20 === 0) {
            actions.push(KEY_SPACE);
          }
        }
      } else if (chapter === 1) {
        // Need items 0, 1, 2
        const needed = [0, 1, 2];
        for (let id of needed) {
          if (!gameState.selectedItems.includes(id)) {
            actions.push(KEY_RIGHT);
            if (gameState.p.frameCount % 20 === 0) {
              actions.push(KEY_SPACE);
            }
            break;
          }
        }
      } else {
        // Final chapter - need 0, 1, 2, 5
        const needed = [0, 1, 2, 5];
        for (let id of needed) {
          if (!gameState.selectedItems.includes(id)) {
            actions.push(KEY_RIGHT);
            if (gameState.p.frameCount % 20 === 0) {
              actions.push(KEY_SPACE);
            }
            break;
          }
        }
      }
    }
  } else if (gameState.currentMode === MODE_PARKOUR) {
    actions.push(KEY_RIGHT);
    actions.push(KEY_SHIFT); // Always sprint
    
    if (gameState.player) {
      const player = gameState.player;
      
      // Look ahead for obstacles
      let shouldJump = false;
      let shouldSlide = false;
      
      for (let obstacle of gameState.obstacles) {
        const distanceToObstacle = obstacle.x - player.x;
        
        if (distanceToObstacle > 20 && distanceToObstacle < 100) {
          if (obstacle.type === 'spike') {
            if (obstacle.height > 30) {
              shouldJump = true;
            } else if (player.grounded) {
              shouldSlide = true;
            }
          } else if (obstacle.type === 'laser') {
            if (obstacle.y > 300) {
              shouldJump = true;
            } else {
              shouldSlide = true;
            }
          }
        }
      }
      
      // Check for gaps (platforms)
      let onPlatform = false;
      for (let platform of gameState.platforms) {
        if (player.x + player.width > platform.x && 
            player.x < platform.x + platform.width) {
          onPlatform = true;
          break;
        }
      }
      
      // Look ahead for gaps
      if (onPlatform) {
        let nextPlatform = null;
        for (let platform of gameState.platforms) {
          if (platform.x > player.x + player.width && 
              (!nextPlatform || platform.x < nextPlatform.x)) {
            nextPlatform = platform;
          }
        }
        
        if (nextPlatform) {
          const gapDistance = nextPlatform.x - (player.x + player.width);
          if (gapDistance > 20 && gapDistance < 120 && player.grounded) {
            shouldJump = true;
          }
        }
      }
      
      // Collect data fragments
      for (let fragment of gameState.dataFragments) {
        if (!fragment.collected) {
          const distanceToFragment = Math.abs(fragment.x - player.x);
          const heightDiff = fragment.y - player.y;
          
          if (distanceToFragment < 150 && heightDiff < -20 && player.grounded) {
            shouldJump = true;
          }
        }
      }
      
      // Execute actions
      if (shouldJump && player.grounded) {
        actions.push(KEY_SPACE);
      }
      if (shouldSlide && player.grounded && !player.sliding) {
        actions.push(KEY_Z);
      }
    }
  }
  
  return actions;
}

function getRandomAction(gameState) {
  const actions = [];
  if (Math.random() < 0.1) {
    const possibleKeys = [KEY_SPACE, KEY_LEFT, KEY_RIGHT, KEY_SHIFT, KEY_Z];
    actions.push(possibleKeys[Math.floor(Math.random() * possibleKeys.length)]);
  }
  return actions;
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

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;