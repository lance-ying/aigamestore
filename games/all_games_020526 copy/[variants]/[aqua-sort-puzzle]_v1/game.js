// game.js - Main game file

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { handleKeyPressed } from './input.js';
import { updateAnimation } from './gameLogic.js';
import { 
  renderStartScreen, 
  renderPlayingScreen, 
  renderPausedScreen, 
  renderLevelComplete,
  renderGameOverWin,
  renderGameOverLose 
} from './rendering.js';
import { loadLevel } from './levelManager.js'; // Import loadLevel for reset function


const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };

  // Function to reset game state to start screen and cancel any auto-restart
  // This function is used for manual restarts (e.g., 'R' key)
  function resetGameAndCancelAutoRestart() {
    // Clear any pending auto-restart timer
    if (gameState.autoRestartTimerId) {
      clearTimeout(gameState.autoRestartTimerId);
      gameState.autoRestartTimerId = null;
    }
    gameState.autoRestartScheduled = false;
    gameState.lastGameOverPhase = null; // Clear this as we are explicitly going to START
    
    // Reset core game state variables to initial values
    gameState.gamePhase = GAME_PHASES.START;
    gameState.totalScore = 0;
    gameState.currentLevel = 1;
    // Other state variables like tubes, selectedTubeIndex, etc., will be reset by loadLevel(1, p)
    // when the user presses ENTER from the START screen.
    
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, action: 'game_reset' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  // NEW: Function to handle the actual auto-restart logic based on win/lose
  function handleAutoRestartLogic(p) {
    // Clear any pending auto-restart timer
    if (gameState.autoRestartTimerId) {
      clearTimeout(gameState.autoRestartTimerId);
      gameState.autoRestartTimerId = null;
    }
    gameState.autoRestartScheduled = false;

    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, action: 'auto_restart_triggered', fromPhase: gameState.lastGameOverPhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    if (gameState.lastGameOverPhase === GAME_PHASES.GAME_OVER_LOSE) {
      // Restart the current level
      loadLevel(gameState.currentLevel, p); // currentLevel is already set to the lost level
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, action: 'restarted_current_level', level: gameState.currentLevel },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.lastGameOverPhase === GAME_PHASES.GAME_OVER_WIN) {
      // Start a new game from level 1
      gameState.currentLevel = 1;
      gameState.totalScore = 0;
      loadLevel(1, p);
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, action: 'started_new_game', level: gameState.currentLevel },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    gameState.lastGameOverPhase = null; // Clear the stored phase after handling
  }
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.randomSeed(42);
    p.frameRate(60);
    
    // Initialize game state
    gameState.gamePhase = GAME_PHASES.START;
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // No test mode handling, always HUMAN
    
    // Update animations
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateAnimation(p);
    }
    
    // Render based on game phase
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      renderPlayingScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      renderPausedScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.LEVEL_COMPLETE) {
      renderLevelComplete(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
      renderGameOverWin(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGameOverLose(p);
    }

    // Auto-restart logic after game over
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      if (!gameState.autoRestartScheduled) {
        gameState.autoRestartScheduled = true;
        // Store the specific game over phase that triggered the auto-restart
        gameState.lastGameOverPhase = gameState.gamePhase; 
        gameState.autoRestartTimerId = setTimeout(() => {
          handleAutoRestartLogic(p); // Trigger the specific auto-restart logic
        }, 1000); // 1 second delay
      }
    } else {
      // If the game is not in a game over state, ensure any pending auto-restart is cleared
      if (gameState.autoRestartScheduled) {
        clearTimeout(gameState.autoRestartTimerId);
        gameState.autoRestartScheduled = false;
        gameState.autoRestartTimerId = null;
        gameState.lastGameOverPhase = null; // Clear the stored phase if no longer in game over
      }
    }
    
    // Log player info periodically
    if (p.frameCount % 60 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
  };
  
  p.keyPressed = function() {
    // Pass the p instance and the manual reset function to handleKeyPressed
    handleKeyPressed(p, resetGameAndCancelAutoRestart);
    return false; // Prevent default
  };
});

// Expose game instance globally
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
  
  // Update button styles
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (mode === 'HUMAN') {
    document.getElementById('humanModeBtn').classList.add('active');
  } 
};