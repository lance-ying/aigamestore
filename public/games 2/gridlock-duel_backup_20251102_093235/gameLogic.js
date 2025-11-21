// gameLogic.js - Core game logic

import { gameState, GAME_PHASES, GAME_STATES, TURN, LEVELS, SCORES, CELL_STATE } from './globals.js';
import { initializeBoard, checkWinner, isBoardFull, placeMarkOnBoard } from './board.js';
import { makeAIMove } from './ai.js';

let p;

export function initGameLogic(p5Instance) {
  p = p5Instance;
  loadHighScore();
}

export function startGame() {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.gameStatus = GAME_STATES.PLAYING;
  gameState.currentLevel = 1;
  gameState.score = 0;
  
  initializeLevel();
  
  p.logs.game_info.push({
    data: { phase: "PLAYING", status: "PLAYING" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function initializeLevel() {
  const levelConfig = LEVELS[gameState.currentLevel - 1];
  
  gameState.boardSize = levelConfig.boardSize;
  gameState.winLength = levelConfig.winLength;
  gameState.board = initializeBoard(gameState.boardSize);
  gameState.currentTurn = TURN.PLAYER;
  gameState.selectedCell = [0, 0];
  gameState.winner = null;
  gameState.winningLine = null;
  gameState.aiMoveDelay = 0;
  gameState.levelCompleteTimer = 0;
  gameState.gameTimer = 0;
}

export function updateGame() {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return;
  }
  
  if (gameState.gameStatus === GAME_STATES.PLAYING) {
    gameState.gameTimer++;
    
    // AI turn logic
    if (gameState.currentTurn === TURN.AI) {
      if (gameState.aiMoveDelay > 0) {
        gameState.aiMoveDelay--;
      } else {
        executeAIMove();
      }
    }
    
    // Check for winner
    const result = checkWinner();
    if (result) {
      handleWinner(result);
    } else if (isBoardFull()) {
      handleDraw();
    }
  } else if (gameState.gameStatus === GAME_STATES.LEVEL_COMPLETE) {
    gameState.levelCompleteTimer++;
  }
}

function executeAIMove() {
  const levelConfig = LEVELS[gameState.currentLevel - 1];
  const move = makeAIMove(levelConfig.aiDifficulty);
  
  if (move) {
    const [row, col] = move;
    placeMarkOnBoard(row, col, CELL_STATE.AI);
    gameState.currentTurn = TURN.PLAYER;
  }
}

function handleWinner(result) {
  gameState.winner = result.winner;
  gameState.winningLine = result.line;
  
  if (result.winner === CELL_STATE.PLAYER) {
    // Player wins
    gameState.score += SCORES.WIN_ROUND;
    
    if (gameState.currentLevel < 5) {
      gameState.score += SCORES.LEVEL_COMPLETE;
      gameState.gameStatus = GAME_STATES.LEVEL_COMPLETE;
    } else {
      // Game complete - beat all levels
      gameState.gameStatus = GAME_STATES.GAME_OVER;
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    }
    
    updateHighScore();
  } else {
    // AI wins
    gameState.gameStatus = GAME_STATES.GAME_OVER;
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    updateHighScore();
  }
  
  p.logs.game_info.push({
    data: { 
      winner: result.winner,
      phase: gameState.gamePhase,
      status: gameState.gameStatus 
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function handleDraw() {
  gameState.score += SCORES.DRAW_ROUND;
  gameState.gameStatus = GAME_STATES.GAME_OVER;
  gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
  gameState.winner = "DRAW";
  
  updateHighScore();
  
  p.logs.game_info.push({
    data: { 
      winner: "DRAW",
      phase: gameState.gamePhase,
      status: gameState.gameStatus 
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function restartGame() {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.gameStatus = GAME_STATES.TITLE_SCREEN;
  gameState.currentLevel = 1;
  gameState.score = 0;
  gameState.winner = null;
  gameState.winningLine = null;
  gameState.board = null;
  
  p.logs.game_info.push({
    data: { phase: "START", status: "TITLE_SCREEN" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function togglePause() {
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    gameState.gamePhase = GAME_PHASES.PAUSED;
    p.logs.game_info.push({
      data: { phase: "PAUSED" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    p.logs.game_info.push({
      data: { phase: "PLAYING" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function loadHighScore() {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('gridlock_duel_highscore');
    if (stored) {
      gameState.highScore = parseInt(stored, 10);
    }
  }
}

function updateHighScore() {
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gridlock_duel_highscore', gameState.highScore.toString());
    }
  }
}

export function proceedToNextLevel() {
  if (gameState.currentLevel < 5) {
    gameState.currentLevel++;
    gameState.gameStatus = GAME_STATES.PLAYING;
    gameState.levelCompleteTimer = 0;
    initializeLevel();
  } else {
    gameState.gameStatus = GAME_STATES.GAME_OVER;
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    gameState.winner = "COMPLETE";
  }
}