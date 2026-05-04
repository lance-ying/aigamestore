// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES } from './globals.js';
import { generatePath, generateTowerSlots, drawPath, drawTowerSlots } from './path.js';
import { spawnWave, updateWaveSpawning } from './enemy.js';
import { updateParticles, drawParticles } from './particle.js';
import { drawUI, drawCursor, drawTowerMenu, drawTowerInfo, drawStartScreen, drawGameOverScreen } from './ui.js';
import { setupInput } from './input.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize game
    generatePath();
    generateTowerSlots();
    
    // Setup input
    setupInput(p);
    
    // Log setup
    p.logs.game_info.push({
      data: { event: "game_initialized", gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(40, 50, 45);
    
    // Handle game phases
    if (gameState.gamePhase === GAME_PHASES.START) {
      drawStartScreen(p);
      return;
    }
    
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      // Draw game state in background
      renderGame(p);
      drawGameOverScreen(p);
      return;
    }
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action !== null) {
        simulateKeyPress(p, action);
      }
    }
    
    // Update and render game
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGame(p);
    }
    
    renderGame(p);
  };
  
  function updateGame(p) {
    // Check game over conditions
    if (gameState.lives <= 0) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      p.logs.game_info.push({
        data: { event: "game_over", result: "lose", finalScore: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return;
    }
    
    if (gameState.wave >= gameState.maxWaves && gameState.enemies.length === 0) {
      if (!gameState.levelComplete) {
        gameState.levelComplete = true;
        gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
        p.logs.game_info.push({
          data: { event: "game_over", result: "win", finalScore: gameState.score },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }
    
    // Wave management
    gameState.waveTimer++;
    
    if (gameState.wave < gameState.maxWaves) {
      const allEnemiesDefeated = gameState.enemies.every(e => !e.alive);
      
      if (gameState.wave === 0 && gameState.waveTimer >= 60) {
        spawnWave(p);
        gameState.wave++;
        gameState.waveTimer = 0;
      } else if (allEnemiesDefeated && gameState.waveTimer >= gameState.waveDelay) {
        spawnWave(p);
        gameState.wave++;
        gameState.waveTimer = 0;
      }
      
      updateWaveSpawning(p);
    }
    
    // Update towers
    for (let tower of gameState.towers) {
      tower.update(p);
    }
    
    // Update enemies
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
      gameState.enemies[i].update(p);
      if (!gameState.enemies[i].alive) {
        gameState.enemies.splice(i, 1);
      }
    }
    
    // Update projectiles
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
      gameState.projectiles[i].update(p);
      if (!gameState.projectiles[i].alive) {
        gameState.projectiles.splice(i, 1);
      }
    }
    
    // Update particles
    updateParticles();
    
    // Log player info periodically
    if (p.frameCount % 60 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.cursorX,
        screen_y: gameState.cursorY,
        game_x: gameState.cursorX,
        game_y: gameState.cursorY,
        framecount: p.frameCount
      });
    }
  }
  
  function renderGame(p) {
    // Draw path
    drawPath(p);
    
    // Draw tower slots
    drawTowerSlots(p);
    
    // Draw towers
    for (let tower of gameState.towers) {
      tower.draw(p);
    }
    
    // Draw enemies
    for (let enemy of gameState.enemies) {
      enemy.draw(p);
    }
    
    // Draw projectiles
    for (let projectile of gameState.projectiles) {
      projectile.draw(p);
    }
    
    // Draw particles
    drawParticles(p);
    
    // Draw UI
    drawUI(p);
    drawCursor(p);
    drawTowerMenu(p);
    drawTowerInfo(p);
  }
  
  function simulateKeyPress(p, keyCode) {
    p.keyCode = keyCode;
    p.key = String.fromCharCode(keyCode);
    if (p.keyPressed) {
      p.keyPressed();
    }
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
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
  
  const activeBtn = mode === 'HUMAN' ? 'humanModeBtn' : 
                     mode === 'TEST_1' ? 'test_1_ModeBtn' :
                     mode === 'TEST_2' ? 'test_2_ModeBtn' : null;
  
  if (activeBtn) {
    const btn = document.getElementById(activeBtn);
    if (btn) {
      btn.classList.add('active');
    }
  }
};