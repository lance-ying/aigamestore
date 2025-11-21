// game_logic.js - Core game logic

import { gameState, PHASE_PLAYING, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, PHASE_START, initializeGrid } from './globals.js';
import { updateAllPopularity } from './facility.js';

export function updateGame(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return;
  }
  
  // Update time progression
  gameState.frameCounter++;
  
  if (gameState.frameCounter >= gameState.framesPerMonth) {
    gameState.frameCounter = 0;
    progressMonth(p);
  }
  
  // Check win/lose conditions
  checkGameOver(p);
}

function progressMonth(p) {
  gameState.month++;
  
  if (gameState.month > 12) {
    gameState.month = 1;
    gameState.year++;
    progressYear(p);
  }
  
  // Monthly income and expenses
  const income = Math.floor(gameState.reputation * 0.5 + gameState.students * 0.3);
  const expenses = Math.floor(gameState.entities.length * 5);
  gameState.budget += income - expenses;
  
  // Update student count based on reputation
  const newStudents = Math.floor(gameState.reputation * 0.1);
  gameState.students += newStudents;
  
  // Recalculate popularity
  updateAllPopularity();
}

function progressYear(p) {
  // Annual events
  const graduatingStudents = Math.floor(gameState.students * 0.25);
  gameState.graduations += graduatingStudents;
  gameState.students -= graduatingStudents;
  
  // Add new students
  const newEnrollment = Math.floor(gameState.reputation * 0.3);
  gameState.students += newEnrollment;
  
  // Tournament simulation
  if (gameState.entities.length >= 5) {
    const tournamentChance = Math.min(0.5, gameState.reputation / 2000);
    if (Math.random() < tournamentChance) {
      gameState.tournaments++;
    }
  }
  
  // Budget bonus for good performance
  gameState.budget += Math.floor(gameState.reputation * 0.3);
  
  p.logs.game_info.push({
    data: { 
      event: "Year End",
      year: gameState.year - 1,
      reputation: gameState.reputation,
      students: gameState.students,
      tournaments: gameState.tournaments
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function checkGameOver(p) {
  // Win condition - reach target reputation
  if (gameState.reputation >= gameState.targetReputation) {
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { phase: PHASE_GAME_OVER_WIN, reputation: gameState.reputation },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // Lose condition - run out of budget and can't build
  if (gameState.budget < 0 && gameState.year >= 5) {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    p.logs.game_info.push({
      data: { phase: PHASE_GAME_OVER_LOSE, reputation: gameState.reputation },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // Lose condition - max years reached without winning
  if (gameState.year > gameState.maxYears) {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    p.logs.game_info.push({
      data: { phase: PHASE_GAME_OVER_LOSE, reason: "Time limit reached" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
}

export function resetGame(p) {
  // Reset all game state
  gameState.gamePhase = PHASE_START;
  gameState.entities = [];
  initializeGrid();
  
  gameState.cursorX = 0;
  gameState.cursorY = 0;
  gameState.cameraX = 0;
  gameState.cameraY = 0;
  
  gameState.budget = 500;
  gameState.reputation = 0;
  gameState.students = 100;
  gameState.year = 1;
  gameState.month = 4;
  
  gameState.buildMenuOpen = false;
  gameState.selectedFacilityType = null;
  gameState.selectedFacilityIndex = 0;
  
  gameState.clubs = [];
  gameState.tournaments = 0;
  gameState.graduations = 0;
  
  gameState.yearProgress = 0;
  gameState.frameCounter = 0;
  
  gameState.positionHistory = [];
  gameState.lastActionFrame = 0;
  
  p.logs.game_info.push({
    data: { phase: PHASE_START, message: "Game Reset" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}