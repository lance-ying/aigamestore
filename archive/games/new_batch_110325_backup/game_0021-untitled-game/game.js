// game.js - Main game file
import { gameState } from './globals.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, MODE_HUMAN } from './globals.js';
import { Cursor } from './entities.js';
import { updateGame, tapNumber, cutNumber } from './game_logic.js';
import { drawStartScreen, drawPlayingScreen, drawGameOverScreen } from './rendering.js';
import { handleKeyPressed, handleKeyReleased, processMovement } from './input_handler.js';
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
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize cursor
    gameState.cursor = new Cursor(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    gameState.player = gameState.cursor;
    
    // Log initialization
    p.logs.game_info.push({
      data: { phase: PHASE_START, action: "initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Single background call at top
    p.background(20, 25, 40);
    
    // Handle automated testing
    if (gameState.gamePhase === PHASE_PLAYING && gameState.controlMode !== MODE_HUMAN) {
      const actions = get_automated_testing_action(gameState);
      
      // Clear previous automated keys
      for (const key in gameState.keys) {
        if ([37, 38, 39, 40, 32, 16, 90].includes(parseInt(key))) {
          gameState.keys[key] = false;
        }
      }
      
      // Apply automated actions
      for (const action of actions) {
        if (action === "ArrowLeft") gameState.keys[37] = true;
        else if (action === "ArrowRight") gameState.keys[39] = true;
        else if (action === "ArrowUp") gameState.keys[38] = true;
        else if (action === "ArrowDown") gameState.keys[40] = true;
        else if (action === "Space") {
          tapNumber(p, gameState.cursor);
        }
        else if (action === "KeyZ") {
          cutNumber(p, gameState.cursor);
        }
        else if (action === "Shift") gameState.keys[16] = true;
      }
    }
    
    // Process movement
    processMovement(p);
    
    // Update and render based on game phase
    switch (gameState.gamePhase) {
      case PHASE_START:
        drawStartScreen(p);
        break;
      
      case PHASE_PLAYING:
        updateGame(p);
        drawPlayingScreen(p);
        break;
      
      case PHASE_PAUSED:
        drawPlayingScreen(p);
        break;
      
      case PHASE_GAME_OVER_WIN:
      case PHASE_GAME_OVER_LOSE:
        drawGameOverScreen(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
    return false; // Prevent default
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p, p.key, p.keyCode);
    return false;
  };
});

// Expose globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  if (mode === MODE_HUMAN) {
    document.getElementById('humanModeBtn')?.classList.add('active');
  } else if (mode === 'TEST_1') {
    document.getElementById('test_1_ModeBtn')?.classList.add('active');
  } else if (mode === 'TEST_2') {
    document.getElementById('test_2_ModeBtn')?.classList.add('active');
  }
  
  gameInstance.logs.game_info.push({
    data: { action: "control_mode_changed", mode: mode },
    framecount: gameInstance.frameCount,
    timestamp: Date.now()
  });
};