// automated_testing_controller.js - Automated testing strategies

import { 
  gameState,
  STATE_MAIN_MENU, STATE_CREATING_GAME, STATE_ALLOCATING_POINTS, 
  STATE_DEVELOPING, STATE_REVIEWING, STATE_RESEARCH_MENU
} from './globals.js';

function getTestWinAction(gameState) {
  // Optimal strategy to win the game
  const state = gameState.playingState;
  
  // Prevent spamming actions
  if (gameState.frameCount - gameState.lastActionFrame < 10) {
    return null;
  }
  
  switch (state) {
    case STATE_MAIN_MENU:
      // Prioritize research when we have enough money
      if (gameState.money >= 2500 && gameState.technologies.filter(t => !t.researched).length > 0) {
        if (gameState.menuSelection !== 1) {
          return { key: 'ArrowDown', keyCode: 40 };
        } else {
          gameState.lastActionFrame = gameState.frameCount;
          return { key: ' ', keyCode: 32 };
        }
      }
      
      // Otherwise create games
      if (gameState.menuSelection !== 0) {
        return { key: 'ArrowUp', keyCode: 38 };
      } else {
        gameState.lastActionFrame = gameState.frameCount;
        return { key: ' ', keyCode: 32 };
      }
      
    case STATE_CREATING_GAME:
      // Select best available game type (prefer later unlocked types for variety)
      const availableTypes = gameState.gameTypes.filter(gt => gt.unlocked);
      const targetSelection = Math.min(gameState.gamesCreated % availableTypes.length, 
                                       availableTypes.length - 1);
      
      if (gameState.menuSelection < targetSelection) {
        return { key: 'ArrowDown', keyCode: 40 };
      } else if (gameState.menuSelection > targetSelection) {
        return { key: 'ArrowUp', keyCode: 38 };
      } else {
        gameState.lastActionFrame = gameState.frameCount;
        return { key: ' ', keyCode: 32 };
      }
      
    case STATE_ALLOCATING_POINTS:
      // Balance allocations for consistent quality
      const total = gameState.designPoints + gameState.techPoints + gameState.marketingPoints;
      
      // Early game: balanced approach
      // Late game: focus on marketing for revenue
      const targetDesign = gameState.money < 10000 ? 35 : 30;
      const targetTech = gameState.money < 10000 ? 35 : 25;
      const targetMarketing = gameState.money < 10000 ? 30 : 45;
      
      // Adjust points
      if (gameState.allocationFocus === 0) {
        if (gameState.designPoints < targetDesign) {
          return { key: 'ArrowRight', keyCode: 39 };
        } else if (gameState.designPoints > targetDesign) {
          return { key: 'ArrowLeft', keyCode: 37 };
        } else {
          return { key: 'ArrowDown', keyCode: 40 };
        }
      } else if (gameState.allocationFocus === 1) {
        if (gameState.techPoints < targetTech) {
          return { key: 'ArrowRight', keyCode: 39 };
        } else if (gameState.techPoints > targetTech) {
          return { key: 'ArrowLeft', keyCode: 37 };
        } else {
          return { key: 'ArrowDown', keyCode: 40 };
        }
      } else {
        if (gameState.marketingPoints < targetMarketing) {
          return { key: 'ArrowRight', keyCode: 39 };
        } else if (gameState.marketingPoints > targetMarketing) {
          return { key: 'ArrowLeft', keyCode: 37 };
        } else {
          // Ready to confirm
          gameState.lastActionFrame = gameState.frameCount;
          return { key: ' ', keyCode: 32 };
        }
      }
      
    case STATE_DEVELOPING:
      // Fast forward through development
      return { key: 'z', keyCode: 90 };
      
    case STATE_REVIEWING:
      // Continue to next game
      gameState.lastActionFrame = gameState.frameCount;
      return { key: ' ', keyCode: 32 };
      
    case STATE_RESEARCH_MENU:
      // Research cheapest available technology
      const availableTech = gameState.technologies.filter(t => !t.researched);
      
      if (availableTech.length === 0) {
        gameState.lastActionFrame = gameState.frameCount;
        return { key: ' ', keyCode: 32 };
      }
      
      // Find cheapest tech we can afford
      let cheapestAffordable = null;
      let cheapestIndex = -1;
      
      availableTech.forEach((tech, index) => {
        if (gameState.money >= tech.cost) {
          if (!cheapestAffordable || tech.cost < cheapestAffordable.cost) {
            cheapestAffordable = tech;
            cheapestIndex = index;
          }
        }
      });
      
      if (cheapestAffordable) {
        if (gameState.menuSelection < cheapestIndex) {
          return { key: 'ArrowDown', keyCode: 40 };
        } else if (gameState.menuSelection > cheapestIndex) {
          return { key: 'ArrowUp', keyCode: 38 };
        } else {
          gameState.lastActionFrame = gameState.frameCount;
          return { key: ' ', keyCode: 32 };
        }
      } else {
        // Can't afford any, go back
        gameState.lastActionFrame = gameState.frameCount;
        return { key: 'Escape', keyCode: 27 };
      }
  }
  
  return null;
}

function getBasicTestAction(gameState) {
  // Basic testing - just create games with default allocations
  const state = gameState.playingState;
  
  if (gameState.frameCount - gameState.lastActionFrame < 10) {
    return null;
  }
  
  switch (state) {
    case STATE_MAIN_MENU:
      if (gameState.menuSelection !== 0) {
        return { key: 'ArrowUp', keyCode: 38 };
      } else {
        gameState.lastActionFrame = gameState.frameCount;
        return { key: ' ', keyCode: 32 };
      }
      
    case STATE_CREATING_GAME:
      gameState.lastActionFrame = gameState.frameCount;
      return { key: ' ', keyCode: 32 };
      
    case STATE_ALLOCATING_POINTS:
      gameState.lastActionFrame = gameState.frameCount;
      return { key: ' ', keyCode: 32 };
      
    case STATE_DEVELOPING:
      return { key: 'z', keyCode: 90 };
      
    case STATE_REVIEWING:
      gameState.lastActionFrame = gameState.frameCount;
      return { key: ' ', keyCode: 32 };
      
    case STATE_RESEARCH_MENU:
      gameState.lastActionFrame = gameState.frameCount;
      return { key: 'Escape', keyCode: 27 };
  }
  
  return null;
}

function getLoseTestAction(gameState) {
  // Make bad decisions to trigger lose condition
  const state = gameState.playingState;
  
  if (gameState.frameCount - gameState.lastActionFrame < 10) {
    return null;
  }
  
  switch (state) {
    case STATE_MAIN_MENU:
      if (gameState.menuSelection !== 0) {
        return { key: 'ArrowUp', keyCode: 38 };
      } else {
        gameState.lastActionFrame = gameState.frameCount;
        return { key: ' ', keyCode: 32 };
      }
      
    case STATE_CREATING_GAME:
      gameState.lastActionFrame = gameState.frameCount;
      return { key: ' ', keyCode: 32 };
      
    case STATE_ALLOCATING_POINTS:
      // Allocate poorly - all points in one category
      if (gameState.allocationFocus === 0) {
        if (gameState.designPoints < 100) {
          return { key: 'ArrowRight', keyCode: 39 };
        } else {
          gameState.lastActionFrame = gameState.frameCount;
          return { key: ' ', keyCode: 32 };
        }
      } else {
        return { key: 'ArrowUp', keyCode: 38 };
      }
      
    case STATE_DEVELOPING:
      return { key: 'z', keyCode: 90 };
      
    case STATE_REVIEWING:
      gameState.lastActionFrame = gameState.frameCount;
      return { key: ' ', keyCode: 32 };
      
    case STATE_RESEARCH_MENU:
      gameState.lastActionFrame = gameState.frameCount;
      return { key: 'Escape', keyCode: 27 };
  }
  
  return null;
}

function getRandomAction(gameState) {
  // Random valid actions
  const validKeys = [
    { key: 'ArrowUp', keyCode: 38 },
    { key: 'ArrowDown', keyCode: 40 },
    { key: ' ', keyCode: 32 }
  ];
  
  if (gameState.frameCount % 30 === 0) {
    const randomIndex = Math.floor(Math.random() * validKeys.length);
    return validKeys[randomIndex];
  }
  
  return null;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getLoseTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;