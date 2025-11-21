// automated_testing_controller.js - Automated testing
import { gameState, BIRD_TYPES, CANVAS_WIDTH } from './globals.js';

function getTestWinAction(gameState) {
  // Strategy: Aim at pigs and structures, use abilities optimally
  
  if (!gameState.launchedBird) {
    // Calculate optimal angle and power to hit targets
    const pigs = gameState.pigs.filter(p => p.active);
    
    if (pigs.length === 0) return { launch: false };
    
    // Target the first pig
    const target = pigs[0];
    const targetAngle = Math.atan2(target.y - 330, target.x - 100) * (180 / Math.PI);
    const distance = Math.sqrt((target.x - 100) ** 2 + (target.y - 330) ** 2);
    const targetPower = Math.min(15, Math.max(8, distance / 40));
    
    // Adjust angle
    if (Math.abs(gameState.slingshotAngle - targetAngle) > 2) {
      return {
        adjustAngle: gameState.slingshotAngle < targetAngle ? 2 : -2
      };
    }
    
    // Adjust power
    if (Math.abs(gameState.slingshotPower - targetPower) > 0.5) {
      return {
        adjustPower: gameState.slingshotPower < targetPower ? 0.5 : -0.5
      };
    }
    
    // Launch when aimed
    return { launch: true };
  } else {
    // Activate ability at optimal time
    const bird = gameState.launchedBird;
    if (!gameState.abilityUsed && bird.active && bird.launched) {
      // For blue bird, activate when near structures
      if (bird.type === 'BLUE' && bird.x > 200) {
        return { activateAbility: true };
      }
      // For yellow bird, activate early
      if (bird.type === 'YELLOW' && bird.x > 150) {
        return { activateAbility: true };
      }
      // For black bird, activate near targets
      if (bird.type === 'BLACK' && bird.x > 300) {
        return { activateAbility: true };
      }
    }
    
    return {};
  }
}

function getTestAbilityAction(gameState) {
  // Test special abilities
  if (!gameState.launchedBird) {
    // Cycle through bird types
    const unlockedTypes = Object.keys(BIRD_TYPES).filter(key => BIRD_TYPES[key].unlocked);
    if (gameState.birdsRemaining === 3) {
      return { changeBird: true };
    }
    
    // Simple straight shot
    if (Math.abs(gameState.slingshotAngle - (-45)) > 2) {
      return { adjustAngle: gameState.slingshotAngle < -45 ? 2 : -2 };
    }
    if (Math.abs(gameState.slingshotPower - 10) > 0.5) {
      return { adjustPower: gameState.slingshotPower < 10 ? 0.5 : -0.5 };
    }
    return { launch: true };
  } else {
    const bird = gameState.launchedBird;
    if (!gameState.abilityUsed && bird.active && bird.x > 200) {
      return { activateAbility: true };
    }
  }
  return {};
}

function getTestMovementAction(gameState) {
  // Test aiming mechanics
  if (!gameState.launchedBird) {
    const frameCount = gameState.positionHistory.length;
    
    if (frameCount < 30) {
      return { adjustAngle: 2 };
    } else if (frameCount < 60) {
      return { adjustAngle: -2 };
    } else if (frameCount < 90) {
      return { adjustPower: 0.5 };
    } else if (frameCount < 120) {
      return { adjustPower: -0.5 };
    } else {
      return { launch: true };
    }
  }
  return {};
}

function getTestCollisionAction(gameState) {
  // Launch directly at structures
  if (!gameState.launchedBird) {
    if (Math.abs(gameState.slingshotAngle - (-30)) > 2) {
      return { adjustAngle: gameState.slingshotAngle < -30 ? 2 : -2 };
    }
    if (Math.abs(gameState.slingshotPower - 12) > 0.5) {
      return { adjustPower: gameState.slingshotPower < 12 ? 0.5 : -0.5 };
    }
    return { launch: true };
  }
  return {};
}

function getRandomAction(gameState) {
  if (!gameState.launchedBird) {
    const actions = ['adjustAngle', 'adjustPower', 'launch', 'wait'];
    const choice = actions[Math.floor(Math.random() * actions.length)];
    
    switch (choice) {
      case 'adjustAngle':
        return { adjustAngle: Math.random() < 0.5 ? 2 : -2 };
      case 'adjustPower':
        return { adjustPower: Math.random() < 0.5 ? 0.5 : -0.5 };
      case 'launch':
        return { launch: true };
      default:
        return {};
    }
  } else {
    if (!gameState.abilityUsed && Math.random() < 0.1) {
      return { activateAbility: true };
    }
  }
  return {};
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestWinAction(gameState);
    case "TEST_2":
      return getTestAbilityAction(gameState);
    case "TEST_3":
      return getTestMovementAction(gameState);
    case "TEST_4":
      return getTestCollisionAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;