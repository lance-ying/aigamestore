// automated_testing_controller.js - Automated testing logic
import { 
  gameState,
  CHAR_ABI,
  CHAR_DD,
  PHASE_PLAYING,
  PHASE_GAME_OVER_WIN
} from './globals.js';

let testState = {
  moveHistory: [],
  stuckCounter: 0,
  currentTarget: null,
  step: 0,
  lastPosition: { x: 0, y: 0 }
};

function getTestWinAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  const activeChar = gameState.activeCharacter === CHAR_ABI ? gameState.abi : gameState.dd;
  if (!activeChar) return null;
  
  // Strategy: Complete each chapter by activating switches and terminal
  const chapter = gameState.currentChapter;
  
  // Find inactive switches
  const inactiveSwitches = gameState.switches.filter(sw => !sw.active);
  
  // Find unactivated terminal
  const terminal = gameState.terminals.find(t => !t.activated);
  
  // Priority: 
  // 1. Activate switches (use appropriate character based on location)
  // 2. Switch to Abi for tight spaces
  // 3. Use DD to push crates if needed
  // 4. Activate terminal
  // 5. Move to next chapter area
  
  if (inactiveSwitches.length > 0) {
    const targetSwitch = inactiveSwitches[0];
    
    // Check if switch is in tight space
    let inTightSpace = false;
    if (gameState.tightSpaces) {
      for (const space of gameState.tightSpaces) {
        const bounds = space.getBounds();
        if (targetSwitch.x >= bounds.left && targetSwitch.x <= bounds.right &&
            targetSwitch.y >= bounds.top && targetSwitch.y <= bounds.bottom) {
          inTightSpace = true;
          break;
        }
      }
    }
    
    // Switch to Abi if target is in tight space and we're DD
    if (inTightSpace && gameState.activeCharacter === CHAR_DD) {
      return ['SWITCH_CHAR'];
    }
    
    // Move toward switch
    const actions = moveToward(activeChar, targetSwitch.x, targetSwitch.y, 40);
    
    // If close enough, interact
    const dist = Math.hypot(activeChar.x - targetSwitch.x, activeChar.y - targetSwitch.y);
    if (dist < 50) {
      return ['INTERACT'];
    }
    
    return actions;
  }
  
  // All switches activated, go to terminal
  if (terminal && !terminal.activated) {
    const actions = moveToward(activeChar, terminal.x, terminal.y, 40);
    
    const dist = Math.hypot(activeChar.x - terminal.x, activeChar.y - terminal.y);
    if (dist < 50) {
      return ['INTERACT'];
    }
    
    return actions;
  }
  
  // Terminal activated, check if chapter complete and move to next area
  if (terminal && terminal.activated) {
    // Move toward next chapter area (right side of world)
    const nextAreaX = gameState.worldWidth - 100;
    const nextAreaY = gameState.worldHeight / 2;
    
    return moveToward(activeChar, nextAreaX, nextAreaY, 20);
  }
  
  return ['RIGHT']; // Default: move right
}

function getBasicTestAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  const activeChar = gameState.activeCharacter === CHAR_ABI ? gameState.abi : gameState.dd;
  if (!activeChar) return null;
  
  // Simple movement pattern and character switching
  const step = Math.floor(gameState.gamePhase === PHASE_PLAYING ? 
    (Date.now() / 1000) % 8 : 0);
  
  switch(step) {
    case 0: return ['RIGHT'];
    case 1: return ['DOWN'];
    case 2: return ['LEFT'];
    case 3: return ['UP'];
    case 4: return ['SWITCH_CHAR'];
    case 5: return ['RIGHT', 'SPRINT'];
    case 6: return ['LEFT', 'SPRINT'];
    case 7: return ['INTERACT'];
    default: return ['RIGHT'];
  }
}

function getInteractionTestAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  const activeChar = gameState.activeCharacter === CHAR_ABI ? gameState.abi : gameState.dd;
  if (!activeChar) return null;
  
  // Test interactions with objects
  const switches = gameState.switches;
  const terminals = gameState.terminals;
  
  if (switches.length > 0) {
    const target = switches[0];
    const dist = Math.hypot(activeChar.x - target.x, activeChar.y - target.y);
    
    if (dist > 50) {
      return moveToward(activeChar, target.x, target.y, 40);
    } else {
      return ['INTERACT'];
    }
  }
  
  if (terminals.length > 0) {
    const target = terminals[0];
    const dist = Math.hypot(activeChar.x - target.x, activeChar.y - target.y);
    
    if (dist > 50) {
      return moveToward(activeChar, target.x, target.y, 40);
    } else {
      return ['INTERACT'];
    }
  }
  
  return ['RIGHT'];
}

function moveToward(character, targetX, targetY, threshold) {
  const dx = targetX - character.x;
  const dy = targetY - character.y;
  const dist = Math.hypot(dx, dy);
  
  if (dist < threshold) {
    return [];
  }
  
  const actions = [];
  
  if (Math.abs(dx) > Math.abs(dy)) {
    actions.push(dx > 0 ? 'RIGHT' : 'LEFT');
  } else {
    actions.push(dy > 0 ? 'DOWN' : 'UP');
  }
  
  // Add sprint for efficiency
  if (dist > 100) {
    actions.push('SPRINT');
  }
  
  return actions;
}

export function get_automated_testing_action(gameState) {
  if (!gameState || gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getInteractionTestAction(gameState);
    default:
      return null;
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;