// game.js - Main game file

import { gameState, GAME_PHASES, FISHING_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, WIN_CONDITIONS, LOCATIONS, UPGRADES } from './globals.js';
import { Player } from './entities.js';
import { drawGame } from './render.js';
import { handleKeyPressed, handleKeyReleased, handleContinuousInput } from './input.js';
import { initFishing, updateFishing } from './fishing.js';
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
    
    // Initialize game state
    gameState.player = new Player(p);
    gameState.gamePhase = GAME_PHASES.START;
    gameState.fishingPhase = FISHING_PHASES.SURFACE;
    
    initFishing(p);
    
    p.logs.game_info.push({
      data: "Game initialized",
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action) {
        simulateKeyAction(p, action);
      }
    }
    
    // Handle continuous input
    handleContinuousInput(p);
    
    // Update game
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateFishing(p);
      
      // Check win condition
      checkWinCondition(p);
      
      // Log player info periodically
      if (p.frameCount % 30 === 0 && gameState.player) {
        p.logs.player_info.push({
          screen_x: gameState.player.x,
          screen_y: gameState.player.y,
          game_x: gameState.player.x,
          game_y: gameState.currentDepth,
          framecount: p.frameCount
        });
      }
    }
    
    // Render
    drawGame(p);
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p);
    }
  };
  
  p.keyReleased = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyReleased(p);
    }
  };
});

function simulateKeyAction(p, action) {
  if (!action) return;
  
  // Simulate key press
  if (action.keyCode) {
    p.keyCode = action.keyCode;
    p.key = String.fromCharCode(action.keyCode);
  } else if (action.key) {
    p.key = action.key;
    p.keyCode = action.key.charCodeAt(0);
  }
  
  handleKeyPressed(p);
}

export function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.fishingPhase = FISHING_PHASES.SURFACE;
  gameState.score = 0;
  gameState.cash = 0;
  gameState.currentDepth = 0;
  gameState.entities = [];
  gameState.projectiles = [];
  gameState.fishCaught = [];
  gameState.uniqueSpeciesCaught = new Set();
  gameState.lineUpgradeLevel = 0;
  gameState.speedUpgradeLevel = 0;
  gameState.weaponUpgradeLevel = 0;
  gameState.currentLocation = 0;
  gameState.unlockedLocations = 1;
  
  gameState.player = new Player(p);
  
  initFishing(p);
  
  p.logs.game_info.push({
    data: "Game started",
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function togglePause(p) {
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    gameState.gamePhase = GAME_PHASES.PAUSED;
    p.logs.game_info.push({
      data: "Game paused",
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    p.logs.game_info.push({
      data: "Game resumed",
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function restartGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.fishingPhase = FISHING_PHASES.SURFACE;
  
  p.logs.game_info.push({
    data: "Game restarted",
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function checkWinCondition(p) {
  // Check if player has met all win conditions
  const hasEnoughCash = gameState.cash >= WIN_CONDITIONS.minCash;
  const hasEnoughSpecies = gameState.uniqueSpeciesCaught.size >= WIN_CONDITIONS.minUniqueSpecies;
  const hasAllLocations = gameState.unlockedLocations >= LOCATIONS.length;
  const hasMaxUpgrades = 
    gameState.lineUpgradeLevel >= UPGRADES.line.length &&
    gameState.speedUpgradeLevel >= UPGRADES.speed.length &&
    gameState.weaponUpgradeLevel >= UPGRADES.weapon.length;
  
  if (hasEnoughCash && hasEnoughSpecies && hasAllLocations && hasMaxUpgrades) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    
    p.logs.game_info.push({
      data: "Game won",
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

// Expose game instance globally
window.gameInstance = gameInstance;

// Expose getGameState function
window.getGameState = function() {
  return gameState;
};

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
  
  console.log('Control mode set to:', mode);
};