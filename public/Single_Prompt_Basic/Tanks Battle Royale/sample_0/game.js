// game.js - Main game file

import { 
  gameState, 
  GAME_PHASES, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  PLAYER_CONFIG,
  ENEMY_CONFIG,
  PICKUP_TYPES,
  XP_TO_LEVEL
} from './globals.js';

import { Player, Enemy, Projectile, Pickup, Particle } from './entities.js';
import { AIController } from './ai.js';

const p5 = window.p5;

let aiController = null;

let keys = {
  up: false,
  down: false,
  left: false,
  right: false,
  shoot: false,
  sprint: false,
  reload: false
};

window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  if (mode !== "HUMAN") {
    aiController = new AIController(mode);
  } else {
    aiController = null;
  }
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (mode === "HUMAN") {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === "TEST_1") {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === "TEST_2") {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
};

let gameInstance = new p5(p => {
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.randomSeed(42);
    p.frameRate(60);
    
    initGame(p);
    
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    p.background(40, 45, 50);

    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGame(p);
      renderGame(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      renderGame(p);
      renderPauseOverlay(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
               gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGame(p);
      renderGameOver(p);
    }
  };

  p.keyPressed = function() {
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        startGame(p);
      }
    } else if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        pauseGame(p);
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        unpauseGame(p);
      }
    } else if (p.keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        restartGame(p);
      }
    }

    if (gameState.controlMode === "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateKeys(p, true);
    }
  };

  p.keyReleased = function() {
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    if (gameState.controlMode === "HUMAN") {
      updateKeys(p, false);
    }
  };

  function updateKeys(p, pressed) {
    if (p.keyCode === 38) keys.up = pressed; // UP
    if (p.keyCode === 40) keys.down = pressed; // DOWN
    if (p.keyCode === 37) keys.left = pressed; // LEFT
    if (p.keyCode === 39) keys.right = pressed; // RIGHT
    if (p.keyCode === 32) keys.shoot = pressed; // SPACE
    if (p.keyCode === 16) keys.sprint = pressed; // SHIFT
    if (p.keyCode === 90 && pressed) keys.reload = true; // Z
  }

  function initGame(p) {
    gameState.player = null;
    gameState.entities = [];
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.pickups = [];
    gameState.particles = [];
    gameState.score = 0;
    gameState.xp = 0;
    gameState.level = 1;
    gameState.kills = 0;
    gameState.waveNumber = 1;
    gameState.enemiesKilledThisWave = 0;
    gameState.framesSinceLastSpawn = 0;
    gameState.timeElapsed = 0;
  }

  function startGame(p) {
    initGame(p);
    
    gameState.player = new Player(p, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    gameState.entities.push(gameState.player);
    
    gameState.gamePhase = GAME_PHASES.PLAYING;
    
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    spawnEnemyWave(p);
  }

  function pauseGame(p) {
    gameState.gamePhase = GAME_PHASES.PAUSED;
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function unpauseGame(p) {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function restartGame(p) {
    initGame(p);
    gameState.gamePhase = GAME_PHASES.START;
    keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      shoot: false,
      sprint: false,
      reload: false
    };
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function updateGame(p) {
    if (!gameState.player) return;

    // Get AI actions if not in human mode
    if (gameState.controlMode !== "HUMAN" && aiController) {
      keys = aiController.getActions(p);
    }

    // Update player
    const prevX = gameState.player.x;
    const prevY = gameState.player.y;
    gameState.player.sprinting = keys.sprint;
    gameState.player.update(keys);

    if (prevX !== gameState.player.x || prevY !== gameState.player.y) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }

    // Player shooting
    if (keys.shoot && gameState.player.shoot()) {
      const proj = new Projectile(
        p,
        gameState.player.x + p.cos(gameState.player.angle) * 15,
        gameState.player.y + p.sin(gameState.player.angle) * 15,
        gameState.player.angle,
        true
      );
      gameState.projectiles.push(proj);
    }

    // Player reload
    if (keys.reload) {
      gameState.player.reload();
      keys.reload = false;
    }

    // Update enemies
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
      const enemy = gameState.enemies[i];
      enemy.update(gameState.player);

      // Enemy shooting
      if (enemy.canShoot()) {
        enemy.shoot();
        const angle = p.atan2(
          gameState.player.y - enemy.y,
          gameState.player.x - enemy.x
        );
        const proj = new Projectile(
          p,
          enemy.x + p.cos(angle) * 12,
          enemy.y + p.sin(angle) * 12,
          angle,
          false
        );
        gameState.projectiles.push(proj);
      }
    }

    // Update projectiles
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
      const proj = gameState.projectiles[i];
      if (proj.update()) {
        gameState.projectiles.splice(i, 1);
        continue;
      }

      // Check collisions
      if (proj.fromPlayer) {
        for (let j = gameState.enemies.length - 1; j >= 0; j--) {
          const enemy = gameState.enemies[j];
          if (p.dist(proj.x, proj.y, enemy.x, enemy.y) < 12) {
            if (enemy.takeDamage(PLAYER_CONFIG.weaponDamage)) {
              // Enemy killed
              createExplosion(p, enemy.x, enemy.y, [200, 100, 100]);
              gameState.enemies.splice(j, 1);
              gameState.entities = gameState.entities.filter(e => e !== enemy);
              gameState.kills++;
              gameState.enemiesKilledThisWave++;
              addXP(p, ENEMY_CONFIG.xpValue);
              
              // Spawn pickup
              if (p.random() < 0.3) {
                const pickupType = gameState.player.health < 50 ? PICKUP_TYPES.HEALTH : PICKUP_TYPES.AMMO;
                gameState.pickups.push(new Pickup(p, enemy.x, enemy.y, pickupType));
              }
            }
            gameState.projectiles.splice(i, 1);
            break;
          }
        }
      } else {
        if (p.dist(proj.x, proj.y, gameState.player.x, gameState.player.y) < 15) {
          gameState.player.takeDamage(ENEMY_CONFIG.attackDamage);
          gameState.projectiles.splice(i, 1);
          createExplosion(p, proj.x, proj.y, [255, 100, 100]);
        }
      }
    }

    // Update pickups
    for (let i = gameState.pickups.length - 1; i >= 0; i--) {
      const pickup = gameState.pickups[i];
      pickup.update();

      if (p.dist(pickup.x, pickup.y, gameState.player.x, gameState.player.y) < 20) {
        if (pickup.type === PICKUP_TYPES.HEALTH) {
          gameState.player.heal(30);
        } else if (pickup.type === PICKUP_TYPES.AMMO) {
          gameState.player.addAmmo(15);
        }
        createExplosion(p, pickup.x, pickup.y, [100, 255, 100]);
        gameState.pickups.splice(i, 1);
      }
    }

    // Update particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
      if (gameState.particles[i].update()) {
        gameState.particles.splice(i, 1);
      }
    }

    // Spawn enemies
    gameState.framesSinceLastSpawn++;
    if (gameState.enemies.length < getMaxEnemies() && gameState.framesSinceLastSpawn > gameState.spawnCooldown) {
      spawnEnemy(p);
      gameState.framesSinceLastSpawn = 0;
    }

    // Check for wave completion
    if (gameState.enemiesKilledThisWave >= getEnemiesPerWave() && gameState.enemies.length === 0) {
      gameState.waveNumber++;
      gameState.enemiesKilledThisWave = 0;
      spawnEnemyWave(p);
    }

    // Check game over conditions
    if (gameState.player.health <= 0) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, reason: "player_died" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }

    if (gameState.level >= 5) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, reason: "reached_level_5" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }

    gameState.timeElapsed++;
  }

  function spawnEnemy(p) {
    const side = p.floor(p.random(4));
    let x, y;
    
    if (side === 0) { // Top
      x = p.random(20, CANVAS_WIDTH - 20);
      y = 20;
    } else if (side === 1) { // Right
      x = CANVAS_WIDTH - 20;
      y = p.random(20, CANVAS_HEIGHT - 20);
    } else if (side === 2) { // Bottom
      x = p.random(20, CANVAS_WIDTH - 20);
      y = CANVAS_HEIGHT - 20;
    } else { // Left
      x = 20;
      y = p.random(20, CANVAS_HEIGHT - 20);
    }

    const difficulty = 1 + gameState.waveNumber * 0.15;
    const enemy = new Enemy(p, x, y, difficulty);
    gameState.enemies.push(enemy);
    gameState.entities.push(enemy);
  }

  function spawnEnemyWave(p) {
    const count = getEnemiesPerWave();
    for (let i = 0; i < Math.min(count, 3); i++) {
      spawnEnemy(p);
    }
  }

  function getEnemiesPerWave() {
    return 3 + gameState.waveNumber * 2;
  }

  function getMaxEnemies() {
    return Math.min(8, 3 + gameState.waveNumber);
  }

  function addXP(p, amount) {
    gameState.xp += amount;
    gameState.score += amount;

    // Check for level up
    while (gameState.level < XP_TO_LEVEL.length - 1 && gameState.xp >= XP_TO_LEVEL[gameState.level + 1]) {
      gameState.level++;
      levelUp(p);
    }
  }

  function levelUp(p) {
    // Upgrade player
    gameState.player.maxHealth += 10;
    gameState.player.health = gameState.player.maxHealth;
    gameState.player.maxAmmo += 5;
    gameState.player.ammo = gameState.player.maxAmmo;
    
    createExplosion(p, gameState.player.x, gameState.player.y, [100, 255, 255], 20);
  }

  function createExplosion(p, x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = p.random(p.TWO_PI);
      const speed = p.random(1, 4);
      const vx = p.cos(angle) * speed;
      const vy = p.sin(angle) * speed - 2;
      gameState.particles.push(new Particle(p, x, y, vx, vy, color));
    }
  }

  function renderGame(p) {
    // Render environment
    renderEnvironment(p);

    // Render pickups
    for (const pickup of gameState.pickups) {
      pickup.render();
    }

    // Render particles
    for (const particle of gameState.particles) {
      particle.render();
    }

    // Render projectiles
    for (const proj of gameState.projectiles) {
      proj.render();
    }

    // Render enemies
    for (const enemy of gameState.enemies) {
      enemy.render();
    }

    // Render player
    if (gameState.player) {
      gameState.player.render();
    }

    // Render UI
    renderUI(p);
  }

  function renderEnvironment(p) {
    // Draw grid
    p.stroke(60, 65, 70);
    p.strokeWeight(1);
    for (let i = 0; i < CANVAS_WIDTH; i += 40) {
      p.line(i, 0, i, CANVAS_HEIGHT);
    }
    for (let i = 0; i < CANVAS_HEIGHT; i += 40) {
      p.line(0, i, CANVAS_WIDTH, i);
    }

    // Draw border
    p.noFill();
    p.stroke(100, 120, 140);
    p.strokeWeight(3);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  function renderUI(p) {
    if (!gameState.player) return;

    // Top bar background
    p.fill(20, 25, 30, 200);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, 60);

    // Level and XP
    p.fill(255, 220, 100);
    p.textSize(16);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`LEVEL ${gameState.level}`, 10, 10);
    
    // XP Bar
    const xpBarWidth = 120;
    const xpBarHeight = 10;
    const nextLevelXP = gameState.level < XP_TO_LEVEL.length - 1 ? XP_TO_LEVEL[gameState.level + 1] : XP_TO_LEVEL[gameState.level];
    const prevLevelXP = XP_TO_LEVEL[gameState.level];
    const xpProgress = (gameState.xp - prevLevelXP) / (nextLevelXP - prevLevelXP);
    
    p.fill(60, 60, 60);
    p.rect(10, 30, xpBarWidth, xpBarHeight);
    p.fill(255, 220, 100);
    p.rect(10, 30, xpBarWidth * Math.min(1, xpProgress), xpBarHeight);

    // Score
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`SCORE: ${gameState.score}`, 150, 10);
    p.text(`KILLS: ${gameState.kills}`, 150, 30);

    // Wave
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`WAVE ${gameState.waveNumber}`, CANVAS_WIDTH - 10, 10);
    p.text(`ENEMIES: ${gameState.enemies.length}`, CANVAS_WIDTH - 10, 30);

    // Health bar
    const healthBarWidth = 150;
    const healthBarHeight = 20;
    const healthPercent = gameState.player.health / gameState.player.maxHealth;
    
    p.fill(60, 60, 60);
    p.rect(10, CANVAS_HEIGHT - 30, healthBarWidth, healthBarHeight);
    p.fill(...(healthPercent > 0.3 ? [100, 200, 100] : [200, 50, 50]));
    p.rect(10, CANVAS_HEIGHT - 30, healthBarWidth * healthPercent, healthBarHeight);
    
    p.fill(255);
    p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(`HP: ${Math.ceil(gameState.player.health)}/${gameState.player.maxHealth}`, 10 + healthBarWidth/2, CANVAS_HEIGHT - 20);

    // Ammo
    p.textAlign(p.RIGHT, p.CENTER);
    p.textSize(16);
    p.fill(255, 200, 100);
    p.text(`AMMO: ${gameState.player.ammo}/${gameState.player.maxAmmo}`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 20);

    // Reload indicator
    if (gameState.player.reloading) {
      const reloadPercent = gameState.player.reloadFrames / PLAYER_CONFIG.reloadTime;
      p.fill(255, 150, 0);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(14);
      p.text(`RELOADING... ${Math.floor(reloadPercent * 100)}%`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
    }
  }

  function renderStartScreen(p) {
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Title
    p.textSize(32);
    p.fill(255, 220, 100);
    p.text("BATTLE ROYALE FPS ARENA", CANVAS_WIDTH / 2, 60);

    // Description
    p.textSize(14);
    p.fill(200);
    p.text("Eliminate enemy soldiers in this fast-paced arena shooter!", CANVAS_WIDTH / 2, 110);
    p.text("Collect pickups to restore health and ammo.", CANVAS_WIDTH / 2, 130);
    p.text("Reach LEVEL 5 to win the match!", CANVAS_WIDTH / 2, 150);

    // Instructions
    p.textSize(13);
    p.fill(255);
    p.textAlign(p.LEFT, p.CENTER);
    const startY = 190;
    const lineHeight = 22;
    
    p.text("ARROW KEYS: Move and turn", 120, startY);
    p.text("SPACE: Shoot", 120, startY + lineHeight);
    p.text("SHIFT: Sprint (2x speed)", 120, startY + lineHeight * 2);
    p.text("Z: Reload weapon", 120, startY + lineHeight * 3);
    p.text("ESC: Pause game", 120, startY + lineHeight * 4);

    // Start prompt
    p.textSize(18);
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    const flash = p.sin(p.frameCount * 0.1) * 0.5 + 0.5;
    p.fill(100 + flash * 155, 255, 100);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 340);
  }

  function renderPauseOverlay(p) {
    p.fill(255);
    p.textSize(16);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }

  function renderGameOver(p) {
    p.fill(0, 0, 0, 180);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
      p.textSize(36);
      p.fill(100, 255, 100);
      p.text("VICTORY!", CANVAS_WIDTH / 2, 120);
      
      p.textSize(16);
      p.fill(255);
      p.text("You reached Level 5 and won the match!", CANVAS_WIDTH / 2, 170);
    } else {
      p.textSize(36);
      p.fill(255, 100, 100);
      p.text("DEFEATED", CANVAS_WIDTH / 2, 120);
      
      p.textSize(16);
      p.fill(255);
      p.text("You were eliminated in combat.", CANVAS_WIDTH / 2, 170);
    }

    p.textSize(18);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
    p.text(`Kills: ${gameState.kills}`, CANVAS_WIDTH / 2, 245);
    p.text(`Level: ${gameState.level}`, CANVAS_WIDTH / 2, 270);

    p.textSize(16);
    p.fill(100, 200, 255);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 330);
  }
});

window.gameInstance = gameInstance;