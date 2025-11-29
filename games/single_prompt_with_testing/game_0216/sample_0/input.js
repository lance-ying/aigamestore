// input.js - Input handling

import { gameState, TOTAL_CAMERAS, ROOM_NAMES, ANOMALY_TYPES } from './globals.js';
import { checkReport, showAlert, createParticles } from './entities.js';
import { resetGame } from './game.js';

// Key state tracking
const keys = {};

// Key constants
const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;
const KEY_SPACE = 32;
const KEY_SHIFT = 16;
const KEY_Z = 90;
const KEY_ENTER = 13;
const KEY_ESC = 27;
const KEY_R = 82;

export function handleKeyPress(p) {
  keys[p.keyCode] = true;
  
  // Log input
  if (p.logs && p.logs.inputs) {
    p.logs.inputs.push({
      input_type: 'keyPressed',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Phase controls
  if (p.keyCode === KEY_ENTER) {
    if (gameState.gamePhase === "START") {
      gameState.gamePhase = "PLAYING";
      if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
          data: { gamePhase: "PLAYING" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
  
  if (p.keyCode === KEY_ESC) {
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
    }
  }
  
  if (p.keyCode === KEY_R) {
    if (gameState.gamePhase === "GAME_OVER_WIN" || 
        gameState.gamePhase === "GAME_OVER_LOSE") {
      resetGame(p);
      gameState.gamePhase = "START";
    }
  }
  
  // Gameplay controls
  if (gameState.gamePhase === "PLAYING") {
    handleGameplayInput(p);
  }
}

export function handleKeyRelease(p) {
  keys[p.keyCode] = false;
  
  // Log input
  if (p.logs && p.logs.inputs) {
    p.logs.inputs.push({
      input_type: 'keyReleased',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function handleGameplayInput(p) {
  // Camera switching
  if (p.keyCode === KEY_LEFT) {
    if (!gameState.reportMenuOpen) {
      switchCamera(-1);
    } else {
      // Navigate report menu
      if (gameState.selectedReportRoom > 0) {
        gameState.selectedReportRoom--;
      }
    }
  }
  
  if (p.keyCode === KEY_RIGHT) {
    if (!gameState.reportMenuOpen) {
      switchCamera(1);
    } else {
      // Navigate report menu
      if (gameState.selectedReportRoom < ROOM_NAMES.length - 1) {
        gameState.selectedReportRoom++;
      }
    }
  }
  
  if (p.keyCode === KEY_UP) {
    if (gameState.reportMenuOpen) {
      if (gameState.selectedReportType > 0) {
        gameState.selectedReportType--;
      }
    }
  }
  
  if (p.keyCode === KEY_DOWN) {
    if (gameState.reportMenuOpen) {
      if (gameState.selectedReportType < ANOMALY_TYPES.length - 1) {
        gameState.selectedReportType++;
      }
    }
  }
  
  // Quick switch with Z
  if (p.keyCode === KEY_Z) {
    if (!gameState.reportMenuOpen) {
      const temp = gameState.currentCamera;
      gameState.currentCamera = gameState.previousCamera;
      gameState.previousCamera = temp;
      
      gameState.cameraTransitioning = true;
      gameState.cameraTransitionProgress = 0;
    }
  }
  
  // Toggle report menu with Shift
  if (p.keyCode === KEY_SHIFT) {
    gameState.reportMenuOpen = !gameState.reportMenuOpen;
    if (gameState.reportMenuOpen) {
      gameState.selectedReportRoom = gameState.currentCamera;
      gameState.selectedReportType = 0;
    }
  }
  
  // Confirm with Space
  if (p.keyCode === KEY_SPACE) {
    if (gameState.reportMenuOpen) {
      submitReport(p);
    }
  }
}

function switchCamera(direction) {
  gameState.previousCamera = gameState.currentCamera;
  gameState.currentCamera = (gameState.currentCamera + direction + TOTAL_CAMERAS) % TOTAL_CAMERAS;
  
  gameState.cameraTransitioning = true;
  gameState.cameraTransitionProgress = 0;
}

function submitReport(p) {
  const roomIndex = gameState.selectedReportRoom;
  const typeIndex = gameState.selectedReportType;
  
  const anomaly = checkReport(roomIndex, typeIndex);
  
  if (anomaly) {
    // Correct report
    anomaly.report();
    createParticles(300, 200, 20, [0, 255, 0]);
  } else {
    // Wrong report
    gameState.falseReports++;
    gameState.strikes++;
    gameState.score += -50; // WRONG_REPORT_PENALTY
    showAlert('False Report! Strike!');
    createParticles(300, 200, 15, [255, 0, 0]);
  }
  
  // Close menu
  gameState.reportMenuOpen = false;
}

export function isKeyPressed(keyCode) {
  return keys[keyCode] === true;
}