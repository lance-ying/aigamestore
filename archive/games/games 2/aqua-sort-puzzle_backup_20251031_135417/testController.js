// testController.js - Automated testing controllers

import { gameState, GAME_PHASES } from './globals.js';
import { handleKeyPressed } from './input.js';

export function getTestAction(p) {
  if (gameState.controlMode === 'HUMAN') {
    return null;
  }
  
  if (gameState.controlMode === 'TEST_1') {
    return getTest1Action(p);
  }
  
  if (gameState.controlMode === 'TEST_2') {
    return getTest2Action(p);
  }
  
  return null;
}

function getTest1Action(p) {
  // Basic testing: Navigate and attempt pours to demonstrate gameplay
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (p.frameCount % 60 === 30) {
      return { keyCode: 13 }; // ENTER to start
    }
  }
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING && !gameState.isAnimating) {
    const cycle = Math.floor(p.frameCount / 40) % 10;
    
    // Demonstrate navigation
    if (cycle === 0) {
      return { keyCode: 39 }; // Arrow right
    } else if (cycle === 1) {
      return { keyCode: 39 }; // Arrow right
    } else if (cycle === 2) {
      return { keyCode: 37 }; // Arrow left
    } else if (cycle === 3) {
      return { keyCode: 32 }; // Space - select
    } else if (cycle === 4) {
      return { keyCode: 39 }; // Arrow right to destination
    } else if (cycle === 5) {
      return { keyCode: 32 }; // Space - pour
    } else if (cycle === 7) {
      return { keyCode: 90 }; // Z - undo to demonstrate
    }
  }
  
  if (gameState.gamePhase === GAME_PHASES.LEVEL_COMPLETE) {
    if (p.frameCount % 60 === 0) {
      return { keyCode: 32 }; // Space to continue
    }
  }
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE || 
      gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    if (p.frameCount % 120 === 0) {
      return { keyCode: 82 }; // R to restart
    }
  }
  
  return null;
}

function getTest2Action(p) {
  // Winning strategy for Level 1
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (p.frameCount % 60 === 30) {
      return { keyCode: 13 }; // ENTER to start
    }
  }
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING && !gameState.isAnimating) {
    // Wait a bit between moves for visibility
    if (p.frameCount % 45 !== 0) {
      return null;
    }
    
    const moves = gameState.levelMovesMade;
    
    // Winning sequence for Level 1
    // Initial state:
    // Tube 0: [red, blue, green, red]
    // Tube 1: [blue, green, red, blue]
    // Tube 2: [green, red, blue, green]
    // Tube 3: []
    
    if (moves === 0) {
      // Select tube 0
      gameState.highlightedTubeIndex = 0;
      return { keyCode: 32 };
    } else if (moves === 1) {
      // Pour to tube 3 (empty) - moves red
      gameState.highlightedTubeIndex = 3;
      return { keyCode: 32 };
    } else if (moves === 2) {
      // Select tube 1
      gameState.highlightedTubeIndex = 1;
      return { keyCode: 32 };
    } else if (moves === 3) {
      // Pour to tube 0 - blue to blue
      gameState.highlightedTubeIndex = 0;
      return { keyCode: 32 };
    } else if (moves === 4) {
      // Select tube 2
      gameState.highlightedTubeIndex = 2;
      return { keyCode: 32 };
    } else if (moves === 5) {
      // Pour to tube 1 - green to green
      gameState.highlightedTubeIndex = 1;
      return { keyCode: 32 };
    } else if (moves === 6) {
      // Select tube 2
      gameState.highlightedTubeIndex = 2;
      return { keyCode: 32 };
    } else if (moves === 7) {
      // Pour to tube 3 - red to red
      gameState.highlightedTubeIndex = 3;
      return { keyCode: 32 };
    } else if (moves === 8) {
      // Select tube 2
      gameState.highlightedTubeIndex = 2;
      return { keyCode: 32 };
    } else if (moves === 9) {
      // Pour to tube 0 - blue to blue
      gameState.highlightedTubeIndex = 0;
      return { keyCode: 32 };
    } else {
      // Try to find any valid move
      for (let i = 0; i < gameState.tubes.length; i++) {
        if (gameState.tubes[i].isEmpty() || gameState.tubes[i].isSorted()) continue;
        
        for (let j = 0; j < gameState.tubes.length; j++) {
          if (i !== j && gameState.tubes[i].canPourInto(gameState.tubes[j])) {
            if (gameState.selectedTubeIndex === -1) {
              gameState.highlightedTubeIndex = i;
              return { keyCode: 32 };
            } else {
              gameState.highlightedTubeIndex = j;
              return { keyCode: 32 };
            }
          }
        }
      }
    }
  }
  
  if (gameState.gamePhase === GAME_PHASES.LEVEL_COMPLETE) {
    if (p.frameCount % 60 === 0) {
      return { keyCode: 32 }; // Space to continue
    }
  }
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    if (p.frameCount % 120 === 0) {
      return { keyCode: 82 }; // R to restart
    }
  }
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    if (p.frameCount % 120 === 0) {
      return { keyCode: 82 }; // R to restart
    }
  }
  
  return null;
}

export function applyTestAction(action, p) {
  if (!action) return;
  
  // Simulate key press
  p.keyCode = action.keyCode;
  p.key = String.fromCharCode(action.keyCode);
  
  // Call the key handler directly
  handleKeyPressed(p);
}