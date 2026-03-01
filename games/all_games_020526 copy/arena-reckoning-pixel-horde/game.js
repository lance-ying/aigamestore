// game.js - Main game file

import { gameState, GAME_PHASES, CONTROL_MODES, CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_CONFIG, LEVEL_CONFIGS } from './globals.js';
import { Player } from './player.js';
import { handleHumanInput, handleKeyPressed } from './controls.js';
import { updateSpawning } from './spawner.js';
import { updatePlayerCombat, updateEnemyShooting, checkCollisions } from './combat.js';
import { checkLevelCompletion, updateLevelTransition } from './levelManager.js';
import { renderUI } from './ui.js';
import { Particle } from './particles.js';

const p5 = window.p5;

let particles = [];

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
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Render distinct floor color per level
    const levelConfig = LEVEL_CONFIGS[gameState.currentLevel];
    if (levelConfig && levelConfig.floorColor) {
      p.background(...levelConfig.floorColor);
    } else {
      p.background(40);
    }
    
    const currentTime = Date.now();
    
    // Handle different game phases
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updatePlayingPhase(p, currentTime);
      renderPlayingPhase(p);
    } else if (gameState.gamePhase === GAME_PHASES.LEVEL_TRANSITION) {
      updateLevelTransition(p, currentTime);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      renderPlayingPhase(p);
    } else if (gameState.gamePhase === GAME_PHASES.UPGRADE_SELECTION) {
      renderPlayingPhase(p);
    }
    
    // Render UI for all phases
    renderUI(p);
    
    // Log player info during gameplay
    if (gameState.player && p.frameCount % 10 === 0 && gameState.gamePhase === GAME_PHASES.PLAYING) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
  };
  
  function updatePlayingPhase(p, currentTime) {
    // Handle input based on control mode
    handleHumanInput(p);
    
    // Update player
    if (gameState.player) {
      gameState.player.update(p);
    }
    
    // Update enemies
    for (const enemy of gameState.enemies) {
      if (!enemy.isDead) {
        enemy.update(p, gameState.player);
      }
    }
    
    // Update projectiles
    for (const projectile of gameState.projectiles) {
      if (!projectile.isDead) {
        projectile.update();
      }
    }
    
    // Update exp gems
    for (const gem of gameState.expGems) {
      if (!gem.isDead && gameState.player) {
        gem.update(gameState.player);
      }
    }
    
    // Update particles
    for (const particle of particles) {
      particle.update();
    }
    
    // Update lightning bolts
    for (const bolt of gameState.lightningBolts) {
      bolt.lifetime--;
    }
    gameState.lightningBolts = gameState.lightningBolts.filter(b => b.lifetime > 0);
    
    // Combat systems
    updatePlayerCombat(p, currentTime);
    updateEnemyShooting(p, currentTime);
    
    // Check collisions
    const newParticles = checkCollisions(p);
    particles.push(...newParticles);
    
    // Spawning
    updateSpawning(p, currentTime);
    
    // Level completion check
    checkLevelCompletion(p, currentTime);
    
    // Survival score
    if (p.frameCount % 60 === 0) {
      gameState.score += 5;
    }
    
    // Clean up dead entities
    gameState.projectiles = gameState.projectiles.filter(e => !e.isDead);
    gameState.expGems = gameState.expGems.filter(e => !e.isDead);
    gameState.enemies = gameState.enemies.filter(e => !e.isDead);
    particles = particles.filter(p => !p.isDead);
    gameState.entities = gameState.entities.filter(e => 
      e === gameState.player || !e.isDead
    );
  }
  
  function renderPlayingPhase(p) {
    // Render arena border
    p.stroke(80);
    p.strokeWeight(2);
    p.noFill();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Render particles
    for (const particle of particles) {
      particle.render(p);
    }
    
    // Render exp gems
    for (const gem of gameState.expGems) {
      if (!gem.isDead) {
        gem.render(p);
      }
    }
    
    // Render enemies
    for (const enemy of gameState.enemies) {
      if (!enemy.isDead) {
        enemy.render(p);
      }
    }
    
    // Render projectiles
    for (const projectile of gameState.projectiles) {
      if (!projectile.isDead) {
        projectile.render(p);
      }
    }
    
    // Render lightning bolts
    for (const bolt of gameState.lightningBolts) {
      renderLightningBolt(p, bolt);
    }
    
    // Render player
    if (gameState.player) {
      gameState.player.render(p);
    }
    
    // Screen shake effect on damage
    if (gameState.player && gameState.player.hitFlash > 5) {
      p.push();
      p.fill(255, 0, 0, 30);
      p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      p.pop();
    }
  }
  
  function renderLightningBolt(p, bolt) {
    p.push();
    
    // Main bolt
    p.stroke(150, 200, 255, 200);
    p.strokeWeight(3);
    
    // Create jagged lightning effect
    const segments = 5;
    const dx = (bolt.x2 - bolt.x1) / segments;
    const dy = (bolt.y2 - bolt.y1) / segments;
    
    let prevX = bolt.x1;
    let prevY = bolt.y1;
    
    for (let i = 1; i <= segments; i++) {
      let nextX = bolt.x1 + dx * i;
      let nextY = bolt.y1 + dy * i;
      
      // Add random offset except for endpoints
      if (i < segments) {
        nextX += (Math.random() - 0.5) * 20;
        nextY += (Math.random() - 0.5) * 20;
      }
      
      p.line(prevX, prevY, nextX, nextY);
      prevX = nextX;
      prevY = nextY;
    }
    
    // Glow effect
    p.stroke(200, 230, 255, 100);
    p.strokeWeight(6);
    p.line(bolt.x1, bolt.y1, bolt.x2, bolt.y2);
    
    // Electric particles at endpoints
    p.noStroke();
    p.fill(200, 230, 255, 150);
    p.circle(bolt.x1, bolt.y1, 8);
    p.circle(bolt.x2, bolt.y2, 8);
    
    p.pop();
  }
  
  p.keyPressed = function() {
    handleKeyPressed(p);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;
// Expose level loading for dev mode
window.loadLevel = function(levelNum) {
  const state = window.getGameState ? window.getGameState() : (window.gameState || (window.gameInstance && window.gameInstance.gameState));
  if (state) {
    state.currentLevel = levelNum;
    // Try common reset/start patterns
    if (typeof resetGame === 'function') {
      resetGame();
    }
    if (typeof startGame === 'function') {
      startGame();
    } else if (state.gamePhase !== undefined) {
      state.gamePhase = "PLAYING";
    }
  }
};

// Expose getGameState function
window.getGameState = function() {
  return gameState;
};

// Control mode switching
window.setControlMode = function(mode) {
  // Only allow setting to HUMAN mode now
  if (mode === CONTROL_MODES.HUMAN) {
    gameState.controlMode = CONTROL_MODES.HUMAN;
    
    // Update button states
    document.querySelectorAll('.control-button').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const btnId = mode.toLowerCase() + 'ModeBtn';
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.add('active');
    }
  }
};