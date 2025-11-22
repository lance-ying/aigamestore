import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { handleKeyPressed, handleKeyHeld } from './input.js';
import { updateGame, getCurrentSceneBuffer, checkObjectClick } from './gameLogic.js';
import { updateTestController } from './testController.js';
import {
  drawStartScreen,
  drawGameUI,
  drawObjectList,
  drawPausedIndicator,
  drawLevelCompleteScreen,
  drawGameOverScreen,
  drawIncorrectClickFeedback,
  drawHintFeedback
} from './ui.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Load high score from localStorage
    if (typeof localStorage !== 'undefined') {
      const savedHighScore = localStorage.getItem('hiddenObjectsHighScore');
      if (savedHighScore) {
        gameState.highScore = parseInt(savedHighScore);
      }
    }
    
    // Initialize player (required by spec, not used in this game)
    gameState.player = { x: 0, y: 0 };
    
    p.logs.game_info.push({
      data: { phase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(20, 30, 40);
    
    // Update test controller
    updateTestController(p);
    
    // Handle keyboard input for panning
    if (gameState.controlMode === "HUMAN") {
      handleKeyHeld(p);
    }
    
    // Game loop based on phase
    if (gameState.gamePhase === GAME_PHASES.START) {
      drawStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGame(p);
      drawGameplay(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      drawGameplay(p);
      drawPausedIndicator(p);
    } else if (gameState.gamePhase === GAME_PHASES.LEVEL_COMPLETE) {
      drawGameplay(p);
      drawLevelCompleteScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
      drawGameOverScreen(p, true);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      drawGameOverScreen(p, false);
    }
  };
  
  function drawGameplay(p) {
    const sceneBuffer = getCurrentSceneBuffer();
    
    if (sceneBuffer) {
      p.push();
      
      // Apply zoom and pan transformations
      p.translate(gameState.panOffsetX, gameState.panOffsetY);
      p.scale(gameState.currentZoomLevel);
      
      // Draw scene
      p.image(sceneBuffer, 0, 0);
      
      // Draw feedback effects
      drawIncorrectClickFeedback(p);
      drawHintFeedback(p);
      
      p.pop();
    }
    
    // Draw UI on top
    drawGameUI(p);
  }
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.keyCode);
    }
  };
  
  p.mousePressed = function() {
    // Note: Mouse control is not allowed by hard constraints
    // But we need to handle clicks for automated testing
    // Only process if in test mode for automated clicking
    if (gameState.controlMode !== "HUMAN") {
      return;
    }
    
    // This would be for manual testing only - not part of gameplay
    // as hard constraints specify keyboard only
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Expose getGameState globally (already done in globals.js but ensure it's available)
window.getGameState = getGameState;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = document.getElementById(`${mode === 'HUMAN' ? 'human' : mode.toLowerCase()}_ModeBtn`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  console.log(`Control mode set to: ${mode}`);
};