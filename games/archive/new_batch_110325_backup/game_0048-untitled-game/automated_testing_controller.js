// automated_testing_controller.js - Automated testing implementation

import { 
  gameState,
  KEY_SPACE,
  KEY_LEFT,
  KEY_RIGHT,
  KEY_Z,
  MODE_SALLY,
  MODE_FATHER,
  PHASE_PLAYING
} from './globals.js';

function getTestBasicAction(state) {
  // Basic testing - simple movement and interactions
  if (state.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  if (state.playMode === MODE_SALLY) {
    // Sally phase - jump when needed
    const player = state.player;
    if (!player) return null;
    
    // Track position to detect if stuck
    if (!state.sallyPosHistory) state.sallyPosHistory = [];
    state.sallyPosHistory.push(player.x);
    if (state.sallyPosHistory.length > 60) {
      state.sallyPosHistory.shift();
    }
    
    // Jump periodically or when on ground
    if (player.onGround && window.gameInstance.frameCount % 40 === 0) {
      return { keyPressed: [KEY_SPACE] };
    }
    
  } else if (state.playMode === MODE_FATHER) {
    // Father phase - activate objects systematically
    const currentFrame = window.gameInstance.frameCount;
    
    // Fast forward through replay
    if (state.currentRecordingFrame < state.sallyRecording.length / 2) {
      return { keyPressed: [KEY_Z] };
    }
    
    // Activate objects at specific intervals
    if (currentFrame % 45 === 0) {
      return { keyPressed: [KEY_SPACE] };
    }
    
    if (currentFrame % 90 === 0) {
      return { keyPressed: [KEY_RIGHT] };
    }
  }
  
  return null;
}

function getTestWinAction(state) {
  // Optimal strategy to win the game
  if (state.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  if (state.playMode === MODE_SALLY) {
    const player = state.player;
    if (!player) return null;
    
    // Track position history
    if (!state.sallyPosHistory) state.sallyPosHistory = [];
    state.sallyPosHistory.push({ x: player.x, y: player.y, frame: window.gameInstance.frameCount });
    if (state.sallyPosHistory.length > 120) {
      state.sallyPosHistory.shift();
    }
    
    // Level-specific jumping strategies
    const level = state.currentLevel;
    
    if (level === 0) {
      // Tutorial level - jump over the gap
      if (player.x > 90 && player.x < 110 && player.onGround) {
        return { keyPressed: [KEY_SPACE] };
      }
    } else if (level === 1) {
      // Level 2 - jump over multiple hazards
      if (player.onGround) {
        // Jump before hazards
        if ((player.x > 130 && player.x < 150) || 
            (player.x > 360 && player.x < 380)) {
          return { keyPressed: [KEY_SPACE] };
        }
      }
    } else if (level === 2) {
      // Level 3 - complex jumps
      if (player.onGround) {
        if ((player.x > 100 && player.x < 120) ||
            (player.x > 170 && player.x < 190) ||
            (player.x > 270 && player.x < 290) ||
            (player.x > 340 && player.x < 360)) {
          return { keyPressed: [KEY_SPACE] };
        }
      }
    }
    
  } else if (state.playMode === MODE_FATHER) {
    const currentFrame = window.gameInstance.frameCount;
    const recordingFrame = state.currentRecordingFrame;
    const level = state.currentLevel;
    
    // Level-specific activation strategies
    if (level === 0) {
      // Tutorial - activate bridge when Sally approaches
      if (recordingFrame > 20 && recordingFrame < 40 && state.lastActionFrame < currentFrame - 10) {
        return { keyPressed: [KEY_SPACE] };
      }
    } else if (level === 1) {
      // Level 2 - activate platforms before Sally reaches hazards
      if (recordingFrame > 30 && recordingFrame < 50 && state.selectedObjectIndex === 0) {
        const result = { keyPressed: [KEY_SPACE] };
        state.lastActionFrame = currentFrame;
        return result;
      }
      if (recordingFrame > 50 && recordingFrame < 55 && state.selectedObjectIndex === 0) {
        return { keyPressed: [KEY_RIGHT] };
      }
      if (recordingFrame > 100 && recordingFrame < 120 && state.selectedObjectIndex === 1) {
        return { keyPressed: [KEY_SPACE] };
      }
    } else if (level === 2) {
      // Level 3 - complex timing
      if (recordingFrame > 25 && recordingFrame < 45 && state.selectedObjectIndex === 0) {
        const result = { keyPressed: [KEY_SPACE] };
        state.lastActionFrame = currentFrame;
        return result;
      }
      if (recordingFrame > 45 && recordingFrame < 50) {
        return { keyPressed: [KEY_RIGHT] };
      }
      if (recordingFrame > 80 && recordingFrame < 100 && state.selectedObjectIndex === 1) {
        return { keyPressed: [KEY_SPACE] };
      }
    }
    
    // Fast forward when no actions needed
    if (recordingFrame < state.sallyRecording.length * 0.3 || 
        recordingFrame > state.sallyRecording.length * 0.8) {
      return { keyPressed: [KEY_Z] };
    }
  }
  
  return null;
}

function getRandomAction(state) {
  if (state.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  const rand = Math.random();
  
  if (state.playMode === MODE_SALLY) {
    if (rand < 0.1) {
      return { keyPressed: [KEY_SPACE] };
    }
  } else if (state.playMode === MODE_FATHER) {
    if (rand < 0.05) {
      return { keyPressed: [KEY_SPACE] };
    } else if (rand < 0.08) {
      return { keyPressed: [KEY_RIGHT] };
    } else if (rand < 0.11) {
      return { keyPressed: [KEY_LEFT] };
    }
  }
  
  return null;
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
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;