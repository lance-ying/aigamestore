// game.js - Main game file
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { LEVEL_CONFIGS, getLevelConfig } from './levels.js';
import { initializeGrid } from './grid.js';
import { handleKeyPressed, handleKeyReleased } from './input.js';
import { renderStartScreen, renderPlayingScreen, renderGameOverScreen } from './render.js';
import { getTestAction } from './testing.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let lastTestActionFrame = 0;

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };
    
    // Load high score
    if (typeof localStorage !== 'undefined') {
      const savedHighScore = localStorage.getItem('connectCascadeHighScore');
      if (savedHighScore) {
        gameState.highScore = parseInt(savedHighScore);
      }
    }
    
    // Initialize first level configuration
    const config = getLevelConfig(gameState.currentLevel);
    gameState.levelConfig = config;
    gameState.currentMoves = config.movesLimit;
    gameState.maxMoves = config.movesLimit;
    gameState.levelObjectives = JSON.parse(JSON.stringify(config.objectives));
    gameState.score = 0;
    initializeGrid(p, config);
    
    p.logs.game_info.push({
      data: { phase: "START", level: gameState.currentLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN") {
      if (p.frameCount - lastTestActionFrame > 5) {
        const action = getTestAction(p);
        if (action) {
          lastTestActionFrame = p.frameCount;
          if (action.type === 'press') {
            simulateKeyPress(action.keyCode);
          } else if (action.type === 'release') {
            simulateKeyRelease(action.keyCode);
          }
        }
      }
    }
    
    // Render based on game phase
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING || gameState.gamePhase === GAME_PHASES.PAUSED) {
      renderPlayingScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGameOverScreen(p);
    }
    
    // Log player info
    if (p.frameCount % 10 === 0 && gameState.gamePhase === GAME_PHASES.PLAYING) {
      p.logs.player_info.push({
        screen_x: gameState.cursorX,
        screen_y: gameState.cursorY,
        game_x: gameState.cursorX,
        game_y: gameState.cursorY,
        framecount: p.frameCount
      });
    }
  };

  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
    return false;
  };

  p.keyReleased = function() {
    handleKeyReleased(p, p.key, p.keyCode);
    return false;
  };

  function simulateKeyPress(keyCode) {
    const keyMap = {
      13: 'Enter',
      27: 'Escape',
      32: ' ',
      37: 'ArrowLeft',
      38: 'ArrowUp',
      39: 'ArrowRight',
      40: 'ArrowDown',
      82: 'r',
      16: 'Shift'
    };
    handleKeyPressed(p, keyMap[keyCode] || '', keyCode);
  }

  function simulateKeyRelease(keyCode) {
    const keyMap = {
      13: 'Enter',
      27: 'Escape',
      32: ' ',
      37: 'ArrowLeft',
      38: 'ArrowUp',
      39: 'ArrowRight',
      40: 'ArrowDown',
      82: 'r',
      16: 'Shift'
    };
    handleKeyReleased(p, keyMap[keyCode] || '', keyCode);
  }
});

// Expose globally
window.gameInstance = gameInstance;
// Expose level loading for dev mode
window.loadLevel = function(levelNum) {
  const state = window.getGameState ? window.getGameState() : (window.gameState || (window.gameInstance && window.gameInstance.gameState));
  if (state) {
    state.currentLevel = levelNum;
    // Try common reset/start patterns
    if (typeof resetGame === 'function') {
      resetGame();
    }
    if (typeof startGame === 'function') {
      startGame();
    } else if (state.gamePhase !== undefined) {
      state.gamePhase = "PLAYING";
    }
  }
};

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (mode === 'HUMAN') {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === 'TEST_1') {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === 'TEST_2') {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
  
  // Reset game when switching modes
  gameState.gamePhase = GAME_PHASES.START;
  gameState.currentLevel = 1;
  gameState.totalScore = 0;
  const config = getLevelConfig(gameState.currentLevel);
  gameState.levelConfig = config;
  gameState.currentMoves = config.movesLimit;
  gameState.maxMoves = config.movesLimit;
  gameState.levelObjectives = JSON.parse(JSON.stringify(config.objectives));
  gameState.score = 0;
  gameState.cursorX = 0;
  gameState.cursorY = 0;
  gameState.currentSelectedDot = null;
  gameState.currentPath = [];
  gameState.isAnimating = false;
  gameState.keysPressed.clear(); // Reset key state
  initializeGrid(gameInstance, config);
};