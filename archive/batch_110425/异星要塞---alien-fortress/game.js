// game.js - Main game file

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, GAME_PHASES } from './globals.js';
import { Player } from './player.js';
import { Bullet } from './bullet.js';
import { InputHandler } from './input_handler.js';
import { Renderer } from './renderer.js';
import { WaveManager } from './wave_manager.js';
import { CollisionManager } from './collision_manager.js';
import get_automated_testing_action from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let inputHandler;
  let renderer;
  let waveManager;
  let collisionManager;
  
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
    
    // Initialize systems
    inputHandler = new InputHandler(p);
    renderer = new Renderer(p);
    waveManager = new WaveManager(p);
    collisionManager = new CollisionManager(p);
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    gameState.frameCount = p.frameCount;
    
    // Handle input based on control mode
    if (gameState.controlMode === "HUMAN") {
      handleHumanInput();
    } else {
      handleAutomatedInput();
    }
    
    // Update game state
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGame();
    }
    
    // Render
    renderer.render();
  };
  
  function handleHumanInput() {
    if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.player && !gameState.player.isDead) {
      const movement = inputHandler.getMovement();
      gameState.player.move(movement.dx, movement.dy);
    }
  }
  
  function handleAutomatedInput() {
    if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.player && !gameState.player.isDead) {
      const action = get_automated_testing_action(gameState);
      
      let dx = 0;
      let dy = 0;
      
      if (action[37]) dx -= 1; // Left
      if (action[39]) dx += 1; // Right
      if (action[38]) dy -= 1; // Up
      if (action[40]) dy += 1; // Down
      
      // Normalize diagonal movement
      if (dx !== 0 && dy !== 0) {
        const length = Math.sqrt(dx * dx + dy * dy);
        dx /= length;
        dy /= length;
      }
      
      gameState.player.move(dx, dy);
      
      // Handle abilities
      if (action[32]) {
        gameState.player.dash();
      }
      if (action[16]) {
        gameState.player.activateShield();
      }
    }
  }
  
  function updateGame() {
    // Update player
    if (gameState.player && !gameState.player.isDead) {
      gameState.player.update();
      
      // Auto-fire
      if (gameState.autoFireEnabled && gameState.enemies.length > 0) {
        const bulletData = gameState.player.fire();
        if (bulletData) {
          const bullet = new Bullet(p, bulletData.x, bulletData.y, bulletData.angle, bulletData.damage, 8, 'player');
          gameState.bullets.push(bullet);
        }
      }
      
      // Log player info periodically
      if (p.frameCount % 10 === 0) {
        p.logs.player_info.push({
          screen_x: gameState.player.x,
          screen_y: gameState.player.y,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          framecount: p.frameCount
        });
      }
    }
    
    // Check if player died
    if (gameState.player && gameState.player.isDead && gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameOver(false);
      return;
    }
    
    // Update wave manager
    waveManager.update();
    
    // Update enemies
    for (let enemy of gameState.enemies) {
      if (!enemy.isDead) {
        enemy.update();
        
        // Enemy firing
        const bullets = enemy.fire();
        if (bullets) {
          for (let bulletData of bullets) {
            const bullet = new Bullet(p, bulletData.x, bulletData.y, bulletData.angle, bulletData.damage, 5, 'enemy');
            gameState.enemyBullets.push(bullet);
          }
        }
      }
    }
    
    // Update bullets
    for (let bullet of gameState.bullets) {
      bullet.update();
    }
    for (let bullet of gameState.enemyBullets) {
      bullet.update();
    }
    
    // Update pickups
    for (let pickup of gameState.pickups) {
      pickup.update();
    }
    
    // Update particles
    for (let particle of gameState.particles) {
      particle.update();
    }
    
    // Update portal
    if (gameState.exitPortal) {
      const entered = gameState.exitPortal.update();
      if (entered) {
        // Check win condition (level 5 completion = win)
        if (gameState.level >= 5) {
          gameOver(true);
        } else {
          waveManager.nextLevel();
        }
      }
    }
    
    // Check collisions
    collisionManager.checkCollisions();
    
    // Clean up dead entities
    cleanupEntities();
  }
  
  function cleanupEntities() {
    gameState.bullets = gameState.bullets.filter(b => !b.isDead);
    gameState.enemyBullets = gameState.enemyBullets.filter(b => !b.isDead);
    gameState.enemies = gameState.enemies.filter(e => !e.isDead);
    gameState.pickups = gameState.pickups.filter(p => !p.isDead);
    gameState.particles = gameState.particles.filter(p => !p.isDead);
    
    gameState.entities = [gameState.player, ...gameState.enemies].filter(e => e && !e.isDead);
  }
  
  function gameOver(win) {
    gameState.gamePhase = win ? GAME_PHASES.GAME_OVER_WIN : GAME_PHASES.GAME_OVER_LOSE;
    
    p.logs.game_info.push({
      data: { 
        phase: gameState.gamePhase,
        finalScore: gameState.score,
        finalLevel: gameState.level
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function initializeGame() {
    // Reset game state
    gameState.player = new Player(p, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    gameState.entities = [gameState.player];
    gameState.enemies = [];
    gameState.bullets = [];
    gameState.enemyBullets = [];
    gameState.pickups = [];
    gameState.particles = [];
    gameState.score = 0;
    gameState.level = 1;
    gameState.wave = 1;
    gameState.enemiesInWave = 0;
    gameState.enemiesDefeated = 0;
    gameState.totalEnemiesForWave = 0;
    gameState.waveComplete = false;
    gameState.exitPortal = null;
    gameState.frameCount = 0;
    gameState.lastDashTime = -1000;
    gameState.lastShieldTime = -1000;
    gameState.shieldCharges = 3;
    gameState.autoFireEnabled = true;
    
    // Start first wave
    waveManager.startWave();
  }
  
  p.keyPressed = function() {
    inputHandler.handleKeyPressed(p.key, p.keyCode);
    
    // Initialize game when starting
    if (p.keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) {
      initializeGame();
    }
    
    // Restart game
    if (p.keyCode === 82 && (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
                              gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE)) {
      // Clear entities before restarting
      gameState.entities = [];
      gameState.enemies = [];
      gameState.bullets = [];
      gameState.enemyBullets = [];
      gameState.pickups = [];
      gameState.particles = [];
    }
  };
  
  p.keyReleased = function() {
    inputHandler.handleKeyReleased(p.key, p.keyCode);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;