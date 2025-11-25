// automated_testing_controller.js - Automated testing strategies
import { STORY_DATA } from './globals.js';

function getTestWinAction(gameState) {
  if (!gameState.player) return getNoAction();

  const player = gameState.player;
  
  // Find nearest uncollected orb
  let nearestOrb = null;
  let minDist = Infinity;
  
  gameState.memoryOrbs.forEach(orb => {
    if (!orb.collected) {
      const dist = Math.sqrt(
        Math.pow(orb.x - player.x, 2) + 
        Math.pow(orb.y - player.y, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        nearestOrb = orb;
      }
    }
  });

  if (nearestOrb) {
    const dx = nearestOrb.x - player.x;
    const dy = nearestOrb.y - player.y;
    
    // Check for nearby distortions
    let shouldAvoid = false;
    let avoidX = 0;
    let avoidY = 0;
    
    gameState.temporalDistortions.forEach(distortion => {
      const distToDistortion = Math.sqrt(
        Math.pow(distortion.x - player.x, 2) + 
        Math.pow(distortion.y - player.y, 2)
      );
      
      if (distToDistortion < 60) {
        shouldAvoid = true;
        avoidX += player.x - distortion.x;
        avoidY += player.y - distortion.y;
      }
    });

    let targetX = dx;
    let targetY = dy;
    
    if (shouldAvoid) {
      // Combine avoidance with target seeking
      targetX = dx * 0.5 + avoidX * 0.5;
      targetY = dy * 0.5 + avoidY * 0.5;
    }

    const useStabilizer = shouldAvoid && gameState.temporalStabilizerCooldown === 0;
    const useSprint = !shouldAvoid && minDist > 100;

    return {
      left: targetX < -5,
      right: targetX > 5,
      up: targetY < -5,
      down: targetY > 5,
      shift: useSprint,
      z: useStabilizer,
      space: false
    };
  }

  return getNoAction();
}

function getTestBasicAction(gameState) {
  if (!gameState.player) return getNoAction();

  const player = gameState.player;
  
  // Simple orb collection with basic avoidance
  let nearestOrb = null;
  let minDist = Infinity;
  
  gameState.memoryOrbs.forEach(orb => {
    if (!orb.collected) {
      const dist = Math.sqrt(
        Math.pow(orb.x - player.x, 2) + 
        Math.pow(orb.y - player.y, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        nearestOrb = orb;
      }
    }
  });

  if (nearestOrb) {
    const dx = nearestOrb.x - player.x;
    const dy = nearestOrb.y - player.y;

    return {
      left: dx < -10,
      right: dx > 10,
      up: dy < -10,
      down: dy > 10,
      shift: false,
      z: false,
      space: false
    };
  }

  return getNoAction();
}

function getTestAvoidanceAction(gameState) {
  if (!gameState.player) return getNoAction();

  const player = gameState.player;
  
  // Focus on avoiding distortions
  let avoidX = 0;
  let avoidY = 0;
  let dangerLevel = 0;
  
  gameState.temporalDistortions.forEach(distortion => {
    const dist = Math.sqrt(
      Math.pow(distortion.x - player.x, 2) + 
      Math.pow(distortion.y - player.y, 2)
    );
    
    if (dist < 80) {
      const force = (80 - dist) / 80;
      avoidX += (player.x - distortion.x) * force;
      avoidY += (player.y - distortion.y) * force;
      dangerLevel += force;
    }
  });

  // Also try to collect orbs
  let nearestOrb = null;
  let minDist = Infinity;
  
  gameState.memoryOrbs.forEach(orb => {
    if (!orb.collected) {
      const dist = Math.sqrt(
        Math.pow(orb.x - player.x, 2) + 
        Math.pow(orb.y - player.y, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        nearestOrb = orb;
      }
    }
  });

  let targetX = avoidX * 2;
  let targetY = avoidY * 2;

  if (nearestOrb && dangerLevel < 0.5) {
    targetX += (nearestOrb.x - player.x) * 0.3;
    targetY += (nearestOrb.y - player.y) * 0.3;
  }

  const useStabilizer = dangerLevel > 0.7 && gameState.temporalStabilizerCooldown === 0;

  return {
    left: targetX < -5,
    right: targetX > 5,
    up: targetY < -5,
    down: targetY > 5,
    shift: false,
    z: useStabilizer,
    space: false
  };
}

function getRandomAction(gameState) {
  const actions = ['left', 'right', 'up', 'down', 'none'];
  const choice = actions[Math.floor(Math.random() * actions.length)];
  
  return {
    left: choice === 'left',
    right: choice === 'right',
    up: choice === 'up',
    down: choice === 'down',
    shift: Math.random() < 0.1,
    z: Math.random() < 0.05,
    space: false
  };
}

function getNoAction() {
  return {
    left: false,
    right: false,
    up: false,
    down: false,
    shift: false,
    z: false,
    space: false
  };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestAvoidanceAction(gameState);
    case "TEST_4":
      return getRandomAction(gameState);
    default:
      return getNoAction();
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;