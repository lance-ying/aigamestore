// game.js - Main game instance and loop

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { initGame, updateGameLogic } from './game_logic.js';
import { initInput, handleKeyPress, handleKeyRelease, processGameplayInputs } from './input.js';
import { updateTowerPhysics, checkClimberCollisions } from './physics.js';
import { renderStartScreen, renderHUD, renderPausedOverlay, renderGameOver, renderGround, renderBackground } from './ui.js';
import { get_automated_testing_action } from './automated_testing.js';

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
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize game
    initGame();
    initInput();
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Update frame count
    gameState.frameCount = p.frameCount;
    
    // Update delta time
    const currentTime = p.millis();
    gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = currentTime;
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        // Simulate key press
        if (!gameState.keys[action.keyCode]) {
          handleKeyPress(p, action.keyCode);
        }
        
        // Auto-release after a frame for most keys
        if (action.keyCode === 32 || action.keyCode === 90) { // SPACE or Z
          setTimeout(() => {
            handleKeyRelease(p, action.keyCode);
          }, 50);
        }
      }
    }
    
    // Clear screen
    p.background(20, 30, 50);
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
        renderGame(p);
        renderHUD(p);
        updateGame(p);
        break;
        
      case GAME_PHASES.PAUSED:
        renderGame(p);
        renderHUD(p);
        renderPausedOverlay(p);
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGame(p);
        renderGameOver(p);
        break;
    }
  };
  
  function renderGame(p) {
    // Render background
    renderBackground(p);
    
    // Render ground
    renderGround(p);
    
    // Render goat
    if (gameState.goat) {
      gameState.goat.render(p);
    }
    
    // Render climbers in tower
    gameState.climbers.forEach(climber => {
      climber.render(p);
    });
    
    // Render player
    if (gameState.player) {
      gameState.player.render(p);
    }
    
    // Render particles
    gameState.particles.forEach(particle => {
      particle.render(p);
    });
  }
  
  function updateGame(p) {
    // Process inputs
    processGameplayInputs();
    
    // Update goat
    if (gameState.goat) {
      gameState.goat.update();
    }
    
    // Update tower physics
    updateTowerPhysics();
    
    // Update climbers
    gameState.climbers.forEach(climber => {
      climber.update();
    });
    
    // Check climber collisions
    checkClimberCollisions();
    
    // Update player
    if (gameState.player) {
      gameState.player.update();
    }
    
    // Update game logic
    updateGameLogic();
  }
  
  p.keyPressed = function() {
    handleKeyPress(p, p.keyCode);
  };
  
  p.keyReleased = function() {
    handleKeyRelease(p, p.keyCode);
  };
}, document.body);

// Expose game instance globally
window.gameInstance = gameInstance;

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
  
  const activeBtn = mode === 'HUMAN' ? 'humanModeBtn' : 
                    mode === 'TEST_1' ? 'test_1_ModeBtn' : 
                    'test_2_ModeBtn';
  const btn = document.getElementById(activeBtn);
  if (btn) {
    btn.classList.add('active');
  }
};