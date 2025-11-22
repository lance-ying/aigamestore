// game.js - Main game file

import { gameState, getGameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, BIRD_TYPES } from './globals.js';
import { Bird } from './entities.js';
import { createLevel, checkLevelComplete, checkLevelFailed } from './level_manager.js';
import { handleInput, processActions } from './input_handler.js';
import { checkCollisions, updatePhysics } from './physics.js';
import { renderStartScreen, renderPlayingScreen, renderGameOverScreen } from './renderer.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // p5 setup function
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Log initial game state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Initialize first bird
    resetForNewLevel(p);
  };
  
  // p5 draw function
  p.draw = function() {
    gameState.frameCount = p.frameCount;
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
        // Handle input
        const actions = handleInput(p);
        processActions(p, actions);
        
        // Update physics
        updatePhysics();
        checkCollisions(p);
        
        // Check win/lose conditions
        if (checkLevelComplete()) {
          changeGamePhase(p, GAME_PHASES.GAME_OVER_WIN);
        } else if (checkLevelFailed()) {
          changeGamePhase(p, GAME_PHASES.GAME_OVER_LOSE);
        }
        
        // Check if current bird is done and we need a new one
        if (gameState.currentBird && !gameState.currentBird.active && gameState.birds.length === 0) {
          if (gameState.birdsRemaining > 0) {
            setTimeout(() => prepareNextBird(p), 1000);
          }
        }
        
        // Render
        renderPlayingScreen(p);
        break;
        
      case GAME_PHASES.PAUSED:
        renderPlayingScreen(p);
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOverScreen(p);
        break;
    }
  };
  
  // Key pressed handler
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // ENTER - Start game
    if (p.keyCode === 13) {
      if (gameState.gamePhase === GAME_PHASES.START) {
        changeGamePhase(p, GAME_PHASES.PLAYING);
        resetForNewLevel(p);
      }
    }
    
    // ESC - Pause/Unpause
    if (p.keyCode === 27) {
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        changeGamePhase(p, GAME_PHASES.PAUSED);
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        changeGamePhase(p, GAME_PHASES.PLAYING);
      }
    }
    
    // R - Restart
    if (p.keyCode === 82) {
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        resetGame(p);
        changeGamePhase(p, GAME_PHASES.START);
      }
    }
    
    // SPACE - Launch or ability (handled in input_handler for timing)
    if (p.keyCode === 32 && gameState.controlMode === "HUMAN") {
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        if (gameState.isAiming && !gameState.birdLaunched && gameState.currentBird) {
          processActions(p, { launch: true });
        } else if (gameState.currentBird && gameState.currentBird.launched && !gameState.currentBird.abilityUsed) {
          processActions(p, { ability: true });
        }
      }
    }
    
    return false; // Prevent default
  };
  
  function changeGamePhase(p, newPhase) {
    gameState.gamePhase = newPhase;
    
    p.logs.game_info.push({
      data: { gamePhase: newPhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function resetGame(p) {
    gameState.score = 0;
    gameState.gems = 100;
    gameState.level = 1;
    gameState.birdsRemaining = 3;
    gameState.entities = [];
    gameState.birds = [];
    gameState.pigs = [];
    gameState.structures = [];
    gameState.particles = [];
    gameState.currentBird = null;
    gameState.isAiming = true;
    gameState.birdLaunched = false;
    gameState.slingshotAngle = -45;
    gameState.slingshotPower = 50;
  }
  
  function resetForNewLevel(p) {
    gameState.birds = [];
    gameState.particles = [];
    gameState.isAiming = true;
    gameState.birdLaunched = false;
    gameState.slingshotAngle = -45;
    gameState.slingshotPower = 50;
    
    createLevel(p, gameState.level);
    prepareNextBird(p);
  }
  
  function prepareNextBird(p) {
    if (gameState.birdsRemaining <= 0) return;
    
    gameState.birdsRemaining--;
    gameState.currentBird = new Bird(p, 100, 290, gameState.selectedBirdType);
    gameState.isAiming = true;
    gameState.birdLaunched = false;
    
    // Log player info
    p.logs.player_info.push({
      screen_x: gameState.currentBird.x,
      screen_y: gameState.currentBird.y,
      game_x: gameState.currentBird.x,
      game_y: gameState.currentBird.y,
      framecount: p.frameCount
    });
  }
});

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
  
  const activeBtn = document.getElementById(
    mode === 'HUMAN' ? 'humanModeBtn' : 
    mode === 'TEST_1' ? 'test_1_ModeBtn' : 
    'test_2_ModeBtn'
  );
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

export default gameInstance;