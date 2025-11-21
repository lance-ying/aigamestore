// automated_testing_controller.js
import {
  gameState,
  KEY_SPACE,
  KEY_LEFT,
  KEY_RIGHT,
  KEY_SHIFT,
  KEY_Z,
  TIMELINE_PAST,
  TIMELINE_FUTURE,
  PHASE_PLAYING
} from './globals.js';

let actionHistory = [];
let stuckCounter = 0;
let lastAction = null;
let testPhase = 0;

function getTestWinAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) return null;
  
  const currentChapter = gameState.currentChapter;
  
  // Chapter 1 solution sequence
  if (currentChapter === 1) {
    return solveChapter1();
  }
  
  // Chapter 2 solution sequence
  if (currentChapter === 2) {
    return solveChapter2();
  }
  
  return null;
}

function solveChapter1() {
  // Phase 0: Go to Past and examine book
  if (testPhase === 0) {
    if (gameState.currentTimeline !== TIMELINE_PAST) {
      testPhase = 1;
      return KEY_SHIFT;
    }
    // Select book (index 0)
    if (gameState.selectedObjectIndex !== 0) {
      return gameState.selectedObjectIndex < 0 ? KEY_RIGHT : KEY_LEFT;
    }
    // Examine book
    testPhase = 1;
    return KEY_SPACE;
  }
  
  // Phase 1: Collect key in Past
  if (testPhase === 1) {
    if (gameState.currentTimeline !== TIMELINE_PAST) {
      return KEY_SHIFT;
    }
    // Select key (index 2)
    if (gameState.selectedObjectIndex !== 2) {
      return gameState.selectedObjectIndex < 2 ? KEY_RIGHT : KEY_LEFT;
    }
    // Collect key
    const hasKey = gameState.inventory.some(item => item.id === "key");
    if (!hasKey) {
      return KEY_SPACE;
    }
    testPhase = 2;
    return KEY_SPACE;
  }
  
  // Phase 2: Use key on box in Past
  if (testPhase === 2) {
    if (gameState.currentTimeline !== TIMELINE_PAST) {
      return KEY_SHIFT;
    }
    // Select box (index 1)
    if (gameState.selectedObjectIndex !== 1) {
      return gameState.selectedObjectIndex < 1 ? KEY_RIGHT : KEY_LEFT;
    }
    // Use key on box
    testPhase = 3;
    return KEY_Z;
  }
  
  // Phase 3: Interact with box to get artifact
  if (testPhase === 3) {
    if (gameState.currentTimeline !== TIMELINE_PAST) {
      return KEY_SHIFT;
    }
    if (gameState.selectedObjectIndex !== 1) {
      return gameState.selectedObjectIndex < 1 ? KEY_RIGHT : KEY_LEFT;
    }
    testPhase = 4;
    return KEY_SPACE;
  }
  
  // Phase 4: Switch to Future and activate console
  if (testPhase === 4) {
    if (gameState.currentTimeline !== TIMELINE_FUTURE) {
      testPhase = 5;
      return KEY_SHIFT;
    }
  }
  
  // Phase 5: Activate console
  if (testPhase === 5) {
    if (gameState.currentTimeline !== TIMELINE_FUTURE) {
      return KEY_SHIFT;
    }
    // Select console (index 0)
    if (gameState.selectedObjectIndex !== 0) {
      return gameState.selectedObjectIndex < 0 ? KEY_RIGHT : KEY_LEFT;
    }
    testPhase = 6;
    return KEY_SPACE;
  }
  
  // Phase 6: Check door opened
  if (testPhase === 6) {
    if (gameState.currentChapter === 2) {
      testPhase = 0; // Move to chapter 2
      return null;
    }
  }
  
  return null;
}

function solveChapter2() {
  // Phase 0: Examine painting in Past
  if (testPhase === 0) {
    if (gameState.currentTimeline !== TIMELINE_PAST) {
      return KEY_SHIFT;
    }
    // Select painting (index 0)
    if (gameState.selectedObjectIndex !== 0) {
      return gameState.selectedObjectIndex < 0 ? KEY_RIGHT : KEY_LEFT;
    }
    testPhase = 1;
    return KEY_SPACE;
  }
  
  // Phase 1: Solve dial in Past
  if (testPhase === 1) {
    if (gameState.currentTimeline !== TIMELINE_PAST) {
      return KEY_SHIFT;
    }
    // Select dial (index 1)
    if (gameState.selectedObjectIndex !== 1) {
      return gameState.selectedObjectIndex < 1 ? KEY_RIGHT : KEY_LEFT;
    }
    testPhase = 2;
    return KEY_SPACE;
  }
  
  // Phase 2: Open chest in Past
  if (testPhase === 2) {
    if (gameState.currentTimeline !== TIMELINE_PAST) {
      return KEY_SHIFT;
    }
    // Select chest (index 2)
    if (gameState.selectedObjectIndex !== 2) {
      return gameState.selectedObjectIndex < 2 ? KEY_RIGHT : KEY_LEFT;
    }
    testPhase = 3;
    return KEY_SPACE;
  }
  
  // Phase 3: Switch to Future
  if (testPhase === 3) {
    if (gameState.currentTimeline !== TIMELINE_FUTURE) {
      testPhase = 4;
      return KEY_SHIFT;
    }
  }
  
  // Phase 4: Activate portal in Future
  if (testPhase === 4) {
    if (gameState.currentTimeline !== TIMELINE_FUTURE) {
      return KEY_SHIFT;
    }
    // Select portal (index 1)
    if (gameState.selectedObjectIndex !== 1) {
      return gameState.selectedObjectIndex < 1 ? KEY_RIGHT : KEY_LEFT;
    }
    testPhase = 5;
    return KEY_SPACE;
  }
  
  return null;
}

function getBasicTestAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) return null;
  
  // Cycle through objects and interact
  if (gameState.framesSinceLastAction > 30) {
    const action = Math.floor(Math.random() * 4);
    switch (action) {
      case 0: return KEY_RIGHT;
      case 1: return KEY_SPACE;
      case 2: return KEY_SHIFT;
      case 3: return KEY_Z;
    }
  }
  
  return null;
}

function getTimelineSyncTest(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) return null;
  
  // Alternate between timelines and interact
  if (gameState.framesSinceLastAction > 40) {
    if (Math.random() < 0.3) {
      return KEY_SHIFT;
    }
    if (Math.random() < 0.5) {
      return KEY_SPACE;
    }
    return Math.random() < 0.5 ? KEY_LEFT : KEY_RIGHT;
  }
  
  return null;
}

function getRandomAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) return null;
  
  if (Math.random() < 0.02) {
    const actions = [KEY_LEFT, KEY_RIGHT, KEY_SPACE, KEY_SHIFT, KEY_Z];
    return actions[Math.floor(Math.random() * actions.length)];
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
      return getTimelineSyncTest(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;