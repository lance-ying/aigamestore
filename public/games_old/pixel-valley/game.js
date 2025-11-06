import { CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, GRID_WIDTH, GRID_HEIGHT, gameState } from './globals.js';
import { Player, Tile, Bed } from './entities.js';
import { renderGame } from './renderer.js';
import { setupInputHandling, handlePlayerInput } from './input.js';
import { getGameState } from './globals.js';
import { game_testing_controller } from './automated_testing_controller.js';

// Expose the getGameState function globally
window.getGameState = getGameState;

// Create p5 instance
const p5 = window.p5;
let gameInstance = new p5(p => {
  // Initialize variables
  p.frameCount = 0;
  
  // Initialize the logs
  p.logs = {
    "game_info": [],
    "player_info": [],
    "inputs": []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    initializeGame();
    setupInputHandling(p);
    
    // Log initial game state
    p.logs.game_info.push({
      "game_status": gameState.gamePhase,
      "data": {},
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
  };
  
  p.draw = function() {
    p.frameCount++;
    gameState.frameCount = p.frameCount;
    
    // Handle player input
    handlePlayerInput(p);
    
    // Render the game
    renderGame(p);
  };
  
  function initializeGame() {
    // Create player
    gameState.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    // Create tiles
    gameState.tiles = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        gameState.tiles.push(new Tile(x, y));
      }
    }
    
    // Create bed
    gameState.bed = new Bed(13, 1);
    
    // Initialize game state
    gameState.gold = 100;
    gameState.day = 1;
    gameState.energy = 100;
    gameState.gamePhase = "START";
    gameState.controlMode = "HUMAN";
    gameState.isExhausted = false;
    gameState.autoSleepTimer = 0;
    gameState.hoveredTile = null;
    
    // Initialize player hover tracking
    gameState.player.updateHoveredTile();
  }
});

// Expose the game instance globally
window.gameInstance = gameInstance;

// Function to set control mode
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(button => {
    button.classList.remove('active');
  });
  
  // Add active class to the selected button
  if (mode === "HUMAN") {
    document.getElementById('humanModeBtn').classList.add('active');
  } else {
    document.getElementById(`${mode.toLowerCase()}_ModeBtn`).classList.add('active');
  }
  
  // Log control mode change
  gameInstance.logs.game_info.push({
    "game_status": "CONTROL_MODE_CHANGED",
    "data": { mode: mode },
    "framecount": gameInstance.frameCount,
    "timestamp": Date.now()
  });
};