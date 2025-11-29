// game.js - Main game loop and p5.js instance

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED } from './globals.js';
import { initializeInput, handleGameplayInput } from './input.js';
import { renderStartScreen, renderUI, renderPausedOverlay, renderGameOver, renderBackground } from './ui.js';
import { updateCamera } from './camera.js';
import { setupLevel1 } from './levelSetup.js';
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
    
    // Initialize game state
    gameState.gamePhase = PHASE_START;
    gameState.controlMode = "HUMAN";
    gameState.frameCount = 0;
    gameState.lastFrameTime = p.millis();
    
    // Initialize input handlers
    initializeInput(p);
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, controlMode: gameState.controlMode },
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
    p.background(20, 20, 30);
    
    // Handle different game phases
    switch (gameState.gamePhase) {
      case PHASE_START:
        renderStartScreen(p);
        break;
        
      case PHASE_PLAYING:
        // Handle automated testing
        if (gameState.controlMode !== "HUMAN") {
          const action = get_automated_testing_action(gameState);
          if (action) {
            simulateKeyPress(p, action.keyCode);
          }
        }
        
        // Handle input
        handleGameplayInput(p);
        
        // Update game
        updateGame(p);
        
        // Render game
        renderGame(p);
        
        // Render UI
        renderUI(p);
        break;
        
      case PHASE_PAUSED:
        // Render game in background
        renderGame(p);
        renderUI(p);
        
        // Render pause overlay
        renderPausedOverlay(p);
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        // Render game in background
        renderGame(p);
        
        // Render game over screen
        renderGameOver(p);
        break;
    }
  };
  
  function updateGame(p) {
    // Initialize level if needed
    if (!gameState.brother || !gameState.sister) {
      setupLevel1(p);
    }
    
    // Update characters
    if (gameState.brother) gameState.brother.update(p);
    if (gameState.sister) gameState.sister.update(p);
    
    // Update collectibles
    for (const collectible of gameState.collectibles) {
      collectible.update(p);
    }
    
    // Update creatures
    for (const creature of gameState.creatures) {
      creature.update(p);
    }
    
    // Update puzzle elements
    for (const element of gameState.puzzleElements) {
      if (element.update) {
        element.update(p);
      }
    }
    
    // Update particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
      const particle = gameState.particles[i];
      particle.update();
      if (particle.isDead()) {
        gameState.particles.splice(i, 1);
      }
    }
    
    // Update camera
    updateCamera();
  }
  
  function renderGame(p) {
    // Render background
    renderBackground(p);
    
    // Render platforms
    for (const platform of gameState.platforms) {
      platform.render(p);
    }
    
    // Render puzzle elements
    for (const element of gameState.puzzleElements) {
      element.render(p);
    }
    
    // Render collectibles
    for (const collectible of gameState.collectibles) {
      collectible.render(p);
    }
    
    // Render creatures
    for (const creature of gameState.creatures) {
      creature.render(p);
    }
    
    // Render characters
    if (gameState.brother) gameState.brother.render(p);
    if (gameState.sister) gameState.sister.render(p);
    
    // Render particles
    for (const particle of gameState.particles) {
      particle.render(p);
    }
  }
  
  function simulateKeyPress(p, keyCode) {
    // Simulate key press for automated testing
    const fakeEvent = { keyCode: keyCode };
    
    // This is a simplified simulation
    if (!p.keyIsDown || !p.keyIsDown(keyCode)) {
      // Trigger keyPressed event manually
      p.keyCode = keyCode;
      if (p.keyPressed) {
        p.keyPressed();
      }
    }
  }
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
  
  // Log mode change
  if (gameInstance.logs && gameInstance.logs.game_info) {
    gameInstance.logs.game_info.push({
      data: { controlMode: mode },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
};