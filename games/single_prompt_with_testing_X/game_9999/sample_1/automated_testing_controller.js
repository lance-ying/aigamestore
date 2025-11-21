// automated_testing_controller.js - Automated testing logic

import { PHASE_PLAYING } from './globals.js';

let testState = {
  initialized: false,
  targetGateIndex: 0,
  firingStarted: false,
  abilityUsed: false,
  framesSinceFiring: 0
};

function getTestWinAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  const action = {
    aimLeft: false,
    aimRight: false,
    fineAimLeft: false,
    fineAimRight: false,
    fire: false,
    ability: false,
    swapChampion: false
  };
  
  if (!testState.initialized) {
    testState.initialized = true;
    testState.targetGateIndex = 0;
    testState.firingStarted = false;
    testState.abilityUsed = false;
    testState.framesSinceFiring = 0;
  }
  
  const cannon = gameState.cannon;
  const blueGates = gameState.gates.filter(g => g.multiplier > 1);
  
  if (blueGates.length === 0) {
    // No blue gates, aim at base
    const targetAngle = Math.atan2(
      gameState.enemyBase.y - cannon.y,
      gameState.enemyBase.x - cannon.x
    );
    const angleDiff = targetAngle - cannon.angle;
    
    if (Math.abs(angleDiff) > 0.05) {
      action.aimRight = angleDiff > 0;
      action.aimLeft = angleDiff < 0;
    } else {
      action.fire = true;
    }
  } else {
    // Aim at blue gates in sequence
    const targetGate = blueGates[testState.targetGateIndex % blueGates.length];
    
    const targetAngle = Math.atan2(
      targetGate.y - cannon.y,
      targetGate.x - cannon.x
    );
    const angleDiff = targetAngle - cannon.angle;
    
    if (Math.abs(angleDiff) > 0.02) {
      if (Math.abs(angleDiff) > 0.1) {
        action.aimRight = angleDiff > 0;
        action.aimLeft = angleDiff < 0;
      } else {
        action.fineAimRight = angleDiff > 0;
        action.fineAimLeft = angleDiff < 0;
      }
    } else {
      action.fire = true;
      testState.firingStarted = true;
    }
    
    // After firing for a while, switch to next gate
    if (testState.firingStarted) {
      testState.framesSinceFiring++;
      if (testState.framesSinceFiring > 60) {
        testState.targetGateIndex++;
        testState.framesSinceFiring = 0;
        testState.firingStarted = false;
      }
    }
  }
  
  // Use champion ability when we have many units
  if (!testState.abilityUsed && gameState.units.length > 20 && !gameState.abilityOnCooldown) {
    action.ability = true;
    testState.abilityUsed = true;
  }
  
  return action;
}

function getBasicTestAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  const action = {
    aimLeft: false,
    aimRight: false,
    fineAimLeft: false,
    fineAimRight: false,
    fire: true,
    ability: false,
    swapChampion: false
  };
  
  // Simple: aim roughly at base and fire continuously
  const cannon = gameState.cannon;
  const targetAngle = Math.atan2(
    gameState.enemyBase.y - cannon.y,
    gameState.enemyBase.x - cannon.x
  );
  const angleDiff = targetAngle - cannon.angle;
  
  if (Math.abs(angleDiff) > 0.05) {
    action.aimRight = angleDiff > 0;
    action.aimLeft = angleDiff < 0;
  }
  
  return action;
}

function getChampionTestAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  const action = {
    aimLeft: false,
    aimRight: false,
    fineAimLeft: false,
    fineAimRight: false,
    fire: true,
    ability: false,
    swapChampion: false
  };
  
  // Aim at base
  const cannon = gameState.cannon;
  const targetAngle = Math.atan2(
    gameState.enemyBase.y - cannon.y,
    gameState.enemyBase.x - cannon.x
  );
  const angleDiff = targetAngle - cannon.angle;
  
  if (Math.abs(angleDiff) > 0.05) {
    action.aimRight = angleDiff > 0;
    action.aimLeft = angleDiff < 0;
  }
  
  // Use abilities and swap champions frequently
  if (gameState.units.length > 10 && !gameState.abilityOnCooldown) {
    action.ability = true;
  }
  
  // Swap champion every 5 seconds
  if (Math.floor(window.gameInstance.frameCount / 300) % 2 === 0 && window.gameInstance.frameCount % 300 === 0) {
    action.swapChampion = true;
  }
  
  return action;
}

function getSlowMotionTestAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  const action = {
    aimLeft: false,
    aimRight: false,
    fineAimLeft: true,
    fineAimRight: false,
    fire: true,
    ability: false,
    swapChampion: false
  };
  
  // Use fine aim controls to test precision
  const cannon = gameState.cannon;
  
  // Sweep slowly left and right
  if (cannon.angle < -Math.PI * 0.7) {
    action.fineAimRight = true;
    action.fineAimLeft = false;
  } else if (cannon.angle > -Math.PI * 0.3) {
    action.fineAimLeft = true;
    action.fineAimRight = false;
  }
  
  return action;
}

function getRandomAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  return {
    aimLeft: Math.random() > 0.7,
    aimRight: Math.random() > 0.7,
    fineAimLeft: false,
    fineAimRight: false,
    fire: Math.random() > 0.3,
    ability: Math.random() > 0.95,
    swapChampion: false
  };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getChampionTestAction(gameState);
    case "TEST_4":
      return getSlowMotionTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;