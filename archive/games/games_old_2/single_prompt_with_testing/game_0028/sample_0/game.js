// game.js - Main game file

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './player.js';
import { updateProjectiles, renderProjectiles, updatePickups, renderPickups } from './projectile.js';
import { updateWaveSystem } from './wave_manager.js';
import { renderUI } from './ui.js';
import { handleKeyPressed, handleKeyReleased, processAutomatedInput } from './input_handler.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup
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
      data: { event: "game_initialized", gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  // Draw loop
  p.draw = function() {
    p.background(20, 20, 30);
    
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      // Process automated testing input
      processAutomatedInput(p);
      
      if (!gameState.showUpgradeMenu) {
        // Update game state
        updateGame(p);
        
        // Render game
        renderGame(p);
      }
    }
    
    // Render UI (handles all game phases)
    renderUI(p);
  };
  
  // Input handlers
  p.keyPressed = function() {
    handleKeyPressed(p);
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p);
  };
  
  // Game update logic
  function updateGame(p) {
    // Update survival time
    gameState.survivalTime = Math.floor(p.frameCount / 60);
    
    // Update wave system
    updateWaveSystem(p);
    
    // Update player
    if (gameState.player) {
      gameState.player.update(p);
      
      // Fire weapon if space is held
      if (gameState.keys.space) {
        gameState.player.fire(p);
      }
      
      // Log player info periodically
      if (p.frameCount % 60 === 0) {
        p.logs.player_info.push({
          screen_x: gameState.player.x,
          screen_y: gameState.player.y,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          framecount: p.frameCount
        });
      }
      
      // Check game over
      if (gameState.player.health <= 0) {
        gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
        p.logs.game_info.push({
          data: { event: "game_over", reason: "player_died", score: gameState.score },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      
      // Win condition: survive 2 minutes for testing purposes
      if (gameState.survivalTime >= 120) {
        gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
        p.logs.game_info.push({
          data: { event: "game_over", reason: "win", score: gameState.score },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Update enemies
    for (const enemy of gameState.enemies) {
      enemy.update(p);
    }
    
    // Update projectiles
    updateProjectiles(p);
    
    // Update pickups
    updatePickups(p);
  }
  
  // Game rendering
  function renderGame(p) {
    // Render ground effect
    p.push();
    p.noStroke();
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        const brightness = 25 + ((i + j) % 2) * 5;
        p.fill(brightness, brightness, brightness + 5);
        p.rect(i * 60, j * 40, 60, 40);
      }
    }
    p.pop();
    
    // Render pickups
    renderPickups(p);
    
    // Render projectiles
    renderProjectiles(p);
    
    // Render enemies
    for (const enemy of gameState.enemies) {
      enemy.render(p);
    }
    
    // Render player
    if (gameState.player) {
      gameState.player.render(p);
    }
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ["humanModeBtn", "test_1_ModeBtn", "test_2_ModeBtn", "test_3_ModeBtn", "test_4_ModeBtn", "test_5_ModeBtn"];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove("active");
    }
  });
  
  const modeMap = {
    "HUMAN": "humanModeBtn",
    "TEST_1": "test_1_ModeBtn",
    "TEST_2": "test_2_ModeBtn",
    "TEST_3": "test_3_ModeBtn",
    "TEST_4": "test_4_ModeBtn",
    "TEST_5": "test_5_ModeBtn"
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
};

export default gameInstance;