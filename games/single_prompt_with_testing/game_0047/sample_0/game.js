// game.js - Main game file

import {
  gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS,
  PHASE_START, PHASE_PLAYING, PHASE_PAUSED,
  PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE
} from './globals.js';
import { Player } from './entities.js';
import { renderStartScreen, renderGame, renderGameOverScreen } from './renderer.js';
import { initGame, updateGame, logPlayerInfo } from './game_logic.js';
import { handleKeyPressed, handleKeyReleased, getMovementInput } from './input_handler.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let lastFrameTime = 0;
  
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
    
    // Initialize game
    initGame(p);
  };
  
  p.draw = function() {
    const currentTime = Date.now();
    const dt = lastFrameTime > 0 ? (currentTime - lastFrameTime) / 1000 : 1 / TARGET_FPS;
    lastFrameTime = currentTime;
    
    // Handle different game phases
    if (gameState.gamePhase === PHASE_START) {
      renderStartScreen(p, gameState);
    } else if (gameState.gamePhase === PHASE_PLAYING) {
      // Handle input
      handlePlayerInput(p, dt);
      
      // Update game
      updateGame(p, dt);
      
      // Render
      renderGame(p, gameState);
      
      // Log player info periodically
      if (p.frameCount % 10 === 0) {
        logPlayerInfo(p);
      }
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      renderGame(p, gameState);
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
               gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      renderGameOverScreen(p, gameState);
    }
  };
  
  function handlePlayerInput(p, dt) {
    const player = gameState.player;
    if (!player) return;
    
    let input;
    
    if (gameState.controlMode === "HUMAN") {
      input = getMovementInput(p);
    } else {
      // Automated testing mode
      const action = get_automated_testing_action(gameState);
      input = {
        forward: action.forward || 0,
        strafe: action.strafe || 0,
        turn: action.turn || 0
      };
      
      // Handle automated sprint
      if (action.sprint) {
        player.isSprinting = true;
      } else {
        player.isSprinting = false;
      }
      
      // Handle automated interaction
      if (action.interact) {
        const { handleInteraction } = require('./game_logic.js');
        handleInteraction(p);
      }
    }
    
    if (input) {
      player.move(input.forward, input.strafe, input.turn, dt);
    }
  }
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p, p.key, p.keyCode);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn'];
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
    'TEST_3': 'test_3_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};