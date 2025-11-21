// game.js - Main game file

import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, PHASE_PLAYING, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, ENERGY_REGEN_RATE, MAP_WIDTH, MAP_HEIGHT } from './globals.js';
import { Unit, Enemy, Turret, Projectile, Particle, CapturePoint } from './entities.js';
import { initWaves, updateWaves, allWavesComplete } from './waveManager.js';
import { updateHeroAbility } from './heroAbilities.js';
import { handleKeyPressed, handleKeyReleased, updateInputs } from './input.js';
import { renderGame } from './rendering.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs (write-only)
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize capture points
    gameState.capturePoints = [
      new CapturePoint(300, 200, 0),
      new CapturePoint(600, 400, 1),
      new CapturePoint(900, 600, 2)
    ];
    
    initWaves();
    
    p.logs.game_info.push({
      data: { phase: "INITIALIZED" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Single background call
    p.background(30, 40, 50);
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN") {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        simulateKeyPress(action.keyCode);
      }
    }
    
    // Update game state
    if (gameState.gamePhase === PHASE_PLAYING) {
      updateGame(p);
    }
    
    // Render
    renderGame(p);
  };

  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
    return false; // Prevent default
  };

  p.keyReleased = function() {
    handleKeyReleased(p, p.key, p.keyCode);
    return false;
  };

  function updateGame(p) {
    // Update inputs
    updateInputs();
    
    // Regenerate energy
    gameState.energy = Math.min(gameState.energy + ENERGY_REGEN_RATE, 300);
    
    // Update waves
    updateWaves(p);
    
    // Update hero ability
    updateHeroAbility();
    
    // Update capture points
    for (const point of gameState.capturePoints) {
      point.update();
    }
    
    // Update units
    for (let i = gameState.units.length - 1; i >= 0; i--) {
      const unit = gameState.units[i];
      unit.update();
      
      if (unit.health <= 0) {
        gameState.units.splice(i, 1);
        const entityIndex = gameState.entities.indexOf(unit);
        if (entityIndex > -1) gameState.entities.splice(entityIndex, 1);
      }
    }
    
    // Update enemies
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
      const enemy = gameState.enemies[i];
      enemy.update();
      
      if (enemy.health <= 0) {
        gameState.enemies.splice(i, 1);
        const entityIndex = gameState.entities.indexOf(enemy);
        if (entityIndex > -1) gameState.entities.splice(entityIndex, 1);
      }
    }
    
    // Update turrets
    for (let i = gameState.turrets.length - 1; i >= 0; i--) {
      const turret = gameState.turrets[i];
      turret.update();
      
      if (turret.health <= 0) {
        gameState.turrets.splice(i, 1);
        const entityIndex = gameState.entities.indexOf(turret);
        if (entityIndex > -1) gameState.entities.splice(entityIndex, 1);
      }
    }
    
    // Update projectiles
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
      const projectile = gameState.projectiles[i];
      projectile.update();
      
      if (!projectile.active) {
        gameState.projectiles.splice(i, 1);
      }
    }
    
    // Update particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
      const particle = gameState.particles[i];
      particle.update();
      
      if (particle.lifetime <= 0) {
        gameState.particles.splice(i, 1);
      }
    }
    
    // Check win condition
    if (allWavesComplete() && gameState.missionObjectives.capturedPoints >= gameState.missionObjectives.requiredPoints) {
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
      p.logs.game_info.push({
        data: { phase: PHASE_GAME_OVER_WIN, score: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // Check lose condition (enemies reached base)
    for (const enemy of gameState.enemies) {
      if (enemy.x < 80) {
        gameState.gamePhase = PHASE_GAME_OVER_LOSE;
        p.logs.game_info.push({
          data: { phase: PHASE_GAME_OVER_LOSE, score: gameState.score },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
        break;
      }
    }
    
    // Log player info periodically
    if (p.frameCount % 60 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.cursorX,
        screen_y: gameState.cursorY,
        game_x: gameState.cameraX + gameState.cursorX,
        game_y: gameState.cameraY + gameState.cursorY,
        framecount: p.frameCount
      });
    }
  }

  function simulateKeyPress(keyCode) {
    // Simulate key press for automated testing
    const key = String.fromCharCode(keyCode);
    
    // Only simulate gameplay keys, not phase transition keys
    if (keyCode === 13 || keyCode === 27 || keyCode === 82) {
      return; // Don't simulate ENTER, ESC, R
    }
    
    // Press
    gameState.keysPressed[keyCode] = true;
    handleKeyPressed(p, key, keyCode);
    
    // Release after a frame
    setTimeout(() => {
      gameState.keysPressed[keyCode] = false;
      handleKeyReleased(p, key, keyCode);
    }, 16);
  }
});

// Expose game instance globally
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
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn',
    'TEST_3': 'test_3_ModeBtn',
    'TEST_4': 'test_4_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

export default gameInstance;