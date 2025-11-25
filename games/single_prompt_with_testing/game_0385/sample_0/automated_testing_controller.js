// automated_testing_controller.js - Automated testing

import { gameState, PLAY_MODES, FOOD_TYPES } from './globals.js';

function getTestWinAction(gameState) {
  // Strategy: Feed high-value items, progress days efficiently, battle strategically
  
  if (gameState.playMode === PLAY_MODES.TRAINING || gameState.playMode === "feed_menu") {
    if (gameState.playMode === "feed_menu") {
      // In food menu - select best affordable food
      const foodItems = [
        { name: "Dragon Fruit", index: 8, cost: 30 },
        { name: "Gem", index: 4, cost: 20 },
        { name: "Iron", index: 6, cost: 18 },
        { name: "Potion", index: 7, cost: 15 },
        { name: "Meat", index: 0, cost: 10 }
      ];
      
      for (const food of foodItems) {
        if (gameState.gold >= food.cost) {
          if (gameState.selectedMenuItem !== food.index) {
            return { keyCode: 40, key: "ArrowDown" }; // Navigate down
          } else {
            return { keyCode: 32, key: " " }; // Select
          }
        }
      }
      
      // If can't afford anything, go back
      if (gameState.selectedMenuItem !== gameState.menuItems.length - 1) {
        return { keyCode: 40, key: "ArrowDown" };
      }
      return { keyCode: 32, key: " " };
    } else {
      // In training menu
      const targetAction = gameState.day < 50 ? 0 : // Feed early
                           gameState.day < 300 ? 1 : // Adventure mid
                           gameState.day < 350 ? 0 : // Feed before boss
                           1; // Challenge boss
      
      if (gameState.player.hp < gameState.player.maxHP * 0.3) {
        // Rest if low HP
        if (gameState.selectedMenuItem !== 2) {
          return { keyCode: 40, key: "ArrowDown" };
        }
        return { keyCode: 32, key: " " };
      }
      
      // Feed if we have gold and stats are not maxed
      if (gameState.gold >= 20 && gameState.player.attack < 100) {
        if (gameState.selectedMenuItem !== 0) {
          return { keyCode: gameState.selectedMenuItem < 0 ? 40 : 38 };
        }
        return { keyCode: 32, key: " " };
      }
      
      // Battle for gold and exp
      if (gameState.selectedMenuItem !== 1) {
        return { keyCode: gameState.selectedMenuItem < 1 ? 40 : 38 };
      }
      return { keyCode: 32, key: " " };
    }
  } else if (gameState.playMode === PLAY_MODES.BATTLE) {
    if (gameState.battleTurn === "player") {
      // Use strongest available attack
      const attackSkills = gameState.player.skills.filter(s => s.type === "attack");
      const strongestIndex = gameState.player.skills.findIndex(s => 
        s.name === "DRAGON_STRIKE" || s.name === "ROAR" || s.name === "FIRE_BREATH"
      );
      
      if (strongestIndex !== -1 && gameState.selectedSkill !== strongestIndex) {
        return { keyCode: strongestIndex > gameState.selectedSkill ? 40 : 38 };
      }
      
      return { keyCode: 32, key: " " };
    }
  }
  
  return null;
}

function getTestBasicAction(gameState) {
  // Test basic navigation and feeding
  if (gameState.playMode === PLAY_MODES.TRAINING) {
    // Cycle through menu items
    if (gameState.selectedMenuItem < 2) {
      return { keyCode: 40, key: "ArrowDown" };
    } else if (gameState.selectedMenuItem === 2) {
      return { keyCode: 32, key: " " }; // Select rest
    } else {
      return { keyCode: 38, key: "ArrowUp" };
    }
  } else if (gameState.playMode === "feed_menu") {
    if (gameState.selectedMenuItem < gameState.menuItems.length - 1) {
      return { keyCode: 40, key: "ArrowDown" };
    } else {
      return { keyCode: 32, key: " " }; // Go back
    }
  } else if (gameState.playMode === PLAY_MODES.BATTLE) {
    if (gameState.battleTurn === "player") {
      return { keyCode: 32, key: " " }; // Attack
    }
  }
  
  return null;
}

function getTestCombatAction(gameState) {
  // Test combat mechanics thoroughly
  if (gameState.playMode === PLAY_MODES.TRAINING) {
    if (gameState.selectedMenuItem !== 1) {
      return { keyCode: gameState.selectedMenuItem < 1 ? 40 : 38 };
    }
    return { keyCode: 32, key: " " }; // Start battle
  } else if (gameState.playMode === PLAY_MODES.BATTLE) {
    if (gameState.battleTurn === "player") {
      // Cycle through all skills to test them
      if (gameState.selectedSkill < gameState.player.skills.length - 1) {
        return { keyCode: 40, key: "ArrowDown" };
      } else {
        return { keyCode: 32, key: " " }; // Use skill
      }
    }
  }
  
  return null;
}

function getTestEdgeCasesAction(gameState) {
  // Test edge cases and boundaries
  if (gameState.playMode === PLAY_MODES.TRAINING) {
    // Rapidly advance days
    if (gameState.selectedMenuItem !== 2) {
      return { keyCode: 40, key: "ArrowDown" };
    }
    return { keyCode: 32, key: " " };
  }
  
  return null;
}

function getRandomAction(gameState) {
  const actions = [
    { keyCode: 38, key: "ArrowUp" },
    { keyCode: 40, key: "ArrowDown" },
    { keyCode: 32, key: " " }
  ];
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestCombatAction(gameState);
    case "TEST_4":
      return getTestEdgeCasesAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;