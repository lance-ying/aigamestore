// automated_testing_controller.js
import { BATTLE_PHASES } from './globals.js';

let lastActionTime = 0;
const ACTION_DELAY = 200;

function getTestBasicAction(gameState) {
  const now = Date.now();
  if (now - lastActionTime < ACTION_DELAY) {
    return null;
  }
  lastActionTime = now;
  
  if (gameState.battlePhase === BATTLE_PHASES.SELECT_CHARACTER) {
    const aliveParty = gameState.party.filter(p => p.isAlive() && !p.actionTaken);
    if (aliveParty.length > 0) {
      return { keyCode: 32, key: ' ' }; // Select first available
    }
  } else if (gameState.battlePhase === BATTLE_PHASES.SELECT_ACTION) {
    return { keyCode: 32, key: ' ' }; // Select attack (first action)
  } else if (gameState.battlePhase === BATTLE_PHASES.SELECT_TARGET) {
    return { keyCode: 32, key: ' ' }; // Select first target
  }
  
  return null;
}

function getTestWinAction(gameState) {
  const now = Date.now();
  if (now - lastActionTime < ACTION_DELAY) {
    return null;
  }
  lastActionTime = now;
  
  if (gameState.battlePhase === BATTLE_PHASES.SELECT_CHARACTER) {
    // Find character with highest attack that hasn't acted
    const availableParty = gameState.party.filter(p => p.isAlive() && !p.actionTaken);
    if (availableParty.length === 0) return null;
    
    let bestCharIdx = -1;
    let bestAttack = -1;
    
    gameState.party.forEach((char, idx) => {
      if (char.isAlive() && !char.actionTaken) {
        const stats = char.calculateStats();
        if (stats.attack > bestAttack) {
          bestAttack = stats.attack;
          bestCharIdx = idx;
        }
      }
    });
    
    if (bestCharIdx !== gameState.selectedCharacterIndex) {
      if (bestCharIdx > gameState.selectedCharacterIndex) {
        return { keyCode: 40, key: 'ArrowDown' };
      } else {
        return { keyCode: 38, key: 'ArrowUp' };
      }
    } else {
      return { keyCode: 32, key: ' ' };
    }
  } else if (gameState.battlePhase === BATTLE_PHASES.SELECT_ACTION) {
    // Select magic if available and high MP, otherwise attack
    const character = gameState.party[gameState.selectedCharacterIndex];
    if (character && character.mp >= 10 && gameState.selectedActionIndex < 2) {
      return { keyCode: 40, key: 'ArrowDown' }; // Move to magic
    } else {
      return { keyCode: 32, key: ' ' };
    }
  } else if (gameState.battlePhase === BATTLE_PHASES.SELECT_TARGET) {
    // Target enemy with lowest HP
    const aliveEnemies = gameState.enemies.filter(e => e.isAlive());
    if (aliveEnemies.length === 0) return null;
    
    let lowestHp = Infinity;
    let lowestIdx = 0;
    
    aliveEnemies.forEach((enemy, idx) => {
      if (enemy.hp < lowestHp) {
        lowestHp = enemy.hp;
        lowestIdx = idx;
      }
    });
    
    if (lowestIdx !== gameState.selectedTargetIndex) {
      if (lowestIdx > gameState.selectedTargetIndex) {
        return { keyCode: 40, key: 'ArrowDown' };
      } else {
        return { keyCode: 38, key: 'ArrowUp' };
      }
    } else {
      return { keyCode: 32, key: ' ' };
    }
  }
  
  return null;
}

function getTestTransmutationAction(gameState) {
  const now = Date.now();
  if (now - lastActionTime < ACTION_DELAY * 2) {
    return null;
  }
  lastActionTime = now;
  
  // Open transmutation menu if we have items
  if (!gameState.transmutationMenu && gameState.inventory.length >= 2) {
    return { keyCode: 16, key: 'Shift' };
  }
  
  // Add items to kiln
  if (gameState.transmutationMenu && gameState.kilnItems.length < 2 && gameState.inventory.length > 0) {
    return { keyCode: 49, key: '1' }; // Add first item
  }
  
  // Transmute if ready
  if (gameState.transmutationMenu && gameState.kilnItems.length === 2) {
    return { keyCode: 32, key: ' ' };
  }
  
  // Close menu and continue with normal actions
  if (gameState.transmutationMenu) {
    return { keyCode: 90, key: 'z' };
  }
  
  // Default to win strategy
  return getTestWinAction(gameState);
}

function getRandomAction(gameState) {
  const actions = [
    { keyCode: 38, key: 'ArrowUp' },
    { keyCode: 40, key: 'ArrowDown' },
    { keyCode: 32, key: ' ' }
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
      return getTestTransmutationAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;