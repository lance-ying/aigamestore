// game.js - Main game file with p5.js instance mode

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  getGameState 
} from './globals.js';
import { setupInput, handleInput } from './input.js';
import { renderGame } from './render.js';
import { renderStartScreen, renderPausedOverlay, renderGameOver } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs - DO NOT RESET DURING GAME
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42); // Set seed once
    
    // Initialize game state
    gameState.gamePhase = "START";
    gameState.controlMode = "HUMAN";
    gameState.lastFrameTime = p.millis();
    
    // Setup input handlers
    setupInput(p);
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Update frame tracking
    gameState.frameCount = p.frameCount;
    const currentTime = p.millis();
    gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = currentTime;
    gameState.animationFrame++;
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        // Simulate key press
        p.keyPressed = () => {};
        p.keyCode = action.keyCode;
        handleInput(p);
      }
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
        
      case "PLAYING":
        // Handle input
        if (gameState.controlMode === "HUMAN") {
          handleInput(p);
        }
        
        // Update game entities
        updateGame(p);
        
        // Render game
        renderGame(p);
        break;
        
      case "PAUSED":
        renderGame(p);
        renderPausedOverlay(p);
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGame(p);
        renderGameOver(p);
        break;
    }
  };
});

function updateGame(p) {
  // Update player
  if (gameState.player) {
    gameState.player.update(p);
  }
  
  // Update gems
  for (const gem of gameState.gems) {
    gem.update(p);
  }
  
  // Update enemies
  for (let i = gameState.enemies.length - 1; i >= 0; i--) {
    gameState.enemies[i].update(p);
  }
  
  // Update bombs
  for (let i = gameState.bombs.length - 1; i >= 0; i--) {
    gameState.bombs[i].update(p);
  }
  
  // Update ropes
  for (const rope of gameState.ropes) {
    rope.update(p);
  }
  
  // Update exit door
  if (gameState.exitDoor) {
    gameState.exitDoor.update(p);
  }
  
  // Update particles
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    gameState.particles[i].update(p);
    if (gameState.particles[i].isDead()) {
      gameState.particles.splice(i, 1);
    }
  }
  
  // Update explosions
  for (let i = gameState.explosions.length - 1; i >= 0; i--) {
    gameState.explosions[i].update(p);
    if (gameState.explosions[i].isDead()) {
      gameState.explosions.splice(i, 1);
    }
  }
}

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switcher for testing
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button styles
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  if (mode === 'HUMAN') {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === 'TEST_1') {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === 'TEST_2') {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
  
  console.log('Control mode set to:', mode);
};