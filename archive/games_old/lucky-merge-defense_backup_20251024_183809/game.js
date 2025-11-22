// game.js - Main game file
import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { handleKeyPressed } from './input.js';
import { updateWaves } from './wave.js';
import { updateProjectiles } from './projectiles.js';
import { updateParticles } from './particles.js';
import { updateRoulette } from './roulette.js';
import { drawStartScreen, drawPlayingScreen, drawPausedScreen, drawGameOverScreen } from './render.js';
import { getTestingAction } from './testing.js';
import { Unit } from './units.js';

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
    
    // Initialize game state
    gameState.gamePhase = 'START';
    
    p.logs.game_info.push({
      data: { phase: 'START' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle testing mode
    if (gameState.controlMode !== 'HUMAN') {
      const action = getTestingAction(p);
      if (action) {
        simulateKeyPress(action.keyCode, p);
      }
    }
    
    // Update game logic
    if (gameState.gamePhase === 'PLAYING') {
      updateGame(p);
    }
    
    // Render
    if (gameState.gamePhase === 'START') {
      drawStartScreen(p);
    } else if (gameState.gamePhase === 'PLAYING') {
      drawPlayingScreen(p);
    } else if (gameState.gamePhase === 'PAUSED') {
      drawPausedScreen(p);
    } else if (gameState.gamePhase === 'GAME_OVER') {
      drawGameOverScreen(p);
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p);
  };
  
  function updateGame(p) {
    // Update waves
    updateWaves(p);
    
    // Update units
    for (let i = gameState.units.length - 1; i >= 0; i--) {
      const unit = gameState.units[i];
      const alive = unit.update();
      
      if (!alive) {
        gameState.grid[unit.gridY][unit.gridX] = null;
        gameState.units.splice(i, 1);
      }
    }
    
    // Update enemies
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
      const enemy = gameState.enemies[i];
      const alive = enemy.update();
      
      if (!alive || enemy.isDead) {
        gameState.enemies.splice(i, 1);
      }
    }
    
    // Update projectiles
    updateProjectiles(p);
    
    // Update particles
    updateParticles();
    
    // Update roulette
    updateRoulette(p);
    
    // Update buffs
    if (gameState.buffTimer > 0) {
      gameState.buffTimer--;
      if (gameState.buffTimer === 0) {
        gameState.globalAttackBuff = 1.0;
      }
    }
    
    // Log player info periodically
    if (p.frameCount % 60 === 0 && gameState.units.length > 0) {
      const firstUnit = gameState.units[0];
      p.logs.player_info.push({
        screen_x: firstUnit.x,
        screen_y: firstUnit.y,
        game_x: firstUnit.x,
        game_y: firstUnit.y,
        framecount: p.frameCount
      });
    }
  }
  
  function simulateKeyPress(keyCode, p) {
    p.keyCode = keyCode;
    
    // Set key for special cases
    if (keyCode === 13) p.key = 'Enter';
    else if (keyCode === 27) p.key = 'Escape';
    else if (keyCode === 32) p.key = ' ';
    else if (keyCode === 82) p.key = 'r';
    else if (keyCode === 90) p.key = 'z';
    else p.key = String.fromCharCode(keyCode);
    
    handleKeyPressed(p);
  }
});

// Expose game instance and state
window.gameInstance = gameInstance;
window.getGameState = getGameState;

// Control mode switching
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
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : mode.toLowerCase() + 'ModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

export default gameInstance;