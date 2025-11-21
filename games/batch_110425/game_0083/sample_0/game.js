// game.js - Main game file

import { gameState, getGameState, GAME_PHASE, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS } from './globals.js';
import { Player } from './player.js';
import { initializeWorld, drawWorld } from './world.js';
import { drawStartScreen, drawGameOverScreen, drawPauseIndicator, drawUI, drawDialogue } from './ui.js';
import { handleKeyPressed, handleKeyReleased, logPlayerInfo } from './input.js';
import { updateGameplay, checkPuzzleSolved } from './gameplay.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup function
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize logs (write-only)
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Initialize game state
    gameState.gamePhase = GAME_PHASE.START;
    
    // Initialize world
    initializeWorld();
    
    // Create player
    gameState.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    // Log initial state
    p.logs.game_info.push({
      data: { message: "Game initialized", gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  // Draw function
  p.draw = function() {
    // Single background call at the top
    p.background(30, 35, 50);
    
    // Render based on game phase
    switch(gameState.gamePhase) {
      case GAME_PHASE.START:
        drawStartScreen(p);
        break;
        
      case GAME_PHASE.PLAYING:
        drawWorld(p);
        
        // Draw entities
        gameState.interactables.forEach(item => item.draw(p));
        gameState.npcs.forEach(npc => npc.draw(p));
        
        // Draw player
        if (gameState.player) {
          gameState.player.draw(p);
        }
        
        // Draw UI
        drawUI(p);
        drawDialogue(p);
        
        // Update gameplay
        updateGameplay(p);
        
        // Check for puzzle completions
        gameState.interactables.forEach(item => {
          if (item.solved) {
            checkPuzzleSolved(item.id);
          }
        });
        
        // Log player info periodically
        logPlayerInfo(p);
        break;
        
      case GAME_PHASE.PAUSED:
        // Draw game state but frozen
        drawWorld(p);
        gameState.interactables.forEach(item => item.draw(p));
        gameState.npcs.forEach(npc => npc.draw(p));
        if (gameState.player) {
          gameState.player.draw(p);
        }
        drawUI(p);
        drawDialogue(p);
        drawPauseIndicator(p);
        break;
        
      case GAME_PHASE.GAME_OVER_WIN:
      case GAME_PHASE.GAME_OVER_LOSE:
        drawGameOverScreen(p);
        break;
    }
  };
  
  // Input handlers
  p.keyPressed = function() {
    handleKeyPressed(p, p.keyCode, p.key);
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p, p.keyCode, p.key);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode management
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = document.getElementById(
    mode === 'HUMAN' ? 'humanModeBtn' : 
    mode === 'TEST_1' ? 'test_1_ModeBtn' : 
    mode === 'TEST_2' ? 'test_2_ModeBtn' : 
    'test_3_ModeBtn'
  );
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  console.log(`Control mode set to: ${mode}`);
};