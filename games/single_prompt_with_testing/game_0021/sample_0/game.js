// game.js
import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './player.js';
import { initializeGrid } from './grid.js';
import { LEVELS } from './levels.js';
import { renderStartScreen, renderPlaying, renderGameOver } from './rendering.js';
import { handleKeyPressed } from './input_handler.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize game state
    gameState.gamePhase = "START";
    gameState.currentLevel = 0;
    gameState.score = 0;
    gameState.demonsCollected = 0;
    gameState.levelComplete = false;
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START", action: "init" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
      const action = get_automated_testing_action(gameState);
      if (action !== null && p.frameCount % 10 === 0) {
        handleKeyPressed(p, action);
      }
    }
    
    // Initialize level if needed
    if (gameState.gamePhase === "PLAYING" && !gameState.player) {
      const level = LEVELS[gameState.currentLevel];
      gameState.maxMoves = level.maxMoves;
      gameState.movesRemaining = level.maxMoves;
      gameState.player = new Player(level.playerStart.x, level.playerStart.y);
      gameState.player.health = 3;
      initializeGrid(level, gameState);
    }
    
    // Render based on game phase
    if (gameState.gamePhase === "START") {
      renderStartScreen(p);
    } else if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "PAUSED") {
      renderPlaying(p);
    } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
      renderGameOver(p);
    }
  };

  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.keyCode);
    }
    return false; // Prevent default
  };
}, document.body);

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  if (mode === "HUMAN") {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === "TEST_1") {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === "TEST_2") {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  } else if (mode === "TEST_3") {
    document.getElementById('test_3_ModeBtn')?.classList.add('active');
  } else if (mode === "TEST_4") {
    document.getElementById('test_4_ModeBtn')?.classList.add('active');
  }
};