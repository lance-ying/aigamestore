// game.js - Main game file

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { Player } from './player.js';
import { createLevel } from './level.js';
import { handleInput, setupKeyHandlers } from './input.js';
import { renderGame } from './renderer.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup function
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
    
    // Log initial game state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, event: "game_initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Initialize game
    initializeGame(p);
    
    // Setup key handlers
    setupKeyHandlers(p);
  };
  
  // Draw function
  p.draw = function() {
    // Single background call to prevent flickering
    p.background(10, 10, 30);
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const actions = get_automated_testing_action(gameState);
      if (actions) {
        for (let action of actions) {
          simulateKeyPress(p, action);
        }
      }
    }
    
    // Update game logic
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGame(p);
      handleInput(p);
      
      // Log player info periodically
      if (p.frameCount % 10 === 0 && gameState.player) {
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
    renderGame(p);
  };
  
  function initializeGame(p) {
    // Create player
    gameState.player = new Player(p, 50, CANVAS_HEIGHT - 70);
    gameState.entities = [gameState.player];
    
    // Create level
    createLevel(p);
    
    // Reset game state
    gameState.score = 0;
    gameState.demonsKilled = 0;
    gameState.levelComplete = false;
    gameState.completionTime = 0;
    gameState.particles = [];
    gameState.cards = [];
  }
  
  function updateGame(p) {
    // Update player
    if (gameState.player) {
      gameState.player.update();
      
      // Check game over conditions
      if (gameState.player.health <= 0) {
        gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase, event: "player_died" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Update entities
    for (let i = gameState.entities.length - 1; i >= 0; i--) {
      const entity = gameState.entities[i];
      if (entity.update) {
        entity.update();
      }
      
      // Remove inactive entities
      if (entity.active === false) {
        gameState.entities.splice(i, 1);
      }
    }
    
    // Update cards
    for (let card of gameState.cards) {
      if (card.active) {
        card.update();
      }
    }
    
    // Update particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
      gameState.particles[i].update();
      if (!gameState.particles[i].active) {
        gameState.particles.splice(i, 1);
      }
    }
    
    // Update exit portal
    if (gameState.exitPortal) {
      gameState.exitPortal.update();
    }
    
    // Check win condition
    if (gameState.levelComplete && !gameState.completionTime) {
      gameState.completionTime = (Date.now() - gameState.startTime) / 1000;
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      gameState.score += Math.floor(10000 / gameState.completionTime);
      
      p.logs.game_info.push({
        data: { 
          gamePhase: gameState.gamePhase, 
          event: "level_complete",
          completionTime: gameState.completionTime,
          finalScore: gameState.score
        },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  function simulateKeyPress(p, keyCode) {
    // Simulate key press for automated testing
    if (keyCode === 37) { // LEFT
      gameState.player.moveLeft();
    } else if (keyCode === 39) { // RIGHT
      gameState.player.moveRight();
    } else if (keyCode === 38) { // UP
      gameState.player.aimAngle -= 0.05;
    } else if (keyCode === 40) { // DOWN
      gameState.player.aimAngle += 0.05;
    } else if (keyCode === 32) { // SPACE
      gameState.player.jump();
    } else if (keyCode === 90) { // Z
      gameState.player.useCardAbility();
    } else if (keyCode === 16) { // SHIFT
      const card = gameState.player.getCurrentCard();
      if (card && card.type.ability === "DASH") {
        gameState.player.dash();
        gameState.player.removeCurrentCard();
      }
    }
  }
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
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn',
    'TEST_3': 'test_3_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

export default gameInstance;