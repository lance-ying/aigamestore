// game.js - Main game file

import {
  CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS,
  PHASE_START, PHASE_PLAYING, PHASE_PAUSED,
  PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE,
  KEY_ENTER, KEY_ESC, KEY_R,
  gameState
} from './globals.js';
import { createPlayer } from './player.js';
import { spawnEnemies } from './enemy.js';
import { handlePlayerInput, handlePlayerActions } from './input_handler.js';
import { updateGame } from './game_logic.js';
import { renderStartScreen, renderPlaying, renderPaused, renderGameOver } from './renderer.js';
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
    
    // Initialize game state
    resetGame();
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: PHASE_START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Single background call to prevent flickering
    p.background(40, 35, 45);
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === PHASE_PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action !== null) {
        handleAutomatedAction(action);
      }
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case PHASE_START:
        renderStartScreen(p);
        break;
      case PHASE_PLAYING:
        handlePlayerInput(p);
        updateGame(p);
        renderPlaying(p);
        break;
      case PHASE_PAUSED:
        renderPaused(p);
        break;
      case PHASE_GAME_OVER_WIN:
        renderGameOver(p, true);
        break;
      case PHASE_GAME_OVER_LOSE:
        renderGameOver(p, false);
        break;
    }
  };

  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: 'keyPressed',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Game phase transitions
    if (p.keyCode === KEY_ENTER && gameState.gamePhase === PHASE_START) {
      startGame();
      return;
    }
    
    if (p.keyCode === KEY_ESC) {
      if (gameState.gamePhase === PHASE_PLAYING) {
        gameState.gamePhase = PHASE_PAUSED;
        p.logs.game_info.push({
          data: { phase: PHASE_PAUSED },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === PHASE_PAUSED) {
        gameState.gamePhase = PHASE_PLAYING;
        p.logs.game_info.push({
          data: { phase: PHASE_PLAYING },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }
    
    if (p.keyCode === KEY_R && 
        (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
         gameState.gamePhase === PHASE_GAME_OVER_LOSE)) {
      resetGame();
      gameState.gamePhase = PHASE_START;
      p.logs.game_info.push({
        data: { phase: PHASE_START },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return;
    }
    
    // Gameplay actions
    if (gameState.gamePhase === PHASE_PLAYING) {
      handlePlayerActions(p, p.keyCode);
    }
  };

  function handleAutomatedAction(keyCode) {
    // Simulate key press for automated testing
    if (keyCode === null) return;
    
    // Log automated input
    p.logs.inputs.push({
      input_type: 'automated',
      data: { keyCode: keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Handle actions
    handlePlayerActions(p, keyCode);
  }

  function startGame() {
    gameState.gamePhase = PHASE_PLAYING;
    
    // Create player
    gameState.player = createPlayer(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    // Spawn initial enemies
    gameState.enemies = spawnEnemies(0, false);
    
    // Clear entities
    gameState.projectiles = [];
    gameState.items = [];
    
    p.logs.game_info.push({
      data: { phase: PHASE_PLAYING },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }

  function resetGame() {
    gameState.player = null;
    gameState.entities = [];
    gameState.projectiles = [];
    gameState.items = [];
    gameState.enemies = [];
    gameState.score = 0;
    gameState.gold = 0;
    gameState.currentRoom = 0;
    gameState.roomsCleared = 0;
    gameState.bossDefeated = false;
    gameState.attackCooldown = 0;
    gameState.fireballCooldown = 0;
    gameState.healCooldown = 0;
    gameState.roomCleared = false;
    gameState.transitionTimer = 0;
  }
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