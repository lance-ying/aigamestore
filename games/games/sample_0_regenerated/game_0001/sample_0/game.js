// Main game file with p5.js instance mode
import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './entities.js';
import { updatePhysics } from './physics.js';
import { initializeLevelGeneration, updateLevelGeneration, resetLevelGeneration } from './level_generator.js';
import { setupInput } from './input.js';
import { renderStartScreen, renderPlayingScreen, renderPausedScreen, renderGameOverScreen } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

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
    
    // Initialize game state
    gameState.gamePhase = "START";
    gameState.controlMode = "HUMAN";
    gameState.lastFrameTime = p.millis();
    
    // Setup input handlers
    setupInput(p);
    
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
    
    // Background - exactly one call
    p.background(20, 20, 30);
    
    // Handle automated testing
    if (gameState.gamePhase === "PLAYING" && 
        gameState.controlMode !== "HUMAN") {
      handleAutomatedTesting(p);
    }
    
    // Update and render based on game phase
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
        
      case "PLAYING":
        updateGame(p);
        renderPlayingScreen(p);
        break;
        
      case "PAUSED":
        renderPlayingScreen(p);
        renderPausedScreen(p);
        break;
        
      case "GAME_OVER_LOSE":
      case "GAME_OVER_WIN":
        renderPlayingScreen(p);
        renderGameOverScreen(p);
        break;
    }
  };
  
  function updateGame(p) {
    // Update speed (gradually increase)
    gameState.currentSpeed = Math.min(
      gameState.maxSpeed,
      gameState.baseSpeed + (gameState.frameCount * gameState.speedIncrement)
    );
    
    // Update level generation
    updateLevelGeneration(p);
    
    // Update physics and entities
    updatePhysics(p);
    
    // Check win condition (optional - can run forever)
    // Win after 10000m distance
    if (gameState.distance >= 10000) {
      gameState.gamePhase = "GAME_OVER_WIN";
    }
  }
  
  function handleAutomatedTesting(p) {
    const action = get_automated_testing_action(gameState);
    
    if (action && action.keyCode) {
      // Simulate key press
      const simulatedEvent = {
        keyCode: action.keyCode
      };
      
      // Execute the action
      if (gameState.player && gameState.player.isAlive) {
        switch (action.keyCode) {
          case 37: // LEFT
            gameState.player.moveLeft();
            break;
          case 39: // RIGHT
            gameState.player.moveRight();
            break;
          case 38: // UP
          case 32: // SPACE
            gameState.player.jump();
            break;
          case 40: // DOWN
            gameState.player.slide();
            break;
        }
      }
      
      // Log automated action
      if (p.logs && p.logs.inputs) {
        p.logs.inputs.push({
          input_type: 'automated',
          data: { keyCode: action.keyCode, mode: gameState.controlMode },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
  
  // Reset function
  window.gameResetFunction = function(p) {
    // Reset game state
    gameState.score = 0;
    gameState.coins = 0;
    gameState.distance = 0;
    gameState.distanceTraveled = 0;
    gameState.coinsCollected = 0;
    gameState.obstaclesAvoided = 0;
    gameState.turnsCompleted = 0;
    gameState.currentSpeed = gameState.baseSpeed;
    gameState.showTutorial = true;
    
    // Clear arrays
    gameState.entities = [];
    gameState.segments = [];
    gameState.obstacles = [];
    gameState.collectibles = [];
    gameState.particles = [];
    
    // Reset level generation
    resetLevelGeneration();
    
    // Create new player
    gameState.player = new Player(0, 0, 0);
    
    // Initialize level
    initializeLevelGeneration();
    
    // Log reset
    if (p.logs && p.logs.game_info) {
      p.logs.game_info.push({
        data: { event: 'game_reset' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  };
  
  // Initialize game when starting to play
  p.keyPressed = function() {
    if (p.keyCode === 13 && gameState.gamePhase === "START") {
      window.gameResetFunction(p);
    }
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
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
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : 
                                           mode === 'TEST_1' ? 'test_1_ModeBtn' : 
                                           'test_2_ModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  // Log mode change
  if (gameInstance.logs && gameInstance.logs.game_info) {
    gameInstance.logs.game_info.push({
      data: { event: 'control_mode_changed', mode: mode },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
};