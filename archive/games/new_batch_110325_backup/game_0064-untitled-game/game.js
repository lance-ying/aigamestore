// game.js - Main game file with p5.js instance

import { gameState, initGameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS } from './globals.js';
import { PHASE_START, PHASE_PLAYING, PHASE_PAUSED, CONTROL_HUMAN } from './globals.js';
import { initializeInventory } from './products.js';
import { handleKeyPressed } from './input_handler.js';
import { renderGame } from './renderer.js';
import { updateGameLogic, resetGameLogic } from './game_logic.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // p5.js instance mode setup
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Initialize game state
    initGameState();
    initializeInventory();
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== CONTROL_HUMAN && gameState.gamePhase === PHASE_PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action !== null) {
        simulateKeyPress(p, action);
      }
    }
    
    // Update game logic
    updateGameLogic(p);
    
    // Render
    renderGame(p);
    
    // Log player position
    if (gameState.gamePhase === PHASE_PLAYING && p.frameCount % 10 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === CONTROL_HUMAN) {
      handleKeyPressed(p, p.key, p.keyCode);
    }
    return false;
  };
});

function simulateKeyPress(p, keyCode) {
  const key = String.fromCharCode(keyCode);
  handleKeyPressed(p, key, keyCode);
}

export function startGame(p) {
  gameState.gamePhase = PHASE_PLAYING;
  resetGameLogic();
  
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function togglePause(p) {
  if (gameState.gamePhase === PHASE_PLAYING) {
    gameState.gamePhase = PHASE_PAUSED;
    p.noLoop();
  } else if (gameState.gamePhase === PHASE_PAUSED) {
    gameState.gamePhase = PHASE_PLAYING;
    p.loop();
  }
  
  p.logs.game_info.push({
    data: { phase: gameState.gamePhase },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function restartGame(p) {
  initGameState();
  initializeInventory();
  resetGameLogic();
  
  gameState.gamePhase = PHASE_START;
  p.loop();
  
  p.logs.game_info.push({
    data: { phase: PHASE_START },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

// Control mode management
function setControlMode(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ["humanModeBtn", "test_1_ModeBtn", "test_2_ModeBtn"];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove("active");
    }
  });
  
  const activeBtn = mode === CONTROL_HUMAN ? "humanModeBtn" : 
                    mode === "TEST_1" ? "test_1_ModeBtn" : "test_2_ModeBtn";
  const btn = document.getElementById(activeBtn);
  if (btn) {
    btn.classList.add("active");
  }
}

// Expose globally
window.gameInstance = gameInstance;
window.setControlMode = setControlMode;
window.getGameState = () => gameState;