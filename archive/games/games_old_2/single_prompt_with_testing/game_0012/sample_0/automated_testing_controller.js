// automated_testing_controller.js - Automated testing functions

import { 
  gameState,
  SUBPHASE_OVERWORLD,
  SUBPHASE_BATTLE,
  SUBPHASE_DIALOGUE,
  BATTLE_MENU
} from './globals.js';

let moveHistory = [];
let stuckCounter = 0;
let lastPosition = { x: 0, y: 0 };
let targetNPC = null;
let lastAction = null;

function getTestWinAction(state) {
  const player = state.player;
  if (!player) return getRandomAction(state);
  
  // In dialogue, advance it
  if (state.subPhase === SUBPHASE_DIALOGUE) {
    return { keyCode: 90, key: 'z' }; // Advance dialogue
  }
  
  // In battle
  if (state.subPhase === SUBPHASE_BATTLE) {
    if (state.battleState !== BATTLE_MENU) {
      return null; // Wait for menu
    }
    
    // Strategy: Use skills intelligently
    const playerCreo = state.playerCreo;
    const enemyCreo = state.enemyCreo;
    
    if (!playerCreo || !enemyCreo) return null;
    
    // If enemy is low HP and we have capture items, try to capture wild Creo
    if (state.isWildBattle && state.captureItems > 0 && 
        enemyCreo.hp < enemyCreo.maxHp * 0.3) {
      // Navigate to Items menu
      if (state.battleMenu.mainMenu !== 2) {
        if (state.battleMenu.mainMenu < 2) {
          return { keyCode: 40, key: 'ArrowDown' };
        } else {
          return { keyCode: 38, key: 'ArrowUp' };
        }
      } else {
        return { keyCode: 90, key: 'z' }; // Use capture item
      }
    }
    
    // If player Creo is low HP and has other Creo, switch
    if (playerCreo.hp < playerCreo.maxHp * 0.3) {
      const aliveCreo = state.playerTeam.filter(c => c.isAlive() && c !== playerCreo);
      if (aliveCreo.length > 0) {
        if (state.battleMenu.mainMenu !== 3) {
          if (state.battleMenu.mainMenu < 3) {
            return { keyCode: 40, key: 'ArrowDown' };
          } else {
            return { keyCode: 38, key: 'ArrowUp' };
          }
        } else {
          return { keyCode: 90, key: 'z' }; // Switch
        }
      }
    }
    
    // Use skills menu to choose best skill
    if (state.battleMenu.mainMenu !== 1) {
      if (state.battleMenu.mainMenu === 0) {
        return { keyCode: 40, key: 'ArrowDown' };
      } else if (state.battleMenu.mainMenu > 1) {
        return { keyCode: 38, key: 'ArrowUp' };
      }
    } else {
      // In skills menu, select strongest skill
      const skills = playerCreo.skills;
      if (state.battleMenu.skillMenu < skills.length - 1) {
        return { keyCode: 40, key: 'ArrowDown' };
      } else {
        return { keyCode: 90, key: 'z' }; // Use strongest skill
      }
    }
    
    return { keyCode: 90, key: 'z' }; // Default attack
  }
  
  // In overworld - navigate to NPCs
  if (state.subPhase === SUBPHASE_OVERWORLD) {
    // Check for stuck
    if (Math.abs(player.x - lastPosition.x) < 1 && 
        Math.abs(player.y - lastPosition.y) < 1) {
      stuckCounter++;
    } else {
      stuckCounter = 0;
    }
    lastPosition = { x: player.x, y: player.y };
    
    // Track position history
    moveHistory.push({ x: player.x, y: player.y });
    if (moveHistory.length > 100) {
      moveHistory.shift();
    }
    
    // Priority: Find nearest interactable NPC
    let nearestNPC = null;
    let minDist = Infinity;
    
    for (let npc of state.entities) {
      if (npc.canInteract && npc.canInteract()) {
        const dx = npc.x - player.x;
        const dy = npc.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < minDist) {
          minDist = dist;
          nearestNPC = npc;
        }
      }
    }
    
    // If close enough, interact
    if (nearestNPC && minDist < 50) {
      targetNPC = nearestNPC;
      return { keyCode: 90, key: 'z' };
    }
    
    // Navigate towards NPC
    if (nearestNPC) {
      targetNPC = nearestNPC;
      const dx = nearestNPC.x - player.x;
      const dy = nearestNPC.y - player.y;
      
      // If stuck, try different direction
      if (stuckCounter > 30) {
        stuckCounter = 0;
        const randomDir = Math.random() < 0.5;
        return randomDir ? 
          { move: { dx: 0, dy: dy > 0 ? 1 : -1 } } :
          { move: { dx: dx > 0 ? 1 : -1, dy: 0 } };
      }
      
      // Move towards target
      const moveX = Math.abs(dx) > Math.abs(dy);
      if (moveX) {
        return { move: { dx: dx > 0 ? 1 : -1, dy: 0 } };
      } else {
        return { move: { dx: 0, dy: dy > 0 ? 1 : -1 } };
      }
    }
    
    // Explore randomly
    return getRandomMovement();
  }
  
  return null;
}

function getBasicTestAction(state) {
  const player = state.player;
  if (!player) return getRandomAction(state);
  
  // In dialogue, advance it
  if (state.subPhase === SUBPHASE_DIALOGUE) {
    return { keyCode: 90, key: 'z' };
  }
  
  // In battle, use basic attacks
  if (state.subPhase === SUBPHASE_BATTLE) {
    if (state.battleState === BATTLE_MENU) {
      return { keyCode: 90, key: 'z' }; // Attack
    }
    return null;
  }
  
  // In overworld, move randomly
  if (state.subPhase === SUBPHASE_OVERWORLD) {
    return getRandomMovement();
  }
  
  return null;
}

function getTestCaptureAction(state) {
  const player = state.player;
  if (!player) return getRandomAction(state);
  
  if (state.subPhase === SUBPHASE_DIALOGUE) {
    return { keyCode: 90, key: 'z' };
  }
  
  if (state.subPhase === SUBPHASE_BATTLE) {
    if (state.battleState !== BATTLE_MENU) return null;
    
    const enemyCreo = state.enemyCreo;
    
    // If wild and low HP, try to capture
    if (state.isWildBattle && enemyCreo && enemyCreo.hp < enemyCreo.maxHp * 0.4) {
      if (state.captureItems > 0) {
        // Navigate to Items
        if (state.battleMenu.mainMenu !== 2) {
          return { keyCode: 40, key: 'ArrowDown' };
        } else {
          return { keyCode: 90, key: 'z' };
        }
      }
    }
    
    // Otherwise attack
    return { keyCode: 90, key: 'z' };
  }
  
  if (state.subPhase === SUBPHASE_OVERWORLD) {
    return getRandomMovement();
  }
  
  return null;
}

function getTestSkillsAction(state) {
  if (state.subPhase === SUBPHASE_DIALOGUE) {
    return { keyCode: 90, key: 'z' };
  }
  
  if (state.subPhase === SUBPHASE_BATTLE) {
    if (state.battleState !== BATTLE_MENU) return null;
    
    // Navigate to Skills menu
    if (state.battleMenu.mainMenu !== 1) {
      if (state.battleMenu.mainMenu === 0) {
        return { keyCode: 40, key: 'ArrowDown' };
      } else {
        return { keyCode: 38, key: 'ArrowUp' };
      }
    } else {
      // Try different skills
      const playerCreo = state.playerCreo;
      if (playerCreo && state.battleMenu.skillMenu < playerCreo.skills.length - 1) {
        if (Math.random() < 0.3) {
          return { keyCode: 40, key: 'ArrowDown' };
        }
      }
      return { keyCode: 90, key: 'z' };
    }
  }
  
  if (state.subPhase === SUBPHASE_OVERWORLD) {
    return getRandomMovement();
  }
  
  return null;
}

function getRandomMovement() {
  const directions = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 }
  ];
  
  // Bias towards continuing in same direction
  if (lastAction && lastAction.move && Math.random() < 0.7) {
    return lastAction;
  }
  
  const action = { move: directions[Math.floor(Math.random() * directions.length)] };
  lastAction = action;
  return action;
}

function getRandomAction(state) {
  if (state.subPhase === SUBPHASE_DIALOGUE) {
    return { keyCode: 90, key: 'z' };
  }
  
  if (state.subPhase === SUBPHASE_BATTLE) {
    if (state.battleState === BATTLE_MENU) {
      const rand = Math.random();
      if (rand < 0.7) {
        return { keyCode: 90, key: 'z' }; // Attack
      } else if (rand < 0.9) {
        return { keyCode: 40, key: 'ArrowDown' }; // Navigate menu
      } else {
        return { keyCode: 38, key: 'ArrowUp' };
      }
    }
    return null;
  }
  
  return getRandomMovement();
}

export function get_automated_testing_action(state) {
  switch (state.controlMode) {
    case "TEST_1":
      return getBasicTestAction(state);
    case "TEST_2":
      return getTestWinAction(state);
    case "TEST_3":
      return getTestCaptureAction(state);
    case "TEST_4":
      return getTestSkillsAction(state);
    default:
      return getRandomAction(state);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;