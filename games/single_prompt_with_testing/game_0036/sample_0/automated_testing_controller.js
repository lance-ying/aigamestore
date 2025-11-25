// automated_testing_controller.js - Automated testing strategies

import { gameState } from './globals.js';

let positionHistory = [];
let stuckCounter = 0;
let currentTarget = null;
let actionCooldown = 0;

function isStuck() {
  if (positionHistory.length < 60) return false;
  
  const recent = positionHistory.slice(-60);
  const avgX = recent.reduce((sum, pos) => sum + pos.x, 0) / recent.length;
  const avgY = recent.reduce((sum, pos) => sum + pos.y, 0) / recent.length;
  
  const variance = recent.reduce((sum, pos) => {
    return sum + Math.abs(pos.x - avgX) + Math.abs(pos.y - avgY);
  }, 0) / recent.length;
  
  return variance < 5;
}

function findNearestInteractable(player, type = null) {
  let nearest = null;
  let minDist = Infinity;
  
  for (let obj of gameState.interactables) {
    if (type && obj.type !== type) continue;
    if (obj.cooldown > 0) continue;
    
    const dist = Math.sqrt(
      Math.pow(player.x - obj.x, 2) + 
      Math.pow(player.y - obj.y, 2)
    );
    
    if (dist < minDist) {
      minDist = dist;
      nearest = obj;
    }
  }
  
  return { obj: nearest, dist: minDist };
}

function moveTowards(player, targetX, targetY) {
  const dx = targetX - player.x;
  const dy = targetY - player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist < 5) return null;
  
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  
  if (absDx > absDy) {
    return dx > 0 ? { key: 'ArrowRight', keyCode: 39 } : { key: 'ArrowLeft', keyCode: 37 };
  } else {
    return dy > 0 ? { key: 'ArrowDown', keyCode: 40 } : { key: 'ArrowUp', keyCode: 38 };
  }
}

// TEST_1: Basic movement and interaction test
function getBasicTestAction(gameState) {
  const player = gameState.player;
  if (!player) return null;
  
  positionHistory.push({ x: player.x, y: player.y });
  if (positionHistory.length > 120) positionHistory.shift();
  
  if (actionCooldown > 0) {
    actionCooldown--;
    return moveTowards(player, 300, 200);
  }
  
  // Find and interact with nearest object
  const nearest = findNearestInteractable(player);
  
  if (nearest.obj && nearest.dist < 40) {
    actionCooldown = 200;
    return { key: ' ', keyCode: 32 };
  }
  
  if (nearest.obj) {
    return moveTowards(player, nearest.obj.x, nearest.obj.y);
  }
  
  // Random exploration
  if (!currentTarget || Math.random() < 0.01) {
    currentTarget = {
      x: 100 + Math.random() * 400,
      y: 100 + Math.random() * 200
    };
  }
  
  return moveTowards(player, currentTarget.x, currentTarget.y);
}

// TEST_2: Survival optimization - Win strategy
function getWinAction(gameState) {
  const player = gameState.player;
  if (!player) return null;
  
  positionHistory.push({ x: player.x, y: player.y });
  if (positionHistory.length > 120) positionHistory.shift();
  
  if (actionCooldown > 0) {
    actionCooldown--;
    return null;
  }
  
  // Priority system for survival
  let targetType = null;
  let priority = 0;
  
  // Critical hunger
  if (gameState.hunger < 30 && gameState.foodRations > 0) {
    targetType = "FOOD";
    priority = 10;
  }
  // Low power
  else if (gameState.power < 40) {
    targetType = "SYSTEM";
    priority = 8;
  }
  // Low sanity
  else if (gameState.sanity < 50) {
    targetType = "BED";
    priority = 7;
  }
  // Moderate hunger
  else if (gameState.hunger < 60 && gameState.foodRations > 5) {
    targetType = "FOOD";
    priority = 5;
  }
  // Maintain power
  else if (gameState.power < 70) {
    targetType = "SYSTEM";
    priority = 4;
  }
  // Rest to maintain sanity
  else if (gameState.sanity < 80) {
    targetType = "BED";
    priority = 3;
  }
  
  if (targetType) {
    const nearest = findNearestInteractable(player, targetType);
    
    if (nearest.obj && nearest.dist < 40) {
      actionCooldown = 200;
      return { key: ' ', keyCode: 32 };
    }
    
    if (nearest.obj) {
      return moveTowards(player, nearest.obj.x, nearest.obj.y);
    }
  }
  
  // Default: patrol to maintain awareness
  if (!currentTarget || Math.random() < 0.02) {
    const rooms = [
      { x: 150, y: 100 },
      { x: 420, y: 100 },
      { x: 150, y: 280 },
      { x: 420, y: 280 }
    ];
    currentTarget = rooms[Math.floor(Math.random() * rooms.length)];
  }
  
  return moveTowards(player, currentTarget.x, currentTarget.y);
}

// TEST_3: Sanity degradation test
function getSanityTestAction(gameState) {
  const player = gameState.player;
  if (!player) return null;
  
  positionHistory.push({ x: player.x, y: player.y });
  if (positionHistory.length > 120) positionHistory.shift();
  
  if (actionCooldown > 0) {
    actionCooldown--;
    return null;
  }
  
  // Only maintain hunger and power, avoid sanity restoration
  if (gameState.hunger < 20 && gameState.foodRations > 0) {
    const food = findNearestInteractable(player, "FOOD");
    if (food.obj && food.dist < 40) {
      actionCooldown = 200;
      return { key: ' ', keyCode: 32 };
    }
    if (food.obj) {
      return moveTowards(player, food.obj.x, food.obj.y);
    }
  }
  
  if (gameState.power < 30) {
    const system = findNearestInteractable(player, "SYSTEM");
    if (system.obj && system.dist < 40) {
      actionCooldown = 200;
      return { key: ' ', keyCode: 32 };
    }
    if (system.obj) {
      return moveTowards(player, system.obj.x, system.obj.y);
    }
  }
  
  // Wander aimlessly
  if (!currentTarget || Math.random() < 0.02) {
    currentTarget = {
      x: 100 + Math.random() * 400,
      y: 100 + Math.random() * 200
    };
  }
  
  return moveTowards(player, currentTarget.x, currentTarget.y);
}

function getRandomAction(gameState) {
  const actions = [
    { key: 'ArrowLeft', keyCode: 37 },
    { key: 'ArrowRight', keyCode: 39 },
    { key: 'ArrowUp', keyCode: 38 },
    { key: 'ArrowDown', keyCode: 40 },
    { key: ' ', keyCode: 32 }
  ];
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getWinAction(gameState);
    case "TEST_3":
      return getSanityTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;