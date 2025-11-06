// game.js - Main game entry point
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES } from './globals.js';
import { Player } from './entities.js';
import { LocationManager } from './location_manager.js';
import { PuzzleSystem } from './puzzle_system.js';
import { GameLogic } from './game_logic.js';
import { Renderer } from './renderer.js';
import { InputHandler } from './input_handler.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let locationManager;
  let puzzleSystem;
  let gameLogic;
  let renderer;
  let inputHandler;
  
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
    
    // Initialize game systems
    locationManager = new LocationManager();
    puzzleSystem = new PuzzleSystem(locationManager);
    gameLogic = new GameLogic(p, locationManager, puzzleSystem);
    renderer = new Renderer(p, locationManager);
    inputHandler = new InputHandler(p);
    
    // Create player
    gameState.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 120);
    gameState.entities.push(gameState.player);
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START", action: "game_initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Update game logic
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameLogic.update();
      
      // Handle automated testing
      if (gameState.controlMode !== "HUMAN") {
        const action = get_automated_testing_action(gameState);
        if (action && p.frameCount % 8 === 0) { // Slower automated actions
          processAction(action);
        }
      }
      
      // Log player info periodically
      if (p.frameCount % 60 === 0 && gameState.player) {
        p.logs.player_info.push({
          screen_x: gameState.player.x,
          screen_y: gameState.player.y,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          framecount: p.frameCount
        });
      }
    }
    
    // Render
    renderer.draw();
  };
  
  p.keyPressed = function() {
    inputHandler.handleKeyPressed(p.keyCode, p.key);
    
    if (gameState.controlMode === "HUMAN") {
      processKeyPress(p.keyCode, p.key);
    }
  };
  
  p.keyReleased = function() {
    inputHandler.handleKeyReleased(p.keyCode, p.key);
  };
  
  function processKeyPress(keyCode, key) {
    // Game phase controls (handled in inputHandler)
    if (keyCode === 13 || keyCode === 27 || keyCode === 82) {
      return;
    }
    
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
    
    // Gameplay controls
    if (keyCode === 37) { // LEFT
      gameLogic.handleInput("LEFT");
    } else if (keyCode === 39) { // RIGHT
      gameLogic.handleInput("RIGHT");
    } else if (keyCode === 38) { // UP
      gameLogic.handleInput("UP");
    } else if (keyCode === 40) { // DOWN
      gameLogic.handleInput("DOWN");
    } else if (keyCode === 32) { // SPACE
      gameLogic.handleInput("SPACE");
    } else if (keyCode === 90) { // Z
      gameLogic.handleInput("Z");
    } else if (keyCode === 16) { // SHIFT
      gameLogic.handleInput("SHIFT");
    }
  }
  
  function processAction(action) {
    if (!action) return;
    
    const keyCode = action.keyCode;
    
    // Gameplay controls only
    if (keyCode === 37) {
      gameLogic.handleInput("LEFT");
    } else if (keyCode === 39) {
      gameLogic.handleInput("RIGHT");
    } else if (keyCode === 38) {
      gameLogic.handleInput("UP");
    } else if (keyCode === 40) {
      gameLogic.handleInput("DOWN");
    } else if (keyCode === 32) {
      gameLogic.handleInput("SPACE");
    } else if (keyCode === 90) {
      gameLogic.handleInput("Z");
    } else if (keyCode === 16) {
      gameLogic.handleInput("SHIFT");
    }
  }
});

// Global exports
window.gameInstance = gameInstance;

window.getGameState = function() {
  return gameState;
};

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
  
  const activeBtn = document.getElementById(
    mode === "HUMAN" ? "humanModeBtn" : 
    mode === "TEST_1" ? "test_1_ModeBtn" : 
    mode === "TEST_2" ? "test_2_ModeBtn" : "humanModeBtn"
  );
  
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
};