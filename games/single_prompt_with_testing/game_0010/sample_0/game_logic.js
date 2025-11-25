// game_logic.js - Core game logic

import { gameState, PHASE_PLAYING, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, VALID_CITIES } from './globals.js';
import { Traveler } from './traveler.js';

export function initGame(p) {
  gameState.day = 1;
  gameState.quota = 5;
  gameState.processed = 0;
  gameState.correctDecisions = 0;
  gameState.wrongDecisions = 0;
  gameState.timeRemaining = 180;
  gameState.score = 0;
  gameState.travelerIndex = 0;
  gameState.selectedDocument = null;
  gameState.inspectMode = false;
  gameState.message = "";
  gameState.messageTimer = 0;
  gameState.lastTimeUpdate = Date.now();
  gameState.uiState.selectedButton = "approve";
  
  generateTravelers(p);
  loadNextTraveler();
}

export function generateTravelers(p) {
  gameState.travelers = [];
  const totalTravelers = gameState.quota + 3;
  
  for (let i = 0; i < totalTravelers; i++) {
    // Mix of valid and invalid travelers
    const makeInvalid = i % 3 === 0; // Every 3rd traveler has issues
    gameState.travelers.push(new Traveler(p, makeInvalid));
  }
}

export function loadNextTraveler() {
  if (gameState.travelerIndex < gameState.travelers.length) {
    gameState.currentTraveler = gameState.travelers[gameState.travelerIndex];
    gameState.selectedDocument = null;
    gameState.inspectMode = false;
  } else {
    gameState.currentTraveler = null;
  }
}

export function processTraveler(approved) {
  if (!gameState.currentTraveler) return;
  
  const hasDiscrepancy = gameState.currentTraveler.hasDiscrepancy();
  const correctDecision = (approved && !hasDiscrepancy) || (!approved && hasDiscrepancy);
  
  if (correctDecision) {
    gameState.correctDecisions++;
    gameState.score += 10;
    gameState.message = "CORRECT - Earned 10 credits";
  } else {
    gameState.wrongDecisions++;
    gameState.score = Math.max(0, gameState.score - 5);
    gameState.message = hasDiscrepancy 
      ? "INCORRECT - Documents had discrepancies! -5 credits"
      : "INCORRECT - Documents were valid! -5 credits";
  }
  
  gameState.messageTimer = 120; // Show for 2 seconds
  gameState.processed++;
  gameState.travelerIndex++;
  
  // Check win/lose conditions
  checkGameOver();
  
  if (gameState.gamePhase === PHASE_PLAYING) {
    loadNextTraveler();
  }
}

export function checkGameOver() {
  // Win condition: meet quota with acceptable accuracy
  if (gameState.processed >= gameState.quota) {
    const accuracy = gameState.correctDecisions / gameState.processed;
    if (accuracy >= 0.6) {
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
      gameState.message = `DAY COMPLETE! Accuracy: ${Math.floor(accuracy * 100)}%`;
    } else {
      gameState.gamePhase = PHASE_GAME_OVER_LOSE;
      gameState.message = `DISMISSED - Poor performance. Accuracy: ${Math.floor(accuracy * 100)}%`;
    }
    return;
  }
  
  // Lose condition: time runs out
  if (gameState.timeRemaining <= 0) {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    gameState.message = "TIME'S UP - Failed to meet quota";
  }
}

export function updateGame(p) {
  // Update timer
  const now = Date.now();
  if (now - gameState.lastTimeUpdate >= 1000) {
    gameState.timeRemaining--;
    gameState.lastTimeUpdate = now;
    checkGameOver();
  }
  
  // Update message timer
  if (gameState.messageTimer > 0) {
    gameState.messageTimer--;
  }
  
  // Log player info periodically
  if (p.frameCount % 30 === 0) {
    p.logs.player_info.push({
      screen_x: 300,
      screen_y: 200,
      game_x: 300,
      game_y: 200,
      framecount: p.frameCount
    });
  }
}