// automated_testing_controller.js - Automated testing functions

import {
  gameState,
  PHASE_PLAYING,
  TARGET_RADIUS,
  PERFECT_RANGE,
  NOTE_TYPE_HOLD
} from './globals.js';

function getTestWinAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return [];
  }

  const actions = [];
  const tolerance = PERFECT_RANGE;
  
  // Find notes that are close to the target zone
  gameState.notes.forEach(note => {
    if (!note.hit && !note.missed && note.alive) {
      const distFromTarget = Math.abs(note.distance - TARGET_RADIUS);
      
      if (note.type === NOTE_TYPE_HOLD) {
        // For hold notes, press when they enter the zone and hold
        if (distFromTarget <= tolerance && !note.isBeingHeld) {
          if (!actions.includes(note.requiredKey)) {
            actions.push(note.requiredKey);
          }
        } else if (note.isBeingHeld && note.holdProgress >= note.holdDuration * 0.95) {
          // Release when almost complete (handled by not including in actions)
        } else if (note.isBeingHeld) {
          // Continue holding
          if (!actions.includes(note.requiredKey)) {
            actions.push(note.requiredKey);
          }
        }
      } else {
        // For regular notes, hit when within perfect range
        if (distFromTarget <= tolerance) {
          if (note.requiredKey !== null && !actions.includes(note.requiredKey)) {
            actions.push(note.requiredKey);
          }
        }
      }
    }
  });
  
  return actions;
}

function getBasicTestAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return [];
  }

  const actions = [];
  const cycleKeys = [32, 37, 38, 39, 40, 90, 16]; // Space, Arrows, Z, Shift
  
  // Cycle through keys based on frame count
  const keyIndex = Math.floor(gameState.songProgress / 30) % cycleKeys.length;
  const randomChance = Math.random();
  
  if (randomChance < 0.3) {
    actions.push(cycleKeys[keyIndex]);
  }
  
  // Look for notes and try to hit them
  if (gameState.notes.length > 0) {
    const closestNote = gameState.notes.reduce((closest, note) => {
      if (!note.hit && !note.missed && note.alive) {
        const dist = Math.abs(note.distance - TARGET_RADIUS);
        const closestDist = closest ? Math.abs(closest.distance - TARGET_RADIUS) : Infinity;
        return dist < closestDist ? note : closest;
      }
      return closest;
    }, null);
    
    if (closestNote) {
      const distFromTarget = Math.abs(closestNote.distance - TARGET_RADIUS);
      if (distFromTarget < 60 && closestNote.requiredKey !== null) {
        if (!actions.includes(closestNote.requiredKey)) {
          actions.push(closestNote.requiredKey);
        }
      }
    }
  }
  
  return actions;
}

function getRandomAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return [];
  }

  const actions = [];
  const allKeys = [32, 37, 38, 39, 40, 90, 16];
  
  if (Math.random() < 0.2) {
    const randomKey = allKeys[Math.floor(Math.random() * allKeys.length)];
    actions.push(randomKey);
  }
  
  return actions;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
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