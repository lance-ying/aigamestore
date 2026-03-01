// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './entities.js';
import { generateLevel } from './level.js';
import { handleInput } from './input.js';
import { renderStartScreen, renderGameOverScreen, renderPausedIndicator, renderHUD } from './render.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Log game start
    p.logs.game_info.push({
      data: { phase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    p.background(40, 60, 80);
    
    if (gameState.gamePhase === "START") {
      renderStartScreen(p);
    } else if (gameState.gamePhase === "PLAYING") {
      updateGame(p);
      renderGame(p);
      renderHUD(p);
    } else if (gameState.gamePhase === "PAUSED") {
      renderGame(p);
      renderHUD(p);
      renderPausedIndicator(p);
    } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
      renderGameOverScreen(p);
    }
  };

  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Game phase transitions
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === "START") {
        startGame(p);
      }
    } else if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === "PLAYING") {
        gameState.gamePhase = "PAUSED";
        p.logs.game_info.push({
          data: { phase: "PAUSED" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === "PAUSED") {
        gameState.gamePhase = "PLAYING";
        p.logs.game_info.push({
          data: { phase: "PLAYING" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (p.keyCode === 82) { // R
      if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
        resetToStart(p);
      }
    }
    
    return false;
  };

  function startGame(p) {
    gameState.gamePhase = "PLAYING";
    gameState.score = 0;
    gameState.rescuedCount = 0;
    gameState.levelComplete = false;
    gameState.framesSinceStart = 0;
    gameState.currentBroIndex = 0;
    gameState.cameraX = 0;
    
    // Generate level
    generateLevel();
    
    // Create player
    gameState.player = new Player(100, 100);
    gameState.player.broType = gameState.broTypes[0];
    
    p.logs.game_info.push({
      data: { phase: "PLAYING" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function resetToStart(p) {
    gameState.gamePhase = "START";
    gameState.player = null;
    gameState.entities = [];
    gameState.terrain = [];
    gameState.enemies = [];
    gameState.prisoners = [];
    gameState.projectiles = [];
    gameState.explosions = [];
    gameState.particles = [];
    gameState.helicopter = null;
    
    p.logs.game_info.push({
      data: { phase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function updateGame(p) {
    gameState.framesSinceStart++;
    
    // Handle input
    handleInput(p);
    
    // Update player
    if (gameState.player) {
      gameState.player.update(p);
      
      // Log player info periodically
      if (p.frameCount % 10 === 0) {
        p.logs.player_info.push({
          screen_x: gameState.player.x - gameState.cameraX,
          screen_y: gameState.player.y,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          framecount: p.frameCount
        });
      }
      
      // Update camera to follow player
      const targetCameraX = gameState.player.x - CANVAS_WIDTH / 3;
      gameState.cameraX += (targetCameraX - gameState.cameraX) * 0.1;
      gameState.cameraX = Math.max(0, gameState.cameraX);
    }
    
    // Update enemies
    for (let enemy of gameState.enemies) {
      enemy.update(p);
    }
    
    // Update prisoners
    for (let prisoner of gameState.prisoners) {
      prisoner.update(p);
    }
    
    // Update projectiles
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
      gameState.projectiles[i].update(p);
      if (!gameState.projectiles[i].active) {
        gameState.projectiles.splice(i, 1);
      }
    }
    
    // Update explosions
    for (let i = gameState.explosions.length - 1; i >= 0; i--) {
      gameState.explosions[i].update();
      if (gameState.explosions[i].lifetime <= 0) {
        gameState.explosions.splice(i, 1);
      }
    }
    
    // Update particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
      gameState.particles[i].update();
      if (gameState.particles[i].lifetime <= 0) {
        gameState.particles.splice(i, 1);
      }
    }
    
    // Update helicopter
    if (gameState.helicopter) {
      gameState.helicopter.update();
    }
    
    // Check win condition
    if (gameState.levelComplete && gameState.gamePhase !== "GAME_OVER_WIN") {
      gameState.gamePhase = "GAME_OVER_WIN";
      p.logs.game_info.push({
        data: { phase: "GAME_OVER_WIN", score: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  function renderGame(p) {
    // Sky gradient
    for (let y = 0; y < CANVAS_HEIGHT; y++) {
      const t = y / CANVAS_HEIGHT;
      p.stroke(40 + t * 80, 60 + t * 100, 80 + t * 120);
      p.line(0, y, CANVAS_WIDTH, y);
    }
    p.noStroke();
    
    const cameraX = gameState.cameraX;
    
    // Render terrain
    for (let terrain of gameState.terrain) {
      terrain.render(p, cameraX);
    }
    
    // Render prisoners
    for (let prisoner of gameState.prisoners) {
      prisoner.render(p, cameraX);
    }
    
    // Render enemies
    for (let enemy of gameState.enemies) {
      enemy.render(p, cameraX);
    }
    
    // Render projectiles
    for (let projectile of gameState.projectiles) {
      projectile.render(p, cameraX);
    }
    
    // Render explosions
    for (let explosion of gameState.explosions) {
      explosion.render(p, cameraX);
    }
    
    // Render particles
    for (let particle of gameState.particles) {
      particle.render(p, cameraX);
    }
    
    // Render player
    if (gameState.player) {
      gameState.player.render(p, cameraX);
    }
    
    // Render helicopter
    if (gameState.helicopter) {
      gameState.helicopter.render(p, cameraX);
    }
  }
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
  
  const activeBtn = mode === 'HUMAN' ? 'humanModeBtn' : mode.toLowerCase() + 'ModeBtn';
  const btn = document.getElementById(activeBtn);
  if (btn) {
    btn.classList.add('active');
  }
};