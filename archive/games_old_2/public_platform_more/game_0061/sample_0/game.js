// game.js - Main game file

import { gameState, GAME_PHASES, CONTROL_MODES, KEY_CODES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './player.js';
import { initializeGame, updateGame, handleInteraction } from './game_logic.js';
import { renderWorld } from './world.js';
import { renderUI, renderStartScreen, renderPausedScreen, renderGameOverScreen } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };
  
  let lastLoggedPhase = null;
  let lastLoggedPlayerX = null;
  let lastLoggedPlayerY = null;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize game
    initializeGame(p);
    
    // Log initial game info
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Single background call at the top
    p.background(20, 20, 30);
    
    // Process automated testing inputs if not in HUMAN mode
    if (gameState.controlMode !== CONTROL_MODES.HUMAN && 
        gameState.gamePhase === GAME_PHASES.PLAYING) {
      const actions = get_automated_testing_action(gameState);
      for (const keyCode of actions) {
        simulateKeyPress(p, keyCode);
      }
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
        updateGame(p);
        
        // Render game world
        if (gameState.player) {
          renderWorld(p, gameState.player);
          
          // Render interactable objects
          for (const obj of gameState.interactables) {
            obj.render(p, gameState.player);
          }
          
          // Render UI
          renderUI(p);
        }
        
        // Log player info periodically
        if (gameState.player && p.frameCount % 10 === 0) {
          const playerX = Math.round(gameState.player.worldX);
          const playerY = Math.round(gameState.player.worldY);
          
          if (playerX !== lastLoggedPlayerX || playerY !== lastLoggedPlayerY) {
            p.logs.player_info.push({
              screen_x: gameState.player.x,
              screen_y: gameState.player.y,
              game_x: playerX,
              game_y: playerY,
              framecount: p.frameCount
            });
            lastLoggedPlayerX = playerX;
            lastLoggedPlayerY = playerY;
          }
        }
        break;
        
      case GAME_PHASES.PAUSED:
        // Render game in background
        if (gameState.player) {
          renderWorld(p, gameState.player);
          
          for (const obj of gameState.interactables) {
            obj.render(p, gameState.player);
          }
          
          renderUI(p);
        }
        renderPausedScreen(p);
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOverScreen(p);
        break;
    }
    
    // Log game phase changes
    if (gameState.gamePhase !== lastLoggedPhase) {
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      lastLoggedPhase = gameState.gamePhase;
    }
  };
  
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Handle game phase transitions
    if (p.keyCode === KEY_CODES.ENTER && gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      initializeGame(p);
      return;
    }
    
    if (p.keyCode === KEY_CODES.ESC) {
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
      }
      return;
    }
    
    if (p.keyCode === KEY_CODES.R) {
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        gameState.gamePhase = GAME_PHASES.START;
        initializeGame(p);
      }
      return;
    }
    
    // Handle gameplay controls
    if (gameState.gamePhase === GAME_PHASES.PLAYING && 
        gameState.controlMode === CONTROL_MODES.HUMAN) {
      if (p.keyCode === KEY_CODES.SPACE) {
        handleInteraction(p);
      } else if (p.keyCode === KEY_CODES.Z) {
        if (gameState.player) {
          gameState.player.toggleRun();
        }
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
  };
  
  function simulateKeyPress(p, keyCode) {
    if (keyCode === KEY_CODES.SPACE) {
      handleInteraction(p);
    } else if (keyCode === KEY_CODES.Z) {
      if (gameState.player) {
        gameState.player.toggleRun();
      }
    }
  }
}, document.body);

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
};