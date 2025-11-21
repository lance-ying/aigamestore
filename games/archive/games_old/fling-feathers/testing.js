// testing.js - Automated testing controllers
import { gameState } from './globals.js';

export function getTestAction(p) {
  const mode = gameState.controlMode;
  
  if (mode === 'TEST_1') {
    return getBasicTestAction(p);
  } else if (mode === 'TEST_2') {
    return getWinTestAction(p);
  }
  
  return null;
}

function getBasicTestAction(p) {
  const frame = p.frameCount;
  
  // Start game
  if (frame === 60 && gameState.gamePhase === 'START') {
    return { type: 'keyPress', keyCode: 13 }; // ENTER
  }
  
  // Launch birds periodically
  if (gameState.gamePhase === 'PLAYING' && gameState.slingshotBird && !gameState.slingshotAiming) {
    if (frame % 300 === 100) {
      return { type: 'keyPress', keyCode: 32 }; // SPACE to aim
    }
  }
  
  // Adjust aim
  if (gameState.slingshotAiming) {
    if (frame % 20 === 0) {
      return { type: 'keyDown', keyCode: 37 }; // LEFT to increase power
    }
    if (frame % 300 === 200) {
      return { type: 'keyRelease', keyCode: 32 }; // Release to launch
    }
  }
  
  return null;
}

function getWinTestAction(p) {
  const frame = p.frameCount;
  
  // Start game
  if (frame === 60 && gameState.gamePhase === 'START') {
    return { type: 'keyPress', keyCode: 13 };
  }
  
  // Aggressive play to win
  if (gameState.gamePhase === 'PLAYING' && gameState.slingshotBird && !gameState.slingshotAiming) {
    if (frame % 200 === 100) {
      return { type: 'keyPress', keyCode: 32 };
    }
  }
  
  if (gameState.slingshotAiming) {
    // Aim strategically
    if (frame % 10 === 0 && gameState.slingshotPullDistance < 100) {
      return { type: 'keyDown', keyCode: 37 }; // Increase power
    }
    
    if (frame % 200 === 180) {
      return { type: 'keyRelease', keyCode: 32 }; // Launch
    }
  }
  
  // Use abilities
  if (gameState.birdInFlight && !gameState.abilityUsed && frame % 50 === 25) {
    return { type: 'keyPress', keyCode: 32 };
  }
  
  return null;
}

export function executeTestAction(p, action) {
  if (!action) return;
  
  if (action.type === 'keyPress') {
    p.keyPressed = () => {};
    p.keyCode = action.keyCode;
    p.key = String.fromCharCode(action.keyCode);
    import('./input.js').then(module => {
      module.handleKeyPressed(p, p.key, p.keyCode);
    });
  } else if (action.type === 'keyRelease') {
    import('./input.js').then(module => {
      module.handleKeyReleased(p, p.key, action.keyCode);
    });
  }
}