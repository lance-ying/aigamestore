import { gameState } from './globals.js';
import { executeTestAction } from './input.js';

export function updateTestingController(p) {
  if (gameState.controlMode === 'HUMAN') return;
  
  if (gameState.controlMode === 'TEST_1') {
    testBasic(p);
  } else if (gameState.controlMode === 'TEST_2') {
    testWin(p);
  }
}

function testBasic(p) {
  // Basic test: Start game, aim, and fire occasionally
  if (gameState.gamePhase === 'START') {
    if (p.frameCount % 60 === 30) {
      executeTestAction('START', p);
    }
  } else if (gameState.gamePhase === 'PLAYING') {
    // Aim randomly
    if (p.frameCount % 30 === 0) {
      const action = p.random() < 0.5 ? 'LEFT' : 'RIGHT';
      executeTestAction(action, p);
    }
    
    // Fire occasionally
    if (p.frameCount % 20 === 0) {
      executeTestAction('FIRE', p);
    }
    
    // Test pause occasionally
    if (p.frameCount % 300 === 0) {
      executeTestAction('PAUSE', p);
    }
  } else if (gameState.gamePhase === 'PAUSED') {
    if (p.frameCount % 60 === 0) {
      executeTestAction('UNPAUSE', p);
    }
  } else if (gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE') {
    if (p.frameCount % 120 === 0) {
      executeTestAction('RESTART', p);
    }
  }
}

function testWin(p) {
  // Aggressive test to try to win
  if (gameState.gamePhase === 'START') {
    if (p.frameCount % 60 === 30) {
      executeTestAction('START', p);
    }
  } else if (gameState.gamePhase === 'PLAYING') {
    // Find closest fish and aim at it
    if (gameState.fish.length > 0) {
      const cannonX = 300;
      const cannonY = 370;
      
      let closestFish = null;
      let minDist = Infinity;
      
      for (const fish of gameState.fish) {
        const dist = p.dist(cannonX, cannonY, fish.x, fish.y);
        if (dist < minDist) {
          minDist = dist;
          closestFish = fish;
        }
      }
      
      if (closestFish) {
        const targetAngle = p.atan2(closestFish.x - cannonX, cannonY - closestFish.y);
        const targetDegrees = p.degrees(targetAngle);
        const currentAngle = gameState.cannon.angle;
        
        // Aim towards target
        if (Math.abs(targetDegrees - currentAngle) > 5) {
          if (targetDegrees > currentAngle) {
            executeTestAction('RIGHT', p);
          } else {
            executeTestAction('LEFT', p);
          }
        }
        
        // Fire when roughly aimed
        if (Math.abs(targetDegrees - currentAngle) < 15) {
          executeTestAction('FIRE', p);
        }
      }
    }
    
    // Fire more frequently
    if (p.frameCount % 10 === 0) {
      executeTestAction('FIRE', p);
    }
  } else if (gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE') {
    if (p.frameCount % 120 === 0) {
      executeTestAction('RESTART', p);
    }
  }
}