// game.js - Main game file

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './entities.js';
import { setupInputHandlers, processAutomatedInput } from './input_handler.js';
import { initializeLevel, updateGameLogic, checkSecrets } from './game_logic.js';
import { renderGame, initializeRenderer } from './renderer.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup function
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
    
    // Log game initialization
    p.logs.game_info.push({
      data: { phase: 'START', message: 'Game initialized' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Initialize player
    gameState.player = new Player(100, 300);
    gameState.entities.push(gameState.player);
    
    // Initialize renderer
    initializeRenderer();
    
    // Initialize first level (but don't start yet)
    initializeLevel(0);
    
    // Setup input handlers
    setupInputHandlers(p);
  };
  
  // Draw function
  p.draw = function() {
    // Process automated testing input
    if (gameState.controlMode !== 'HUMAN' && p.frameCount % 5 === 0) {
      processAutomatedInput(p);
    }
    
    // Update game logic
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGameLogic(p);
      checkSecrets(p);
      
      // Update entities
      gameState.entities.forEach(entity => {
        if (entity.update) {
          entity.update();
        }
      });
    }
    
    // Render game
    renderGame(p);
  };
});

// Expose the game instance globally
window.gameInstance = gameInstance;

export default gameInstance;