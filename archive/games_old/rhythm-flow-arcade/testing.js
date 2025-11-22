// testing.js - Automated testing controllers

import { gameState } from './globals.js';
import { handleNoteHit } from './gameplay.js';

export function updateTestController(p) {
  if (gameState.controlMode === 'HUMAN') return;
  
  if (gameState.controlMode === 'TEST_1') {
    testController1(p);
  } else if (gameState.controlMode === 'TEST_2') {
    testController2(p);
  }
}

// Basic testing - random key presses
function testController1(p) {
  if (gameState.gamePhase === 'START') {
    // Auto-start
    if (p.frameCount % 120 === 0) {
      simulateKeyPress(p, 13); // ENTER
    }
  } else if (gameState.gamePhase === 'PLAYING') {
    // Random key presses
    if (p.frameCount % 30 === 0) {
      const lane = Math.floor(Math.random() * 4);
      const keyCode = gameState.keyBindings[lane];
      simulateKeyPress(p, keyCode);
    }
  }
}

// Win testing - perfect play
function testController2(p) {
  if (gameState.gamePhase === 'START') {
    // Auto-start
    if (p.frameCount % 120 === 0) {
      simulateKeyPress(p, 13); // ENTER
    }
  } else if (gameState.gamePhase === 'PLAYING') {
    // Try to hit all notes perfectly
    for (const note of gameState.activeNotes) {
      if (note.status === 'active') {
        const timeDiff = note.time - gameState.songTimeElapsed;
        
        // Hit when note is very close
        if (Math.abs(timeDiff) < 30) {
          const keyCode = gameState.keyBindings[note.lane];
          if (!gameState.keyState[keyCode]) {
            simulateKeyPress(p, keyCode);
          }
        }
      }
    }
    
    // Handle hold notes
    for (const note of gameState.activeNotes) {
      if (note.type === 'hold' && note.holdPressed) {
        const keyCode = gameState.keyBindings[note.lane];
        const holdEnd = note.time + note.duration;
        
        if (gameState.songTimeElapsed < holdEnd) {
          // Keep holding
          if (!gameState.keyState[keyCode]) {
            simulateKeyPress(p, keyCode);
          }
        } else {
          // Release
          if (gameState.keyState[keyCode]) {
            simulateKeyRelease(p, keyCode);
          }
        }
      }
    }
  } else if (gameState.gamePhase === 'LEVEL_COMPLETE') {
    // Auto-advance
    if (p.frameCount % 120 === 0) {
      simulateKeyPress(p, 32); // SPACE
    }
  } else if (gameState.gamePhase === 'GAME_OVER') {
    // Auto-restart
    if (p.frameCount % 180 === 0) {
      simulateKeyPress(p, 82); // R
    }
  }
}

function simulateKeyPress(p, keyCode) {
  gameState.keyState[keyCode] = true;
  
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key: String.fromCharCode(keyCode), keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Handle gameplay
  if (gameState.gamePhase === 'PLAYING') {
    handleNoteHit(p, keyCode);
  }
}

function simulateKeyRelease(p, keyCode) {
  gameState.keyState[keyCode] = false;
  
  p.logs.inputs.push({
    input_type: 'keyReleased',
    data: { key: String.fromCharCode(keyCode), keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}