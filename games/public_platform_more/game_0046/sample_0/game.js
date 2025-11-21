// game.js - Main game file

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { Player } from './entities.js';
import { renderScene } from './scene_manager.js';
import { renderUI, renderStartScreen, renderGameOverScreen, renderHint } from './ui.js';
import { handleKeyPress, updateHintCooldown, handleAutomatedInput } from './input_handler.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize the logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize player
    gameState.player = new Player(300, 380);
    gameState.entities = [gameState.player];
    
    // Log initial game info
    p.logs.game_info.push({
      data: "Game initialized",
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(20, 30, 45);
    
    // Update hint cooldown
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateHintCooldown();
      gameState.framesSinceLastAction++;
    }
    
    // Handle automated testing input
    handleAutomatedInput(p);
    
    // Render based on game phase
    switch(gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
        renderScene(p);
        renderUI(p);
        
        // Show hint if cooldown just triggered
        if (gameState.hintCooldown > 3540 && gameState.hintCooldown < 3600) {
          renderHint(p);
        }
        
        // Update and render player
        if (gameState.player) {
          gameState.player.update();
          gameState.player.render(p);
          
          // Log player info periodically
          if (p.frameCount % 60 === 0) {
            p.logs.player_info.push({
              screen_x: gameState.player.screenX,
              screen_y: gameState.player.screenY,
              game_x: gameState.player.gameX,
              game_y: gameState.player.gameY,
              framecount: p.frameCount
            });
          }
        }
        break;
        
      case GAME_PHASES.PAUSED:
        renderScene(p);
        renderUI(p);
        if (gameState.player) {
          gameState.player.render(p);
        }
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
        renderGameOverScreen(p, true);
        break;
        
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOverScreen(p, false);
        break;
    }
  };
  
  p.keyPressed = function() {
    handleKeyPress(p, p.key, p.keyCode);
    return false; // Prevent default
  };
});

// Expose the game instance globally
window.gameInstance = gameInstance;

// Control mode switching
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
  
  const activeBtnId = mode === 'HUMAN' ? 'humanModeBtn' : `${mode.toLowerCase()}_ModeBtn`;
  const activeBtn = document.getElementById(activeBtnId);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  gameInstance.logs.game_info.push({
    data: `Control mode changed to ${mode}`,
    framecount: gameInstance.frameCount,
    timestamp: Date.now()
  });
};