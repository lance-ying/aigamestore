// game.js - Main game file

import { gameState, GAME_PHASES, INGREDIENTS, LEVEL_CONFIG } from './globals.js';
import { Customer } from './customer.js';
import { WrapRenderer } from './wrap.js';
import { UIRenderer } from './ui.js';
import { GameLogic } from './gameLogic.js';
import { AutomatedController } from './controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let wrapRenderer;
  let uiRenderer;
  let gameLogic;
  let automatedController;
  
  p.setup = function() {
    p.createCanvas(600, 400);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Load high score
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('shawarmaStackHighScore');
      if (saved) {
        gameState.highScore = parseInt(saved);
      }
    }
    
    // Initialize renderers and logic
    wrapRenderer = new WrapRenderer(p);
    uiRenderer = new UIRenderer(p);
    gameLogic = new GameLogic(p);
    automatedController = new AutomatedController(p, gameLogic);
    
    // Log initial state
    p.logs.game_info.push({
      event: "game_start",
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(60, 50, 70);
    
    // Update automated controller
    automatedController.update();
    
    if (gameState.gamePhase === GAME_PHASES.START) {
      uiRenderer.drawStartScreen();
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      drawPlaying();
      gameLogic.update();
      
      if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        uiRenderer.drawPausedOverlay();
      }
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      drawPlaying();
      uiRenderer.drawPausedOverlay();
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
      uiRenderer.drawGameOver(true);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      uiRenderer.drawGameOver(false);
    }
  };
  
  function drawPlaying() {
    // Background
    p.fill(80, 70, 60);
    p.noStroke();
    p.rect(0, 0, 600, 150);
    
    // Counter
    p.fill(139, 119, 101);
    p.rect(0, 150, 600, 250);
    
    // Draw HUD
    uiRenderer.drawHUD();
    
    // Draw customers
    gameState.customerQueue.forEach(customer => {
      customer.draw();
    });
    
    // Draw current wrap
    wrapRenderer.draw(gameState.currentWrap, 300, 230);
    
    // Draw ingredient bins
    const config = LEVEL_CONFIG[gameState.currentLevel - 1];
    const availableIngredients = config.availableIngredients;
    wrapRenderer.drawIngredientBins(availableIngredients, -1);
    
    // Draw serve button
    uiRenderer.drawServeButton();
  }
  
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Handle game phase changes
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        gameLogic.initLevel(1);
        p.logs.game_info.push({
          event: "game_started",
          data: { gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        p.logs.game_info.push({
          event: "game_paused",
          data: { gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          event: "game_resumed",
          data: { gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (p.keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE ||
          gameState.gamePhase === GAME_PHASES.PAUSED) {
        resetGame();
      }
    } else if (p.keyCode === 16) { // SHIFT (quick pause)
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
      }
    }
    
    // Handle gameplay inputs
    if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.controlMode === "HUMAN") {
      // Check ingredient keys
      for (const [key, ingredient] of Object.entries(INGREDIENTS)) {
        if (p.keyCode === ingredient.keyCode) {
          const config = LEVEL_CONFIG[gameState.currentLevel - 1];
          if (config.availableIngredients.includes(key)) {
            gameLogic.addIngredient(key);
          }
        }
      }
      
      // Serve order
      if (p.keyCode === 32) { // SPACE
        gameLogic.serveOrder();
      }
    }
  };
  
  function resetGame() {
    gameState.gamePhase = GAME_PHASES.START;
    gameState.score = 0;
    gameState.coins = 0;
    gameState.reputation = 1.0;
    gameState.currentLevel = 1;
    gameState.customersServed = 0;
    gameState.totalCustomersThisLevel = 0;
    gameState.currentWrap = [];
    gameState.customerQueue = [];
    
    p.logs.game_info.push({
      event: "game_reset",
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (mode === "HUMAN") {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === "TEST_1") {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === "TEST_2") {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
  
  gameInstance.logs.game_info.push({
    event: "control_mode_changed",
    data: { controlMode: mode },
    framecount: gameInstance.frameCount,
    timestamp: Date.now()
  });
};