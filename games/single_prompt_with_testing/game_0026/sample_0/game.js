// game.js - Main game file

import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, KEYS, gameState } from './globals.js';
import { Player } from './player.js';
import { LevelManager } from './level.js';
import { handleCollisions } from './collision.js';
import { handleInput } from './input.js';
import { updateParticles, renderParticles } from './particle.js';
import { renderUI, renderStartScreen, renderGameOverScreen } from './ui.js';
import { updateTimeSlow, getTimeScale, renderTimeSlowEffect } from './timeslow.js';
import get_automated_testing_action from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let levelManager;
  
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize level manager
    levelManager = new LevelManager(p);
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(20, 20, 30);
    
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
      return;
    }
    
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGameOverScreen(p);
      return;
    }
    
    if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      // Render frozen game state
      renderGame();
      return;
    }
    
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      // Handle automated testing
      if (gameState.controlMode !== "HUMAN") {
        const actions = get_automated_testing_action(gameState);
        // Simulate key presses
        for (const key of actions) {
          simulateKeyPress(key);
        }
      }
      
      // Update time slow
      updateTimeSlow(p);
      
      const timeScale = getTimeScale();
      const updates = Math.max(1, Math.round(timeScale * 1));
      
      // Update game logic
      for (let i = 0; i < updates; i++) {
        updateGame();
      }
      
      // Render game
      renderGame();
      
      // Increment frame counter
      gameState.frameCounter++;
      
      // Check level completion
      if (levelManager.allEnemiesDefeated() && !gameState.levelComplete) {
        gameState.levelComplete = true;
        setTimeout(() => {
          advanceLevel();
        }, 1000);
      }
    }
  };
  
  function updateGame() {
    const player = gameState.player;
    
    if (player && player.alive) {
      // Handle input
      if (gameState.controlMode === "HUMAN") {
        handleInput(p, player);
      }
      
      player.update();
      
      // Log player info
      if (p.frameCount % 10 === 0) {
        p.logs.player_info.push({
          screen_x: player.x,
          screen_y: player.y,
          game_x: player.x,
          game_y: player.y,
          framecount: p.frameCount
        });
      }
      
      // Check if player died
      if (!player.alive) {
        gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Update enemies
    for (const enemy of gameState.enemies) {
      enemy.update();
    }
    
    // Update projectiles
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
      const proj = gameState.projectiles[i];
      proj.update();
      if (!proj.alive) {
        gameState.projectiles.splice(i, 1);
      }
    }
    
    // Update particles
    updateParticles(gameState);
    
    // Handle collisions
    handleCollisions(p);
  }
  
  function renderGame() {
    // Background gradient
    for (let y = 0; y < CANVAS_HEIGHT; y++) {
      const inter = y / CANVAS_HEIGHT;
      const c = p.lerpColor(p.color(20, 20, 30), p.color(40, 30, 50), inter);
      p.stroke(c);
      p.line(0, y, CANVAS_WIDTH, y);
    }
    
    // Ground
    p.fill(30, 30, 40);
    p.noStroke();
    p.rect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);
    
    // Grid on ground
    p.stroke(50, 50, 60);
    for (let x = 0; x < CANVAS_WIDTH; x += 30) {
      p.line(x, CANVAS_HEIGHT - 50, x, CANVAS_HEIGHT);
    }
    
    // Render particles
    renderParticles(p, gameState.particles);
    
    // Render projectiles
    for (const proj of gameState.projectiles) {
      proj.render();
    }
    
    // Render enemies
    for (const enemy of gameState.enemies) {
      enemy.render();
    }
    
    // Render player
    if (gameState.player) {
      gameState.player.render();
    }
    
    // Time slow effect
    renderTimeSlowEffect(p);
    
    // UI
    renderUI(p, levelManager);
  }
  
  function advanceLevel() {
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
    
    gameState.currentLevel++;
    gameState.levelComplete = false;
    
    if (gameState.currentLevel >= gameState.totalLevels) {
      // Win condition
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, score: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else {
      // Load next level
      levelManager.loadLevel(gameState.currentLevel);
      gameState.frameCounter = 0;
      
      // Reset player position
      gameState.player.x = 50;
      gameState.player.y = 100;
      gameState.player.vx = 0;
      gameState.player.vy = 0;
    }
  }
  
  function startGame() {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    gameState.currentLevel = 0;
    gameState.score = 0;
    gameState.levelComplete = false;
    gameState.frameCounter = 0;
    gameState.timeSlowCharge = 100;
    
    // Create player
    gameState.player = new Player(p, 50, 100);
    
    // Load first level
    levelManager.loadLevel(0);
    
    // Add player to entities
    gameState.entities = [gameState.player, ...gameState.enemies];
    
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function simulateKeyPress(keyCode) {
    // This is called for automated testing
    // The actual key state is checked via keyIsDown
  }
  
  p.keyPressed = function() {
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    if (p.keyCode === KEYS.ENTER) {
      if (gameState.gamePhase === GAME_PHASES.START) {
        startGame();
      }
    }
    
    if (p.keyCode === KEYS.ESC) {
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    if (p.keyCode === KEYS.R) {
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        gameState.gamePhase = GAME_PHASES.START;
        gameState.player = null;
        gameState.entities = [];
        gameState.enemies = [];
        gameState.projectiles = [];
        gameState.particles = [];
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  };
  
  p.keyReleased = function() {
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
});

// Expose globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : `${mode.toLowerCase()}_ModeBtn`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

export default gameInstance;