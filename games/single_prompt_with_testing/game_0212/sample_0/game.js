// game.js - Main game loop and p5.js instance

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  getGameState
} from './globals.js';
import { setupInput, handleGameplayInput } from './input.js';
import { initializeGame, startNewGame } from './game_init.js';
import { 
  renderStartScreen, 
  renderHUD, 
  renderPausedOverlay, 
  renderGameOver 
} from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

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
    
    // Initialize game
    gameState.gamePhase = "START";
    gameState.controlMode = "HUMAN";
    
    initializeGame(p);
    
    // Setup input handlers
    setupInput(p);
    
    // Log initial state
    p.logs.game_info.push({
      data: { 
        gamePhase: gameState.gamePhase,
        controlMode: gameState.controlMode
      },
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
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
      const testAction = get_automated_testing_action(gameState);
      if (testAction) {
        // Simulate key press
        p.keyCode = testAction.keyCode;
        p.keyPressed();
      }
    }
    
    // Background
    p.background(10, 10, 30);
    
    // Update and render based on game phase
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
        
      case "PLAYING":
        updateGame(p);
        renderGame(p);
        renderHUD(p);
        break;
        
      case "PAUSED":
        renderGame(p);
        renderHUD(p);
        renderPausedOverlay(p);
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGame(p);
        renderGameOver(p);
        break;
    }
  };
});

function updateGame(p) {
  // Start game if not started
  if (!gameState.player) {
    startNewGame();
  }
  
  // Handle input
  handleGameplayInput();
  
  // Update star field
  if (gameState.stars) {
    gameState.stars.update(p.frameCount);
  }
  
  // Update all entities
  if (gameState.player) {
    gameState.player.update(p);
  }
  
  for (let i = gameState.asteroids.length - 1; i >= 0; i--) {
    gameState.asteroids[i].update(p);
  }
  
  for (let i = gameState.drones.length - 1; i >= 0; i--) {
    gameState.drones[i].update(p);
  }
  
  for (let i = gameState.crystals.length - 1; i >= 0; i--) {
    gameState.crystals[i].update(p);
  }
  
  for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
    gameState.projectiles[i].update(p);
  }
  
  for (let i = gameState.enemyProjectiles.length - 1; i >= 0; i--) {
    gameState.enemyProjectiles[i].update(p);
  }
  
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    gameState.particles[i].update();
  }
}

function renderGame(p) {
  // Render stars
  if (gameState.stars) {
    gameState.stars.render(p);
  }
  
  // Render all entities (back to front)
  for (const asteroid of gameState.asteroids) {
    asteroid.render(p);
  }
  
  for (const crystal of gameState.crystals) {
    crystal.render(p);
  }
  
  for (const drone of gameState.drones) {
    drone.render(p);
  }
  
  if (gameState.player) {
    gameState.player.render(p);
  }
  
  for (const projectile of gameState.projectiles) {
    projectile.render(p);
  }
  
  for (const enemyProjectile of gameState.enemyProjectiles) {
    enemyProjectile.render(p);
  }
  
  for (const particle of gameState.particles) {
    particle.render(p);
  }
}

// Expose game instance globally
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
  
  const activeBtn = document.getElementById(
    mode === 'HUMAN' ? 'humanModeBtn' : 
    mode === 'TEST_1' ? 'test_1_ModeBtn' : 
    'test_2_ModeBtn'
  );
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  console.log(`Control mode set to: ${mode}`);
};