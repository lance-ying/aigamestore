// automated_testing_controller.js - Automated testing

import { gameState, GAME_PHASES } from './globals.js';

let testState = {
  positionHistory: [],
  stuckCounter: 0,
  targetDemon: null,
  lastAction: null,
  phaseStartFrame: 0
};

function getTestWinAction(gameState) {
  const player = gameState.player;
  if (!player) return null;
  
  const actions = [];
  
  // Update position history to detect stuck
  testState.positionHistory.push({ x: player.x, y: player.y });
  if (testState.positionHistory.length > 60) {
    testState.positionHistory.shift();
  }
  
  // Check if stuck
  if (testState.positionHistory.length >= 60) {
    const recent = testState.positionHistory.slice(-30);
    const variance = calculateVariance(recent);
    if (variance < 100) {
      testState.stuckCounter++;
      if (testState.stuckCounter > 30) {
        // Try to get unstuck with jump and movement
        actions.push(32); // SPACE
        testState.stuckCounter = 0;
      }
    } else {
      testState.stuckCounter = 0;
    }
  }
  
  // Strategy: Prioritize collecting cards, then eliminate demons
  
  // Find nearest card
  let nearestCard = null;
  let minCardDist = Infinity;
  for (let card of gameState.cards) {
    if (card.active && !card.collected) {
      const dist = Math.hypot(card.x - player.x, card.y - player.y);
      if (dist < minCardDist) {
        minCardDist = dist;
        nearestCard = card;
      }
    }
  }
  
  // Find nearest active demon
  let nearestDemon = null;
  let minDemonDist = Infinity;
  for (let demon of gameState.demons) {
    if (demon.active) {
      const dist = Math.hypot(demon.x - player.x, demon.y - player.y);
      if (dist < minDemonDist) {
        minDemonDist = dist;
        nearestDemon = demon;
      }
    }
  }
  
  // Prioritize cards if close and we don't have many
  let target = null;
  if (nearestCard && (player.inventory.length < 2 || minCardDist < 80)) {
    target = nearestCard;
  } else if (nearestDemon) {
    target = nearestDemon;
  }
  
  // Navigate to target
  if (target) {
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const dist = Math.hypot(dx, dy);
    
    // Aim at target
    const targetAngle = Math.atan2(dy, dx);
    const angleDiff = targetAngle - player.aimAngle;
    
    if (Math.abs(angleDiff) > 0.1) {
      if (angleDiff > 0) {
        actions.push(40); // DOWN
      } else {
        actions.push(38); // UP
      }
    }
    
    // Move towards target
    if (Math.abs(dx) > 20) {
      if (dx > 0) {
        actions.push(39); // RIGHT
      } else {
        actions.push(37); // LEFT
      }
    }
    
    // Jump if target is above or if blocked
    if (dy < -50 && player.grounded) {
      actions.push(32); // SPACE
    }
    
    // Shoot if we have a card and demon is in range
    if (nearestDemon && dist < 150 && player.inventory.length > 0) {
      const card = player.getCurrentCard();
      if (card && card.type.ability === "SHOOT") {
        actions.push(90); // Z to shoot
      }
    }
    
    // Use dash if we have it and demon is in range
    if (nearestDemon && dist < 120 && player.inventory.length > 0) {
      const card = player.getCurrentCard();
      if (card && card.type.ability === "DASH") {
        actions.push(16); // SHIFT
      }
    }
  }
  
  // Head to exit if all demons dead
  if (gameState.demonsKilled >= gameState.totalDemons && gameState.exitPortal) {
    const portal = gameState.exitPortal;
    const dx = portal.x - player.x;
    
    if (Math.abs(dx) > 20) {
      if (dx > 0) {
        actions.push(39); // RIGHT
      } else {
        actions.push(37); // LEFT
      }
    }
    
    // Jump to reach portal if needed
    if (player.y > portal.y && player.grounded) {
      actions.push(32); // SPACE
    }
  }
  
  return actions.length > 0 ? actions : null;
}

function getBasicTestAction(gameState) {
  const player = gameState.player;
  if (!player) return null;
  
  const actions = [];
  const frameCount = gameState.player.p.frameCount;
  
  // Simple movement pattern
  if (frameCount % 120 < 60) {
    actions.push(39); // RIGHT
  } else {
    actions.push(37); // LEFT
  }
  
  // Jump periodically
  if (frameCount % 80 === 0 && player.grounded) {
    actions.push(32); // SPACE
  }
  
  // Shoot if we have cards
  if (frameCount % 30 === 0 && player.inventory.length > 0) {
    actions.push(90); // Z
  }
  
  // Aim randomly
  if (frameCount % 20 === 0) {
    actions.push(Math.random() > 0.5 ? 38 : 40); // UP or DOWN
  }
  
  return actions.length > 0 ? actions : null;
}

function getRandomAction(gameState) {
  const possibleActions = [37, 39, 32, 90, 16, 38, 40];
  const numActions = Math.floor(Math.random() * 2) + 1;
  const actions = [];
  
  for (let i = 0; i < numActions; i++) {
    actions.push(possibleActions[Math.floor(Math.random() * possibleActions.length)]);
  }
  
  return actions.length > 0 ? actions : null;
}

function getParkourTestAction(gameState) {
  const player = gameState.player;
  if (!player) return null;
  
  const actions = [];
  const frameCount = player.p.frameCount;
  
  // Move right and test parkour
  actions.push(39); // RIGHT
  
  // Use cards for parkour abilities
  if (player.inventory.length > 0) {
    const card = player.getCurrentCard();
    
    if (frameCount % 60 === 0) {
      if (card.type.ability === "DASH") {
        actions.push(16); // SHIFT for dash
      } else if (card.type.ability === "DOUBLE_JUMP") {
        actions.push(90); // Z to activate double jump
      }
    }
  }
  
  // Jump regularly
  if (frameCount % 40 === 0) {
    actions.push(32); // SPACE
  }
  
  return actions.length > 0 ? actions : null;
}

function calculateVariance(positions) {
  if (positions.length === 0) return 0;
  
  const avgX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
  const avgY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;
  
  const variance = positions.reduce((sum, p) => {
    return sum + Math.pow(p.x - avgX, 2) + Math.pow(p.y - avgY, 2);
  }, 0) / positions.length;
  
  return variance;
}

export function get_automated_testing_action(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getParkourTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;