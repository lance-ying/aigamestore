// game.js - Main game file
const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Body } = Matter;

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GAME_PHASES, 
  CONFIG,
  CONTROL_MODES,
  getGameState 
} from './globals.js';

import { 
  Player, 
  ForcePod, 
  Enemy, 
  Boss 
} from './entities.js';

import { setupPhysics, updatePhysics } from './physics.js';
import { updateAI } from './ai.js';
import { 
  renderStartScreen, 
  renderGame, 
  renderPausedOverlay, 
  renderGameOver 
} from './rendering.js';

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);

    // Create Matter.js engine
    const engine = Engine.create();
    engine.world.gravity.y = 0; // No gravity in space
    gameState.engine = engine;
    gameState.world = engine.world;

    // Initialize p5.logs
    p.logs = {
      game_info: [],
      player_info: [],
      inputs: []
    };

    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Setup physics
    setupPhysics(p);

    // Initialize game
    initializeGame(p);
  };

  p.draw = function() {
    // Update physics engine
    Engine.update(gameState.engine, 1000 / 60);

    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;

      case GAME_PHASES.PLAYING:
        updateGame(p);
        renderGame(p);
        break;

      case GAME_PHASES.PAUSED:
        renderGame(p);
        renderPausedOverlay(p);
        break;

      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOver(p);
        break;
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

    // Game phase controls
    if (p.keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) { // ENTER
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }

    if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        p.logs.game_info.push({
          data: { gamePhase: GAME_PHASES.PAUSED },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { gamePhase: GAME_PHASES.PLAYING },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }

    if (p.keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ||
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        resetGame(p);
        gameState.gamePhase = GAME_PHASES.START;
        p.logs.game_info.push({
          data: { gamePhase: GAME_PHASES.START },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }

    // Gameplay controls
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.keys[p.keyCode] = true;

      // Force pod controls
      if (p.keyCode === 90 && gameState.forcePod) { // Z
        if (gameState.forcePod.attached) {
          gameState.forcePod.detach();
        } else {
          gameState.forcePod.attach('front');
        }
      }

      if (p.keyCode === 16 && gameState.forcePod && !gameState.forcePod.attached) { // Shift
        gameState.forcePod.launch();
      }
    }

    return false;
  };

  p.keyReleased = function() {
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    gameState.keys[p.keyCode] = false;

    // Release charge beam
    if (p.keyCode === 32 && gameState.chargeTime >= CONFIG.CHARGE_TIME) { // Space
      if (gameState.player) {
        gameState.player.shootChargedBeam();
      }
      gameState.chargeTime = 0;
    }

    return false;
  };
});

function initializeGame(p) {
  // Clear world
  if (gameState.world) {
    World.clear(gameState.world, false);
  }

  // Reset game state
  gameState.entities = [];
  gameState.bullets = [];
  gameState.enemyBullets = [];
  gameState.enemies = [];
  gameState.powerups = [];
  gameState.particles = [];
  gameState.keys = {};
  gameState.score = 0;
  gameState.lives = CONFIG.PLAYER_LIVES;
  gameState.currentLevel = 1;
  gameState.currentWave = 0;
  gameState.enemiesKilled = 0;
  gameState.lastEnemySpawn = 0;
  gameState.boss = null;
  gameState.bossActive = false;
  gameState.chargeTime = 0;
  gameState.weaponLevel = 1;
  gameState.hasMissiles = false;
  gameState.speedBoost = 1;

  // Create player
  gameState.player = new Player(p, 100, CANVAS_HEIGHT / 2);
  gameState.entities.push(gameState.player);

  // Create force pod
  gameState.forcePod = new ForcePod(p, 125, CANVAS_HEIGHT / 2);
  gameState.entities.push(gameState.forcePod);
}

function resetGame(p) {
  initializeGame(p);
}

function updateGame(p) {
  // AI control
  if (gameState.controlMode !== CONTROL_MODES.HUMAN) {
    updateAI(p);
  } else {
    // Human controls
    handlePlayerInput(p);
  }

  // Update entities
  if (gameState.player) gameState.player.update();
  if (gameState.forcePod) gameState.forcePod.update();
  
  gameState.bullets.forEach(bullet => bullet.update());
  gameState.enemyBullets.forEach(bullet => bullet.update());
  gameState.enemies.forEach(enemy => enemy.update());
  gameState.powerups.forEach(powerup => powerup.update());
  gameState.particles.forEach(particle => particle.update());

  // Update physics and collisions
  updatePhysics(p);

  // Spawn enemies
  spawnEnemies(p);

  // Check level progression
  checkLevelProgression(p);
}

function handlePlayerInput(p) {
  if (!gameState.player) return;

  const speed = CONFIG.PLAYER_SPEED * gameState.speedBoost;
  let vx = 0;
  let vy = 0;

  // Movement
  if (gameState.keys[37] || gameState.keys[65]) vx -= speed; // Left, A
  if (gameState.keys[39] || gameState.keys[68]) vx += speed; // Right, D
  if (gameState.keys[38] || gameState.keys[87]) vy -= speed; // Up, W
  if (gameState.keys[40] || gameState.keys[83]) vy += speed; // Down, S

  Body.setVelocity(gameState.player.body, { x: vx, y: vy });

  // Shooting
  if (gameState.keys[32]) { // Space
    if (gameState.chargeTime < CONFIG.CHARGE_TIME) {
      gameState.chargeTime++;
      if (gameState.chargeTime === 1) {
        gameState.player.shoot();
      }
    }
  } else {
    if (gameState.chargeTime > 0 && gameState.chargeTime < CONFIG.CHARGE_TIME) {
      gameState.chargeTime = 0;
    }
  }
}

function spawnEnemies(p) {
  if (gameState.bossActive) return;

  const framesSinceSpawn = p.frameCount - gameState.lastEnemySpawn;
  const spawnRate = Math.max(60, CONFIG.ENEMY_SPAWN_RATE - gameState.currentLevel * 10);

  if (framesSinceSpawn > spawnRate && gameState.enemies.length < 10) {
    const y = p.random(50, CANVAS_HEIGHT - 50);
    const enemy = new Enemy(p, CANVAS_WIDTH + 30, y);
    gameState.enemies.push(enemy);
    gameState.entities.push(enemy);
    gameState.lastEnemySpawn = p.frameCount;
  }
}

function checkLevelProgression(p) {
  const wavesPerLevel = CONFIG.WAVES_PER_LEVEL;
  const enemiesPerWave = CONFIG.ENEMIES_PER_WAVE + gameState.currentLevel * 2;

  if (gameState.enemiesKilled >= enemiesPerWave * (gameState.currentWave + 1)) {
    gameState.currentWave++;

    if (gameState.currentWave >= wavesPerLevel && !gameState.bossActive) {
      // Spawn boss
      spawnBoss(p);
    }
  }
}

function spawnBoss(p) {
  gameState.bossActive = true;
  const boss = new Boss(p, CANVAS_WIDTH + 100, CANVAS_HEIGHT / 2);
  gameState.enemies.push(boss);
  gameState.entities.push(boss);
  gameState.boss = boss;
}

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn',
    'TEST_3': 'test_3_ModeBtn',
    'TEST_4': 'test_4_ModeBtn',
    'TEST_5': 'test_5_ModeBtn',
    'TEST_6': 'test_6_ModeBtn',
    'TEST_7': 'test_7_ModeBtn'
  };
  
  const btnId = modeMap[mode];
  if (btnId) {
    const btn = document.getElementById(btnId);
    if (btn) btn.classList.add('active');
  }
};

// Expose globally
window.gameInstance = gameInstance;