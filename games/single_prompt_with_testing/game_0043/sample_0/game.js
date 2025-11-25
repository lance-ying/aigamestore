// game.js - Main game file

import { 
  gameState, 
  CANVAS_WIDTH, CANVAS_HEIGHT,
  PHASE_START, PHASE_PLAYING, PHASE_PAUSED
} from './globals.js';
import { Player } from './player.js';
import { generateWorld, renderWorld } from './world.js';
import { updateGame, resetGame } from './game_logic.js';
import { renderUI } from './ui.js';
import { getPlayerInputs, handleKeyPress } from './input.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let lastInteractPress = false;
  
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
    
    // Initialize game state
    gameState.gamePhase = PHASE_START;
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: PHASE_START, init: true },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Single background call at the top
    p.background(135, 206, 235);
    
    const phase = gameState.gamePhase;
    
    if (phase === PHASE_START) {
      renderUI(p);
    } else if (phase === PHASE_PLAYING || phase === PHASE_PAUSED) {
      // Initialize game on first frame of playing
      if (phase === PHASE_PLAYING && !gameState.player) {
        initializeGame(p);
      }
      
      // Get inputs
      let automatedAction = null;
      if (gameState.controlMode !== "HUMAN") {
        automatedAction = get_automated_testing_action(gameState);
      }
      
      const inputs = getPlayerInputs(p, automatedAction);
      
      // Handle interact key press (edge detection)
      if (inputs.interact && !lastInteractPress) {
        // Interact key just pressed
        lastInteractPress = true;
      } else if (!inputs.interact) {
        lastInteractPress = false;
      }
      
      // Only pass interact on fresh press
      const processedInputs = {
        ...inputs,
        interact: inputs.interact && lastInteractPress
      };
      
      // Update game
      if (phase === PHASE_PLAYING) {
        updateGame(p, processedInputs);
      }
      
      // Render world and entities
      renderWorld(p, gameState.camera.x, gameState.camera.y);
      
      // Render player
      if (gameState.player) {
        gameState.player.render(p, gameState.camera.x, gameState.camera.y);
      }
      
      // Render UI
      renderUI(p);
    } else {
      // Game over screen
      renderUI(p);
    }
  };
  
  p.keyPressed = function() {
    handleKeyPress(p, p.key, p.keyCode);
  };
  
  function initializeGame(p) {
    // Create player
    gameState.player = new Player(100, 300);
    gameState.entities = [gameState.player];
    
    // Generate world
    generateWorld(p);
    
    // Reset scores
    gameState.score = 0;
    gameState.money = 0;
    gameState.deliveriesCompleted = 0;
    gameState.treasuresCollected = 0;
    gameState.worldTime = 0;
    
    // Reset camera
    gameState.camera.x = 0;
    gameState.camera.y = 0;
    
    // Log player initial state
    p.logs.player_info.push({
      screen_x: gameState.player.x - gameState.camera.x,
      screen_y: gameState.player.y - gameState.camera.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
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
  
  const activeBtn = document.getElementById(
    mode === 'HUMAN' ? 'humanModeBtn' : 
    mode === 'TEST_1' ? 'test_1_ModeBtn' :
    mode === 'TEST_2' ? 'test_2_ModeBtn' :
    mode === 'TEST_3' ? 'test_3_ModeBtn' :
    'test_4_ModeBtn'
  );
  
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};