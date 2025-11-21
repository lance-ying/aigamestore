// automated_testing_controller.js - Automated testing AI

import { isPrime, getPrimeFactors } from './utils.js';
import { CANVAS_WIDTH } from './globals.js';

function getTestWinAction(gameState) {
  const actions = [];
  
  if (!gameState.player) return actions;
  
  const player = gameState.player;
  const balls = gameState.entities.filter(e => 
    (e.type === 'numberBall' || e.type === 'primeFactorBall') && !e.collected
  );
  
  if (balls.length === 0) return actions;
  
  // Find the closest ball
  let closestBall = null;
  let minDist = Infinity;
  
  balls.forEach(ball => {
    const dist = Math.abs(ball.x - player.x);
    if (dist < minDist) {
      minDist = dist;
      closestBall = ball;
    }
  });
  
  if (!closestBall) return actions;
  
  // Move towards the ball
  const tolerance = 15;
  if (closestBall.x < player.x - tolerance) {
    actions.push(37); // LEFT
  } else if (closestBall.x > player.x + tolerance) {
    actions.push(39); // RIGHT
  }
  
  // Check if ball is in range to interact
  const distanceY = Math.abs(closestBall.y - player.y);
  const distanceX = Math.abs(closestBall.x - player.x);
  
  if (distanceY < 60 && distanceX < 40) {
    if (closestBall.isPrime) {
      // Tap prime number
      actions.push(32); // SPACE
    } else if (closestBall.type === 'numberBall' && !closestBall.sliced) {
      // Slice composite number
      actions.push(90); // Z
    }
  }
  
  return actions;
}

function getTestBasicAction(gameState) {
  const actions = [];
  
  if (!gameState.player) return actions;
  
  const player = gameState.player;
  const primeBalls = gameState.entities.filter(e => 
    (e.type === 'numberBall' || e.type === 'primeFactorBall') && e.isPrime && !e.collected
  );
  
  if (primeBalls.length === 0) {
    // Just move around
    if (Math.random() < 0.5) {
      actions.push(37); // LEFT
    } else {
      actions.push(39); // RIGHT
    }
    return actions;
  }
  
  // Find closest prime ball
  let closestPrime = null;
  let minDist = Infinity;
  
  primeBalls.forEach(ball => {
    const dist = Math.abs(ball.x - player.x);
    if (dist < minDist) {
      minDist = dist;
      closestPrime = ball;
    }
  });
  
  if (!closestPrime) return actions;
  
  // Move towards prime
  const tolerance = 20;
  if (closestPrime.x < player.x - tolerance) {
    actions.push(37); // LEFT
  } else if (closestPrime.x > player.x + tolerance) {
    actions.push(39); // RIGHT
  }
  
  // Try to tap if close
  const distanceY = Math.abs(closestPrime.y - player.y);
  const distanceX = Math.abs(closestPrime.x - player.x);
  
  if (distanceY < 60 && distanceX < 40) {
    actions.push(32); // SPACE
  }
  
  return actions;
}

function getTestPenaltyAction(gameState) {
  const actions = [];
  
  if (!gameState.player) return actions;
  
  const player = gameState.player;
  const compositeBalls = gameState.entities.filter(e => 
    e.type === 'numberBall' && !e.isPrime && !e.sliced && !e.collected
  );
  
  if (compositeBalls.length === 0) {
    // Random movement
    if (Math.random() < 0.5) {
      actions.push(37);
    } else {
      actions.push(39);
    }
    return actions;
  }
  
  // Find closest composite
  let closestComposite = null;
  let minDist = Infinity;
  
  compositeBalls.forEach(ball => {
    const dist = Math.abs(ball.x - player.x);
    if (dist < minDist) {
      minDist = dist;
      closestComposite = ball;
    }
  });
  
  if (!closestComposite) return actions;
  
  // Move towards composite
  if (closestComposite.x < player.x - 20) {
    actions.push(37);
  } else if (closestComposite.x > player.x + 20) {
    actions.push(39);
  }
  
  // Intentionally tap composite (wrong action)
  const distanceY = Math.abs(closestComposite.y - player.y);
  const distanceX = Math.abs(closestComposite.x - player.x);
  
  if (distanceY < 60 && distanceX < 40) {
    actions.push(32); // SPACE - this will cause penalty
  }
  
  return actions;
}

function getRandomAction(gameState) {
  const actions = [];
  const rand = Math.random();
  
  if (rand < 0.3) {
    actions.push(37); // LEFT
  } else if (rand < 0.6) {
    actions.push(39); // RIGHT
  } else if (rand < 0.8) {
    actions.push(32); // SPACE
  } else {
    actions.push(90); // Z
  }
  
  return actions;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestPenaltyAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;