// game.js - Main game file
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { LEVEL_CONFIGS, getLevelConfig } from './levels.js';
import { initializeGrid } from './grid.js';
import { handleKeyPressed, handleKeyReleased } from './input.js';
import { renderStartScreen, renderPlayingScreen, renderGameOverScreen } from './render.js';


const p5 = window.p5;

let gameInstance = new p5(p => {
  

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    
    // Initialize logs
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };
    
    // Load high score
    if (typeof localStorage !== 'undefined') {
      const savedHighScore = localStorage.getItem('gameHighScore');
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
    gameState.totalScore = 0;
    gameState.levelStartTotalScore = 0;
    initializeGrid(p, config);
    
    p.logs.game_info.push({
      data: { phase: "START", level: gameState.currentLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    
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
  // Since only "HUMAN" mode remains, we can simplify this.
  // The function is primarily used to reset the game to level 1 and ensure the button is active.
  gameState.controlMode = 'HUMAN'; // Always set to HUMAN
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Only the human mode button should exist and be active
  document.getElementById('humanModeBtn').classList.add('active');
  
  // Reset game when switching modes (or clicking the human mode button)
  gameState.gamePhase = GAME_PHASES.START;
  gameState.currentLevel = 1;
  gameState.totalScore = 0;
  gameState.levelStartTotalScore = 0;
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