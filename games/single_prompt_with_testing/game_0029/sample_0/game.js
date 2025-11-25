// game.js - Main game file

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  gameState
} from './globals.js';

import { Player, handlePlayerInput } from './player.js';
import { updateGameLogic, resetGame } from './game_logic.js';
import {
  drawStartScreen,
  drawGameplayUI,
  drawPausedIndicator,
  drawGameOverScreen
} from './ui.js';

import get_automated_testing_action from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup function
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs (write-only)
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Log initial game state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, action: "game_initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  // Draw function
  p.draw = function() {
    p.background(20, 25, 35);
    
    switch (gameState.gamePhase) {
      case PHASE_START:
        drawStartScreen(p);
        break;
        
      case PHASE_PLAYING:
        // Handle input
        if (gameState.controlMode === "HUMAN") {
          handlePlayerInput(p);
        } else {
          // Automated testing
          const action = get_automated_testing_action(gameState);
          if (action !== null) {
            simulateKeyPress(action);
          }
        }
        
        // Update game logic
        updateGameLogic(p);
        
        // Draw game
        drawGameplay(p);
        break;
        
      case PHASE_PAUSED:
        // Draw game but don't update
        drawGameplay(p);
        drawPausedIndicator(p);
        break;
        
      case PHASE_GAME_OVER_WIN:
        drawGameOverScreen(p, true);
        break;
        
      case PHASE_GAME_OVER_LOSE:
        drawGameOverScreen(p, false);
        break;
    }
    
    // Log player info periodically
    if (gameState.player && p.frameCount % 10 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
  };
  
  function drawGameplay(p) {
    // Draw performance zones
    for (const zone of gameState.performanceZones) {
      zone.draw(p);
    }
    
    // Draw player
    if (gameState.player) {
      gameState.player.draw(p);
    }
    
    // Draw UI
    drawGameplayUI(p);
    
    // Draw current challenge
    if (gameState.currentChallenge) {
      gameState.currentChallenge.draw(p);
    }
  }
  
  function simulateKeyPress(keyCode) {
    const player = gameState.player;
    if (!player) return;
    
    switch (keyCode) {
      case 38: // UP
        player.move('UP', p);
        break;
      case 40: // DOWN
        player.move('DOWN', p);
        break;
      case 37: // LEFT
        player.move('LEFT', p);
        break;
      case 39: // RIGHT
        player.move('RIGHT', p);
        break;
      case 32: // SPACE
        player.activateBoost();
        break;
      case 16: // SHIFT
        player.untwistCable();
        break;
      case 90: // Z
        player.quickOptimize();
        break;
    }
  }
  
  // Key pressed handler
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Game phase transitions
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === PHASE_START) {
        startGame(p);
      }
    } else if (p.keyCode === 27) { // ESC
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
    } else if (p.keyCode === 82) { // R
      if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
        gameState.gamePhase = PHASE_START;
        resetGame();
        p.logs.game_info.push({
          data: { phase: PHASE_START, action: "restart" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Gameplay keys (only in PLAYING phase)
    if (gameState.gamePhase === PHASE_PLAYING && gameState.player) {
      if (p.keyCode === 16) { // SHIFT
        gameState.player.untwistCable();
      } else if (p.keyCode === 90) { // Z
        gameState.player.quickOptimize();
      }
    }
  };
  
  p.keyReleased = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Handle boost deactivation
    if (p.keyCode === 32 && gameState.player) {
      gameState.player.deactivateBoost();
    }
  };
  
  function startGame(p) {
    resetGame();
    gameState.gamePhase = PHASE_PLAYING;
    
    // Create player
    gameState.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    gameState.entities = [gameState.player];
    
    gameState.sessionStartTime = Date.now();
    
    p.logs.game_info.push({
      data: { phase: PHASE_PLAYING, action: "game_started" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
});

// Expose game instance globally
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