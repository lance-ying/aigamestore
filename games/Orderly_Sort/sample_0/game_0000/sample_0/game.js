// game.js - Main game file

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Selector } from './entities.js';
import { handleKeyPressed, loadLevel, gameLose } from './input.js';
import { drawStartScreen, drawGame, drawGameOver } from './render.js';
import { getAutomatedAction } from './automation.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let lastFrameTime = 0;

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
    
    // Initialize selector
    gameState.player = new Selector(p);
    gameState.selectorX = 0;
    gameState.selectorY = 0;
    
    // Load high score
    try {
      const savedHighScore = localStorage.getItem('orderlySort_highScore');
      if (savedHighScore) {
        gameState.highScore = parseInt(savedHighScore, 10);
      }
    } catch (e) {
      // localStorage not available
    }
    
    // Initial game phase
    gameState.gamePhase = GAME_PHASES.START;
    
    p.logs.game_info.push({
      data: { phase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    lastFrameTime = Date.now();
  };

  p.draw = function() {
    const currentTime = Date.now();
    const deltaTime = (currentTime - lastFrameTime) / 1000;
    lastFrameTime = currentTime;
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = getAutomatedAction(p);
      if (action !== null) {
        simulateKeyPress(p, action);
      }
    }
    
    // Update game state
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGameplay(p, deltaTime);
    }
    
    // Render based on phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        drawStartScreen(p);
        break;
      case GAME_PHASES.PLAYING:
      case GAME_PHASES.PAUSED:
        drawGame(p);
        break;
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        drawGameOver(p);
        break;
    }
    
    // Log player info periodically
    if (p.frameCount % 30 === 0 && gameState.player) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.gridX,
        game_y: gameState.player.gridY,
        framecount: p.frameCount
      });
    }
  };

  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode);
    }
    return false;
  };

  function updateGameplay(p, deltaTime) {
    // Update time
    gameState.timeRemaining -= deltaTime;
    
    if (gameState.timeRemaining <= 0) {
      gameState.timeRemaining = 0;
      gameLose(p);
    }
  }

  function simulateKeyPress(p, keyCode) {
    const keyMap = {
      37: 'ArrowLeft',
      38: 'ArrowUp',
      39: 'ArrowRight',
      40: 'ArrowDown',
      32: ' ',
      13: 'Enter',
      27: 'Escape',
      82: 'r'
    };
    
    handleKeyPressed(p, keyMap[keyCode] || '', keyCode);
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
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
  
  const activeBtn = document.getElementById(`${mode === 'HUMAN' ? 'humanModeBtn' : mode.toLowerCase() + '_ModeBtn'}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};