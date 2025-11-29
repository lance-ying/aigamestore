// game.js - Main game file with p5.js instance mode

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  initializeLogs,
  logGameInfo
} from './globals.js';

import { Player } from './entities.js';
import { generateWorld, resetWorld } from './world.js';
import { updateCamera } from './camera.js';
import { handleKeyPress, handleKeyRelease, checkTimeLoopUnlock } from './input.js';
import { 
  renderStartScreen, 
  renderGame, 
  renderHUD, 
  renderDialogue,
  renderPausedOverlay, 
  renderGameOver 
} from './ui.js';

import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

const gameInstance = new p5(p => {
  
  // Initialize logs
  initializeLogs(p);
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42); // Set seed once for reproducibility
    
    // Initialize game state
    gameState.gamePhase = "START";
    gameState.controlMode = "HUMAN";
    gameState.frameCount = 0;
    gameState.lastFrameTime = p.millis();
    
    // Generate world
    generateWorld();
    
    // Create player
    gameState.player = new Player(300, 300);
    
    logGameInfo(p, { 
      event: "game_initialized",
      gamePhase: gameState.gamePhase 
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
      if (action) {
        // Simulate key press
        gameState.keys[action.keyCode] = true;
        if (action.keyCode === 32 && gameState.frameCount % 60 === 0) {
          // Trigger space action periodically
          handleKeyPress(p);
        }
      }
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
        
      case "PLAYING":
        updateGameState(p);
        renderGame(p);
        renderHUD(p);
        renderDialogue(p);
        break;
        
      case "PAUSED":
        renderGame(p);
        renderHUD(p);
        renderDialogue(p);
        renderPausedOverlay(p);
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGame(p);
        renderGameOver(p);
        break;
    }
  };
  
  function updateGameState(p) {
    // Update player
    if (gameState.player) {
      gameState.player.update(p);
    }
    
    // Update NPCs
    gameState.npcs.forEach(npc => npc.update(p));
    
    // Update tablets
    gameState.tablets.forEach(tablet => tablet.update(p));
    
    // Update particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
      const particle = gameState.particles[i];
      particle.update();
      if (particle.isDead()) {
        gameState.particles.splice(i, 1);
      }
    }
    
    // Update camera
    updateCamera(p);
    
    // Check time loop unlock
    checkTimeLoopUnlock();
  }
  
  p.keyPressed = function() {
    handleKeyPress(p);
  };
  
  p.keyReleased = function() {
    handleKeyRelease(p);
  };
  
}, document.body);

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switcher
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
  
  logGameInfo(gameInstance, { 
    event: "control_mode_changed", 
    mode: mode 
  });
};