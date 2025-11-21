// game.js - Main game file

import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { PHASE_PLAYING, CONTROL_HUMAN } from './globals.js';
import { createBirdDeck, generateRoundGoals } from './bird_data.js';
import { updateMessage } from './game_logic.js';
import { handleKeyPressed, processAutomatedAction } from './input_handler.js';
import { drawGame } from './renderer.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup function
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
    
    // Initialize bird deck
    gameState.birdDeck = createBirdDeck();
    gameState.roundGoals = generateRoundGoals();
    
    // Shuffle deck
    for (let i = gameState.birdDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [gameState.birdDeck[i], gameState.birdDeck[j]] = [gameState.birdDeck[j], gameState.birdDeck[i]];
    }
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  // Draw function
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== CONTROL_HUMAN && gameState.gamePhase === PHASE_PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action) {
        processAutomatedAction(p, action);
        gameState.lastActionFrame = p.frameCount;
      }
      
      // Check if stuck
      if (p.frameCount - gameState.lastActionFrame > 300) {
        gameState.consecutiveIdleFrames++;
      } else {
        gameState.consecutiveIdleFrames = 0;
      }
    }
    
    // Update message timer
    updateMessage();
    
    // Render
    drawGame(p);
  };
  
  // Key pressed handler
  p.keyPressed = function() {
    if (gameState.controlMode === CONTROL_HUMAN) {
      handleKeyPressed(p);
    }
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
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
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

export default gameInstance;