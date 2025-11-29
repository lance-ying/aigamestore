// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { Player } from './entities.js';
import { loadLevel, renderLevel } from './level.js';
import { renderStartScreen, renderGameOverScreen, renderPausedIndicator, renderHUD } from './ui.js';
import { updateCamera } from './camera.js';
import { handleInput, setupKeyHandlers } from './input.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
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
      data: { gamePhase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Setup input handlers
    setupKeyHandlers(p);
    
    // Initialize keys
    gameState.keys = {};
  };
  
  p.draw = function() {
    p.background(20, 30, 50);
    
    if (gameState.gamePhase === "START") {
      renderStartScreen(p);
    } else if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "PAUSED") {
      // Initialize game on first play
      if (!gameState.player) {
        gameState.player = new Player(p, 50, 200);
        loadLevel(p, gameState.currentLevel);
        gameState.entities.push(gameState.player);
      }
      
      // Handle automated input
      handleInput(p);
      
      // Update game state
      if (gameState.gamePhase === "PLAYING") {
        // Update player
        if (gameState.player) {
          gameState.player.update();
          
          // Log player info every 10 frames
          if (p.frameCount % 10 === 0) {
            p.logs.player_info.push({
              screen_x: gameState.player.x - gameState.cameraX,
              screen_y: gameState.player.y,
              game_x: gameState.player.x,
              game_y: gameState.player.y,
              framecount: p.frameCount
            });
          }
          
          // Check win condition
          if (gameState.levelComplete) {
            gameState.gamePhase = "GAME_OVER_WIN";
            p.logs.game_info.push({
              data: { gamePhase: "GAME_OVER_WIN", score: gameState.score },
              framecount: p.frameCount,
              timestamp: Date.now()
            });
          }
          
          // Check lose condition
          if (gameState.player.health <= 0) {
            gameState.gamePhase = "GAME_OVER_LOSE";
            p.logs.game_info.push({
              data: { gamePhase: "GAME_OVER_LOSE", score: gameState.score },
              framecount: p.frameCount,
              timestamp: Date.now()
            });
          }
        }
        
        // Update enemies
        for (let enemy of gameState.enemies) {
          enemy.update();
        }
        
        // Update particles
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
          gameState.particles[i].update();
          if (gameState.particles[i].life <= 0) {
            gameState.particles.splice(i, 1);
          }
        }
        
        // Update camera
        updateCamera();
      }
      
      // Render game
      renderLevel(p, gameState.cameraX);
      
      // Render entities
      for (let enemy of gameState.enemies) {
        enemy.render(gameState.cameraX);
      }
      
      if (gameState.player) {
        gameState.player.render(gameState.cameraX);
      }
      
      // Render particles
      for (let particle of gameState.particles) {
        particle.render(gameState.cameraX);
      }
      
      // Render HUD
      renderHUD(p);
      
      // Render paused indicator
      if (gameState.gamePhase === "PAUSED") {
        renderPausedIndicator(p);
      }
    } else if (gameState.gamePhase.startsWith("GAME_OVER")) {
      // Render final game state
      renderLevel(p, gameState.cameraX);
      
      for (let enemy of gameState.enemies) {
        enemy.render(gameState.cameraX);
      }
      
      if (gameState.player) {
        gameState.player.render(gameState.cameraX);
      }
      
      renderHUD(p);
      
      // Render game over screen
      renderGameOverScreen(p);
    }
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn', 'test_5_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = mode === 'HUMAN' ? 'humanModeBtn' : mode.toLowerCase() + '_ModeBtn';
  const btn = document.getElementById(activeBtn);
  if (btn) {
    btn.classList.add('active');
  }
};