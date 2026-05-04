import { gameState, GAME_PHASES, CENTER_X, CENTER_Y, PLAYER_RADIUS } from './globals.js';
import { Player } from './player.js';
import { Projectile } from './projectile.js';
import { Enemy } from './enemy.js';
import { Particle } from './particle.js';

export function initGame() {
  gameState.player = new Player();
  gameState.entities = [gameState.player];
  gameState.projectiles = [];
  gameState.enemies = [];
  gameState.particles = [];
  gameState.score = 0;
  gameState.waveNumber = 1;
  gameState.enemiesDestroyed = 0;
  gameState.survivalTime = 0;
  gameState.lastShotTime = Date.now();
  gameState.difficultyMultiplier = 1.0;
  gameState.lastDifficultyIncrease = Date.now();
  gameState.inputState = {
    leftPressed: false,
    rightPressed: false
  };
}

export function startGame(p) {
  initGame();
  gameState.gamePhase = GAME_PHASES.PLAYING;
  
  p.logs.game_info.push({
    data: { phase: gameState.gamePhase, event: "game_started" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateGame(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;

  // Update survival time
  gameState.survivalTime = Date.now() - (gameState.lastDifficultyIncrease - (gameState.difficultyMultiplier - 1) * 15000);

  // Increase difficulty every 15 seconds
  const timeSinceLastIncrease = Date.now() - gameState.lastDifficultyIncrease;
  if (timeSinceLastIncrease > 15000) {
    gameState.difficultyMultiplier += 0.3;
    gameState.lastDifficultyIncrease = Date.now();
    gameState.waveNumber++;
    
    p.logs.game_info.push({
      data: { event: "difficulty_increased", wave: gameState.waveNumber, multiplier: gameState.difficultyMultiplier },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  // Update player
  if (gameState.player) {
    gameState.player.update(gameState.inputState);

    // Log player info periodically
    if (p.frameCount % 30 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.player.getScreenX(),
        screen_y: gameState.player.getScreenY(),
        game_x: gameState.player.getGameX(),
        game_y: gameState.player.getGameY(),
        framecount: p.frameCount
      });
    }
  }

  // Auto-fire projectiles
  const now = Date.now();
  if (now - gameState.lastShotTime > gameState.shootCooldown && gameState.player && gameState.player.isAlive) {
    const projectile = new Projectile(
      gameState.player.getScreenX(),
      gameState.player.getScreenY(),
      gameState.player.angle
    );
    gameState.projectiles.push(projectile);
    gameState.lastShotTime = now;
  }

  // Update projectiles
  gameState.projectiles.forEach(proj => proj.update());
  gameState.projectiles = gameState.projectiles.filter(proj => proj.isActive);

  // Spawn enemies based on difficulty
  const spawnChance = 0.02 * gameState.difficultyMultiplier;
  if (Math.random() < spawnChance) {
    const angle = Math.random() * Math.PI * 2;
    const enemyType = gameState.waveNumber > 5 && Math.random() < 0.3 ? 'fast' : 'basic';
    const enemy = new Enemy(angle, enemyType);
    gameState.enemies.push(enemy);
  }

  // Update enemies
  gameState.enemies.forEach(enemy => enemy.update());
  gameState.enemies = gameState.enemies.filter(enemy => enemy.isActive);

  // Check collisions between projectiles and enemies
  for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
    const proj = gameState.projectiles[i];
    if (!proj.isActive) continue;

    for (let j = gameState.enemies.length - 1; j >= 0; j--) {
      const enemy = gameState.enemies[j];
      if (!enemy.isActive) continue;

      const dist = Math.sqrt(
        Math.pow(proj.x - enemy.getScreenX(), 2) +
        Math.pow(proj.y - enemy.getScreenY(), 2)
      );

      if (dist < proj.radius + enemy.radius) {
        proj.isActive = false;
        const destroyed = enemy.takeDamage(1);
        
        if (destroyed) {
          gameState.score += enemy.type === 'basic' ? 10 : 20;
          gameState.enemiesDestroyed++;
          
          // Create explosion particles
          for (let k = 0; k < 8; k++) {
            const particle = new Particle(
              enemy.getScreenX(),
              enemy.getScreenY(),
              enemy.color,
              3
            );
            gameState.particles.push(particle);
          }
        } else {
          // Hit but not destroyed - smaller effect
          for (let k = 0; k < 3; k++) {
            const particle = new Particle(
              enemy.getScreenX(),
              enemy.getScreenY(),
              [255, 255, 100],
              2
            );
            gameState.particles.push(particle);
          }
        }
        break;
      }
    }
  }

  // Check collisions between player and enemies
  if (gameState.player && gameState.player.isAlive) {
    for (let i = 0; i < gameState.enemies.length; i++) {
      const enemy = gameState.enemies[i];
      if (!enemy.isActive) continue;

      const dist = Math.sqrt(
        Math.pow(gameState.player.getScreenX() - enemy.getScreenX(), 2) +
        Math.pow(gameState.player.getScreenY() - enemy.getScreenY(), 2)
      );

      if (dist < PLAYER_RADIUS + enemy.radius) {
        gameState.player.takeDamage();
        
        // Create death particles
        for (let k = 0; k < 20; k++) {
          const particle = new Particle(
            gameState.player.getScreenX(),
            gameState.player.getScreenY(),
            [100, 200, 255],
            4
          );
          gameState.particles.push(particle);
        }
        
        gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
        
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase, event: "player_died", final_score: gameState.score },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
        break;
      }
    }
  }

  // Update particles
  gameState.particles.forEach(particle => particle.update());
  gameState.particles = gameState.particles.filter(particle => particle.isActive);

  // Win condition: survive 90 seconds and destroy 100 enemies
  if (gameState.survivalTime > 90000 && gameState.enemiesDestroyed >= 100) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, event: "player_won", final_score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function handleKeyPressed(p, keyCode) {
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
  } else if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, event: "game_paused" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, event: "game_resumed" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      gameState.gamePhase = GAME_PHASES.START;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, event: "game_restarted" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (keyCode === 37) { // LEFT
      gameState.inputState.leftPressed = true;
    } else if (keyCode === 39) { // RIGHT
      gameState.inputState.rightPressed = true;
    }
  }
}

export function handleKeyReleased(p, keyCode) {
  p.logs.inputs.push({
    input_type: "keyReleased",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  if (keyCode === 37) { // LEFT
    gameState.inputState.leftPressed = false;
  } else if (keyCode === 39) { // RIGHT
    gameState.inputState.rightPressed = false;
  }
}