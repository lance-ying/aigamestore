// input.js
import { gameState, GAME_PHASES, CONTROL_MODES, resetGameState } from './globals.js';
import { getSquareKey, generateBingoCard } from './bingoCard.js';
import { handleCorrectMark, handleIncorrectMark } from './scoring.js';
import { activateInstantMark, activateScoreMultiplier, activateFreeMark, useFreeMarkOnSelected } from './boosters.js';
import { resetGameLoop } from './gameLoop.js';

export function handleKeyPressed(p) {
  if (gameState.controlMode !== CONTROL_MODES.HUMAN) return;
  
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (p.keyCode === 13) { // ENTER
    handleEnter(p);
  } else if (p.keyCode === 27) { // ESC
    handleEscape(p);
  } else if (p.keyCode === 82) { // R
    handleRestart(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    handleGameplayKeys(p);
  }
}

function handleEnter(p) {
  if (gameState.gamePhase === GAME_PHASES.START) {
    startGame(p);
  }
}

function handleEscape(p) {
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    gameState.gamePhase = GAME_PHASES.PAUSED;
    p.logs.game_info.push({
      data: { phase: 'PAUSED' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    resetGameLoop();
    p.logs.game_info.push({
      data: { phase: 'PLAYING' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function handleRestart(p) {
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
      gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    resetGameState();
    gameState.gamePhase = GAME_PHASES.START;
    resetGameLoop();
    p.logs.game_info.push({
      data: { phase: 'START' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function handleGameplayKeys(p) {
  if (p.keyCode === 37) { // LEFT
    gameState.selectedCol = Math.max(0, gameState.selectedCol - 1);
  } else if (p.keyCode === 39) { // RIGHT
    gameState.selectedCol = Math.min(4, gameState.selectedCol + 1);
  } else if (p.keyCode === 38) { // UP
    gameState.selectedRow = Math.max(0, gameState.selectedRow - 1);
  } else if (p.keyCode === 40) { // DOWN
    gameState.selectedRow = Math.min(4, gameState.selectedRow + 1);
  } else if (p.keyCode === 32) { // SPACE
    handleSpacePress(p);
  } else if (p.keyCode === 16) { // SHIFT
    activateScoreMultiplier(p);
  } else if (p.keyCode === 90) { // Z
    activateFreeMark(p);
  }
}

function handleSpacePress(p) {
  if (gameState.boosters.instantMark.available && !gameState.boosters.freeMark.active) {
    activateInstantMark(p);
  } else if (gameState.boosters.freeMark.active) {
    useFreeMarkOnSelected(p);
  } else {
    markSelectedSquare(p);
  }
}

function markSelectedSquare(p) {
  const key = getSquareKey(gameState.selectedRow, gameState.selectedCol);
  const number = gameState.bingoCard[gameState.selectedCol][gameState.selectedRow];
  
  if (number === 'FREE') {
    // FREE is always marked
    return;
  }
  
  if (gameState.markedSquares.has(key)) {
    // Already marked
    return;
  }
  
  // Check if this number has been called
  if (gameState.calledNumbers.includes(number)) {
    gameState.markedSquares.add(key);
    const isQuick = (Date.now() - gameState.lastCalledNumberTime) < 500;
    handleCorrectMark(isQuick, p);
  } else {
    handleIncorrectMark(p);
  }
}

function startGame(p) {
  resetGameState();
  resetGameLoop();
  gameState.bingoCard = generateBingoCard(p);
  gameState.markedSquares.add(getSquareKey(2, 2)); // FREE space
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.nextNumberCallTime = Date.now() + 1000;
  gameState.framesSinceStart = p.frameCount;
  
  p.logs.game_info.push({
    data: { phase: 'PLAYING', level: gameState.level },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}