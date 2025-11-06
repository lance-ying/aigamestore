// automated_testing_controller.js
import { gameState, GAME_PHASES } from './globals.js';

let lastPositions = [];
let stuckCounter = 0;
let currentTargetEvidence = 0;

function getTestWinAction(gameState) {
  const action = { keys: [], space: false, fire: false, slowMo: false };
  
  if (gameState.gamePhase === GAME_PHASES.INVESTIGATION) {
    // Collect all evidence systematically
    const uncollected = gameState.evidencePoints.filter(e => !e.collected);
    
    if (uncollected.length > 0) {
      const target = uncollected[0];
      const player = gameState.player;
      
      const dx = target.x - player.x;
      const dy = target.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 40) {
        action.space = true;
      } else {
        // Move towards target
        if (Math.abs(dx) > Math.abs(dy)) {
          action.keys.push(dx > 0 ? 39 : 37); // Right or Left
        } else {
          action.keys.push(dy > 0 ? 40 : 38); // Down or Up
        }
      }
    }
  } 
  else if (gameState.gamePhase === GAME_PHASES.CLASS_TRIAL) {
    // Find lies and shoot them
    let shouldFire = false;
    let shouldSlowMo = false;
    
    // Look for lies in the center area
    gameState.trialStatements.forEach(statement => {
      if (statement.isLie && !statement.hit) {
        const inFireZone = statement.x > 200 && statement.x < 400;
        if (inFireZone) {
          shouldFire = true;
          
          // Use slow-mo if multiple lies are present
          const activeLies = gameState.trialStatements.filter(s => 
            s.isLie && !s.hit && s.x > 0 && s.x < 600
          ).length;
          
          if (activeLies > 2 && gameState.slowMoCharges > 0 && !gameState.slowMoActive) {
            shouldSlowMo = true;
          }
        }
      }
    });
    
    action.fire = shouldFire;
    action.slowMo = shouldSlowMo;
  }
  
  return action;
}

function getBasicTestAction(gameState) {
  const action = { keys: [], space: false, fire: false, slowMo: false };
  
  if (gameState.gamePhase === GAME_PHASES.INVESTIGATION) {
    // Move around and collect evidence
    const player = gameState.player;
    
    // Track position to detect stuck
    lastPositions.push({ x: player.x, y: player.y });
    if (lastPositions.length > 30) {
      lastPositions.shift();
    }
    
    // Check if stuck
    if (lastPositions.length >= 30) {
      const avgX = lastPositions.reduce((sum, p) => sum + p.x, 0) / lastPositions.length;
      const avgY = lastPositions.reduce((sum, p) => sum + p.y, 0) / lastPositions.length;
      const variance = Math.sqrt(
        Math.pow(player.x - avgX, 2) + Math.pow(player.y - avgY, 2)
      );
      
      if (variance < 10) {
        stuckCounter++;
      } else {
        stuckCounter = 0;
      }
    }
    
    // Find nearest evidence
    const uncollected = gameState.evidencePoints.filter(e => !e.collected);
    if (uncollected.length > 0) {
      const nearest = uncollected.reduce((closest, e) => {
        const dist = Math.sqrt(
          Math.pow(e.x - player.x, 2) + 
          Math.pow(e.y - player.y, 2)
        );
        return dist < closest.dist ? { evidence: e, dist } : closest;
      }, { evidence: null, dist: Infinity });
      
      if (nearest.dist < 40) {
        action.space = true;
      } else {
        const dx = nearest.evidence.x - player.x;
        const dy = nearest.evidence.y - player.y;
        
        if (Math.abs(dx) > 5) {
          action.keys.push(dx > 0 ? 39 : 37);
        }
        if (Math.abs(dy) > 5) {
          action.keys.push(dy > 0 ? 40 : 38);
        }
      }
    }
  }
  else if (gameState.gamePhase === GAME_PHASES.CLASS_TRIAL) {
    // Simple strategy: fire at any statement in range
    const hasLieInRange = gameState.trialStatements.some(s => 
      s.isLie && !s.hit && s.x > 250 && s.x < 350
    );
    
    if (hasLieInRange) {
      action.fire = true;
    }
  }
  
  return action;
}

function getRandomAction(gameState) {
  const action = { keys: [], space: false, fire: false, slowMo: false };
  
  if (gameState.gamePhase === GAME_PHASES.INVESTIGATION) {
    // Random movement
    const rand = Math.random();
    if (rand < 0.25) action.keys.push(37); // Left
    else if (rand < 0.5) action.keys.push(39); // Right
    else if (rand < 0.75) action.keys.push(38); // Up
    else action.keys.push(40); // Down
    
    if (Math.random() < 0.1) {
      action.space = true;
    }
  }
  else if (gameState.gamePhase === GAME_PHASES.CLASS_TRIAL) {
    if (Math.random() < 0.15) {
      action.fire = true;
    }
    if (Math.random() < 0.05) {
      action.slowMo = true;
    }
  }
  
  return action;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getRandomAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;