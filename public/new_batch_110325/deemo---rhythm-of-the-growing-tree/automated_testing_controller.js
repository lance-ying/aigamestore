// automated_testing_controller.js - Automated testing strategies
import { 
  NOTE_TYPE_SINGLE,
  NOTE_TYPE_HOLD,
  NOTE_TYPE_SWIPE,
  JUDGMENT_LINE_Y,
  PERFECT_TIMING,
  TREE_HEIGHT_TARGET
} from './globals.js';

function getTestWinAction(gameState) {
  // Optimal strategy to win the game
  const player = gameState.player;
  const notes = gameState.notes;

  // Find the closest note that needs attention
  let targetNote = null;
  let minDistance = Infinity;

  for (const note of notes) {
    if (note.active && !note.hit) {
      const distance = JUDGMENT_LINE_Y - note.y;
      if (distance > -50 && distance < 100) {
        if (distance < minDistance) {
          minDistance = distance;
          targetNote = note;
        }
      }
    }
  }

  const action = { left: false, right: false, hit: false, release: false };

  if (targetNote) {
    // Move to the note's lane
    if (player.lane < targetNote.lane) {
      action.right = true;
    } else if (player.lane > targetNote.lane) {
      action.left = true;
    }

    // Hit the note at perfect timing
    if (player.lane === targetNote.lane) {
      const distance = Math.abs(targetNote.y - JUDGMENT_LINE_Y);
      
      if (targetNote.type === NOTE_TYPE_HOLD) {
        if (!gameState.holdingNote && distance <= PERFECT_TIMING) {
          action.hit = true;
        } else if (gameState.holdingNote === targetNote && targetNote.holdComplete) {
          action.release = true;
        }
      } else if (distance <= PERFECT_TIMING) {
        action.hit = true;
      }
    }
  }

  return action;
}

function getTestBasicAction(gameState) {
  // Basic testing - hit notes with good timing
  const player = gameState.player;
  const notes = gameState.notes;

  let targetNote = null;
  let minDistance = Infinity;

  for (const note of notes) {
    if (note.active && !note.hit && note.lane === player.lane) {
      const distance = Math.abs(note.y - JUDGMENT_LINE_Y);
      if (distance < minDistance && distance < 40) {
        minDistance = distance;
        targetNote = note;
      }
    }
  }

  const action = { left: false, right: false, hit: false, release: false };

  if (targetNote) {
    const distance = Math.abs(targetNote.y - JUDGMENT_LINE_Y);
    if (distance <= 25) {
      action.hit = true;
    }
  } else {
    // Move randomly to test movement
    if (Math.random() < 0.05) {
      if (Math.random() < 0.5) {
        action.left = true;
      } else {
        action.right = true;
      }
    }
  }

  return action;
}

function getTestMovementAction(gameState) {
  // Test movement mechanics
  const player = gameState.player;
  const action = { left: false, right: false, hit: false, release: false };

  // Cycle through lanes
  const targetLane = Math.floor((gameState.framesSinceStart / 60) % 4);
  
  if (player.lane < targetLane) {
    action.right = true;
  } else if (player.lane > targetLane) {
    action.left = true;
  }

  return action;
}

function getRandomAction(gameState) {
  // Random actions for testing
  const action = { left: false, right: false, hit: false, release: false };
  
  const rand = Math.random();
  if (rand < 0.1) {
    action.left = true;
  } else if (rand < 0.2) {
    action.right = true;
  } else if (rand < 0.3) {
    action.hit = true;
  }

  return action;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestMovementAction(gameState);
    case "TEST_4":
      return getRandomAction(gameState);
    default:
      return { left: false, right: false, hit: false, release: false };
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;