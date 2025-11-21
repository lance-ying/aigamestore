// game_logic.js - Core game logic

import { gameState, GAME_PHASES } from './globals.js';
import { Player } from './entities.js';
import { createGameData } from './game_data.js';

let p5Instance = null;

export function setP5Instance(p) {
  p5Instance = p;
}

export function initializeGame() {
  // Create game data
  const gameData = createGameData();
  gameState.locations = gameData.locations;
  gameState.clues = gameData.clues;
  gameState.suspects = gameData.suspects;
  gameState.puzzles = gameData.puzzles;
  
  // Set totals for win condition
  gameState.totalClues = gameData.clues.length;
  gameState.totalSuspects = gameData.suspects.length;
  gameState.totalPuzzles = gameData.puzzles.length;
  
  // Create player
  gameState.player = new Player(300, 350);
  gameState.entities = [gameState.player];
  
  // Initialize state
  gameState.currentLocation = 0;
  gameState.collectedClues = [];
  gameState.interrogatedSuspects = [];
  gameState.solvedPuzzles = [];
  gameState.score = 0;
  gameState.showCaseFile = false;
  gameState.selectedHotspot = null;
  gameState.puzzleActive = null;
  gameState.dialogueState = null;
  gameState.finalDeductionMade = false;
  gameState.requiredCluesCollected = 0;
  gameState.requiredSuspectsInterrogated = 0;
  gameState.requiredPuzzlesSolved = 0;
  
  // Mark first location as visited
  gameState.locations[0].visited = true;
}

export function startGame() {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  
  if (p5Instance) {
    p5Instance.logs.game_info.push({
      data: { phase: "PLAYING", action: "game_started" },
      framecount: p5Instance.frameCount,
      timestamp: Date.now()
    });
  }
}

export function togglePause() {
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    gameState.gamePhase = GAME_PHASES.PAUSED;
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    gameState.gamePhase = GAME_PHASES.PLAYING;
  }
  
  if (p5Instance) {
    p5Instance.logs.game_info.push({
      data: { phase: gameState.gamePhase, action: "pause_toggled" },
      framecount: p5Instance.frameCount,
      timestamp: Date.now()
    });
  }
}

export function restartGame() {
  gameState.gamePhase = GAME_PHASES.START;
  initializeGame();
  
  if (p5Instance) {
    p5Instance.logs.game_info.push({
      data: { phase: "START", action: "game_restarted" },
      framecount: p5Instance.frameCount,
      timestamp: Date.now()
    });
  }
}

export function checkWinCondition() {
  // Win condition: collect all clues, interrogate all suspects, solve all puzzles
  const allCluesCollected = gameState.requiredCluesCollected >= gameState.totalClues;
  const allSuspectsInterrogated = gameState.requiredSuspectsInterrogated >= gameState.totalSuspects;
  const allPuzzlesSolved = gameState.requiredPuzzlesSolved >= gameState.totalPuzzles;
  
  if (allCluesCollected && allSuspectsInterrogated && allPuzzlesSolved && !gameState.finalDeductionMade) {
    gameState.finalDeductionMade = true;
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    
    if (p5Instance) {
      p5Instance.logs.game_info.push({
        data: { 
          phase: "GAME_OVER_WIN", 
          action: "case_solved",
          score: gameState.score
        },
        framecount: p5Instance.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

export function logPlayerInfo() {
  if (!p5Instance || !gameState.player) return;
  
  p5Instance.logs.player_info.push({
    screen_x: gameState.player.x,
    screen_y: gameState.player.y,
    game_x: gameState.player.x,
    game_y: gameState.player.y,
    framecount: p5Instance.frameCount
  });
}