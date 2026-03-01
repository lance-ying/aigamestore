// game.js - Main game loop and p5.js instance

import {
  gameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  GROUND_Y,
  PLATFORM_HEIGHT,
  ENEMY_SPAWN_RATE,
  ITEM_SPAWN_RATE,
  DIFFICULTY_INCREASE_RATE,
  COLORS,
  ITEM_TYPES
} from './globals.js';

import {
  Player,
  Enemy,
  Item,
  Teleporter,
  Platform
} from './entities.js';

import { Particle } from './particles.js';

import {
  handleKeyPressed,
  handleKeyReleased,
  updatePlayerInput
} from './input.js';

import {
  renderStartScreen,
  renderPlayingUI,
  renderPausedOverlay,
  renderGameOverScreen,
  renderBackground
} from './ui.js';

// Get p5 from window
const p5 = window.p5;

// Create p5 instance
const gameInstance = new p5((p) => {
  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42); // Set seed once
    
    // Initialize game state
    gameState.gamePhase = PHASE_START;
    gameState.controlMode = "HUMAN";
    gameState.lastFrameTime = p.millis();
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: PHASE_START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Update frame count
    gameState.frameCount = p.frameCount;
    
    // Update delta time
    const currentTime = p.millis();
    gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = currentTime;
    
    // Clear screen - EXACTLY ONE background() call
    p.background(...COLORS.background);
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case PHASE_START:
        renderStartScreen(p);
        break;
        
      case PHASE_PLAYING:
        updateGame(p);
        renderGame(p);
        renderPlayingUI(p);
        break;
        
      case PHASE_PAUSED:
        renderGame(p);
        renderPlayingUI(p);
        renderPausedOverlay(p);
        break;
        
      case PHASE_GAME_OVER_WIN:
      case PHASE_GAME_OVER_LOSE:
        renderGame(p);
        renderGameOverScreen(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.keyCode);
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p, p.keyCode);
  };
  
  // Game initialization
  function initGame() {
    // Create player
    new Player(100, 200);
    
    // Create platforms
    new Platform(150, 280, 100, PLATFORM_HEIGHT);
    new Platform(350, 240, 120, PLATFORM_HEIGHT);
    new Platform(250, 200, 80, PLATFORM_HEIGHT);
    new Platform(100, 160, 90, PLATFORM_HEIGHT);
    new Platform(450, 180, 100, PLATFORM_HEIGHT);
    
    // Create ground platforms
    new Platform(0, GROUND_Y, CANVAS_WIDTH, PLATFORM_HEIGHT);
    
    // Create teleporter
    new Teleporter(CANVAS_WIDTH - 80, GROUND_Y - 60);
    
    // Spawn initial enemies
    for (let i = 0; i < 3; i++) {
      spawnEnemy();
    }
    
    // Spawn initial items
    for (let i = 0; i < 2; i++) {
      spawnItem();
    }
  }
  
  // Game update loop
  function updateGame(p) {
    // Initialize game on first frame of PLAYING phase
    if (gameState.player === null) {
      initGame();
    }
    
    // Update game time and difficulty
    gameState.gameTime++;
    gameState.difficulty = 1.0 + (gameState.gameTime * DIFFICULTY_INCREASE_RATE);
    
    // Handle input
    updatePlayerInput();
    
    // Update all entities
    for (let i = gameState.entities.length - 1; i >= 0; i--) {
      const entity = gameState.entities[i];
      if (entity && entity.active && entity.update) {
        entity.update(p);
      }
      
      // Remove inactive entities
      if (entity && !entity.active) {
        gameState.entities.splice(i, 1);
      }
    }
    
    // Update particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
      gameState.particles[i].update();
      if (!gameState.particles[i].active) {
        gameState.particles.splice(i, 1);
      }
    }
    
    // Spawn enemies
    if (!gameState.teleporterActivated) {
      gameState.enemySpawnTimer++;
      if (gameState.enemySpawnTimer >= ENEMY_SPAWN_RATE / gameState.difficulty) {
        spawnEnemy();
        gameState.enemySpawnTimer = 0;
      }
    }
    
    // Spawn items
    gameState.itemSpawnTimer++;
    if (gameState.itemSpawnTimer >= ITEM_SPAWN_RATE) {
      spawnItem();
      gameState.itemSpawnTimer = 0;
    }
  }
  
  // Spawn enemy at random location
  function spawnEnemy() {
    const side = Math.floor(Math.random() * 2);
    const x = side === 0 ? -20 : CANVAS_WIDTH + 20;
    const y = GROUND_Y - 40;
    
    new Enemy(x, y);
  }
  
  // Spawn item at random location
  function spawnItem() {
    const itemTypes = Object.keys(ITEM_TYPES);
    const randomType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
    
    const x = Math.random() * (CANVAS_WIDTH - 100) + 50;
    const y = Math.random() * 200 + 50;
    
    new Item(x, y, randomType);
  }
  
  // Render game
  function renderGame(p) {
    // Background
    renderBackground(p);
    
    // Render platforms
    for (const platform of gameState.platforms) {
      platform.render(p);
    }
    
    // Render teleporter
    if (gameState.teleporter) {
      gameState.teleporter.render(p);
    }
    
    // Render items
    for (const item of gameState.items) {
      if (item.active) {
        item.render(p);
      }
    }
    
    // Render enemies
    for (const enemy of gameState.enemies) {
      if (enemy.active) {
        enemy.render(p);
      }
    }
    
    // Render boss
    if (gameState.boss && gameState.boss.active) {
      gameState.boss.render(p);
    }
    
    // Render projectiles
    for (const projectile of gameState.projectiles) {
      if (projectile.active) {
        projectile.render(p);
      }
    }
    
    // Render player
    if (gameState.player && gameState.player.active) {
      gameState.player.render(p);
    }
    
    // Render particles (on top)
    for (const particle of gameState.particles) {
      if (particle.active) {
        particle.render(p);
      }
    }
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const modes = ['HUMAN', 'TEST_1', 'TEST_2'];
  modes.forEach(m => {
    const btn = document.getElementById(`${m === 'HUMAN' ? 'humanMode' : m.toLowerCase() + '_Mode'}Btn`);
    if (btn) {
      if (m === mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });
};