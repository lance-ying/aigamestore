// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './entities.js';
import { initializeWorld, renderWorld, renderGoal, checkGoalReached } from './world.js';
import { handleInput, handleKeyPressed, handleKeyReleased } from './input.js';
import { renderUI, renderStartScreen, renderGameOverScreen } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs (write-only)
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
    
    // Initialize game objects
    gameState.player = new Player(100, 300);
    gameState.entities = [gameState.player];
    initializeWorld();
  };
  
  // Draw
  p.draw = function() {
    // Single background call at the top
    p.background(50);
    
    if (gameState.gamePhase === "START") {
      renderStartScreen(p);
    } else if (gameState.gamePhase === "PLAYING") {
      updateGame(p);
      renderGame(p);
    } else if (gameState.gamePhase === "PAUSED") {
      renderGame(p);
      renderUI(p);
    } else if (gameState.gamePhase === "GAME_OVER_WIN") {
      renderGame(p);
      renderGameOverScreen(p);
    }
  };
  
  // Update game logic
  function updateGame(p) {
    // Handle automated testing input
    if (gameState.controlMode !== "HUMAN") {
      const action = get_automated_testing_action(gameState);
      if (action) {
        const player = gameState.player;
        if (player) {
          if (action.jump && !player.isDashing) {
            player.jump();
          }
          if (action.dash) {
            player.startDash();
          }
          if (action.groundPound) {
            player.startGroundPound();
          }
        }
      }
    }
    
    // Handle keyboard input
    handleInput(p);
    
    // Update player
    if (gameState.player) {
      gameState.player.update(p);
      
      // Check platform collisions
      for (const platform of gameState.platforms) {
        platform.checkCollision(gameState.player, p);
      }
      
      // Check orb collection
      for (const orb of gameState.orbs) {
        orb.checkCollision(gameState.player, p);
      }
      
      // Update camera to follow player vertically
      const targetCameraY = gameState.player.y - CANVAS_HEIGHT / 2;
      gameState.cameraY += (targetCameraY - gameState.cameraY) * 0.1;
      
      // Log player info periodically
      if (p.frameCount % 10 === 0) {
        p.logs.player_info.push({
          screen_x: gameState.player.x,
          screen_y: gameState.player.y - gameState.cameraY,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          framecount: p.frameCount
        });
      }
      
      // Check goal
      if (!gameState.goalReached && checkGoalReached(gameState.player, p)) {
        gameState.goalReached = true;
        gameState.score += 500;
        gameState.gamePhase = "GAME_OVER_WIN";
        p.logs.game_info.push({
          data: { phase: "GAME_OVER_WIN", score: gameState.score },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Update particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
      gameState.particles[i].update();
      if (gameState.particles[i].isDead()) {
        gameState.particles.splice(i, 1);
      }
    }
  }
  
  // Render game
  function renderGame(p) {
    // Background and world
    renderWorld(p);
    
    // Platforms
    for (const platform of gameState.platforms) {
      platform.render(p);
    }
    
    // Orbs
    for (const orb of gameState.orbs) {
      orb.render(p);
    }
    
    // Goal
    renderGoal(p);
    
    // Particles
    for (const particle of gameState.particles) {
      particle.render(p);
    }
    
    // Player
    if (gameState.player) {
      gameState.player.render(p);
    }
    
    // UI
    renderUI(p);
  }
  
  // Event handlers
  p.keyPressed = function() {
    handleKeyPressed(p);
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p);
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
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn',
    'TEST_3': 'test_3_ModeBtn',
    'TEST_4': 'test_4_ModeBtn',
    'TEST_5': 'test_5_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};