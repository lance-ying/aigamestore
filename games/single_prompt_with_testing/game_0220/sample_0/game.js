// game.js - Main game loop and p5.js instance

import { 
  gameState, 
  resetGame, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  getGameState
} from './globals.js';

import { handleKeyPress, handleKeyRelease, handleGameplayInput } from './input.js';
import { updateCamera } from './camera.js';
import { renderStartScreen, renderUI, renderPausedOverlay, renderGameOver, renderBackground } from './ui.js';
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
    resetGame();
    
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
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        // Simulate key press
        p.keyCode = action.keyCode;
        handleKeyPress(p);
      }
    }
    
    // Single background call
    p.background(...(gameState.gamePhase === "START" ? [10, 5, 15] : [10, 5, 15]));
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
        
      case "PLAYING":
        updateGame(p);
        renderGame(p);
        renderUI(p);
        break;
        
      case "PAUSED":
        renderGame(p);
        renderPausedOverlay(p);
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGame(p);
        renderGameOver(p);
        break;
    }
    
    // Apply screen flash
    if (gameState.flashAmount > 0) {
      p.fill(180, 0, 20, gameState.flashAmount * 255);
      p.noStroke();
      p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      gameState.flashAmount *= 0.9;
      if (gameState.flashAmount < 0.01) {
        gameState.flashAmount = 0;
      }
    }
  };
  
  p.keyPressed = function() {
    handleKeyPress(p);
  };
  
  p.keyReleased = function() {
    handleKeyRelease(p);
  };
  
  function updateGame(p) {
    // Handle gameplay input
    handleGameplayInput(p);
    
    // Update camera
    updateCamera();
    
    // Update blood trail timer
    if (gameState.bloodTrailActive) {
      gameState.bloodTrailTimer--;
      if (gameState.bloodTrailTimer <= 0) {
        gameState.bloodTrailActive = false;
      }
    }
    
    // Update blood trail cooldown
    if (gameState.bloodTrailCooldown > 0) {
      gameState.bloodTrailCooldown--;
    }
    
    // Update all entities
    if (gameState.player) {
      gameState.player.update(p);
      
      // Log player position periodically
      if (gameState.frameCount % 30 === 0) {
        p.logs.player_info.push({
          screen_x: gameState.player.x - gameState.cameraX,
          screen_y: gameState.player.y - gameState.cameraY,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          framecount: gameState.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    for (let human of [...gameState.humans]) {
      human.update(p);
    }
    
    for (let tentacle of [...gameState.tentacles]) {
      tentacle.update(p);
    }
    
    // Update particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
      const particle = gameState.particles[i];
      particle.update();
      if (particle.isDead()) {
        gameState.particles.splice(i, 1);
      }
    }
  }
  
  function renderGame(p) {
    // Render background
    renderBackground(p);
    
    // Render walls
    for (let wall of gameState.walls) {
      wall.render(p);
    }
    
    // Render tentacles
    for (let tentacle of gameState.tentacles) {
      tentacle.render(p);
    }
    
    // Render humans
    for (let human of gameState.humans) {
      human.render(p);
    }
    
    // Render player
    if (gameState.player) {
      gameState.player.render(p);
    }
    
    // Render particles
    for (let particle of gameState.particles) {
      particle.render(p);
    }
  }
});

// Expose game instance
window.gameInstance = gameInstance;

// Control mode switcher
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
                    mode === 'TEST_2' ? 'test_2_ModeBtn' : null;
  
  if (activeBtn) {
    const btn = document.getElementById(activeBtn);
    if (btn) {
      btn.classList.add('active');
    }
  }
};