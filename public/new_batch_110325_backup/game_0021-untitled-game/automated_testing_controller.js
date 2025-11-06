// automated_testing_controller.js - Automated testing functions
import { isPrime, getPrimeFactors } from './utils.js';

function getRandomAction(gameState) {
  const actions = [];
  
  if (Math.random() < 0.7) {
    const choice = Math.floor(Math.random() * 4);
    if (choice === 0) actions.push("ArrowLeft");
    else if (choice === 1) actions.push("ArrowRight");
    else if (choice === 2) actions.push("ArrowUp");
    else actions.push("ArrowDown");
  }
  
  if (Math.random() < 0.1) {
    actions.push(Math.random() < 0.5 ? "Space" : "KeyZ");
  }
  
  return actions;
}

function getTestBasicAction(gameState) {
  const actions = [];
  
  if (!gameState.cursor) return actions;
  
  // Find closest number
  let closestNum = null;
  let closestDist = Infinity;
  
  for (const num of gameState.numbers) {
    const dist = Math.sqrt(
      Math.pow(num.x - gameState.cursor.x, 2) + 
      Math.pow(num.y - gameState.cursor.y, 2)
    );
    if (dist < closestDist) {
      closestDist = dist;
      closestNum = num;
    }
  }
  
  // Move toward it
  if (closestNum) {
    const dx = closestNum.x - gameState.cursor.x;
    const dy = closestNum.y - gameState.cursor.y;
    
    if (Math.abs(dx) > 5) {
      actions.push(dx > 0 ? "ArrowRight" : "ArrowLeft");
    }
    if (Math.abs(dy) > 5) {
      actions.push(dy > 0 ? "ArrowDown" : "ArrowUp");
    }
    
    // Try to interact if close
    if (closestDist < 30) {
      if (Math.random() < 0.3) {
        actions.push(Math.random() < 0.5 ? "Space" : "KeyZ");
      }
    }
  }
  
  return actions;
}

function getTestWinAction(gameState) {
  const actions = [];
  
  if (!gameState.cursor) return actions;
  
  // Priority system: prime factors > high value primes > composites to cut
  
  // Check for prime factors to tap
  let bestFactor = null;
  let bestFactorDist = Infinity;
  
  for (const entity of gameState.entities) {
    if (entity.settled) {
      const dist = Math.sqrt(
        Math.pow(entity.x - gameState.cursor.x, 2) + 
        Math.pow(entity.y - gameState.cursor.y, 2)
      );
      if (dist < bestFactorDist) {
        bestFactorDist = dist;
        bestFactor = entity;
      }
    }
  }
  
  if (bestFactor && bestFactorDist < 40) {
    actions.push("Space");
    return actions;
  }
  
  // Find best target number
  let bestTarget = null;
  let bestScore = -Infinity;
  
  for (const num of gameState.numbers) {
    // Calculate value score
    let score = 0;
    
    if (isPrime(num.value)) {
      // High value primes are great
      score = num.value * 1.5;
    } else if (!num.isCut) {
      // Composites to cut - score based on sum of factors
      const factors = getPrimeFactors(num.value);
      const factorSum = factors.reduce((a, b) => a + b, 0);
      score = factorSum;
    } else {
      continue; // Already cut
    }
    
    // Penalty for distance and falling progress
    const dist = Math.sqrt(
      Math.pow(num.x - gameState.cursor.x, 2) + 
      Math.pow(num.y - gameState.cursor.y, 2)
    );
    const heightPenalty = num.y * 0.5; // Prioritize numbers higher up
    
    score = score - dist * 0.1 - heightPenalty * 0.05;
    
    if (score > bestScore) {
      bestScore = score;
      bestTarget = num;
    }
  }
  
  if (bestTarget) {
    const dx = bestTarget.x - gameState.cursor.x;
    const dy = bestTarget.y - gameState.cursor.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Move toward target
    if (Math.abs(dx) > 10) {
      actions.push(dx > 0 ? "ArrowRight" : "ArrowLeft");
    }
    if (Math.abs(dy) > 10) {
      actions.push(dy > 0 ? "ArrowDown" : "ArrowUp");
    }
    
    // Use speed boost if far
    if (dist > 50) {
      actions.push("Shift");
    }
    
    // Interact when close
    if (dist < 30) {
      if (isPrime(bestTarget.value)) {
        actions.push("Space");
      } else if (!bestTarget.isCut) {
        actions.push("KeyZ");
      }
    }
  } else if (bestFactor) {
    // Move toward factor if no good numbers
    const dx = bestFactor.x - gameState.cursor.x;
    const dy = bestFactor.y - gameState.cursor.y;
    
    if (Math.abs(dx) > 5) {
      actions.push(dx > 0 ? "ArrowRight" : "ArrowLeft");
    }
    if (Math.abs(dy) > 5) {
      actions.push(dy > 0 ? "ArrowDown" : "ArrowUp");
    }
  }
  
  return actions;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;