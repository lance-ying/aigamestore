// game.js - Main game file with p5.js instance mode

import { 
  gameState, 
  resetGameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  ENEMY_SPAWN_RATE,
  ENEMIES_PER_WAVE,
  TOTAL_WAVES
} from './globals.js';

import { 
  Player, 
  Enemy, 
  BackgroundBuilding 
} from './entities.js';

import { updatePhysics } from './physics.js';
import { initInput, handleInput } from './input.js';
import { 
  renderStartScreen, 
  renderUI, 
  renderPausedOverlay, 
  renderGameOver,
  renderBackground 
} from './ui.js';

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
    p.frameRate(60);
    p.randomSeed(42); // Set seed once
    
    // Initialize game state
    gameState.gamePhase = "START";
    gameState.controlMode = "HUMAN";
    gameState.lastFrameTime = p.millis();
    
    // Initialize input handlers
    initInput(p);
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Generate background buildings
    generateBackground();
  };
  
  p.draw = function() {
    // Update timing
    gameState.frameCount = p.frameCount;
    const currentTime = p.millis();
    gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = currentTime;
    
    // Single background call
    p.background(10, 5, 20);
    
    // Handle different game phases
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
        
      case "PLAYING":
        handleInput(p);
        updateGame(p);
        renderGame(p);
        renderUI(p);
        break;
        
      case "PAUSED":
        renderGame(p);
        renderPausedOverlay(p);
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGame(p);
        renderGameOver(p);
        break;
    }
  };
  
  function updateGame(p) {
    // Initialize game on first frame of PLAYING
    if (!gameState.player) {
      initGame();
    }
    
    // Update player
    if (gameState.player) {
      gameState.player.update(p);
      logPlayerInfo();
    }
    
    // Update enemies
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
      gameState.enemies[i].update(p);
    }
    
    // Update projectiles
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
      gameState.projectiles[i].update(p);
    }
    
    // Update particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
      gameState.particles[i].update();
      if (gameState.particles[i].isDead()) {
        gameState.particles.splice(i, 1);
      }
    }
    
    // Update physics and collisions
    updatePhysics();
    
    // Spawn enemies
    updateEnemySpawning(p);
    
    // Check wave completion
    checkWaveCompletion();
    
    // Update camera shake
    if (gameState.cameraShake > 0) {
      gameState.cameraShake *= 0.9;
      if (gameState.cameraShake < 0.1) gameState.cameraShake = 0;
    }
  }
  
  function renderGame(p) {
    p.push();
    
    // Apply camera shake
    if (gameState.cameraShake > 0) {
      p.translate(
        (Math.random() - 0.5) * gameState.cameraShake,
        (Math.random() - 0.5) * gameState.cameraShake
      );
    }
    
    // Render background
    renderBackground(p);
    
    // Render entities
    if (gameState.player) {
      gameState.player.render(p);
    }
    
    for (const enemy of gameState.enemies) {
      enemy.render(p);
    }
    
    for (const projectile of gameState.projectiles) {
      projectile.render(p);
    }
    
    for (const particle of gameState.particles) {
      particle.render(p);
    }
    
    p.pop();
  }
  
  function updateEnemySpawning(p) {
    if (gameState.bossSpawned) return;
    
    gameState.enemySpawnTimer++;
    
    if (gameState.enemySpawnTimer >= ENEMY_SPAWN_RATE) {
      gameState.enemySpawnTimer = 0;
      
      // Calculate how many enemies should be alive for this wave
      const maxEnemiesThisWave = Math.min(
        ENEMIES_PER_WAVE,
        5 + gameState.currentWave * 2
      );
      
      if (gameState.enemies.length < maxEnemiesThisWave) {
        spawnEnemy();
      }
    }
  }
  
  function spawnEnemy() {
    const side = Math.random() < 0.5 ? -1 : 1;
    const x = side < 0 ? -20 : CANVAS_WIDTH + 20;
    const y = CANVAS_HEIGHT - 100 - Math.random() * 100;
    
    new Enemy(x, y, false);
  }
  
  function checkWaveCompletion() {
    if (gameState.bossSpawned) return;
    
    const enemiesToKill = ENEMIES_PER_WAVE;
    
    if (gameState.enemiesKilledThisWave >= enemiesToKill) {
      gameState.currentWave++;
      gameState.enemiesKilledThisWave = 0;
      
      if (gameState.currentWave > TOTAL_WAVES) {
        // Spawn boss
        spawnBoss();
      } else {
        // Next wave message
        p.logs.game_info.push({
          data: { event: "wave_complete", wave: gameState.currentWave - 1 },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
  
  function spawnBoss() {
    gameState.bossSpawned = true;
    const x = CANVAS_WIDTH / 2;
    const y = CANVAS_HEIGHT - 150;
    new Enemy(x, y, true);
    
    p.logs.game_info.push({
      data: { event: "boss_spawned" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function logPlayerInfo() {
    if (gameState.player && p.logs && p.frameCount % 10 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        health: gameState.player.health,
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  function generateBackground() {
    // Generate cyberpunk buildings
    let x = -50;
    while (x < CANVAS_WIDTH + 100) {
      const width = 60 + Math.random() * 80;
      const height = 150 + Math.random() * 150;
      const depth = Math.random() * 0.5 + 0.3;
      const y = CANVAS_HEIGHT - 50 - height;
      
      const building = new BackgroundBuilding(x, y, width, height, depth);
      gameState.buildings.push(building);
      
      x += width + 20 + Math.random() * 30;
    }
  }
});

export function initGame() {
  resetGameState();
  
  // Create player
  gameState.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 100);
  
  // Spawn initial enemies
  for (let i = 0; i < 3; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const x = side < 0 ? 50 : CANVAS_WIDTH - 50;
    const y = CANVAS_HEIGHT - 100;
    new Enemy(x, y, false);
  }
  
  // Regenerate background
  gameState.buildings = [];
  let x = -50;
  while (x < CANVAS_WIDTH + 100) {
    const width = 60 + Math.random() * 80;
    const height = 150 + Math.random() * 150;
    const depth = Math.random() * 0.5 + 0.3;
    const y = CANVAS_HEIGHT - 50 - height;
    
    const building = new BackgroundBuilding(x, y, width, height, depth);
    gameState.buildings.push(building);
    
    x += width + 20 + Math.random() * 30;
  }
}

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
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : 
                                            mode === 'TEST_1' ? 'test_1_ModeBtn' : 
                                            'test_2_ModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};