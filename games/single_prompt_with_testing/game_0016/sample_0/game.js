// game.js - Main game file

import {
  gameState,
  getGameState,
  GAME_PHASES,
  CONTROL_MODES,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  WORLD_WIDTH,
  WORLD_HEIGHT
} from './globals.js';

import { Player } from './entities.js';
import { generateWorld } from './world_generator.js';
import { updateGameLogic, checkPortalWin } from './game_logic.js';
import { updateCamera, drawGame, drawStartScreen, drawGameOverScreen } from './rendering.js';
import { handleKeyPress, getMovementKeys } from './input_handler.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let keysPressed = {};
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };
    
    // Initialize player
    gameState.player = new Player(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    gameState.entities.push(gameState.player);
    
    // Generate world
    generateWorld(p);
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== CONTROL_MODES.HUMAN && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      applyAutomatedAction(action, p);
    }
    
    // Update game state
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      const keys = getMovementKeys(p);
      gameState.player.update(p, keys);
      updateGameLogic(p);
      checkPortalWin(p);
      updateCamera();
      
      // Log player info periodically
      if (p.frameCount % 60 === 0) {
        p.logs.player_info.push({
          screen_x: gameState.player.x - gameState.cameraX,
          screen_y: gameState.player.y - gameState.cameraY,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          framecount: p.frameCount
        });
        
        // Track position history for testing
        gameState.positionHistory.push({
          x: gameState.player.x,
          y: gameState.player.y,
          frame: p.frameCount
        });
        
        // Keep only last 100 positions
        if (gameState.positionHistory.length > 100) {
          gameState.positionHistory.shift();
        }
      }
    }
    
    // Render
    if (gameState.gamePhase === GAME_PHASES.START) {
      drawStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
               gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      drawGameOverScreen(p);
    } else {
      drawGame(p);
    }
  };
  
  p.keyPressed = function() {
    keysPressed[p.keyCode] = true;
    handleKeyPress(p, p.key, p.keyCode);
    return false;
  };
  
  p.keyReleased = function() {
    keysPressed[p.keyCode] = false;
    
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    return false;
  };
  
  function applyAutomatedAction(action, p) {
    // Simulate key presses for automated actions
    if (action.left) p.keyIsDown = (kc) => kc === 37 || p.keyIsDown(kc);
    if (action.right) p.keyIsDown = (kc) => kc === 39 || p.keyIsDown(kc);
    if (action.up) p.keyIsDown = (kc) => kc === 38 || p.keyIsDown(kc);
    if (action.down) p.keyIsDown = (kc) => kc === 40 || p.keyIsDown(kc);
    
    if (action.space) {
      handleKeyPress(p, ' ', 32);
    }
    if (action.z) {
      handleKeyPress(p, 'z', 90);
    }
    if (action.shift) {
      handleKeyPress(p, 'Shift', 16);
    }
    if (action.key) {
      handleKeyPress(p, action.key, action.key.charCodeAt(0));
    }
  }
});

// Expose game instance
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn', 'test_5_ModeBtn'];
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
    'TEST_4': 'test_4_ModeBtn',
    'TEST_5': 'test_5_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};