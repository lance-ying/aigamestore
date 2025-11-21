// automated_testing_controller.js - Automated testing strategies

import { GAME_PHASES } from './globals.js';

let testState = {
  framesSinceLastAction: 0,
  targetGateIndex: 0,
  abilityUsed: false,
  firingStarted: false,
  strategyPhase: 'aim', // 'aim', 'fire', 'adjust'
};

function getTestBasicAction(gameState) {
  testState.framesSinceLastAction++;
  
  const action = {
    rotateLeft: false,
    rotateRight: false,
    fire: false,
    useAbility: false
  };
  
  // Simple strategy: sweep and fire
  if (testState.framesSinceLastAction < 60) {
    action.rotateRight = true;
  } else if (testState.framesSinceLastAction < 120) {
    action.rotateLeft = true;
  } else {
    testState.framesSinceLastAction = 0;
  }
  
  // Fire continuously after initial delay
  if (gameState.totalUnitsSpawned < 100) {
    action.fire = true;
  }
  
  return action;
}

function getTestWinAction(gameState) {
  testState.framesSinceLastAction++;
  
  const action = {
    rotateLeft: false,
    rotateRight: false,
    fire: false,
    useAbility: false
  };
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return action;
  }
  
  // Strategic targeting of blue gates
  const cannon = gameState.cannon;
  const gates = gameState.gates;
  
  if (!cannon || gates.length === 0) {
    action.fire = true;
    return action;
  }
  
  // Find the next blue gate to target
  const blueGates = gates.filter(g => g.multiplier > 1).sort((a, b) => a.x - b.x);
  
  if (blueGates.length > 0 && testState.targetGateIndex < blueGates.length) {
    const targetGate = blueGates[testState.targetGateIndex];
    
    // Calculate desired angle to hit the gate
    const dx = targetGate.x - cannon.x;
    const dy = targetGate.y - cannon.y;
    const desiredAngle = Math.atan2(dy, dx);
    
    const angleDiff = desiredAngle - cannon.angle;
    
    // Aim towards the gate
    if (Math.abs(angleDiff) > 0.05) {
      if (angleDiff > 0) {
        action.rotateRight = true;
      } else {
        action.rotateLeft = true;
      }
    } else {
      // Aimed correctly, start firing
      action.fire = true;
      testState.firingStarted = true;
      
      // Move to next gate after firing for a bit
      if (testState.firingStarted && testState.framesSinceLastAction > 40) {
        testState.targetGateIndex++;
        testState.framesSinceLastAction = 0;
        testState.firingStarted = false;
      }
    }
  } else {
    // All gates targeted, just fire at base
    action.fire = true;
    
    // Aim at enemy base
    if (gameState.enemyBase) {
      const dx = gameState.enemyBase.x - cannon.x;
      const dy = gameState.enemyBase.y - cannon.y;
      const desiredAngle = Math.atan2(dy, dx);
      const angleDiff = desiredAngle - cannon.angle;
      
      if (Math.abs(angleDiff) > 0.05) {
        if (angleDiff > 0) {
          action.rotateRight = true;
        } else {
          action.rotateLeft = true;
        }
      }
    }
  }
  
  // Use champion ability when obstacles are present
  if (!testState.abilityUsed && gameState.championAbilityReady) {
    const aliveObstacles = gameState.obstacles.filter(o => o.alive);
    if (aliveObstacles.length > 0 && gameState.totalUnitsSpawned > 20) {
      action.useAbility = true;
      testState.abilityUsed = true;
    }
  }
  
  return action;
}

function getTestChampionAction(gameState) {
  const action = {
    rotateLeft: false,
    rotateRight: false,
    fire: false,
    useAbility: false
  };
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return action;
  }
  
  // Fire some units first
  if (gameState.totalUnitsSpawned < 30) {
    action.fire = true;
    action.rotateRight = gameState.totalUnitsSpawned % 20 < 10;
  }
  
  // Use ability when ready and obstacles exist
  if (gameState.championAbilityReady && gameState.obstacles.filter(o => o.alive).length > 0) {
    action.useAbility = true;
  }
  
  // Continue firing
  if (gameState.totalUnitsSpawned < 60) {
    action.fire = true;
  }
  
  return action;
}

function getTestGateAction(gameState) {
  const action = {
    rotateLeft: false,
    rotateRight: false,
    fire: false,
    useAbility: false
  };
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return action;
  }
  
  const cannon = gameState.cannon;
  const blueGates = gameState.gates.filter(g => g.multiplier > 1);
  
  if (blueGates.length > 0 && cannon) {
    // Target first blue gate
    const gate = blueGates[0];
    const dx = gate.x - cannon.x;
    const dy = gate.y - cannon.y;
    const desiredAngle = Math.atan2(dy, dx);
    const angleDiff = desiredAngle - cannon.angle;
    
    if (Math.abs(angleDiff) > 0.08) {
      action.rotateRight = angleDiff > 0;
      action.rotateLeft = angleDiff < 0;
    }
  }
  
  // Fire continuously
  action.fire = true;
  
  return action;
}

function getTestWinConditionAction(gameState) {
  const action = {
    rotateLeft: false,
    rotateRight: false,
    fire: false,
    useAbility: false
  };
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return action;
  }
  
  // Aggressive strategy to win quickly
  const cannon = gameState.cannon;
  
  if (gameState.enemyBase && cannon) {
    const dx = gameState.enemyBase.x - cannon.x;
    const dy = gameState.enemyBase.y - cannon.y;
    const desiredAngle = Math.atan2(dy, dx);
    const angleDiff = desiredAngle - cannon.angle;
    
    if (Math.abs(angleDiff) > 0.05) {
      action.rotateRight = angleDiff > 0;
      action.rotateLeft = angleDiff < 0;
    }
  }
  
  // Fire continuously
  action.fire = true;
  
  // Use ability when available
  if (gameState.championAbilityReady && gameState.totalUnitsSpawned > 15) {
    action.useAbility = true;
  }
  
  return action;
}

function getRandomAction(gameState) {
  return {
    rotateLeft: Math.random() < 0.3,
    rotateRight: Math.random() < 0.3,
    fire: Math.random() < 0.5,
    useAbility: Math.random() < 0.1 && gameState.championAbilityReady
  };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestChampionAction(gameState);
    case "TEST_4":
      return getTestGateAction(gameState);
    case "TEST_5":
      return getTestWinConditionAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;