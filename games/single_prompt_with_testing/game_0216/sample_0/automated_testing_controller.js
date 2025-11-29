// automated_testing_controller.js - Automated testing AI

import { gameState, ROOM_NAMES, ANOMALY_TYPES } from './globals.js';

// Memory of room states for testing
let lastKnownStates = [];
let scanPattern = 0;
let reportCooldown = 0;

// Initialize testing
export function initializeTesting() {
  lastKnownStates = [];
  scanPattern = 0;
  reportCooldown = 0;
  
  // Create snapshots of initial room states
  for (let room of gameState.roomStates) {
    lastKnownStates.push(JSON.parse(JSON.stringify(room)));
  }
}

// TEST_1: Basic testing - systematic scanning and reporting
function getTestBasicAction(p) {
  reportCooldown = Math.max(0, reportCooldown - 1);
  
  // Systematic camera scanning
  if (p.frameCount % 90 === 0) { // Every 1.5 seconds
    scanPattern = (scanPattern + 1) % ROOM_NAMES.length;
    return { keyCode: 39 }; // Right arrow
  }
  
  // Check for anomalies every 60 frames
  if (p.frameCount % 60 === 0 && reportCooldown === 0) {
    const anomaly = findVisibleAnomaly();
    if (anomaly) {
      // Open report menu
      if (!gameState.reportMenuOpen) {
        reportCooldown = 30;
        return { keyCode: 16 }; // Shift
      }
    }
  }
  
  // If report menu is open, navigate and submit
  if (gameState.reportMenuOpen) {
    const anomaly = findVisibleAnomaly();
    if (anomaly) {
      // Select correct room
      if (gameState.selectedReportRoom !== anomaly.roomIndex) {
        return gameState.selectedReportRoom < anomaly.roomIndex ? 
          { keyCode: 39 } : { keyCode: 37 }; // Right or Left
      }
      
      // Select correct type
      const typeIndex = ANOMALY_TYPES.indexOf(anomaly.type);
      if (gameState.selectedReportType !== typeIndex) {
        return gameState.selectedReportType < typeIndex ? 
          { keyCode: 40 } : { keyCode: 38 }; // Down or Up
      }
      
      // Submit
      reportCooldown = 60;
      return { keyCode: 32 }; // Space
    } else {
      // Close menu if no anomaly
      return { keyCode: 16 }; // Shift
    }
  }
  
  return null;
}

// TEST_2: Optimal win strategy
function getTestWinAction(p) {
  reportCooldown = Math.max(0, reportCooldown - 1);
  
  // Rapid camera cycling to detect anomalies fast
  if (p.frameCount % 30 === 0) { // Every 0.5 seconds
    return { keyCode: 39 }; // Right arrow
  }
  
  // Check for anomalies continuously
  if (reportCooldown === 0) {
    const anomaly = findVisibleAnomaly();
    if (anomaly) {
      // Open report menu instantly
      if (!gameState.reportMenuOpen) {
        reportCooldown = 10;
        return { keyCode: 16 }; // Shift
      }
    }
  }
  
  // If report menu is open, handle with perfect accuracy
  if (gameState.reportMenuOpen) {
    const anomaly = findVisibleAnomaly();
    if (anomaly) {
      // Perfect navigation
      if (gameState.selectedReportRoom !== anomaly.roomIndex) {
        const diff = anomaly.roomIndex - gameState.selectedReportRoom;
        return diff > 0 ? { keyCode: 39 } : { keyCode: 37 };
      }
      
      const typeIndex = ANOMALY_TYPES.indexOf(anomaly.type);
      if (gameState.selectedReportType !== typeIndex) {
        const diff = typeIndex - gameState.selectedReportType;
        return diff > 0 ? { keyCode: 40 } : { keyCode: 38 };
      }
      
      // Submit immediately
      reportCooldown = 20;
      return { keyCode: 32 }; // Space
    } else {
      // Close menu
      return { keyCode: 16 };
    }
  }
  
  return null;
}

// Find first visible anomaly
function findVisibleAnomaly() {
  // Return first active anomaly
  if (gameState.activeAnomalies.length > 0) {
    for (let anomaly of gameState.activeAnomalies) {
      if (!anomaly.detected) {
        return anomaly;
      }
    }
  }
  return null;
}

// Main automated testing function
export function get_automated_testing_action(gameStateObj) {
  if (!gameStateObj || gameStateObj.controlMode === "HUMAN") {
    return null;
  }
  
  // Get p5 instance
  const p = window.gameInstance;
  if (!p) return null;
  
  switch (gameStateObj.controlMode) {
    case "TEST_1":
      return getTestBasicAction(p);
    case "TEST_2":
      return getTestWinAction(p);
    default:
      return null;
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}