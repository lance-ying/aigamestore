// automated_testing_controller.js - Automated testing

import { gameState, PHASE_PLAYING, VALID_CITIES } from './globals.js';

let testState = {
  lastAction: null,
  actionTimer: 0,
  inspectionComplete: false,
  positionHistory: []
};

function getTestWinAction(gameState) {
  // TEST_2: Optimal strategy to win
  if (gameState.gamePhase !== PHASE_PLAYING || !gameState.currentTraveler) {
    return null;
  }
  
  // Wait a bit to simulate inspection
  if (testState.actionTimer < 30) {
    testState.actionTimer++;
    return null;
  }
  
  testState.actionTimer = 0;
  
  // Inspect documents
  const traveler = gameState.currentTraveler;
  const hasDiscrepancy = checkForDiscrepancies(traveler);
  
  // Make decision
  if (hasDiscrepancy) {
    return { keyCode: 90 }; // DENY
  } else {
    return { keyCode: 32 }; // APPROVE
  }
}

function getBasicTestAction(gameState) {
  // TEST_1: Basic testing - inspect and make decisions
  if (gameState.gamePhase !== PHASE_PLAYING || !gameState.currentTraveler) {
    return null;
  }
  
  // Cycle through inspection phases
  if (testState.actionTimer < 20) {
    testState.actionTimer++;
    if (testState.actionTimer === 10) {
      // Select first document
      return { keyCode: 37 }; // LEFT
    }
    return null;
  }
  
  if (testState.actionTimer < 40) {
    testState.actionTimer++;
    if (testState.actionTimer === 30) {
      // Select second document
      return { keyCode: 39 }; // RIGHT
    }
    return null;
  }
  
  testState.actionTimer = 0;
  
  // Make decision based on discrepancies
  const traveler = gameState.currentTraveler;
  const hasDiscrepancy = checkForDiscrepancies(traveler);
  
  if (hasDiscrepancy) {
    return { keyCode: 90 }; // DENY
  } else {
    return { keyCode: 32 }; // APPROVE
  }
}

function getInspectionTestAction(gameState) {
  // TEST_3: Test inspection mechanics
  if (gameState.gamePhase !== PHASE_PLAYING || !gameState.currentTraveler) {
    testState.inspectionComplete = false;
    return null;
  }
  
  // Go through inspection sequence
  if (!testState.inspectionComplete) {
    if (testState.actionTimer === 0) {
      testState.actionTimer++;
      return { keyCode: 37 }; // Select document
    }
    if (testState.actionTimer === 1) {
      testState.actionTimer++;
      return { keyCode: 16 }; // SHIFT - inspect mode
    }
    if (testState.actionTimer < 60) {
      testState.actionTimer++;
      return null; // Wait in inspect mode
    }
    if (testState.actionTimer === 60) {
      testState.actionTimer++;
      return { keyCode: 16 }; // SHIFT - exit inspect mode
    }
    if (testState.actionTimer === 61) {
      testState.actionTimer++;
      return { keyCode: 39 }; // Select other document
    }
    if (testState.actionTimer === 62) {
      testState.inspectionComplete = true;
      testState.actionTimer = 0;
    }
  }
  
  // Make decision
  const traveler = gameState.currentTraveler;
  const hasDiscrepancy = checkForDiscrepancies(traveler);
  
  testState.inspectionComplete = false;
  
  if (hasDiscrepancy) {
    return { keyCode: 90 }; // DENY
  } else {
    return { keyCode: 32 }; // APPROVE
  }
}

function checkForDiscrepancies(traveler) {
  if (!traveler) return false;
  
  const passport = traveler.passport.data;
  const permit = traveler.permit.data;
  
  // Check name match
  if (passport.name !== permit.name) {
    return true;
  }
  
  // Check ID match
  if (passport.idNumber !== permit.idNumber) {
    return true;
  }
  
  // Check expiration dates
  const currentYear = 2024;
  const passportYear = parseInt(passport.expiration.split('.')[0]);
  const permitYear = parseInt(permit.validUntil.split('.')[0]);
  
  if (passportYear < currentYear || permitYear < currentYear) {
    return true;
  }
  
  // Check valid city
  if (!VALID_CITIES.includes(passport.city)) {
    return true;
  }
  
  return false;
}

function getRandomAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  const actions = [
    { keyCode: 37 },  // LEFT
    { keyCode: 39 },  // RIGHT
    { keyCode: 32 },  // SPACE
    { keyCode: 90 },  // Z
    null, null, null  // More nulls for pauses
  ];
  
  const randomIndex = Math.floor(Math.random() * actions.length);
  return actions[randomIndex];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getInspectionTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;