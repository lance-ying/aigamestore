// game.js - Main game file

import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, MAX_ESCAPED_ENEMIES, CONTROL_HUMAN } from './globals.js';
import { Unit } from './entities.js';
import { generatePath } from './pathGenerator.js';
import { updateWave } from './waveManager.js';
import { handleKeyPressed, processAutomatedInput } from './input.js';
import { renderGame } from './rendering.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup function
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
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: PHASE_START, message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Initialize game
    initializeGame(p);
  };
  
  // Draw function
  p.draw = function() {
    gameState.frameCount = p.frameCount;
    
    // Handle automated testing
    if (gameState.controlMode !== CONTROL_HUMAN && gameState.gamePhase === PHASE_PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action) {
        processAutomatedInput(p, action);
      }
    }
    
    // Update game logic
    if (gameState.gamePhase === PHASE_PLAYING) {
      updateGame(p);
    }
    
    // Render
    renderGame(p);
  };
  
  // Key pressed handler
  p.keyPressed = function() {
    if (gameState.controlMode === CONTROL_HUMAN) {
      handleKeyPressed(p, p.keyCode);
    }
    return false; // Prevent default behavior
  };
});

function initializeGame(p) {
  // Generate path
  gameState.paths = generatePath(gameState.level);
  
  // Deploy starting units
  const startUnit = new Unit('BANDIT', 250, 150);
  gameState.units.push(startUnit);
  gameState.entities.push(startUnit);
  
  const startUnit2 = new Unit('BANDIT', 350, 250);
  gameState.units.push(startUnit2);
  gameState.entities.push(startUnit2);
}

function updateGame(p) {
  // Check lose condition
  if (gameState.escapedEnemies >= MAX_ESCAPED_ENEMIES) {
    gameState.gamePhase = "GAME_OVER_LOSE";
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_LOSE", reason: "Too many enemies escaped" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // Update wave manager
  updateWave(p);
  
  // Update all entities
  for (const entity of gameState.entities) {
    if (entity.update) {
      entity.update();
    }
  }
  
  // Update power-ups
  for (const powerUp of gameState.powerUps) {
    if (!powerUp.collected) {
      powerUp.update();
    }
  }
  
  // Clean up dead enemies
  gameState.enemies = gameState.enemies.filter(e => !e.dead && !e.escaped);
  gameState.entities = gameState.entities.filter(e => {
    if (e.dead !== undefined) {
      return !e.dead && !e.escaped;
    }
    return true;
  });
  
  // Clean up expired power-ups
  gameState.powerUps = gameState.powerUps.filter(p => !p.collected && p.lifetime > 0);
  
  // Log player info periodically
  if (p.frameCount % 60 === 0 && gameState.units.length > 0) {
    const firstUnit = gameState.units[0];
    p.logs.player_info.push({
      screen_x: firstUnit.x,
      screen_y: firstUnit.y,
      game_x: firstUnit.x,
      game_y: firstUnit.y,
      framecount: p.frameCount
    });
  }
}

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