// automated_testing_controller.js - Automated testing functions

import { gameState } from './globals.js';

function getTestWinAction(state) {
  // Strategy: Systematically collect coins, solve all mandatory puzzles optimally
  
  // If in puzzle mode, solve the puzzle
  if (state.inPuzzleMode && state.currentPuzzle) {
    const puzzle = state.currentPuzzle;
    
    // Provide optimal answers immediately
    if (state.puzzleInput === "") {
      // Return each character of the answer one at a time
      return { key: puzzle.answer[0], keyCode: puzzle.answer.charCodeAt(0) };
    } else if (state.puzzleInput.length < puzzle.answer.length) {
      const nextChar = puzzle.answer[state.puzzleInput.length];
      return { key: nextChar, keyCode: nextChar.charCodeAt(0) };
    } else {
      // Submit answer
      return { key: ' ', keyCode: 32 };
    }
  }
  
  const player = state.player;
  if (!player) return { key: '', keyCode: 0 };
  
  // Priority 1: Collect nearby hint coins
  const nearestCoin = state.hintCoins.find(coin => !coin.collected);
  if (nearestCoin) {
    const dx = nearestCoin.x - player.x;
    const dy = nearestCoin.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 15) {
      // Move towards coin
      if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? { key: 'ArrowRight', keyCode: 39 } : { key: 'ArrowLeft', keyCode: 37 };
      } else {
        return dy > 0 ? { key: 'ArrowDown', keyCode: 40 } : { key: 'ArrowUp', keyCode: 38 };
      }
    }
  }
  
  // Priority 2: Find and interact with unsolved mandatory puzzles
  const unsolvedHotspot = state.puzzleHotspots.find(h => !h.solved);
  if (unsolvedHotspot) {
    const dx = (unsolvedHotspot.x + unsolvedHotspot.width / 2) - player.x;
    const dy = (unsolvedHotspot.y + unsolvedHotspot.height / 2) - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 40) {
      // Close enough to interact
      return { key: ' ', keyCode: 32 };
    } else {
      // Move towards hotspot
      if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? { key: 'ArrowRight', keyCode: 39 } : { key: 'ArrowLeft', keyCode: 37 };
      } else {
        return dy > 0 ? { key: 'ArrowDown', keyCode: 40 } : { key: 'ArrowUp', keyCode: 38 };
      }
    }
  }
  
  // Default: explore
  return getRandomAction(state);
}

function getTestBasicAction(state) {
  // Test basic movement and interaction
  const player = state.player;
  if (!player) return { key: '', keyCode: 0 };
  
  // Move in a pattern to test all directions
  const frame = state.frameCount % 240;
  
  if (frame < 60) {
    return { key: 'ArrowRight', keyCode: 39 };
  } else if (frame < 120) {
    return { key: 'ArrowDown', keyCode: 40 };
  } else if (frame < 180) {
    return { key: 'ArrowLeft', keyCode: 37 };
  } else {
    return { key: 'ArrowUp', keyCode: 38 };
  }
}

function getRandomAction(state) {
  const actions = [
    { key: 'ArrowLeft', keyCode: 37 },
    { key: 'ArrowRight', keyCode: 39 },
    { key: 'ArrowUp', keyCode: 38 },
    { key: 'ArrowDown', keyCode: 40 },
    { key: ' ', keyCode: 32 }
  ];
  
  const idx = Math.floor(Math.random() * actions.length);
  return actions[idx];
}

export function get_automated_testing_action(state) {
  switch (state.controlMode) {
    case "TEST_1":
      return getTestBasicAction(state);
    case "TEST_2":
      return getTestWinAction(state);
    default:
      return getRandomAction(state);
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;