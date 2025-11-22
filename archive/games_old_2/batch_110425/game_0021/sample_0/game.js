// game.js - Main game file

import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, STARTING_GOLD, STARTING_LIVES } from './globals.js';
import { Player } from './entities.js';
import { generatePath, generateValidPlacementLocations } from './pathfinding.js';
import { startNextWave, updateWaveState, checkEnemiesRemaining } from './wave_manager.js';
import { handleKeyPressed, handleKeyReleased, handleMovementInput, processAutomatedInput } from './input_handler.js';
import { renderStartScreen, renderGameUI, renderGameOverScreen, renderPath, renderValidPlacementLocations } from './ui.js';
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
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize game
    initializeGame(p);
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: PHASE_START, event: "setup_complete" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Clear screen
    p.background(40, 60, 50);
    
    // Handle game phases
    if (gameState.gamePhase === PHASE_START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === PHASE_PLAYING || gameState.gamePhase === PHASE_PAUSED) {
      // Update game state
      if (gameState.gamePhase === PHASE_PLAYING) {
        updateGame(p);
      }
      
      // Render game
      renderGame(p);
      renderGameUI(p);
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      renderGameOverScreen(p);
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
    return false; // Prevent default
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p, p.keyCode);
    return false;
  };
});

function initializeGame(p) {
  // Generate level
  gameState.path = generatePath();
  gameState.validPlacementLocations = generateValidPlacementLocations(gameState.path);
  
  // Create player (hero)
  gameState.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
  gameState.entities.push(gameState.player);
  
  // Reset game state
  gameState.gold = STARTING_GOLD;
  gameState.lives = STARTING_LIVES;
  gameState.stars = 0;
  gameState.currentWave = 0;
  gameState.waveInProgress = false;
  gameState.towers = [];
  gameState.enemies = [];
  gameState.projectiles = [];
  gameState.particles = [];
}

function updateGame(p) {
  // Process automated testing input
  if (gameState.controlMode !== "HUMAN") {
    const action = get_automated_testing_action(gameState);
    processAutomatedInput(p, action);
  } else {
    handleMovementInput(p);
  }
  
  // Update entities
  if (gameState.player) {
    gameState.player.update();
  }
  
  for (const tower of gameState.towers) {
    tower.update();
  }
  
  for (let i = gameState.enemies.length - 1; i >= 0; i--) {
    const enemy = gameState.enemies[i];
    enemy.update();
    
    if (enemy.hp <= 0 || enemy.reachedEnd) {
      gameState.enemies.splice(i, 1);
      const entityIndex = gameState.entities.indexOf(enemy);
      if (entityIndex > -1) {
        gameState.entities.splice(entityIndex, 1);
      }
    }
  }
  
  for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
    if (gameState.projectiles[i].update()) {
      gameState.projectiles.splice(i, 1);
    }
  }
  
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    if (gameState.particles[i].update()) {
      gameState.particles.splice(i, 1);
    }
  }
  
  // Update wave state
  updateWaveState();
  checkEnemiesRemaining();
  
  // Check game over condition
  if (gameState.lives <= 0) {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    p.logs.game_info.push({
      data: { phase: PHASE_GAME_OVER_LOSE, event: "game_over_lose" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function renderGame(p) {
  // Render background grass
  p.push();
  p.fill(60, 100, 60);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  p.pop();
  
  // Render path
  renderPath(p, gameState.path);
  
  // Render valid placement locations
  if (!gameState.selectedTower) {
    renderValidPlacementLocations(p, gameState.validPlacementLocations);
  }
  
  // Render towers
  for (const tower of gameState.towers) {
    tower.render(p);
  }
  
  // Render projectiles
  for (const projectile of gameState.projectiles) {
    projectile.render(p);
  }
  
  // Render enemies
  for (const enemy of gameState.enemies) {
    enemy.render(p);
  }
  
  // Render player
  if (gameState.player) {
    gameState.player.render(p);
  }
  
  // Render particles
  for (const particle of gameState.particles) {
    particle.render(p);
  }
}

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const modes = ["HUMAN", "TEST_1", "TEST_2", "TEST_3", "TEST_4", "TEST_5"];
  for (const m of modes) {
    const btn = document.getElementById(m === "HUMAN" ? "humanModeBtn" : `test_${modes.indexOf(m)}_ModeBtn`);
    if (btn) {
      if (m === mode) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    }
  }
};