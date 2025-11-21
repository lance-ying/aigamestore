// automated_testing_controller.js - Automated testing strategies

import { ARENA_WIDTH, ARENA_HEIGHT } from './globals.js';

let moveHistory = [];
let stuckCounter = 0;
let currentStrategy = 'collect';
let targetFood = null;
let avoidanceTarget = null;

function getTestWinAction(gameState) {
  if (!gameState.player || !gameState.player.alive) {
    return { targetAngle: 0, speedBoost: false, useMagnet: false };
  }

  const head = gameState.player.getHead();
  const player = gameState.player;
  
  // Track position history to detect stalling
  moveHistory.push({ x: head.x, y: head.y });
  if (moveHistory.length > 30) {
    moveHistory.shift();
  }
  
  // Check if stuck
  if (moveHistory.length >= 30) {
    const recentMoves = moveHistory.slice(-30);
    const avgX = recentMoves.reduce((sum, pos) => sum + pos.x, 0) / 30;
    const avgY = recentMoves.reduce((sum, pos) => sum + pos.y, 0) / 30;
    const variance = recentMoves.reduce((sum, pos) => 
      sum + Math.hypot(pos.x - avgX, pos.y - avgY), 0) / 30;
    
    if (variance < 20) {
      stuckCounter++;
      if (stuckCounter > 60) {
        // Unstuck maneuver
        const randomAngle = Math.random() * Math.PI * 2;
        stuckCounter = 0;
        return { 
          targetAngle: randomAngle, 
          speedBoost: true, 
          useMagnet: false 
        };
      }
    } else {
      stuckCounter = 0;
    }
  }
  
  // Check for immediate threats
  const threats = findThreats(gameState, head, 60);
  if (threats.length > 0) {
    currentStrategy = 'avoid';
    avoidanceTarget = threats[0];
  } else {
    currentStrategy = 'collect';
    avoidanceTarget = null;
  }
  
  let targetAngle = player.angle;
  let useSpeedBoost = false;
  let useMagnet = false;
  
  if (currentStrategy === 'avoid') {
    // Avoid threats
    const avoidX = head.x - avoidanceTarget.x;
    const avoidY = head.y - avoidanceTarget.y;
    targetAngle = Math.atan2(avoidY, avoidX);
    useSpeedBoost = player.mass > 20;
  } else {
    // Aggressive collection strategy
    if (!targetFood || targetFood.collected) {
      targetFood = findBestFood(gameState, head, 200);
    }
    
    if (targetFood) {
      const dx = targetFood.x - head.x;
      const dy = targetFood.y - head.y;
      targetAngle = Math.atan2(dy, dx);
      
      // Use speed boost if far from food and have enough mass
      const dist = Math.hypot(dx, dy);
      useSpeedBoost = dist > 80 && player.mass > 30;
    } else {
      // Explore toward center if no food found
      const centerX = ARENA_WIDTH / 2;
      const centerY = ARENA_HEIGHT / 2;
      const dx = centerX - head.x;
      const dy = centerY - head.y;
      targetAngle = Math.atan2(dy, dx);
    }
    
    // Use magnet when available and food nearby
    if (player.powerups.magnet > 0 && !player.magnetActive) {
      const nearbyFood = gameState.food.filter(f => {
        if (f.collected) return false;
        const dist = Math.hypot(f.x - head.x, f.y - head.y);
        return dist < 150;
      });
      useMagnet = nearbyFood.length > 5;
    }
  }
  
  // Try to encircle smaller AI worms when large enough
  if (player.mass > 50 && currentStrategy === 'collect') {
    const target = findEncirclementTarget(gameState, head);
    if (target) {
      const dx = target.x - head.x;
      const dy = target.y - head.y;
      const angle = Math.atan2(dy, dx);
      // Circle around target
      targetAngle = angle + Math.PI / 2;
    }
  }
  
  return {
    targetAngle: targetAngle,
    speedBoost: useSpeedBoost,
    useMagnet: useMagnet
  };
}

function getBasicTestAction(gameState) {
  if (!gameState.player || !gameState.player.alive) {
    return { targetAngle: 0, speedBoost: false, useMagnet: false };
  }

  const head = gameState.player.getHead();
  const player = gameState.player;
  
  // Simple strategy: find nearest food and go to it
  const nearestFood = findNearestFood(gameState, head);
  
  let targetAngle = player.angle;
  if (nearestFood) {
    const dx = nearestFood.x - head.x;
    const dy = nearestFood.y - head.y;
    targetAngle = Math.atan2(dy, dx);
  }
  
  // Avoid threats
  const threats = findThreats(gameState, head, 50);
  if (threats.length > 0) {
    const threat = threats[0];
    const avoidX = head.x - threat.x;
    const avoidY = head.y - threat.y;
    targetAngle = Math.atan2(avoidY, avoidX);
  }
  
  return {
    targetAngle: targetAngle,
    speedBoost: false,
    useMagnet: false
  };
}

function getCollisionTestAction(gameState) {
  if (!gameState.player || !gameState.player.alive) {
    return { targetAngle: 0, speedBoost: false, useMagnet: false };
  }

  const head = gameState.player.getHead();
  
  // Find nearest AI worm and move toward its body
  const nearestAI = findNearestAIWorm(gameState, head);
  
  if (nearestAI && nearestAI.segments.length > 10) {
    // Target middle segment
    const targetSeg = nearestAI.segments[Math.floor(nearestAI.segments.length / 2)];
    const dx = targetSeg.x - head.x;
    const dy = targetSeg.y - head.y;
    const targetAngle = Math.atan2(dy, dx);
    
    return {
      targetAngle: targetAngle,
      speedBoost: true,
      useMagnet: false
    };
  }
  
  return { targetAngle: gameState.player.angle, speedBoost: false, useMagnet: false };
}

function getPowerUpTestAction(gameState) {
  if (!gameState.player || !gameState.player.alive) {
    return { targetAngle: 0, speedBoost: false, useMagnet: false };
  }

  const head = gameState.player.getHead();
  const player = gameState.player;
  
  // Find nearest powerup
  let nearestPowerup = null;
  let minDist = Infinity;
  
  for (const powerup of gameState.powerups) {
    if (powerup.collected) continue;
    const dist = Math.hypot(powerup.x - head.x, powerup.y - head.y);
    if (dist < minDist) {
      minDist = dist;
      nearestPowerup = powerup;
    }
  }
  
  let targetAngle = player.angle;
  let useMagnet = false;
  let useSpeedBoost = false;
  
  if (nearestPowerup) {
    const dx = nearestPowerup.x - head.x;
    const dy = nearestPowerup.y - head.y;
    targetAngle = Math.atan2(dy, dx);
    useSpeedBoost = minDist > 100 && player.mass > 20;
  } else {
    // Collect food while waiting for powerups
    const food = findNearestFood(gameState, head);
    if (food) {
      const dx = food.x - head.x;
      const dy = food.y - head.y;
      targetAngle = Math.atan2(dy, dx);
    }
    
    // Use magnet if available
    useMagnet = player.powerups.magnet > 0 && !player.magnetActive;
  }
  
  return {
    targetAngle: targetAngle,
    speedBoost: useSpeedBoost,
    useMagnet: useMagnet
  };
}

function getEncirclementTestAction(gameState) {
  if (!gameState.player || !gameState.player.alive) {
    return { targetAngle: 0, speedBoost: false, useMagnet: false };
  }

  const head = gameState.player.getHead();
  const player = gameState.player;
  
  // Find smaller AI to encircle
  const target = findEncirclementTarget(gameState, head);
  
  if (target && player.mass > 40) {
    const dx = target.x - head.x;
    const dy = target.y - head.y;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    
    // Circle around target
    let targetAngle;
    if (dist > 50) {
      // Move toward target
      targetAngle = angle;
    } else {
      // Circle around
      targetAngle = angle + Math.PI / 2;
    }
    
    return {
      targetAngle: targetAngle,
      speedBoost: dist > 80 && player.mass > 50,
      useMagnet: false
    };
  } else {
    // Grow first
    return getBasicTestAction(gameState);
  }
}

function getRandomAction(gameState) {
  if (!gameState.player || !gameState.player.alive) {
    return { targetAngle: 0, speedBoost: false, useMagnet: false };
  }
  
  const randomAngle = Math.random() * Math.PI * 2;
  return {
    targetAngle: randomAngle,
    speedBoost: Math.random() < 0.1,
    useMagnet: Math.random() < 0.05
  };
}

// Helper functions
function findNearestFood(gameState, head) {
  let nearest = null;
  let minDist = Infinity;
  
  for (const food of gameState.food) {
    if (food.collected) continue;
    const dist = Math.hypot(food.x - head.x, food.y - head.y);
    if (dist < minDist) {
      minDist = dist;
      nearest = food;
    }
  }
  
  return nearest;
}

function findBestFood(gameState, head, range) {
  const foods = gameState.food.filter(f => {
    if (f.collected) return false;
    const dist = Math.hypot(f.x - head.x, f.y - head.y);
    return dist < range;
  });
  
  if (foods.length === 0) return findNearestFood(gameState, head);
  
  // Prefer food with higher value closer to us
  foods.sort((a, b) => {
    const distA = Math.hypot(a.x - head.x, a.y - head.y);
    const distB = Math.hypot(b.x - head.x, b.y - head.y);
    const scoreA = a.value / distA;
    const scoreB = b.value / distB;
    return scoreB - scoreA;
  });
  
  return foods[0];
}

function findThreats(gameState, head, range) {
  const threats = [];
  const allWorms = [gameState.player, ...gameState.aiWorms].filter(w => 
    w && w.alive && w !== gameState.player
  );
  
  for (const worm of allWorms) {
    for (let i = 5; i < worm.segments.length; i++) {
      const seg = worm.segments[i];
      const dist = Math.hypot(seg.x - head.x, seg.y - head.y);
      if (dist < range) {
        threats.push(seg);
      }
    }
  }
  
  return threats;
}

function findNearestAIWorm(gameState, head) {
  let nearest = null;
  let minDist = Infinity;
  
  for (const aiWorm of gameState.aiWorms) {
    if (!aiWorm.alive) continue;
    const aiHead = aiWorm.getHead();
    const dist = Math.hypot(aiHead.x - head.x, aiHead.y - head.y);
    if (dist < minDist) {
      minDist = dist;
      nearest = aiWorm;
    }
  }
  
  return nearest;
}

function findEncirclementTarget(gameState, head) {
  // Find smaller AI worms that could be encircled
  const candidates = gameState.aiWorms.filter(w => 
    w.alive && w.mass < gameState.player.mass * 0.7
  );
  
  if (candidates.length === 0) return null;
  
  // Find closest candidate
  let nearest = null;
  let minDist = Infinity;
  
  for (const candidate of candidates) {
    const targetHead = candidate.getHead();
    const dist = Math.hypot(targetHead.x - head.x, targetHead.y - head.y);
    if (dist < minDist && dist < 200) {
      minDist = dist;
      nearest = targetHead;
    }
  }
  
  return nearest;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getCollisionTestAction(gameState);
    case "TEST_4":
      return getPowerUpTestAction(gameState);
    case "TEST_5":
      return getEncirclementTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;