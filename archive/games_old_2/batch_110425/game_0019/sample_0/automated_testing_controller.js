// automated_testing_controller.js - Automated testing

import { gameState, GAME_PHASES, HERO_CLASSES } from './globals.js';

let testState = {
  initialized: false,
  path: [],
  targetX: 0,
  targetY: 0,
  combatTurns: 0,
  stuckCounter: 0,
  lastX: 0,
  lastY: 0
};

function getTestWinAction(gameState) {
  // Optimal strategy to win
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    return { keyCode: 13 }; // ENTER
  }
  
  if (gameState.gamePhase === GAME_PHASES.PARTY_SELECT) {
    if (!testState.initialized) {
      testState.partySetup = 0;
      testState.initialized = true;
    }
    
    // Add 4 heroes: Warrior, Cleric, Mage, Rogue
    if (gameState.partySize < 4) {
      const classOrder = ["WARRIOR", "CLERIC", "MAGE", "ROGUE"];
      const targetClass = classOrder[gameState.partySize];
      const classNames = Object.keys(HERO_CLASSES);
      const targetIndex = classNames.indexOf(targetClass);
      
      if (gameState.selectedHeroClass !== targetIndex) {
        return { keyCode: 39 }; // RIGHT
      } else {
        return { keyCode: 32 }; // SPACE to add
      }
    } else {
      return { keyCode: 13 }; // ENTER to start
    }
  }
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (!gameState.player || !gameState.dungeon) {
      return { keyCode: 0 };
    }
    
    // Check if stuck
    if (gameState.player.x === testState.lastX && gameState.player.y === testState.lastY) {
      testState.stuckCounter++;
      if (testState.stuckCounter > 20) {
        // Try random direction
        const dirs = [37, 38, 39, 40];
        testState.stuckCounter = 0;
        return { keyCode: dirs[Math.floor(Math.random() * dirs.length)] };
      }
    } else {
      testState.stuckCounter = 0;
    }
    
    testState.lastX = gameState.player.x;
    testState.lastY = gameState.player.y;
    
    // Navigate to stairs
    const targetX = gameState.dungeon.stairsX;
    const targetY = gameState.dungeon.stairsY;
    
    const dx = targetX - gameState.player.x;
    const dy = targetY - gameState.player.y;
    
    // Prioritize horizontal then vertical movement
    if (Math.abs(dx) > 0) {
      return { keyCode: dx > 0 ? 39 : 37 }; // RIGHT or LEFT
    } else if (Math.abs(dy) > 0) {
      return { keyCode: dy > 0 ? 40 : 38 }; // DOWN or UP
    }
    
    return { keyCode: 0 };
  }
  
  if (gameState.gamePhase === GAME_PHASES.COMBAT) {
    const combat = gameState.combat;
    if (!combat || combat.actionInProgress) {
      return { keyCode: 0 };
    }
    
    if (!combat.isHeroTurn()) {
      return { keyCode: 0 };
    }
    
    const hero = combat.getCurrentActor();
    
    // Strategy: Cleric heals, others attack
    if (hero.className === "CLERIC") {
      // Check if any hero needs healing
      const needsHealing = combat.heroes.find(h => h.alive && h.hp < h.maxHp * 0.6);
      
      if (needsHealing && combat.menuState === "main") {
        return { keyCode: 16 }; // SHIFT for skills
      } else if (needsHealing && combat.menuState === "skills") {
        // Select heal skill (usually first skill)
        if (combat.selectedSkillIndex !== 0) {
          return { keyCode: 38 }; // UP
        }
        return { keyCode: 32 }; // SPACE to select
      }
    }
    
    // Attack logic
    if (combat.menuState === "main") {
      return { keyCode: 32 }; // SPACE for basic attack
    } else if (combat.menuState === "target") {
      // Target enemy with highest HP
      let highestHpIndex = 0;
      let highestHp = 0;
      const livingEnemies = combat.enemies.filter(e => e.alive);
      
      for (let i = 0; i < livingEnemies.length; i++) {
        if (livingEnemies[i].hp > highestHp) {
          highestHp = livingEnemies[i].hp;
          highestHpIndex = i;
        }
      }
      
      if (combat.selectedTargetIndex !== highestHpIndex) {
        return { keyCode: combat.selectedTargetIndex < highestHpIndex ? 40 : 38 }; // DOWN or UP
      }
      return { keyCode: 32 }; // SPACE to confirm
    } else if (combat.menuState === "skills") {
      return { keyCode: 90 }; // Z to back out
    }
    
    return { keyCode: 0 };
  }
  
  return { keyCode: 0 };
}

function getBasicTestAction(gameState) {
  // Basic movement and combat testing
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    return { keyCode: 13 }; // ENTER
  }
  
  if (gameState.gamePhase === GAME_PHASES.PARTY_SELECT) {
    if (gameState.partySize < 2) {
      return { keyCode: 32 }; // SPACE to add hero
    }
    return { keyCode: 13 }; // ENTER to start
  }
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    // Random movement
    const dirs = [37, 38, 39, 40];
    return { keyCode: dirs[Math.floor(Math.random() * dirs.length)] };
  }
  
  if (gameState.gamePhase === GAME_PHASES.COMBAT) {
    const combat = gameState.combat;
    if (!combat || combat.actionInProgress || !combat.isHeroTurn()) {
      return { keyCode: 0 };
    }
    
    if (combat.menuState === "main") {
      return { keyCode: 32 }; // Basic attack
    } else if (combat.menuState === "target") {
      return { keyCode: 32 }; // Confirm target
    }
  }
  
  return { keyCode: 0 };
}

function getCombatTestAction(gameState) {
  // Test all combat abilities
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    return { keyCode: 13 };
  }
  
  if (gameState.gamePhase === GAME_PHASES.PARTY_SELECT) {
    if (gameState.partySize < 3) {
      return { keyCode: 32 };
    }
    return { keyCode: 13 };
  }
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    // Move towards enemies
    const dirs = [37, 38, 39, 40];
    return { keyCode: dirs[Math.floor(Math.random() * dirs.length)] };
  }
  
  if (gameState.gamePhase === GAME_PHASES.COMBAT) {
    const combat = gameState.combat;
    if (!combat || combat.actionInProgress || !combat.isHeroTurn()) {
      return { keyCode: 0 };
    }
    
    testState.combatTurns = testState.combatTurns || 0;
    
    // Alternate between attacks and skills
    if (testState.combatTurns % 2 === 0) {
      if (combat.menuState === "main") {
        return { keyCode: 32 }; // Attack
      } else if (combat.menuState === "target") {
        testState.combatTurns++;
        return { keyCode: 32 };
      }
    } else {
      if (combat.menuState === "main") {
        return { keyCode: 16 }; // Skills
      } else if (combat.menuState === "skills") {
        return { keyCode: 32 }; // Select skill
      } else if (combat.menuState === "target") {
        testState.combatTurns++;
        return { keyCode: 32 };
      }
    }
  }
  
  return { keyCode: 0 };
}

function getRandomAction(gameState) {
  const actions = [37, 38, 39, 40, 32, 16];
  return { keyCode: actions[Math.floor(Math.random() * actions.length)] };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getCombatTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;