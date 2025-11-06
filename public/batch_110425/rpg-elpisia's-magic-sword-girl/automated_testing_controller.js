// automated_testing_controller.js - Automated testing

import { gameState, GAME_PHASES, PLAY_MODES } from './globals.js';

let testState = {
  actionQueue: [],
  framesSinceLastAction: 0,
  waitingForEnemyTurn: false,
  lastHP: 100,
  lastAP: 5,
  combatActionsCount: 0,
  positionHistory: []
};

function getTestWinAction(gameState) {
  const player = gameState.player;
  const enemy = gameState.currentEnemy;
  
  // Wait between actions
  testState.framesSinceLastAction++;
  if (testState.framesSinceLastAction < 30) {
    return null;
  }
  
  // Handle exploration mode
  if (gameState.playMode === PLAY_MODES.EXPLORATION) {
    testState.framesSinceLastAction = 0;
    
    // Track position to detect when combat should start
    testState.positionHistory.push({x: gameState.playerPosition.x, y: gameState.playerPosition.y});
    if (testState.positionHistory.length > 60) {
      testState.positionHistory.shift();
    }
    
    // Move around to trigger combat after some exploration
    if (testState.positionHistory.length < 40) {
      return { keyCode: 39 }; // Move right
    } else {
      return { keyCode: 40 }; // Move down
    }
  }
  
  // Handle victory screen
  if (gameState.combatVictory) {
    testState.framesSinceLastAction = 0;
    testState.waitingForEnemyTurn = false;
    // Wait for automatic transition
    return null;
  }
  
  // Handle combat
  if (gameState.playMode === PLAY_MODES.COMBAT) {
    // Wait for enemy turn to complete
    if (gameState.combatTurn === "ENEMY") {
      testState.waitingForEnemyTurn = true;
      return null;
    }
    
    if (testState.waitingForEnemyTurn && gameState.combatTurn === "PLAYER") {
      testState.waitingForEnemyTurn = false;
      testState.framesSinceLastAction = 0;
      return null;
    }
    
    if (!player || !enemy) return null;
    
    testState.framesSinceLastAction = 0;
    
    // Strategic combat AI
    if (gameState.menuState === "MAIN") {
      // If AP is low, charge
      if (player.ap <= 1) {
        // Navigate to Charge option (index 2)
        if (gameState.selectedAction !== 2) {
          return { keyCode: 40 }; // DOWN
        } else {
          return { keyCode: 32 }; // SPACE to confirm
        }
      }
      
      // If HP is low and we have a defensive option, use it
      if (player.hp < player.maxHP * 0.3 && gameState.selectedAction !== 3) {
        return { keyCode: 40 }; // Move to defend
      }
      
      // If we have good AP, use skills
      if (player.ap >= 3) {
        if (gameState.selectedAction !== 1) {
          return { keyCode: 40 }; // Move to Skills
        } else {
          return { keyCode: 32 }; // Enter skills menu
        }
      }
      
      // Otherwise, basic attack
      if (gameState.selectedAction !== 0) {
        return { keyCode: 38 }; // Move to Attack
      } else {
        return { keyCode: 32 }; // Confirm attack
      }
    }
    
    // Weapon selection menu
    if (gameState.menuState === "WEAPON_SELECT") {
      // Choose Thunder Sword (most powerful)
      if (gameState.selectedWeapon !== 2) {
        return { keyCode: 40 }; // DOWN
      } else {
        return { keyCode: 32 }; // Confirm
      }
    }
    
    // Skill selection menu
    if (gameState.menuState === "SKILL_SELECT") {
      const weapon = player.weapons[gameState.selectedWeapon];
      const skills = weapon.skills;
      
      // Choose the most powerful skill we can afford
      let bestSkillIndex = 0;
      let bestPower = 0;
      
      for (let i = 0; i < skills.length; i++) {
        if (skills[i].apCost <= player.ap && skills[i].power > bestPower) {
          bestPower = skills[i].power;
          bestSkillIndex = i;
        }
      }
      
      if (gameState.selectedSkill !== bestSkillIndex) {
        return { keyCode: 40 }; // Navigate to best skill
      } else {
        return { keyCode: 32 }; // Confirm skill
      }
    }
  }
  
  return null;
}

function getBasicTestAction(gameState) {
  testState.framesSinceLastAction++;
  
  if (testState.framesSinceLastAction < 20) {
    return null;
  }
  
  testState.framesSinceLastAction = 0;
  
  // Random exploration movement
  if (gameState.playMode === PLAY_MODES.EXPLORATION) {
    const directions = [37, 38, 39, 40]; // Arrow keys
    return { keyCode: directions[Math.floor(Math.random() * directions.length)] };
  }
  
  // Random combat actions
  if (gameState.playMode === PLAY_MODES.COMBAT) {
    if (gameState.combatTurn === "ENEMY") {
      return null; // Wait for enemy turn
    }
    
    if (gameState.menuState === "MAIN") {
      const actions = [32, 38, 40]; // Space, Up, Down
      return { keyCode: actions[Math.floor(Math.random() * actions.length)] };
    } else {
      // Go back or confirm
      return { keyCode: Math.random() > 0.3 ? 32 : 90 }; // Space or Z
    }
  }
  
  return null;
}

function getResourceManagementAction(gameState) {
  const player = gameState.player;
  
  testState.framesSinceLastAction++;
  if (testState.framesSinceLastAction < 25) {
    return null;
  }
  
  if (gameState.playMode === PLAY_MODES.EXPLORATION) {
    testState.framesSinceLastAction = 0;
    return { keyCode: [37, 38, 39, 40][Math.floor(Math.random() * 4)] };
  }
  
  if (gameState.playMode === PLAY_MODES.COMBAT && gameState.combatTurn === "PLAYER") {
    testState.framesSinceLastAction = 0;
    
    if (gameState.menuState === "MAIN") {
      // Focus on resource management: charge when AP is low
      if (player.ap <= 2) {
        // Navigate to charge
        if (gameState.selectedAction !== 2) {
          return { keyCode: 40 };
        }
        return { keyCode: 32 };
      }
      
      // Use skills when AP is high
      if (player.ap >= 4) {
        if (gameState.selectedAction !== 1) {
          return { keyCode: 40 };
        }
        return { keyCode: 32 };
      }
      
      // Basic attack otherwise
      if (gameState.selectedAction !== 0) {
        return { keyCode: 38 };
      }
      return { keyCode: 32 };
    }
    
    // In other menus, just confirm or go back
    return { keyCode: Math.random() > 0.5 ? 32 : 90 };
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
      return getResourceManagementAction(gameState);
    default:
      return null;
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;