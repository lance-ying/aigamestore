import { gameState, LEVELS } from './globals.js';

export function getTestingAction(p) {
  if (gameState.controlMode === "TEST_1") {
    return getBasicTestAction(p);
  } else if (gameState.controlMode === "TEST_2") {
    return getWinTestAction(p);
  }
  return null;
}

function getBasicTestAction(p) {
  // Basic testing: Start game and try some actions
  if (gameState.gamePhase === "START") {
    if (p.frameCount > 60) {
      return { keyCode: 13 }; // ENTER to start
    }
  } else if (gameState.gamePhase === "PLAYING") {
    // Try moving around with arrow keys
    if (p.frameCount % 30 === 0) {
      const actions = [38, 40, 37, 39]; // Arrow keys
      return { keyCode: actions[Math.floor(p.frameCount / 30) % actions.length] };
    }
    
    // Try hint
    if (p.frameCount % 300 === 0 && gameState.availableHints > 0) {
      return { keyCode: 32 }; // SPACE for hint
    }
    
    // Try pause
    if (p.frameCount === 500) {
      return { keyCode: 27 }; // ESC to pause
    }
  } else if (gameState.gamePhase === "PAUSED") {
    if (p.frameCount > 520) {
      return { keyCode: 27 }; // ESC to resume
    }
  }
  
  return null;
}

function getWinTestAction(p) {
  // Auto-complete game by finding all words
  if (gameState.gamePhase === "START") {
    if (p.frameCount > 30) {
      return { keyCode: 13 }; // ENTER to start
    }
  } else if (gameState.gamePhase === "PLAYING") {
    // Auto-find words
    if (p.frameCount % 60 === 0) {
      autoFindNextWord();
    }
  } else if (gameState.gamePhase === "LEVEL_COMPLETE") {
    if (p.frameCount % 120 === 0) {
      return { keyCode: 13 }; // ENTER to next level
    }
  } else if (gameState.gamePhase === "GAME_OVER_WIN") {
    // Game won, do nothing
  }
  
  return null;
}

function autoFindNextWord() {
  // Find first unfound word and mark it as found
  for (const wordObj of gameState.targetWords) {
    if (!wordObj.found) {
      wordObj.found = true;
      gameState.foundWords.push(wordObj.word);
      gameState.score += 50;
      
      // Check if all words found
      let allFound = true;
      for (const word of gameState.targetWords) {
        if (!word.found) {
          allFound = false;
          break;
        }
      }
      
      if (allFound) {
        const elapsedTime = Math.floor((Date.now() - gameState.levelStartTime) / 1000);
        const timeBonus = Math.max(0, Math.floor(500 - (elapsedTime * 1.5)));
        gameState.score += timeBonus + 100;
        gameState.gamePhase = "LEVEL_COMPLETE";
      }
      
      break;
    }
  }
}