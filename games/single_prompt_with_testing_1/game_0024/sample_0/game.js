// game.js - Main game logic with p5.js

const p5 = window.p5;

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  initializeGrid,
  getGameState 
} from './globals.js';

import { 
  spawnNewPiece, 
  movePiece, 
  lockPiece, 
  clearLines 
} from './tetromino.js';

import { handleGameplayInput } from './controls.js';
import { initializeTestMode, executeTestActions } from './testing.js';

import { 
  renderStartScreen, 
  renderGame, 
  renderPausedOverlay, 
  renderGameOver 
} from './render.js';

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize p5.logs
    p.logs = {
      game_info: [],
      player_info: [],
      inputs: []
    };
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Initialize game
    initializeGame();
  };
  
  p.draw = function() {
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
        
      case "PLAYING":
        updateGame(p);
        renderGame(p);
        break;
        
      case "PAUSED":
        renderGame(p);
        renderPausedOverlay(p);
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGameOver(p);
        break;
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
    
    // Phase controls
    if (p.keyCode === 13 && gameState.gamePhase === "START") { // ENTER
      startGame();
      p.logs.game_info.push({
        data: { gamePhase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === "PLAYING") {
        gameState.gamePhase = "PAUSED";
        p.logs.game_info.push({
          data: { gamePhase: "PAUSED" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === "PAUSED") {
        gameState.gamePhase = "PLAYING";
        p.logs.game_info.push({
          data: { gamePhase: "PLAYING" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    if (p.keyCode === 82) { // R
      if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
        resetGame();
        p.logs.game_info.push({
          data: { gamePhase: "START" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    return false;
  };
  
  function initializeGame() {
    initializeGrid();
    gameState.score = 0;
    gameState.level = 1;
    gameState.linesCleared = 0;
    gameState.fallSpeed = 800;
    gameState.currentPiece = null;
    gameState.nextShape = null;
    gameState.clearingLines = [];
    gameState.keysPressed = {};
  }
  
  function startGame() {
    initializeGame();
    spawnNewPiece();
    gameState.gamePhase = "PLAYING";
    gameState.lastFallTime = Date.now();
    
    // Initialize test mode if applicable
    if (gameState.controlMode !== "HUMAN") {
      initializeTestMode();
    }
  }
  
  function resetGame() {
    initializeGame();
    gameState.gamePhase = "START";
  }
  
  function updateGame(p) {
    // Handle line clearing animation
    if (gameState.clearingLines.length > 0) {
      const elapsed = Date.now() - gameState.clearAnimationTimer;
      if (elapsed >= gameState.clearAnimationDuration) {
        clearLines();
      }
      return;
    }
    
    // Execute test actions
    if (gameState.controlMode !== "HUMAN") {
      executeTestActions(p);
    } else {
      handleGameplayInput(p);
    }
    
    // Auto-fall logic
    if (gameState.currentPiece && !gameState.isPieceLocked) {
      const currentTime = Date.now();
      const fallInterval = gameState.softDrop ? 50 : gameState.fallSpeed;
      
      if (currentTime - gameState.lastFallTime >= fallInterval) {
        const moved = movePiece(0, 1);
        gameState.lastFallTime = currentTime;
        
        if (!moved && gameState.lockDelayTimer > 0) {
          // Check if lock delay expired
          if (currentTime - gameState.lockDelayTimer >= gameState.lockDelay) {
            lockPiece();
            
            // Log player position when piece locks
            p.logs.player_info.push({
              screen_x: gameState.pieceX * 18 + 200,
              screen_y: gameState.pieceY * 18 + 20,
              game_x: gameState.pieceX * 18 + 200,
              game_y: gameState.pieceY * 18 + 20,
              framecount: p.frameCount,
              timestamp: Date.now()
            });
          }
        }
      }
    }
  }
});

// Expose globally
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
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : `${mode.toLowerCase()}_ModeBtn`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  // Reset game when changing modes
  if (gameState.gamePhase !== "START") {
    gameState.gamePhase = "START";
    initializeGrid();
  }
};