// automated_testing_controller.js - Automated testing
import { GAME_PHASES, MODES } from './globals.js';

function getTestWinAction(gameState) {
  // Strategy: Search for high-value words systematically
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  // High-value patterns to search
  const searchPatterns = [
    "QUIZ", "QUAY", "JINX", "JACK", "JAZZ", "JOKY", "JOWL", "JURY",
    "ZERO", "ZEST", "ZONE", "ZOOM", "APEX", "WAXY", "VEX*",
    "QU*", "*X*", "*Z*", "*J*", "WH*", "PH*",
    "WATER", "WORLD", "GREAT", "HOUSE", "LIGHT"
  ];
  
  // Switch to search mode if not already
  if (gameState.currentMode !== MODES.SEARCH) {
    return { keyCode: 32, key: ' ' }; // Space to switch mode
  }
  
  // If we have text, clear it
  if (gameState.inputText.length > 0 && gameState.searchResults.length === 0) {
    return { keyCode: 90, key: 'z' }; // Backspace
  }
  
  // Find next pattern to search
  const currentPattern = searchPatterns.find(p => !gameState.inputHistory.includes(p));
  if (currentPattern) {
    // Type next character
    const targetText = currentPattern;
    if (gameState.inputText.length < targetText.length) {
      const nextChar = targetText[gameState.inputText.length];
      if (nextChar === '*' || nextChar === '?') {
        return { keyCode: 56, key: nextChar }; // Special character
      }
      const keyCode = nextChar.charCodeAt(0);
      return { keyCode, key: nextChar };
    }
  }
  
  // Clear and try next pattern
  if (gameState.inputText.length > 0) {
    return { keyCode: 90, key: 'z' };
  }
  
  return null;
}

function getBasicTestAction(gameState) {
  // Test basic functionality
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  const frameCount = gameState.inputHistory.length;
  
  // Test sequence
  if (frameCount < 5) {
    // Type "CAT"
    const word = "CAT";
    if (gameState.inputText.length < word.length) {
      const nextChar = word[gameState.inputText.length];
      return { keyCode: nextChar.charCodeAt(0), key: nextChar };
    }
  } else if (frameCount < 10) {
    // Clear
    if (gameState.inputText.length > 0) {
      return { keyCode: 90, key: 'z' };
    }
  } else if (frameCount < 15) {
    // Switch to anagram mode
    if (gameState.currentMode !== MODES.ANAGRAM) {
      return { keyCode: 32, key: ' ' };
    }
    // Type "CARE"
    const word = "CARE";
    if (gameState.inputText.length < word.length) {
      const nextChar = word[gameState.inputText.length];
      return { keyCode: nextChar.charCodeAt(0), key: nextChar };
    }
  } else if (frameCount < 20) {
    // Navigate results
    return { keyCode: 39, key: 'ArrowRight' };
  }
  
  return null;
}

function getWildcardTestAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  const patterns = ["?AT", "C*T", "*OO*"];
  const patternIndex = Math.floor(gameState.inputHistory.length / 10);
  
  if (patternIndex >= patterns.length) {
    return null;
  }
  
  const pattern = patterns[patternIndex];
  if (gameState.inputText.length < pattern.length) {
    const nextChar = pattern[gameState.inputText.length];
    if (nextChar === '?' || nextChar === '*') {
      return { keyCode: 56, key: nextChar };
    }
    return { keyCode: nextChar.charCodeAt(0), key: nextChar };
  }
  
  // Clear for next pattern
  if (gameState.inputText.length > 0) {
    return { keyCode: 90, key: 'z' };
  }
  
  return null;
}

function getAnagramTestAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  // Switch to anagram mode
  if (gameState.currentMode !== MODES.ANAGRAM) {
    return { keyCode: 32, key: ' ' };
  }
  
  const testWords = ["STONE", "HEART", "DREAM"];
  const wordIndex = Math.floor(gameState.inputHistory.length / 20);
  
  if (wordIndex >= testWords.length) {
    return null;
  }
  
  const word = testWords[wordIndex];
  if (gameState.inputText.length < word.length) {
    const nextChar = word[gameState.inputText.length];
    return { keyCode: nextChar.charCodeAt(0), key: nextChar };
  }
  
  // Clear for next word
  if (gameState.inputText.length > 0) {
    return { keyCode: 90, key: 'z' };
  }
  
  return null;
}

function getRandomAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  const actions = [
    { keyCode: 65 + Math.floor(Math.random() * 26), key: 'A' }, // Random letter
    { keyCode: 90, key: 'z' }, // Backspace
    { keyCode: 32, key: ' ' }, // Switch mode
    { keyCode: 39, key: 'ArrowRight' } // Navigate
  ];
  
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getWildcardTestAction(gameState);
    case "TEST_4":
      return getAnagramTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;