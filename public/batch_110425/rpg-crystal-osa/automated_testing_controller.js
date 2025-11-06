// automated_testing_controller.js - Automated testing functions

import { gameState, GAME_PHASES, BATTLE_PHASES } from './globals.js';

let testState = {
  moveHistory: [],
  stuckCounter: 0,
  lastPosition: { x: 0, y: 0 },
  battleStrategy: "AGGRESSIVE"
};

function getTestWinAction(gs) {
  // Strategy to win: Navigate dungeons, fight battles optimally, reach final boss
  
  if (gs.battlePhase !== BATTLE_PHASES.NONE && gs.currentBattle) {
    return getBattleAction(gs, true);
  }
  
  // In dungeon exploration
  if (gs.showPartyMenu) {
    return { keyCode: 16 }; // Close menu with Shift
  }
  
  // Navigate to stairs
  const dx = gs.dungeonX;
  const dy = gs.dungeonY;
  
  // Check if stuck
  if (dx === testState.lastPosition.x && dy === testState.lastPosition.y) {
    testState.stuckCounter++;
  } else {
    testState.stuckCounter = 0;
    testState.lastPosition = { x: dx, y: dy };
  }
  
  // If stuck, try random movement
  if (testState.stuckCounter > 10) {
    const randomDir = Math.floor(Math.random() * 4);
    testState.stuckCounter = 0;
    return { keyCode: 37 + randomDir }; // Random arrow key
  }
  
  // Move towards stairs (bottom-right)
  const stairsX = 13;
  const stairsY = 8;
  
  if (dx < stairsX) {
    return { keyCode: 39 }; // Right
  } else if (dx > stairsX) {
    return { keyCode: 37 }; // Left
  } else if (dy < stairsY) {
    return { keyCode: 40 }; // Down
  } else if (dy > stairsY) {
    return { keyCode: 38 }; // Up
  }
  
  // Should be on stairs, press space to advance
  return { keyCode: 32 };
}

function getBattleAction(gs, optimal = true) {
  const battle = gs.currentBattle;
  if (!battle) return null;
  
  const currentActor = battle.getCurrentActor();
  if (!currentActor || currentActor.type === "ENEMY" || currentActor.actionReady) {
    return { keyCode: 32 }; // Space to advance
  }
  
  // Optimal strategy
  if (optimal) {
    // Check if need healing
    const needsHealing = gs.party.some(char => char.isAlive() && char.hp < char.maxHP * 0.4);
    
    if (battle.actionState === "SELECTING_ACTION") {
      if (needsHealing && currentActor.heroType === "MAGE") {
        // Select Skill
        while (battle.actionMenuSelection !== 1) {
          battle.actionMenuSelection++;
          if (battle.actionMenuSelection >= 3) battle.actionMenuSelection = 0;
        }
        return { keyCode: 32 }; // Confirm Skill
      } else if (currentActor.equippedSkills.length > 0 && currentActor.mp >= currentActor.equippedSkills[0].mpCost) {
        // Use skill if available
        while (battle.actionMenuSelection !== 1) {
          battle.actionMenuSelection++;
          if (battle.actionMenuSelection >= 3) battle.actionMenuSelection = 0;
        }
        return { keyCode: 32 }; // Confirm Skill
      } else {
        // Attack
        while (battle.actionMenuSelection !== 0) {
          battle.actionMenuSelection++;
          if (battle.actionMenuSelection >= 3) battle.actionMenuSelection = 0;
        }
        return { keyCode: 32 }; // Confirm Attack
      }
    } else if (battle.actionState === "SELECTING_SKILL") {
      // Select healing skill or first available skill
      if (needsHealing && currentActor.heroType === "MAGE") {
        // Find heal skill
        const healIndex = currentActor.equippedSkills.findIndex(s => s.name.includes("Heal"));
        if (healIndex >= 0) {
          while (battle.skillSelection !== healIndex) {
            battle.skillSelection++;
            if (battle.skillSelection >= currentActor.equippedSkills.length) {
              battle.skillSelection = 0;
            }
          }
        }
      }
      return { keyCode: 32 }; // Confirm skill
    } else if (battle.actionState === "SELECTING_TARGET") {
      const action = currentActor.selectedAction;
      if (action.type === "SKILL" && action.skill && action.skill.target.includes("ALLY")) {
        // Target weakest ally
        const allies = gs.party.filter(a => a.isAlive());
        let weakestIndex = 0;
        let lowestHPPercent = 1;
        allies.forEach((ally, i) => {
          const hpPercent = ally.hp / ally.maxHP;
          if (hpPercent < lowestHPPercent) {
            lowestHPPercent = hpPercent;
            weakestIndex = i;
          }
        });
        while (battle.targetSelection !== weakestIndex) {
          battle.targetSelection++;
          if (battle.targetSelection >= allies.length) {
            battle.targetSelection = 0;
          }
        }
      } else {
        // Target first alive enemy
        battle.targetSelection = 0;
      }
      return { keyCode: 32 }; // Confirm target
    }
  } else {
    // Basic testing - just attack
    if (battle.actionState === "SELECTING_ACTION") {
      return { keyCode: 32 }; // Select Attack
    } else if (battle.actionState === "SELECTING_TARGET") {
      return { keyCode: 32 }; // Confirm target
    }
  }
  
  return { keyCode: 32 }; // Default: space
}

function getBasicTestAction(gs) {
  // Basic movement and battle testing
  
  if (gs.battlePhase !== BATTLE_PHASES.NONE && gs.currentBattle) {
    return getBattleAction(gs, false);
  }
  
  // Random exploration
  const actions = [37, 38, 39, 40]; // Arrow keys
  const randomAction = actions[Math.floor(Math.random() * actions.length)];
  return { keyCode: randomAction };
}

function getRandomAction(gs) {
  const actions = [37, 38, 39, 40, 32]; // Arrows and space
  const randomAction = actions[Math.floor(Math.random() * actions.length)];
  return { keyCode: randomAction };
}

export function get_automated_testing_action(gs) {
  switch (gs.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gs);
    case "TEST_2":
      return getTestWinAction(gs);
    default:
      return getRandomAction(gs);
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;