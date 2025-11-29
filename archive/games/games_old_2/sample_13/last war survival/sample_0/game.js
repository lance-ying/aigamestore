// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, FPS, PHASE_START, PHASE_PLAYING, PHASE_PAUSED } from './globals.js';
import { updateCombat } from './combat.js';
import { updateResourceGeneration } from './basebuilding.js';
import { drawStartScreen, drawCombatScene, drawBaseBuilding, drawLevelTransition, drawGameOver, drawPauseOverlay } from './rendering.js';
import { handleKeyPressed, handleMouseClicked } from './input.js';
import { updateTestMode } from './testing.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(FPS);
    p.randomSeed(42);
    
    // Initialize game state
    gameState.gamePhase = PHASE_START;
    gameState.gameSubState = 'MENU';
    
    // Load high score
    const savedHighScore = localStorage.getItem('lastWarHighScore');
    if (savedHighScore) {
      gameState.highScore = parseInt(savedHighScore);
    }
    
    // Log initialization
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, action: "init" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Update test mode
    updateTestMode(p);
    
    // Render based on game phase
    if (gameState.gamePhase === PHASE_START) {
      drawStartScreen(p);
    } else if (gameState.gamePhase === PHASE_PLAYING) {
      if (gameState.gameSubState === 'COMBAT') {
        updateCombat(p);
        drawCombatScene(p);
      } else if (gameState.gameSubState === 'BASE_BUILDING') {
        updateResourceGeneration();
        drawBaseBuilding(p);
      } else if (gameState.gameSubState === 'LEVEL_TRANSITION') {
        drawLevelTransition(p);
        gameState.transitionTimer--;
        if (gameState.transitionTimer <= 0) {
          gameState.gameSubState = 'BASE_BUILDING';
        }
      } else if (gameState.gameSubState === 'GAME_OVER_LOSE' || gameState.gameSubState === 'GAME_OVER_WIN') {
        drawGameOver(p);
      }
    }
    
    // Draw pause overlay
    if (gameState.gamePhase === PHASE_PAUSED) {
      // Redraw last frame
      if (gameState.gameSubState === 'COMBAT') {
        drawCombatScene(p);
      } else if (gameState.gameSubState === 'BASE_BUILDING') {
        drawBaseBuilding(p);
      }
      drawPauseOverlay(p);
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === 'HUMAN') {
      handleKeyPressed(p, p.key, p.keyCode);
    }
  };
  
  p.mouseClicked = function() {
    if (gameState.controlMode === 'HUMAN') {
      handleMouseClicked(p, p.mouseX, p.mouseY);
    }
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Expose getGameState function
window.getGameState = function() {
  return gameState;
};

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  if (mode === 'HUMAN') {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === 'TEST_1') {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === 'TEST_2') {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
};