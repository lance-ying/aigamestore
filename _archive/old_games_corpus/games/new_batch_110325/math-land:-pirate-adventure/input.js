// input.js - Input handling
import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { createMathPuzzle } from './mathPuzzle.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Game state transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === PHASE_START) {
      startGame(p);
    }
  } else if (keyCode === 27) { // ESC
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      p.logs.game_info.push({
        data: { phase: PHASE_PAUSED },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      p.logs.game_info.push({
        data: { phase: PHASE_PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (keyCode === 82) { // R
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      resetGame(p);
    }
  }

  // Gameplay controls
  if (gameState.gamePhase === PHASE_PLAYING && gameState.player) {
    if (gameState.puzzleActive && gameState.mathPuzzle) {
      handlePuzzleInput(p, keyCode);
    } else {
      handleGameplayInput(p, keyCode);
    }
  }
}

function handleGameplayInput(p, keyCode) {
  // Z key - interact with chests
  if (keyCode === 90) {
    gameState.chests.forEach(chest => {
      if (chest.open()) {
        // Create math puzzle
        gameState.mathPuzzle = createMathPuzzle(gameState.currentLevel);
        gameState.puzzleActive = true;
      }
    });
  }
}

function handlePuzzleInput(p, keyCode) {
  if (!gameState.mathPuzzle) return;

  // Arrow keys for selection
  if (keyCode === 37 || keyCode === 38) { // LEFT or UP
    gameState.mathPuzzle.selectedOption = Math.max(0, gameState.mathPuzzle.selectedOption - 1);
  } else if (keyCode === 39 || keyCode === 40) { // RIGHT or DOWN
    gameState.mathPuzzle.selectedOption = Math.min(3, gameState.mathPuzzle.selectedOption + 1);
  }

  // SPACE to submit answer
  if (keyCode === 32) {
    if (!gameState.mathPuzzle.answered) {
      gameState.mathPuzzle.submitAnswer();
    }
  }

  // Z to continue after answering
  if (keyCode === 90) {
    if (gameState.mathPuzzle.answered) {
      if (gameState.mathPuzzle.correct) {
        gameState.puzzleActive = false;
        gameState.mathPuzzle = null;
        checkLevelComplete(p);
      } else {
        // Retry - generate new puzzle
        gameState.mathPuzzle = createMathPuzzle(gameState.currentLevel);
      }
    }
  }
}

function startGame(p) {
  gameState.gamePhase = PHASE_PLAYING;
  gameState.currentLevel = 0;
  gameState.score = 0;
  gameState.sacredStones = 0;
  gameState.health = gameState.maxHealth;
  gameState.hasSpyglass = false;
  
  const levels = require('./levels.js');
  const levelData = levels.loadLevel(gameState.currentLevel);
  initializeLevel(p, levelData);
  
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING, level: 0 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetGame(p) {
  gameState.gamePhase = PHASE_START;
  gameState.player = null;
  gameState.entities = [];
  gameState.platforms = [];
  gameState.hazards = [];
  gameState.collectibles = [];
  gameState.chests = [];
  gameState.currentLevel = 0;
  gameState.score = 0;
  gameState.sacredStones = 0;
  gameState.health = gameState.maxHealth;
  gameState.hasSpyglass = false;
  gameState.puzzleActive = false;
  gameState.mathPuzzle = null;
  gameState.levelComplete = false;
  
  p.logs.game_info.push({
    data: { phase: PHASE_START },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function initializeLevel(p, levelData) {
  const Player = require('./entities.js').Player;
  
  gameState.player = new Player(levelData.spawnX, levelData.spawnY);
  gameState.entities = [gameState.player];
  gameState.platforms = levelData.platforms;
  gameState.hazards = levelData.hazards;
  gameState.collectibles = levelData.collectibles;
  gameState.chests = levelData.chests;
  gameState.levelComplete = false;
  
  levelData.enemies.forEach(enemy => {
    gameState.entities.push(enemy);
  });
}

function checkLevelComplete(p) {
  // Check if level is complete
  if (gameState.currentLevel < 5) {
    gameState.currentLevel++;
    const levels = require('./levels.js');
    const levelData = levels.loadLevel(gameState.currentLevel);
    initializeLevel(p, levelData);
  } else {
    // Game won!
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { phase: PHASE_GAME_OVER_WIN, finalScore: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function processPlayerMovement(p) {
  if (!gameState.player || gameState.puzzleActive) return;

  const player = gameState.player;
  
  if (gameState.controlMode === 'HUMAN') {
    if (p.keyIsDown(37)) player.moveLeft();
    if (p.keyIsDown(39)) player.moveRight();
    if (p.keyIsDown(38)) player.jump();
    player.sprinting = p.keyIsDown(16);
  }
}