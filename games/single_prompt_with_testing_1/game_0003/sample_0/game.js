// game.js - Main game file

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, resetGameState } from './globals.js';
import { Player } from './player.js';
import { createScenes } from './scene.js';
import { renderUI, renderStartScreen, renderGameOverScreen } from './ui.js';
import { handleKeyPressed, processAutomatedInput } from './input.js';
import { updateDialogue, updateSceneTransition } from './game_logic.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let scenes = {};
  
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
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Create scenes
    scenes = createScenes();
    p._scenes = scenes; // Store for access from other modules
    
    // Initialize player
    gameState.player = new Player(100, CANVAS_HEIGHT * 0.65);
    gameState.entities = [gameState.player];
    
    // Log player initial position
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  };
  
  p.draw = function() {
    p.background(50, 40, 60);
    
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
      case GAME_PHASES.PAUSED:
        // Process automated input if in test mode
        if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
          processAutomatedInput(p, scenes);
        }
        
        // Update game state
        if (gameState.gamePhase === GAME_PHASES.PLAYING) {
          gameState.player.update();
          updateDialogue();
          updateSceneTransition();
          
          // Log player position changes
          if (gameState.player.isMoving() && p.frameCount % 10 === 0) {
            p.logs.player_info.push({
              screen_x: gameState.player.x,
              screen_y: gameState.player.y,
              game_x: gameState.player.x,
              game_y: gameState.player.y,
              framecount: p.frameCount
            });
          }
        }
        
        // Render scene
        const currentScene = scenes[gameState.currentScene];
        if (currentScene) {
          const nearbyHotspot = currentScene.getNearbyHotspot(gameState.player);
          gameState.currentHotspot = nearbyHotspot;
          currentScene.render(p, nearbyHotspot);
        }
        
        // Render player
        gameState.player.render(p);
        
        // Render UI
        renderUI(p);
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOverScreen(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.keyCode, p.key, scenes);
    }
    return false;
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode management
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
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  // Dispatch event for test controller
  window.dispatchEvent(new Event('controlModeChange'));
  
  // Reset game if switching modes
  if (gameState.gamePhase === GAME_PHASES.PLAYING || gameState.gamePhase === GAME_PHASES.PAUSED) {
    resetGameState();
    gameState.gamePhase = GAME_PHASES.START;
    gameState.controlMode = mode;
  }
};

export default gameInstance;