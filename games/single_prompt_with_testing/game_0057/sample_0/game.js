// game.js - Main game loop and p5.js instance

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { PHASE_START, PHASE_PLAYING, PHASE_PAUSED } from './globals.js';
import { PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { Player } from './player.js';
import { initializeFarm, advanceDay } from './farm.js';
import { handleKeyPress, handleKeyRelease, processGameplayInput } from './input.js';
import { renderStartScreen, renderPlayingScreen, renderPausedScreen, renderGameOverScreen } from './ui.js';
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
    
    // Initialize game
    gameState.gamePhase = PHASE_START;
    gameState.controlMode = "HUMAN";
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Initialize farm
    initializeFarm();
  };
  
  p.draw = function() {
    // Update frame count
    gameState.frameCount = p.frameCount;
    
    // Update delta time
    const currentTime = p.millis();
    gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = currentTime;
    
    // Background - single call
    p.background(20, 20, 30);
    
    // Update and render based on game phase
    switch (gameState.gamePhase) {
      case PHASE_START:
        renderStartScreen(p);
        break;
        
      case PHASE_PLAYING:
        // Handle automated testing
        if (gameState.controlMode !== "HUMAN") {
          const action = get_automated_testing_action(gameState);
          if (action) {
            simulateInput(p, action);
          }
        }
        
        // Process input
        processGameplayInput(p);
        
        // Update game
        updateGame(p);
        
        // Render
        renderPlayingScreen(p);
        break;
        
      case PHASE_PAUSED:
        renderPlayingScreen(p);
        renderPausedScreen(p);
        break;
        
      case PHASE_GAME_OVER_WIN:
      case PHASE_GAME_OVER_LOSE:
        renderGameOverScreen(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    handleKeyPress(p);
  };
  
  p.keyReleased = function() {
    handleKeyRelease(p);
  };
  
  // Mouse support for shop interactions
  p.mousePressed = function() {
    // Mouse handling for shop is in ui.js
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

function updateGame(p) {
  // Update player
  if (gameState.player) {
    gameState.player.update(p);
  }
  
  // Time progression (simple version)
  if (p.frameCount % 60 === 0) {
    gameState.timeOfDay += 0.1;
    
    // End of day at 22:00
    if (gameState.timeOfDay >= 22) {
      advanceDay();
    }
  }
  
  // Energy regeneration
  if (p.frameCount % 30 === 0) {
    gameState.energy = Math.min(gameState.maxEnergy, gameState.energy + 1);
  }
}

export function resetGame() {
  // Clear entities
  gameState.entities = [];
  gameState.crops = [];
  gameState.farmTiles = [];
  
  // Reset stats
  gameState.money = 100;
  gameState.energy = 100;
  gameState.maxEnergy = 100;
  gameState.farmingLevel = 0;
  gameState.farmingExp = 0;
  gameState.score = 0;
  
  // Reset time
  gameState.currentDay = 1;
  gameState.currentSeason = 0;
  gameState.timeOfDay = 6;
  
  // Reset UI
  gameState.showShop = false;
  gameState.selectedShopItem = null;
  
  // Reinitialize
  initializeFarm();
  gameState.player = new Player(300, 200);
}

function simulateInput(p, action) {
  if (!action) return;
  
  // Simulate key press for automated testing
  if (action.keyCode) {
    const fakeEvent = {
      keyCode: action.keyCode,
      key: String.fromCharCode(action.keyCode)
    };
    
    // Temporarily set p properties
    const oldKeyCode = p.keyCode;
    const oldKey = p.key;
    p.keyCode = fakeEvent.keyCode;
    p.key = fakeEvent.key;
    
    handleKeyPress(p);
    
    // Restore
    p.keyCode = oldKeyCode;
    p.key = oldKey;
  }
}

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button styles
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = document.getElementById(
    mode === 'HUMAN' ? 'humanModeBtn' :
    mode === 'TEST_1' ? 'test_1_ModeBtn' :
    'test_2_ModeBtn'
  );
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  // Reset game when switching modes
  if (gameState.gamePhase === PHASE_PLAYING) {
    resetGame();
    gameState.gamePhase = PHASE_PLAYING;
  }
};

// Initialize player after setup
setTimeout(() => {
  if (!gameState.player) {
    gameState.player = new Player(300, 200);
  }
}, 100);