// automated_testing_controller.js - Automated testing AI
import { GAME_PHASES, BATTLE_PHASES } from './globals.js';
import { ENEMY_ACTS } from './enemies.js';

// Helper to create action objects
function createAction(keyCode, key, pressed = true) {
  return { keyCode, key, pressed };
}

// TEST_1: Basic movement and menu testing
function getTest1Action(gameState) {
  const { battlePhase, player } = gameState;
  
  // Random movement during enemy turn
  if (battlePhase === BATTLE_PHASES.ENEMY_TURN && player) {
    const actions = [
      createAction(37, 'ArrowLeft'),
      createAction(39, 'ArrowRight'),
      createAction(38, 'ArrowUp'),
      createAction(40, 'ArrowDown')
    ];
    
    // Random dodge occasionally
    if (Math.random() < 0.05) {
      return createAction(32, ' ');
    }
    
    return actions[Math.floor(Math.random() * actions.length)];
  }
  
  // Navigate menus
  if (battlePhase === BATTLE_PHASES.MENU) {
    if (Math.random() < 0.1) {
      return createAction(90, 'z'); // Confirm
    }
    return createAction(39, 'ArrowRight'); // Move right
  }
  
  // Confirm dialogues
  if (battlePhase === BATTLE_PHASES.DIALOGUE || battlePhase === BATTLE_PHASES.VICTORY) {
    return createAction(90, 'z');
  }
  
  // Attack timing
  if (battlePhase === BATTLE_PHASES.ATTACK_INPUT) {
    if (gameState.attackTiming >= 45 && gameState.attackTiming <= 55) {
      return createAction(90, 'z');
    }
  }
  
  return null;
}

// TEST_2: Win by sparing all enemies (Pacifist route)
let test2State = {
  positionHistory: [],
  stuckCounter: 0,
  lastAction: null,
  actionsUsed: {}
};

function getTest2Action(gameState) {
  const { battlePhase, currentEnemy, player, menuSelection, inSubMenu, subMenuSelection } = gameState;
  
  // Handle enemy turn - optimal dodging
  if (battlePhase === BATTLE_PHASES.ENEMY_TURN && player) {
    return getDodgeAction(gameState);
  }
  
  // Handle menu
  if (battlePhase === BATTLE_PHASES.MENU) {
    if (!currentEnemy) return null;
    
    if (inSubMenu) {
      // In ACT submenu - select the right action
      const enemyName = currentEnemy.name;
      const actOptions = ENEMY_ACTS[enemyName] || [];
      
      // Select first action (Compliment/Joke/Flex) until can spare
      if (subMenuSelection === 0 && !test2State.actionsUsed[enemyName]) {
        test2State.actionsUsed[enemyName] = true;
        return createAction(90, 'z'); // Confirm
      }
      
      // Need to navigate to correct option first
      if (subMenuSelection !== 0) {
        return createAction(37, 'ArrowLeft');
      }
      
      return createAction(90, 'z');
    } else {
      // Main menu
      if (currentEnemy.canSpare) {
        // Navigate to SPARE (index 3)
        if (menuSelection < 3) {
          return createAction(39, 'ArrowRight');
        } else {
          return createAction(90, 'z'); // Confirm SPARE
        }
      } else {
        // Navigate to ACT (index 1)
        if (menuSelection < 1) {
          return createAction(39, 'ArrowRight');
        } else if (menuSelection > 1) {
          return createAction(37, 'ArrowLeft');
        } else {
          return createAction(90, 'z'); // Confirm ACT
        }
      }
    }
  }
  
  // Handle dialogues and victory
  if (battlePhase === BATTLE_PHASES.DIALOGUE || battlePhase === BATTLE_PHASES.VICTORY) {
    return createAction(90, 'z');
  }
  
  return null;
}

// TEST_3: Win by fighting (Genocide route)
let test3State = {
  positionHistory: [],
  actionsUsed: {}
};

function getTest3Action(gameState) {
  const { battlePhase, player, menuSelection } = gameState;
  
  // Optimal dodging during enemy turn
  if (battlePhase === BATTLE_PHASES.ENEMY_TURN && player) {
    return getDodgeAction(gameState);
  }
  
  // Select FIGHT
  if (battlePhase === BATTLE_PHASES.MENU) {
    if (menuSelection !== 0) {
      return createAction(37, 'ArrowLeft');
    }
    return createAction(90, 'z');
  }
  
  // Perfect timing attack
  if (battlePhase === BATTLE_PHASES.ATTACK_INPUT) {
    if (gameState.attackTiming >= 45 && gameState.attackTiming <= 55) {
      return createAction(90, 'z');
    }
  }
  
  // Handle dialogues
  if (battlePhase === BATTLE_PHASES.DIALOGUE || battlePhase === BATTLE_PHASES.VICTORY) {
    return createAction(90, 'z');
  }
  
  return null;
}

// TEST_4: Intentionally lose by taking damage
function getTest4Action(gameState) {
  const { battlePhase } = gameState;
  
  // Don't move during enemy turn - take all hits
  if (battlePhase === BATTLE_PHASES.ENEMY_TURN) {
    return null; // Stay still
  }
  
  // Select FIGHT to keep game moving
  if (battlePhase === BATTLE_PHASES.MENU) {
    if (gameState.menuSelection !== 0) {
      return createAction(37, 'ArrowLeft');
    }
    return createAction(90, 'z');
  }
  
  // Attack without timing
  if (battlePhase === BATTLE_PHASES.ATTACK_INPUT) {
    if (gameState.attackTiming > 80) {
      return createAction(90, 'z');
    }
  }
  
  // Handle dialogues
  if (battlePhase === BATTLE_PHASES.DIALOGUE || battlePhase === BATTLE_PHASES.VICTORY) {
    return createAction(90, 'z');
  }
  
  return null;
}

// TEST_5: Mixed strategy (some fight, some spare)
let test5State = {
  strategy: {},
  positionHistory: []
};

function getTest5Action(gameState) {
  const { battlePhase, currentEnemy, player, menuSelection, enemyIndex } = gameState;
  
  if (!currentEnemy) return null;
  
  // Define strategy per enemy (0: fight, 1: spare, 2: spare)
  const strategies = ['fight', 'spare', 'spare'];
  const currentStrategy = strategies[enemyIndex] || 'fight';
  
  // Optimal dodging
  if (battlePhase === BATTLE_PHASES.ENEMY_TURN && player) {
    return getDodgeAction(gameState);
  }
  
  // Menu handling
  if (battlePhase === BATTLE_PHASES.MENU) {
    if (currentStrategy === 'fight') {
      // Select FIGHT
      if (menuSelection !== 0) {
        return createAction(37, 'ArrowLeft');
      }
      return createAction(90, 'z');
    } else {
      // Spare strategy (similar to TEST_2)
      if (gameState.inSubMenu) {
        if (gameState.subMenuSelection !== 0) {
          return createAction(37, 'ArrowLeft');
        }
        return createAction(90, 'z');
      } else {
        if (currentEnemy.canSpare) {
          if (menuSelection < 3) {
            return createAction(39, 'ArrowRight');
          } else {
            return createAction(90, 'z');
          }
        } else {
          if (menuSelection < 1) {
            return createAction(39, 'ArrowRight');
          } else if (menuSelection > 1) {
            return createAction(37, 'ArrowLeft');
          } else {
            return createAction(90, 'z');
          }
        }
      }
    }
  }
  
  // Attack timing
  if (battlePhase === BATTLE_PHASES.ATTACK_INPUT) {
    if (gameState.attackTiming >= 45 && gameState.attackTiming <= 55) {
      return createAction(90, 'z');
    }
  }
  
  // Handle dialogues
  if (battlePhase === BATTLE_PHASES.DIALOGUE || battlePhase === BATTLE_PHASES.VICTORY) {
    return createAction(90, 'z');
  }
  
  return null;
}

// Helper function for optimal dodging
function getDodgeAction(gameState) {
  const { player } = gameState;
  if (!player) return null;
  
  // Get all projectiles from attack manager (we'll use simple heuristic)
  // Move in a circular pattern to avoid most attacks
  const frame = gameState.gamePhase === 'PLAYING' ? (Date.now() / 50) : 0;
  const pattern = Math.floor(frame) % 4;
  
  const actions = [
    createAction(37, 'ArrowLeft'),   // 0
    createAction(40, 'ArrowDown'),   // 1
    createAction(39, 'ArrowRight'),  // 2
    createAction(38, 'ArrowUp')      // 3
  ];
  
  // Use dodge occasionally
  if (Math.random() < 0.05 && gameState.dodgeCooldown <= 0) {
    return createAction(32, ' ');
  }
  
  return actions[pattern];
}

// Random fallback action
function getRandomAction(gameState) {
  const actions = [
    createAction(37, 'ArrowLeft'),
    createAction(39, 'ArrowRight'),
    createAction(38, 'ArrowUp'),
    createAction(40, 'ArrowDown'),
    createAction(90, 'z')
  ];
  return actions[Math.floor(Math.random() * actions.length)];
}

// Main controller function
export function get_automated_testing_action(gameState) {
  // Don't act during non-playing phases
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTest1Action(gameState);
    case "TEST_2":
      return getTest2Action(gameState);
    case "TEST_3":
      return getTest3Action(gameState);
    case "TEST_4":
      return getTest4Action(gameState);
    case "TEST_5":
      return getTest5Action(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;