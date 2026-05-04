// gameLogic.js - Core game logic

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './player.js';
import { Knife } from './knife.js';
import { Enemy } from './enemy.js';
import { Barrel } from './barrel.js';
import { Box } from './box.js';
import { Hostage } from './hostage.js';
import { levels } from './levels.js';
import { circleCircleCollision, circleRectCollision } from './collision.js';

let particleSystem = null;

export function setParticleSystem(ps) {
  particleSystem = ps;
}

export function initializeLevel(p, levelNumber) {
  // Clear previous level
  gameState.knives = [];
  gameState.enemies = [];
  gameState.barrels = [];
  gameState.boxes = [];
  gameState.hostages = [];
  gameState.entities = [];
  gameState.showLevelComplete = false;
  gameState.levelTransitionTimer = 0;
  
  if (particleSystem) {
    particleSystem.clear();
  }
  
  // Get level data
  const levelData = levels[levelNumber - 1];
  if (!levelData) {
    // No more levels - game complete
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    gameState.score += 500; // Game completion bonus
    return;
  }
  
  // Initialize player if not exists
  if (!gameState.player) {
    gameState.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
    gameState.entities.push(gameState.player);
  }
  
  // Spawn enemies
  for (const enemyData of levelData.enemies) {
    const enemy = new Enemy(enemyData.spawnX, enemyData.spawnY, enemyData.type);
    enemy.setPath(enemyData.path);
    gameState.enemies.push(enemy);
    gameState.entities.push(enemy);
  }
  
  // Spawn barrels
  for (const barrelData of levelData.barrels) {
    const barrel = new Barrel(barrelData.x, barrelData.y);
    gameState.barrels.push(barrel);
    gameState.entities.push(barrel);
  }
  
  // Spawn boxes
  for (const boxData of levelData.boxes) {
    const box = new Box(boxData.x, boxData.y);
    gameState.boxes.push(box);
    gameState.entities.push(box);
  }
  
  // Spawn hostages
  for (const hostageData of levelData.hostages) {
    const hostage = new Hostage(hostageData.x, hostageData.y);
    gameState.hostages.push(hostage);
    gameState.entities.push(hostage);
  }
  
  gameState.enemiesRemaining = gameState.enemies.length;
  gameState.hostagesAlive = gameState.hostages.length;
  
  // Log player initial position
  if (gameState.player) {
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
}

export function throwKnife(p) {
  const currentTime = Date.now();
  
  if (currentTime - gameState.lastKnifeTime < gameState.knifeCooldownTime) {
    return; // Still on cooldown
  }
  
  gameState.lastKnifeTime = currentTime;
  
  const knife = new Knife(
    gameState.player.x,
    gameState.player.y,
    gameState.playerAngle
  );
  
  gameState.knives.push(knife);
}

export function updateGame(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Handle level transition
  if (gameState.showLevelComplete) {
    gameState.levelTransitionTimer++;
    if (gameState.levelTransitionTimer >= gameState.levelTransitionDuration) {
      gameState.currentLevel++;
      if (gameState.currentLevel > gameState.maxLevel) {
        gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
        gameState.score += 500; // Game completion bonus
        
        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase, finalScore: gameState.score },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else {
        initializeLevel(p, gameState.currentLevel);
        gameState.gamePhase = GAME_PHASES.PLAYING;
      }
    }
    return;
  }
  
  // Update player
  if (gameState.player) {
    gameState.player.update();
  }
  
  // Update knives
  for (let i = gameState.knives.length - 1; i >= 0; i--) {
    const knife = gameState.knives[i];
    knife.update(CANVAS_WIDTH, CANVAS_HEIGHT);
    
    if (!knife.active) {
      gameState.knives.splice(i, 1);
      continue;
    }
    
    checkKnifeCollisions(p, knife, i);
  }
  
  // Update enemies
  gameState.enemiesRemaining = 0;
  for (const enemy of gameState.enemies) {
    if (enemy.active) {
      enemy.update();
      gameState.enemiesRemaining++;
      
      // Check collision with hostages
      for (const hostage of gameState.hostages) {
        if (hostage.alive) {
          const enemyBounds = enemy.getBounds();
          const hostageBounds = hostage.getBounds();
          
          if (circleCircleCollision(
            enemyBounds.x, enemyBounds.y, enemyBounds.radius,
            hostageBounds.x, hostageBounds.y, hostageBounds.radius + 5
          )) {
            hostage.kill();
            gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
            
            p.logs.game_info.push({
              data: { gamePhase: gameState.gamePhase, reason: "hostage_killed" },
              framecount: p.frameCount,
              timestamp: Date.now()
            });
            return;
          }
        }
      }
    }
  }
  
  // Update barrels
  for (const barrel of gameState.barrels) {
    barrel.update();
  }
  
  // Update boxes
  for (const box of gameState.boxes) {
    box.update();
  }
  
  // Update particle system
  if (particleSystem) {
    particleSystem.update();
  }
  
  // Check win condition
  gameState.hostagesAlive = 0;
  for (const hostage of gameState.hostages) {
    if (hostage.alive) gameState.hostagesAlive++;
  }
  
  if (gameState.enemiesRemaining === 0 && gameState.hostagesAlive === gameState.hostages.length) {
    gameState.showLevelComplete = true;
    gameState.levelTransitionTimer = 0;
    gameState.score += 100; // Level completion bonus
    
    p.logs.game_info.push({
      data: { level: gameState.currentLevel, levelComplete: true },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function checkKnifeCollisions(p, knife, knifeIndex) {
  const knifeBounds = knife.getBounds();
  
  // Check collision with enemies
  for (const enemy of gameState.enemies) {
    if (!enemy.active) continue;
    
    const enemyBounds = enemy.getBounds();
    if (circleCircleCollision(
      knifeBounds.x, knifeBounds.y, knifeBounds.radius,
      enemyBounds.x, enemyBounds.y, enemyBounds.radius
    )) {
      knife.active = false;
      
      if (enemy.takeDamage(1)) {
        // Enemy defeated
        gameState.score += enemy.points;
        
        if (particleSystem) {
          particleSystem.addEnemyDefeatEffect(enemy.x, enemy.y, enemy.color);
        }
      }
      
      return;
    }
  }
  
  // Check collision with barrels
  for (const barrel of gameState.barrels) {
    if (!barrel.active || barrel.exploding) continue;
    
    const barrelBounds = barrel.getBounds();
    if (circleCircleCollision(
      knifeBounds.x, knifeBounds.y, knifeBounds.radius,
      barrelBounds.x, barrelBounds.y, barrelBounds.radius
    )) {
      knife.active = false;
      
      if (barrel.explode()) {
        gameState.score += 50;
        
        // Damage enemies in explosion radius
        const explosionBounds = barrel.getExplosionBounds();
        for (const enemy of gameState.enemies) {
          if (!enemy.active) continue;
          
          const enemyBounds = enemy.getBounds();
          if (circleCircleCollision(
            explosionBounds.x, explosionBounds.y, explosionBounds.radius,
            enemyBounds.x, enemyBounds.y, enemyBounds.radius
          )) {
            if (enemy.takeDamage(1)) {
              gameState.score += enemy.points;
              
              if (particleSystem) {
                particleSystem.addEnemyDefeatEffect(enemy.x, enemy.y, enemy.color);
              }
            }
          }
        }
      }
      
      return;
    }
  }
  
  // Check collision with boxes
  for (const box of gameState.boxes) {
    if (!box.active || box.breaking) continue;
    
    const boxBounds = box.getBounds();
    if (circleRectCollision(
      knifeBounds.x, knifeBounds.y, knifeBounds.radius,
      boxBounds.x, boxBounds.y, boxBounds.width, boxBounds.height
    )) {
      knife.active = false;
      
      if (box.break()) {
        gameState.score += 25;
        
        // Stun enemies in radius
        const stunBounds = box.getStunBounds();
        for (const enemy of gameState.enemies) {
          if (!enemy.active) continue;
          
          const enemyBounds = enemy.getBounds();
          if (circleCircleCollision(
            stunBounds.x, stunBounds.y, stunBounds.radius,
            enemyBounds.x, enemyBounds.y, enemyBounds.radius
          )) {
            enemy.stun(120); // 2 seconds at 60 FPS
          }
        }
      }
      
      return;
    }
  }
}

export function handleTestingControls(p) {
  if (gameState.controlMode === "HUMAN") return;
  
  // Implement automated testing logic
  if (gameState.controlMode === "TEST_1") {
    // Basic testing - rotate and shoot periodically
    if (p.frameCount % 30 === 0) {
      gameState.playerAngle += 10 * (Math.PI / 180);
    }
    if (p.frameCount % 60 === 0) {
      throwKnife(p);
    }
  } else if (gameState.controlMode === "TEST_2") {
    // Win condition testing - aim at enemies and shoot
    if (gameState.enemies.length > 0) {
      const activeEnemies = gameState.enemies.filter(e => e.active);
      if (activeEnemies.length > 0) {
        const target = activeEnemies[0];
        const dx = target.x - gameState.player.x;
        const dy = target.y - gameState.player.y;
        const targetAngle = Math.atan2(dy, dx);
        
        gameState.playerAngle = targetAngle;
        
        if (p.frameCount % 30 === 0) {
          throwKnife(p);
        }
      }
    }
  }
}