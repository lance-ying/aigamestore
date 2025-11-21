// game.js
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './entities.js';
import { initializeGame, updateGame } from './gameLogic.js';
import { renderStartScreen, renderGame, renderPausedScreen, renderGameOverScreen } from './rendering.js';
import { handleKeyPressed, processAutomatedInput } from './inputHandler.js';
import get_automated_testing_action from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Variables
  let lastFrameCount = 0;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };
    
    // Initialize player
    gameState.player = new Player();
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
      const action = get_automated_testing_action(gameState);
      if (action) {
        processAutomatedInput(p, action);
      }
    }
    
    // Update game state
    if (gameState.gamePhase === "PLAYING") {
      updateGame(p);
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
      case "PLAYING":
        renderGame(p);
        break;
      case "PAUSED":
        renderPausedScreen(p);
        break;
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGameOverScreen(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.keyCode);
    }
    return false;
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ["humanModeBtn", "test_1_ModeBtn", "test_2_ModeBtn"];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove("active");
    }
  });
  
  const activeBtn = document.getElementById(mode === "HUMAN" ? "humanModeBtn" : `${mode.toLowerCase()}_ModeBtn`);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
  
  // Reinitialize game when switching to test mode
  if (mode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
    initializeGame(gameInstance);
  }
  
  // Start game if in START phase and switching to test mode
  if (mode !== "HUMAN" && gameState.gamePhase === "START") {
    gameState.gamePhase = "PLAYING";
    initializeGame(gameInstance);
  }
};

// Initialize game on first PLAYING transition
let gameInitialized = false;
const originalDraw = gameInstance.draw;
gameInstance.draw = function() {
  if (gameState.gamePhase === "PLAYING" && !gameInitialized) {
    initializeGame(gameInstance);
    gameInitialized = true;
  }
  if (gameState.gamePhase === "START") {
    gameInitialized = false;
  }
  originalDraw.call(this);
};