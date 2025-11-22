// automated_testing_controller.js
import { ALIEN_WORDS } from './globals.js';

let testState = {
  currentObjectIndex: 0,
  objectInteractionCount: 0,
  dictionaryEntriesCreated: 0,
  waitFrames: 0,
  testPhase: "interact", // "interact", "dictionary", "wait"
  targetEntries: 10,
  lastAction: null,
  framesSinceLastAction: 0
};

function getTestWinAction(gameState) {
  testState.framesSinceLastAction++;
  
  // Wait between actions for stability
  if (testState.waitFrames > 0) {
    testState.waitFrames--;
    return null;
  }
  
  // Phase 1: Interact with all objects to discover words
  if (testState.testPhase === "interact") {
    if (gameState.dictionaryOpen) {
      testState.testPhase = "dictionary";
      testState.waitFrames = 10;
      return { key: 'z', keyCode: 90 }; // Close dictionary
    }
    
    // Navigate through objects
    if (testState.objectInteractionCount < gameState.entities.length * 2) {
      if (testState.framesSinceLastAction < 20) {
        return null; // Wait between actions
      }
      
      if (testState.objectInteractionCount % 3 === 0) {
        testState.objectInteractionCount++;
        testState.framesSinceLastAction = 0;
        return { key: ' ', keyCode: 32 }; // Interact
      } else if (testState.objectInteractionCount % 3 === 1) {
        testState.objectInteractionCount++;
        testState.framesSinceLastAction = 0;
        return { keyCode: 39 }; // Right arrow
      } else {
        testState.objectInteractionCount++;
        testState.framesSinceLastAction = 0;
        return { keyCode: 37 }; // Left arrow
      }
    } else {
      // Move to dictionary phase
      testState.testPhase = "dictionary";
      testState.waitFrames = 20;
      return { key: 'z', keyCode: 90 }; // Open dictionary
    }
  }
  
  // Phase 2: Create dictionary entries
  if (testState.testPhase === "dictionary") {
    if (!gameState.dictionaryOpen) {
      testState.waitFrames = 10;
      return { key: 'z', keyCode: 90 }; // Open dictionary
    }
    
    // Strategy: Create meaningful translations for critical words
    const criticalWords = [
      { alien: ALIEN_WORDS.escape.alien, translation: "escape" },
      { alien: ALIEN_WORDS.trust.alien, translation: "trust" },
      { alien: ALIEN_WORDS.friend.alien, translation: "friend" },
      { alien: ALIEN_WORDS.help.alien, translation: "help" },
      { alien: ALIEN_WORDS.door.alien, translation: "door" },
      { alien: ALIEN_WORDS.danger.alien, translation: "danger" },
      { alien: ALIEN_WORDS.want.alien, translation: "want" },
      { alien: ALIEN_WORDS.go.alien, translation: "go" },
      { alien: ALIEN_WORDS.give.alien, translation: "give" },
      { alien: ALIEN_WORDS.happy.alien, translation: "happy" }
    ];
    
    if (testState.dictionaryEntriesCreated < criticalWords.length) {
      const entry = criticalWords[testState.dictionaryEntriesCreated];
      
      // Check if already in dictionary
      if (gameState.playerDictionary[entry.alien]) {
        testState.dictionaryEntriesCreated++;
        return null;
      }
      
      // Type alien word
      if (gameState.currentInputWord !== entry.alien) {
        if (gameState.currentInputWord.length < entry.alien.length) {
          const nextChar = entry.alien[gameState.currentInputWord.length];
          testState.waitFrames = 3;
          testState.framesSinceLastAction = 0;
          return { key: nextChar, keyCode: nextChar.charCodeAt(0) };
        } else if (gameState.currentInputWord !== entry.alien) {
          // Clear and restart
          testState.waitFrames = 5;
          return { keyCode: 16 }; // Shift
        }
      }
      
      // Switch to translation mode
      if (gameState.inputMode === "word" && gameState.currentInputWord === entry.alien) {
        testState.waitFrames = 5;
        testState.framesSinceLastAction = 0;
        return { keyCode: 40 }; // Down arrow
      }
      
      // Type translation
      if (gameState.inputMode === "translation" && gameState.currentInputTranslation !== entry.translation) {
        if (gameState.currentInputTranslation.length < entry.translation.length) {
          const nextChar = entry.translation[gameState.currentInputTranslation.length];
          testState.waitFrames = 3;
          testState.framesSinceLastAction = 0;
          return { key: nextChar, keyCode: nextChar.charCodeAt(0) };
        }
      }
      
      // Confirm entry
      if (gameState.currentInputWord === entry.alien && 
          gameState.currentInputTranslation === entry.translation) {
        testState.dictionaryEntriesCreated++;
        testState.waitFrames = 10;
        testState.framesSinceLastAction = 0;
        return { key: ' ', keyCode: 32 }; // Space to confirm
      }
    } else {
      // Done with dictionary, continue game
      testState.testPhase = "continue";
      testState.waitFrames = 10;
      return { key: 'z', keyCode: 90 }; // Close dictionary
    }
  }
  
  // Phase 3: Continue interacting until day 7
  if (testState.testPhase === "continue") {
    if (gameState.currentDay >= 7) {
      testState.testPhase = "complete";
      return null;
    }
    
    // Keep interacting with objects to advance time
    if (testState.framesSinceLastAction > 30) {
      testState.framesSinceLastAction = 0;
      testState.objectInteractionCount++;
      
      if (testState.objectInteractionCount % 2 === 0) {
        return { key: ' ', keyCode: 32 }; // Interact
      } else {
        return { keyCode: 39 }; // Navigate
      }
    }
  }
  
  return null;
}

function getBasicTestAction(gameState) {
  testState.framesSinceLastAction++;
  
  if (testState.waitFrames > 0) {
    testState.waitFrames--;
    return null;
  }
  
  // Simple movement test
  if (testState.framesSinceLastAction > 20) {
    testState.framesSinceLastAction = 0;
    testState.objectInteractionCount++;
    
    const actions = [
      { keyCode: 39 }, // Right
      { keyCode: 37 }, // Left
      { key: ' ', keyCode: 32 }, // Space
      { key: 'z', keyCode: 90 } // Dictionary toggle
    ];
    
    return actions[testState.objectInteractionCount % actions.length];
  }
  
  return null;
}

function getAlternatePathAction(gameState) {
  // Similar to TEST_2 but with opposite interpretations
  testState.framesSinceLastAction++;
  
  if (testState.waitFrames > 0) {
    testState.waitFrames--;
    return null;
  }
  
  if (testState.testPhase === "interact") {
    if (testState.objectInteractionCount < 15 && testState.framesSinceLastAction > 20) {
      testState.objectInteractionCount++;
      testState.framesSinceLastAction = 0;
      
      if (testState.objectInteractionCount % 2 === 0) {
        return { key: ' ', keyCode: 32 };
      } else {
        return { keyCode: 39 };
      }
    } else if (testState.objectInteractionCount >= 15) {
      testState.testPhase = "dictionary";
      testState.waitFrames = 20;
      return { key: 'z', keyCode: 90 };
    }
  }
  
  if (testState.testPhase === "dictionary") {
    if (!gameState.dictionaryOpen) {
      return { key: 'z', keyCode: 90 };
    }
    
    // Opposite interpretations
    const alternateWords = [
      { alien: ALIEN_WORDS.escape.alien, translation: "stay" },
      { alien: ALIEN_WORDS.trust.alien, translation: "doubt" },
      { alien: ALIEN_WORDS.friend.alien, translation: "stranger" },
      { alien: ALIEN_WORDS.help.alien, translation: "abandon" }
    ];
    
    if (testState.dictionaryEntriesCreated < alternateWords.length) {
      const entry = alternateWords[testState.dictionaryEntriesCreated];
      
      if (gameState.playerDictionary[entry.alien]) {
        testState.dictionaryEntriesCreated++;
        return null;
      }
      
      if (gameState.currentInputWord !== entry.alien) {
        if (gameState.currentInputWord.length < entry.alien.length) {
          const nextChar = entry.alien[gameState.currentInputWord.length];
          testState.waitFrames = 3;
          return { key: nextChar, keyCode: nextChar.charCodeAt(0) };
        }
      }
      
      if (gameState.inputMode === "word" && gameState.currentInputWord === entry.alien) {
        testState.waitFrames = 5;
        return { keyCode: 40 };
      }
      
      if (gameState.inputMode === "translation" && gameState.currentInputTranslation !== entry.translation) {
        if (gameState.currentInputTranslation.length < entry.translation.length) {
          const nextChar = entry.translation[gameState.currentInputTranslation.length];
          testState.waitFrames = 3;
          return { key: nextChar, keyCode: nextChar.charCodeAt(0) };
        }
      }
      
      if (gameState.currentInputWord === entry.alien && 
          gameState.currentInputTranslation === entry.translation) {
        testState.dictionaryEntriesCreated++;
        testState.waitFrames = 10;
        return { key: ' ', keyCode: 32 };
      }
    } else {
      testState.testPhase = "continue";
      testState.waitFrames = 10;
      return { key: 'z', keyCode: 90 };
    }
  }
  
  if (testState.testPhase === "continue") {
    if (gameState.currentDay >= 7) {
      testState.testPhase = "complete";
      return null;
    }
    
    if (testState.framesSinceLastAction > 30) {
      testState.framesSinceLastAction = 0;
      return { key: ' ', keyCode: 32 };
    }
  }
  
  return null;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getAlternatePathAction(gameState);
    default:
      return null;
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;