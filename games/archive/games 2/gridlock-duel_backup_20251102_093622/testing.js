// testing.js - Automated testing

import { gameState, GAME_PHASES, GAME_STATES, TURN } from './globals.js';
import { handleKeyPressed } from './input.js';

let testSequence = [];
let testIndex = 0;
let testFrameDelay = 0;

export function initTesting() {
  testSequence = [];
  testIndex = 0;
  testFrameDelay = 0;
}

export function updateTesting() {
  if (gameState.controlMode === "HUMAN") {
    return;
  }
  
  if (testFrameDelay > 0) {
    testFrameDelay--;
    return;
  }
  
  if (gameState.controlMode === "TEST_1") {
    runBasicTest();
  } else if (gameState.controlMode === "TEST_2") {
    runWinTest();
  }
}

function runBasicTest() {
  // Basic test: Start game, make some moves, navigate
  if (gameState.gamePhase === GAME_PHASES.START) {
    handleKeyPressed("Enter", 13);
    testFrameDelay = 30;
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING && 
             gameState.gameStatus === GAME_STATES.PLAYING &&
             gameState.currentTurn === TURN.PLAYER) {
    
    // Navigate and place marks
    const moves = [
      { key: "ArrowRight", code: 39 },
      { key: "Space", code: 32 },
      { key: "ArrowDown", code: 40 },
      { key: "Space", code: 32 },
      { key: "ArrowLeft", code: 37 },
      { key: "Space", code: 32 }
    ];
    
    if (testIndex < moves.length) {
      const move = moves[testIndex];
      handleKeyPressed(move.key, move.code);
      testIndex++;
      testFrameDelay = 45;
    }
  }
}

function runWinTest() {
  // Win test: Execute a winning strategy
  if (gameState.gamePhase === GAME_PHASES.START) {
    handleKeyPressed("Enter", 13);
    testFrameDelay = 30;
    testIndex = 0;
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING && 
             gameState.gameStatus === GAME_STATES.PLAYING &&
             gameState.currentTurn === TURN.PLAYER) {
    
    // Try to win by getting three in a row (top row)
    const winMoves = [
      // Top-left
      { key: "Space", code: 32 },
      // Move right, wait for AI
      { key: "ArrowRight", code: 39 },
      // Middle top
      { key: "Space", code: 32 },
      // Move right, wait for AI
      { key: "ArrowRight", code: 39 },
      // Right top
      { key: "Space", code: 32 }
    ];
    
    if (testIndex < winMoves.length) {
      const move = winMoves[testIndex];
      handleKeyPressed(move.key, move.code);
      testIndex++;
      testFrameDelay = 60;
    }
  } else if (gameState.gameStatus === GAME_STATES.LEVEL_COMPLETE) {
    handleKeyPressed("Space", 32);
    testFrameDelay = 60;
    testIndex = 0;
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ||
             gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    handleKeyPressed("r", 82);
    testFrameDelay = 60;
    testIndex = 0;
  }
}

export function setControlMode(mode) {
  gameState.controlMode = mode;
  initTesting();
}