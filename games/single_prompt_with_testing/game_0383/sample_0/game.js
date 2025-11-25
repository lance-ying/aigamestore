// game.js
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, GADGET_COOLDOWN } from './globals.js';
import { createWorld } from './world.js';
import { handleKeyPressed, handleKeyReleased, processMovement } from './input.js';
import { renderStartScreen, renderPlayingScreen, renderPausedScreen, renderGameOverScreen } from './rendering.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize logs (write-only)
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Create world
    createWorld();
    
    // Start in START phase
    p.noLoop();
  };
  
  p.draw = function() {
    gameState.frameCount = p.frameCount;
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
        // Update game logic
        updateGame(p);
        renderPlayingScreen(p);
        break;
        
      case GAME_PHASES.PAUSED:
        renderPausedScreen(p);
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOverScreen(p);
        break;
    }
  };
  
  function updateGame(p) {
    // Handle automated testing controls
    if (gameState.controlMode !== "HUMAN") {
      const actions = get_automated_testing_action(gameState);
      if (actions && Array.isArray(actions)) {
        // Clear current keys
        gameState.keysPressed = {};
        // Set new keys
        for (const keyCode of actions) {
          gameState.keysPressed[keyCode] = true;
        }
      }
    }
    
    // Process movement
    processMovement(p);
    
    // Update entities
    for (const entity of gameState.entities) {
      if (entity.update) {
        entity.update(p);
      }
    }
    
    // Update exit zone
    if (gameState.exitZone) {
      gameState.exitZone.update(p);
      if (gameState.exitZone.checkWin()) {
        gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase, score: gameState.score },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Update dialog timer
    if (gameState.dialogTimer > 0) {
      gameState.dialogTimer--;
      if (gameState.dialogTimer === 0) {
        gameState.currentDialog = null;
      }
    }
    
    // Update gadget cooldown
    if (gameState.gadgetCooldown > 0) {
      gameState.gadgetCooldown--;
    }
    
    // Log player info periodically
    if (p.frameCount % 30 === 0 && gameState.player) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
  }
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
    return false;
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p, p.key, p.keyCode);
    return false;
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn',
    'TEST_3': 'test_3_ModeBtn',
    'TEST_4': 'test_4_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  console.log(`Control mode set to: ${mode}`);
};