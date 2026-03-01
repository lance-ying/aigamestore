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
    gameState.frameRate = p.frameRate(); // Store actual frame rate for auto-restart timer
    
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
    resetLevel(p, 1); // Use the new resetLevel function for initial setup
    gameState.gamePhase = GAME_PHASES.START; // Set to start phase after initial reset
    
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

      // Auto-restart logic
      if (gameState.autoRestartTimer === null) {
          gameState.autoRestartTimer = p.frameCount;
      }
      const framesToWait = gameState.frameRate; // 1 second
      if (p.frameCount - gameState.autoRestartTimer > framesToWait) {
          if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
              if (gameState.currentLevel < LEVEL_CONFIGS.length) {
                  advanceLevel(p);
              } else {
                  returnToStart(p);
              }
          } else { // GAME_OVER_LOSE
              resetLevel(p, gameState.currentLevel, true); // true to restore levelStartTotalScore
          }
          gameState.autoRestartTimer = null; // Reset timer after action
      }
    } else {
        // If not in game over, ensure timer is reset
        gameState.autoRestartTimer = null;
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

// Centralized game state reset/advance functions
export function resetLevel(p, levelNum, restoreScore = false) {
  gameState.currentLevel = levelNum;
  const config = getLevelConfig(levelNum);
  gameState.levelConfig = config;
  gameState.currentMoves = config.movesLimit;
  gameState.maxMoves = config.movesLimit;
  gameState.levelObjectives = JSON.parse(JSON.stringify(config.objectives));
  gameState.score = 0; // Score for current level
  if (restoreScore) {
      gameState.totalScore = gameState.levelStartTotalScore; // Total score for entire game
  } else {
      // If not restoring, it's a fresh start or new level, so total score should be updated by levelStartTotalScore
      // This is handled by advanceLevel setting levelStartTotalScore, or initial setup setting totalScore to 0.
      // No explicit totalScore reset here unless it's a full game restart (handled by returnToStart)
  }
  gameState.cursorX = 0;
  gameState.cursorY = 0;
  gameState.currentSelectedDot = null;
  gameState.currentPath = [];
  gameState.isAnimating = false;
  gameState.keysPressed.clear();
  gameState.autoRestartTimer = null; // Clear auto-restart timer on any manual reset

  initializeGrid(p, config);
  gameState.gamePhase = GAME_PHASES.PLAYING; // Always start playing after a level load/reset
  
  p.logs.game_info.push({
    data: { phase: "PLAYING", level: levelNum },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function advanceLevel(p) {
  gameState.levelStartTotalScore = gameState.totalScore; // Save total score before advancing
  resetLevel(p, gameState.currentLevel + 1);
}

export function returnToStart(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.currentLevel = 1;
  gameState.totalScore = 0;
  gameState.levelStartTotalScore = 0;
  gameState.keysPressed.clear(); // Reset key state
  gameState.autoRestartTimer = null; // Clear auto-restart timer

  // Re-initialize level 1 for the background
  const config = getLevelConfig(1);
  gameState.levelConfig = config;
  initializeGrid(p, config);
  
  p.logs.game_info.push({
    data: { phase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}


// Expose globally
window.gameInstance = gameInstance;
// Expose level loading for dev mode
window.loadLevel = function(levelNum) {
  const state = window.getGameState ? window.getGameState() : (window.gameState || (window.gameInstance && window.gameInstance.gameState));
  if (state && window.gameInstance) { // Ensure p5 instance is available
    resetLevel(window.gameInstance, levelNum);
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
  // This is effectively a return to start
  returnToStart(gameInstance);
  
  // The original code was essentially a partial `resetLevel(1)` followed by `gameState.gamePhase = GAME_PHASES.START;`
  // The `returnToStart` function now encapsulates this correctly.
};