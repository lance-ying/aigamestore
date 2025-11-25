// game.js - Main game file

import {
  CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS,
  PHASE_START, PHASE_PLAYING, PHASE_PAUSED,
  PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE,
  gameState, getGameState
} from './globals.js';
import { initializeGame, updateGame } from './game_logic.js';
import { renderRoom } from './room_generator.js';
import { renderUI, renderPauseIndicator, renderStartScreen, renderGameOverScreen } from './ui.js';
import { handleKeyPressed, handleGameplayInput, processBombInput } from './input_handler.js';

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
    
    // Initial game state
    gameState.gamePhase = PHASE_START;
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: PHASE_START, event: 'game_initialized' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(20, 15, 10);
    
    if (gameState.gamePhase === PHASE_START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === PHASE_PLAYING) {
      renderGameplay(p);
      
      // Get and process input
      const actions = handleGameplayInput(p);
      updateGame(p, actions);
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      renderGameplay(p);
      renderPauseIndicator(p);
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
               gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      renderGameplay(p);
      renderGameOverScreen(p, gameState.gamePhase === PHASE_GAME_OVER_WIN);
    }
  };
  
  function renderGameplay(p) {
    // Render room
    if (gameState.currentRoom) {
      renderRoom(p, gameState.currentRoom);
    }
    
    // Render exit portal
    if (gameState.exitPortal) {
      gameState.exitPortal.render(p);
    }
    
    // Render items
    gameState.items.forEach(item => item.render(p));
    
    // Render hearts
    gameState.hearts.forEach(heart => heart.render(p));
    
    // Render bombs
    gameState.bombs.forEach(bomb => bomb.render(p));
    
    // Render tears
    gameState.tears.forEach(tear => tear.render(p));
    
    // Render enemies
    gameState.enemies.forEach(enemy => enemy.render(p));
    
    // Render enemy projectiles
    gameState.projectiles.forEach(proj => proj.render(p));
    
    // Render player
    if (gameState.player) {
      gameState.player.render(p);
    }
    
    // Render UI
    renderUI(p);
  }
  
  p.keyPressed = function() {
    const action = handleKeyPressed(p, p.keyCode);
    
    if (action === 'START_GAME') {
      gameState.gamePhase = PHASE_PLAYING;
      initializeGame(p);
    } else if (action === 'PAUSE') {
      gameState.gamePhase = PHASE_PAUSED;
      p.logs.game_info.push({
        data: { phase: PHASE_PAUSED, event: 'game_paused' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (action === 'UNPAUSE') {
      gameState.gamePhase = PHASE_PLAYING;
      p.logs.game_info.push({
        data: { phase: PHASE_PLAYING, event: 'game_unpaused' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (action === 'RESTART') {
      gameState.gamePhase = PHASE_START;
      p.logs.game_info.push({
        data: { phase: PHASE_START, event: 'game_restarted' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // Handle bomb input
    if (gameState.gamePhase === PHASE_PLAYING && processBombInput(p, p.keyCode)) {
      if (gameState.playerBombCount > 0) {
        const Bomb = (await import('./entities.js')).Bomb;
        gameState.playerBombCount--;
        const bomb = new Bomb(gameState.player.x, gameState.player.y);
        gameState.bombs.push(bomb);
      }
    }
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 
                   'test_4_ModeBtn', 'test_5_ModeBtn'];
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