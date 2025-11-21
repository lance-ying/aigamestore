// automated_testing_controller.js - Automated testing

import { gameState, COMBAT_PHASES } from './globals.js';

function getTestWinAction(gameState) {
  // Strategy: Select highest damage cards, focus weakest enemy
  
  if (gameState.combatPhase === COMBAT_PHASES.SELECT_CARD) {
    // Find card with highest damage
    let bestIndex = 0;
    let bestDamage = 0;
    
    gameState.hand.forEach((card, index) => {
      const damage = card.damage + (card.type === "ATTACK" ? gameState.player.strength : 0);
      if (damage > bestDamage) {
        bestDamage = damage;
        bestIndex = index;
      }
    });
    
    // Navigate to best card
    if (gameState.selectedCardIndex < bestIndex) {
      return { keyCode: 39 }; // RIGHT
    } else if (gameState.selectedCardIndex > bestIndex) {
      return { keyCode: 37 }; // LEFT
    } else {
      return { keyCode: 32 }; // SPACE to confirm
    }
  }
  
  if (gameState.combatPhase === COMBAT_PHASES.SELECT_TARGET) {
    // Find enemy with lowest HP
    let lowestHp = Infinity;
    let targetIndex = 0;
    
    gameState.enemies.forEach((enemy, index) => {
      if (enemy.hp > 0 && enemy.hp < lowestHp) {
        lowestHp = enemy.hp;
        targetIndex = index;
      }
    });
    
    // Navigate to target
    if (gameState.selectedTargetIndex < targetIndex) {
      return { keyCode: 39 }; // RIGHT
    } else if (gameState.selectedTargetIndex > targetIndex) {
      return { keyCode: 37 }; // LEFT
    } else {
      return { keyCode: 32 }; // SPACE to confirm
    }
  }
  
  if (gameState.combatPhase === COMBAT_PHASES.REWARD) {
    // Select card with highest damage
    let bestIndex = 0;
    let bestValue = 0;
    
    gameState.rewardCards.forEach((card, index) => {
      const value = card.damage * 2 + (card.type === "POWER" ? 10 : 0);
      if (value > bestValue) {
        bestValue = value;
        bestIndex = index;
      }
    });
    
    if (gameState.selectedRewardIndex < bestIndex) {
      return { keyCode: 39 }; // RIGHT
    } else if (gameState.selectedRewardIndex > bestIndex) {
      return { keyCode: 37 }; // LEFT
    } else {
      return { keyCode: 32 }; // SPACE
    }
  }
  
  return null;
}

function getBasicTestAction(gameState) {
  // Simple testing: just press space and arrows randomly
  const actions = [
    { keyCode: 32 }, // SPACE
    { keyCode: 37 }, // LEFT
    { keyCode: 39 }, // RIGHT
    { keyCode: 38 }, // UP
    { keyCode: 40 }  // DOWN
  ];
  
  return actions[Math.floor(Math.random() * actions.length)];
}

function getLoseTestAction(gameState) {
  // Intentionally bad play - select defend cards, wrong targets
  
  if (gameState.combatPhase === COMBAT_PHASES.SELECT_CARD) {
    // Find weakest card
    let worstIndex = 0;
    let lowestDamage = Infinity;
    
    gameState.hand.forEach((card, index) => {
      if (card.damage < lowestDamage) {
        lowestDamage = card.damage;
        worstIndex = index;
      }
    });
    
    if (gameState.selectedCardIndex < worstIndex) {
      return { keyCode: 39 };
    } else if (gameState.selectedCardIndex > worstIndex) {
      return { keyCode: 37 };
    } else {
      return { keyCode: 32 };
    }
  }
  
  if (gameState.combatPhase === COMBAT_PHASES.SELECT_TARGET) {
    // Target strongest enemy (worst choice)
    let highestHp = 0;
    let targetIndex = 0;
    
    gameState.enemies.forEach((enemy, index) => {
      if (enemy.hp > 0 && enemy.hp > highestHp) {
        highestHp = enemy.hp;
        targetIndex = index;
      }
    });
    
    if (gameState.selectedTargetIndex !== targetIndex) {
      return { keyCode: 39 };
    } else {
      return { keyCode: 32 };
    }
  }
  
  if (gameState.combatPhase === COMBAT_PHASES.REWARD) {
    return { keyCode: 32 }; // Just pick something
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
      return null;
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;