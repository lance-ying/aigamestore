// game.js - Main game file with p5.js instance

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  getGameState
} from './globals.js';
import { handleKeyPress, handleKeyRelease, handlePlayerInput, updateGearBoy } from './input.js';
import { updateCamera } from './camera.js';
import { renderBackground, renderEntities } from './renderer.js';
import { renderStartScreen, renderUI, renderPausedOverlay, renderGameOver } from './ui.js';
import { initializeWorld } from './world.js';
import { checkFurnitureCollision } from './physics.js';
import { get_automated_testing_action } from './automated_testing_controller.js';
import { GhostParticle } from './entities.js';

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
    
    // Initialize game state
    gameState.gamePhase = PHASE_START;
    gameState.controlMode = "HUMAN";
    gameState.lastFrameTime = p.millis();
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Update frame count and delta time
    gameState.frameCount = p.frameCount;
    const currentTime = p.millis();
    gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = currentTime;
    
    // Single background call
    p.background(20, 15, 25);
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === PHASE_PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        handleKeyPress(p, action.keyCode);
        // Simulate key release after a few frames
        if (p.frameCount % 5 === 0) {
          handleKeyRelease(p, action.keyCode);
        }
      }
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case PHASE_START:
        renderStartScreen(p);
        break;
        
      case PHASE_PLAYING:
        // Initialize world on first frame of playing
        if (!gameState.player) {
          initializeWorld();
        }
        
        // Update game logic
        updateGame(p);
        
        // Render game
        renderGame(p);
        
        // Render UI
        renderUI(p);
        break;
        
      case PHASE_PAUSED:
        // Render game state (frozen)
        renderGame(p);
        
        // Render pause overlay
        renderPausedOverlay(p);
        break;
        
      case PHASE_GAME_OVER_WIN:
      case PHASE_GAME_OVER_LOSE:
        // Render final game state
        renderGame(p);
        
        // Render game over screen
        renderGameOver(p);
        break;
    }
  };
  
  function updateGame(p) {
    // Handle player input
    handlePlayerInput();
    
    // Update Gear Boy
    updateGearBoy();
    
    // Update player
    if (gameState.player) {
      gameState.player.update(p);
      checkFurnitureCollision(gameState.player);
    }
    
    // Update enemies
    gameState.enemies.forEach(enemy => enemy.update(p));
    
    // Update clues
    gameState.clues.forEach(clue => clue.update(p));
    
    // Update particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
      gameState.particles[i].update();
      if (gameState.particles[i].isDead()) {
        gameState.particles.splice(i, 1);
      }
    }
    
    // Spawn ghost particles when Gear Boy is active
    if (gameState.gearBoyActive && p.frameCount % 5 === 0) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 100 + 50;
      const x = gameState.player.x + Math.cos(angle) * distance;
      const y = gameState.player.y + Math.sin(angle) * distance;
      new GhostParticle(x, y);
    }
    
    // Update camera
    updateCamera();
  }
  
  function renderGame(p) {
    // Render background
    renderBackground(p);
    
    // Render all entities
    renderEntities(p);
  }
  
  p.keyPressed = function() {
    handleKeyPress(p, p.keyCode);
  };
  
  p.keyReleased = function() {
    handleKeyRelease(p, p.keyCode);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (mode === "HUMAN") {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === "TEST_1") {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === "TEST_2") {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
  
  console.log(`Control mode switched to: ${mode}`);
};