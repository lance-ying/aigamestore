// game.js - Main game loop

import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';
import { generateWorld } from './world.js';
import { Player } from './player.js';
import { handleKeyPress, handleKeyRelease } from './input.js';
import { renderStartScreen, renderHUD, renderPausedOverlay, renderGameOver, renderMiniMap } from './ui.js';
import { renderWorld, renderEntities } from './render.js';
import { updateParticles } from './particles.js';
import { updateCameraShake } from './utils.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

const gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };
  
  let initialized = false;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    gameState.gamePhase = "START";
    gameState.controlMode = "HUMAN";
    gameState.lastFrameTime = p.millis();
    
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, action: "setup_complete" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Update frame tracking
    gameState.frameCount = p.frameCount;
    const currentTime = p.millis();
    gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = currentTime;
    
    // Update camera shake
    updateCameraShake(p);
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
        
      case "PLAYING":
        if (!initialized) {
          initializeGame(p);
          initialized = true;
        }
        
        // Handle automated testing
        if (gameState.controlMode !== "HUMAN") {
          const action = get_automated_testing_action(gameState);
          if (action) {
            simulateKeyPress(action.keyCode);
          }
        }
        
        updateGame(p);
        renderGame(p);
        break;
        
      case "PAUSED":
        renderGame(p);
        renderPausedOverlay(p);
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGame(p);
        renderGameOver(p);
        initialized = false;
        break;
    }
  };
  
  function initializeGame(p) {
    // Generate world
    generateWorld(p);
    
    // Create player in first room
    if (gameState.worldRooms && gameState.worldRooms.length > 0) {
      const startRoom = gameState.worldRooms[0];
      const playerX = (startRoom.x + startRoom.width / 2) * 30;
      const playerY = (startRoom.y + startRoom.height / 2) * 30;
      new Player(playerX, playerY);
    } else {
      new Player(300, 300);
    }
    
    p.logs.game_info.push({
      data: { action: "game_initialized", crystals: gameState.totalCrystals },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function updateGame(p) {
    // Update player
    if (gameState.player) {
      gameState.player.update(p);
    }
    
    // Update enemies
    for (const enemy of gameState.enemies) {
      enemy.update(p);
    }
    
    // Update collectibles
    for (const collectible of gameState.collectibles) {
      collectible.update(p);
    }
    
    // Update hazards
    for (const hazard of gameState.hazards) {
      hazard.update(p);
    }
    
    // Update projectiles
    for (const projectile of gameState.projectiles) {
      projectile.update(p);
    }
    
    // Update particles
    updateParticles();
  }
  
  function renderGame(p) {
    p.background(...COLORS.background);
    
    // Render world
    renderWorld(p);
    
    // Render entities
    renderEntities(p);
    
    // Render UI
    renderHUD(p);
    renderMiniMap(p);
  }
  
  function simulateKeyPress(keyCode) {
    if (!gameState.keys[keyCode]) {
      gameState.keys[keyCode] = true;
      
      // Simulate key press event
      p.logs.inputs.push({
        input_type: 'keyPressed',
        data: { keyCode: keyCode, automated: true },
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
      
      // Release after a short delay
      setTimeout(() => {
        gameState.keys[keyCode] = false;
      }, 100);
    }
  }
  
  p.keyPressed = function() {
    handleKeyPress(p);
  };
  
  p.keyReleased = function() {
    handleKeyRelease(p);
  };
}, document.body);

// Expose game instance and control mode setter
window.gameInstance = gameInstance;

window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  const activeBtn = document.getElementById(`${mode === 'HUMAN' ? 'humanModeBtn' : mode + '_ModeBtn'}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  gameInstance.logs.game_info.push({
    data: { action: "control_mode_changed", mode: mode },
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
};