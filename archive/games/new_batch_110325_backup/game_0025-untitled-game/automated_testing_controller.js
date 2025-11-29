// automated_testing_controller.js - Automated testing logic

import { gameState, MONSTER_TYPES, MONSTER_SLOTS } from './globals.js';

// Track state for strategic decisions
let testState = {
  lastDeployFrame: 0,
  lastSkillFrame: 0,
  deployOrder: [],
  upgradePreferences: ["damage", "health", "new_monster", "attack_speed", "range", "skill_cooldown"]
};

function getTestWinAction(gameState) {
  const actions = [];
  
  // Handle upgrade screen
  if (gameState.showUpgradeScreen) {
    // Select best upgrade based on preferences
    let bestIndex = 0;
    let bestPriority = 999;
    
    for (let i = 0; i < gameState.upgradeOptions.length; i++) {
      const upgrade = gameState.upgradeOptions[i];
      const priority = testState.upgradePreferences.indexOf(upgrade.type);
      if (priority !== -1 && priority < bestPriority) {
        bestPriority = priority;
        bestIndex = i;
      }
    }
    
    // Navigate to best upgrade
    if (gameState.selectedUpgrade < bestIndex) {
      actions.push(40); // DOWN
    } else if (gameState.selectedUpgrade > bestIndex) {
      actions.push(38); // UP
    } else {
      actions.push(32); // SPACE to confirm
    }
    
    return actions;
  }
  
  // Deploy monsters strategically
  if (gameState.monsters.length < 5) {
    const emptySlots = [];
    for (let i = 0; i < MONSTER_SLOTS.length; i++) {
      const occupied = gameState.monsters.some(m => m.slotIndex === i);
      if (!occupied) {
        emptySlots.push(i);
      }
    }
    
    if (emptySlots.length > 0) {
      // Prioritize front slots (0, 1) then middle (2, 3, 4)
      const priorityOrder = [0, 1, 2, 3, 4];
      let targetSlot = emptySlots[0];
      
      for (const slot of priorityOrder) {
        if (emptySlots.includes(slot)) {
          targetSlot = slot;
          break;
        }
      }
      
      // Navigate to target slot
      if (gameState.selectedSlotIndex !== targetSlot) {
        if (gameState.selectedSlotIndex < targetSlot) {
          actions.push(39); // RIGHT or DOWN
        } else {
          actions.push(37); // LEFT or UP
        }
      } else {
        // Deploy strongest available monster
        actions.push(32); // SPACE
        testState.lastDeployFrame = gameState.wave;
      }
      
      return actions;
    }
  }
  
  // Use skills strategically
  if (gameState.monsters.length > 0 && gameState.heroes.length > 0) {
    // Find monster with skill ready and nearby enemies
    let bestMonster = -1;
    let maxValue = 0;
    
    for (let i = 0; i < gameState.monsters.length; i++) {
      const monster = gameState.monsters[i];
      if (monster.skillTimer === 0) {
        // Count nearby heroes
        let nearbyHeroes = 0;
        for (const hero of gameState.heroes) {
          const dist = Math.sqrt(
            Math.pow(hero.x - monster.getX(), 2) + 
            Math.pow(hero.y - monster.getY(), 2)
          );
          if (dist <= monster.range * 1.5) {
            nearbyHeroes++;
          }
        }
        
        if (nearbyHeroes > maxValue) {
          maxValue = nearbyHeroes;
          bestMonster = i;
        }
      }
    }
    
    if (bestMonster >= 0 && maxValue >= 2) {
      // Select this monster and use skill
      if (gameState.selectedMonsterIndex !== bestMonster) {
        actions.push(90); // Z to cycle
      } else {
        actions.push(32); // SPACE to use skill
        testState.lastSkillFrame = gameState.wave;
      }
      return actions;
    }
  }
  
  // Cycle through monsters to keep selection active
  if (gameState.monsters.length > 0 && Math.random() < 0.05) {
    actions.push(90); // Z
  }
  
  return actions;
}

function getBasicTestAction(gameState) {
  const actions = [];
  
  // Handle upgrade screen randomly
  if (gameState.showUpgradeScreen) {
    if (Math.random() < 0.3) {
      actions.push(Math.random() < 0.5 ? 38 : 40); // UP or DOWN
    } else {
      actions.push(32); // SPACE
    }
    return actions;
  }
  
  // Random actions during gameplay
  if (Math.random() < 0.1) {
    const possibleActions = [32, 37, 38, 39, 40, 90, 16];
    actions.push(possibleActions[Math.floor(Math.random() * possibleActions.length)]);
  }
  
  return actions;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return [];
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;