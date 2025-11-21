// game.js - Main game file

import { gameState, GAME_PHASE, CANVAS_WIDTH, CANVAS_HEIGHT, LEVELS } from './globals.js';
import { Player, Enemy, Projectile, Loot } from './entities.js';
import { initLevel, getCurrentLevelConfig } from './level.js';
import { getPlayerInputs, generateTestActions } from './input.js';
import { renderStartScreen, renderPausedOverlay, renderGameOverScreen, renderUI, renderZone, renderLevelTransition } from './rendering.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let levelConfig = null;

  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Load high score
    const savedHighScore = localStorage.getItem('wildArenaHighScore');
    if (savedHighScore) {
      gameState.highScore = parseInt(savedHighScore);
    }
    
    logGameInfo('Game initialized');
  };

  p.draw = function() {
    p.background(40, 60, 40);
    
    if (gameState.gamePhase === GAME_PHASE.START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASE.PLAYING) {
      updateGame();
      renderGame();
      renderUI(p);
    } else if (gameState.gamePhase === GAME_PHASE.PAUSED) {
      renderGame();
      renderUI(p);
      renderPausedOverlay(p);
    } else if (gameState.gamePhase === GAME_PHASE.LEVEL_TRANSITION) {
      renderGame();
      renderLevelTransition(p);
      updateLevelTransition();
    } else if (gameState.gamePhase === GAME_PHASE.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASE.GAME_OVER_LOSE) {
      renderGame();
      renderGameOverScreen(p, gameState.gamePhase === GAME_PHASE.GAME_OVER_WIN);
    }
  };

  function updateLevelTransition() {
    gameState.transitionTimer++;
    
    // After 2 seconds (120 frames), start the next level
    if (gameState.transitionTimer >= 120) {
      gameState.transitionTimer = 0;
      gameState.gamePhase = GAME_PHASE.PLAYING;
      levelConfig = initLevel(p, gameState.currentLevel);
      logGameInfo(`Level ${gameState.currentLevel} started`);
    }
  }

  function updateGame() {
    gameState.framesSinceStart++;
    
    // Generate test mode actions
    if (gameState.controlMode !== 'HUMAN') {
      gameState.testModeActions = generateTestActions(p);
    }
    
    // Get inputs
    const inputs = getPlayerInputs(p);
    
    // Update player
    if (gameState.player) {
      gameState.player.update(inputs);
      
      // Fire weapon
      if (inputs.fire) {
        const projectiles = gameState.player.fire();
        if (projectiles) {
          for (const projData of projectiles) {
            gameState.projectiles.push(new Projectile(p, projData));
          }
        }
      }
      
      // Use ability
      if (inputs.ability) {
        gameState.player.useAbility();
      }
      
      // Log player info periodically
      if (p.frameCount % 30 === 0) {
        logPlayerInfo();
      }
    }
    
    // Count active enemies
    const enemies = gameState.entities.filter(e => e.constructor.name === 'Enemy' && e.active && e.defeatAnimation === 0);
    const allEnemiesDefeated = gameState.enemiesDefeated >= gameState.enemiesRequired;
    
    // Update enemies
    for (const enemy of gameState.entities.filter(e => e.constructor.name === 'Enemy')) {
      if (enemy.active && enemy.defeatAnimation === 0) {
        enemy.update(gameState.player);
        
        // Enemy attack
        const attack = enemy.attack(gameState.player);
        if (attack) {
          if (attack.type === 'MELEE') {
            gameState.player.takeDamage(attack.damage);
          } else if (attack.type === 'RANGED') {
            gameState.projectiles.push(new Projectile(p, attack));
          }
        }
        
        // Check if enemy is outside zone (only damage if enemies still alive)
        if (!allEnemiesDefeated && levelConfig && gameState.levelTimer > levelConfig.zoneStartDelay) {
          const distToZoneCenter = p.dist(enemy.x, enemy.y, gameState.zoneCenterX, gameState.zoneCenterY);
          if (distToZoneCenter > gameState.zoneRadius - enemy.radius) {
            // Damage enemy every 30 frames (0.5 seconds)
            if (gameState.framesSinceStart % 30 === 0) {
              enemy.takeDamage(5);
            }
          }
        }
      }
      
      // Remove defeated enemies
      if (enemy.defeatAnimation === 1) {
        enemy.active = false;
      }
    }
    
    // Update projectiles
    for (const projectile of gameState.projectiles) {
      projectile.update();
      
      if (!projectile.active || projectile.hitEffect > 0) continue;
      
      // Check collisions
      if (projectile.owner === 'PLAYER') {
        for (const enemy of enemies) {
          if (enemy.active && enemy.defeatAnimation === 0) {
            if (p.collideCircleCircle(projectile.x, projectile.y, projectile.radius * 2, enemy.x, enemy.y, enemy.radius * 2)) {
              enemy.takeDamage(projectile.damage);
              projectile.hit();
              gameState.score += Math.floor(projectile.damage / 5);
              break;
            }
          }
        }
      } else if (projectile.owner === 'ENEMY') {
        if (gameState.player && p.collideCircleCircle(projectile.x, projectile.y, projectile.radius * 2, gameState.player.x, gameState.player.y, gameState.player.radius * 2)) {
          gameState.player.takeDamage(projectile.damage);
          projectile.hit();
        }
      }
    }
    
    // Remove inactive projectiles
    gameState.projectiles = gameState.projectiles.filter(proj => proj.active);
    
    // Update loot
    for (const loot of gameState.loot) {
      if (loot.active && loot.pickupAnimation === 0 && gameState.player) {
        const dist = p.dist(loot.x, loot.y, gameState.player.x, gameState.player.y);
        if (dist < 25) {
          loot.pickup();
          
          switch (loot.type) {
            case 'HEALTH':
              gameState.player.heal(30);
              break;
            case 'WEAPON':
              gameState.player.weapon.damage += 3;
              gameState.player.weapon.fireRate = Math.max(8, gameState.player.weapon.fireRate - 2);
              break;
            case 'ABILITY':
              gameState.player.ability.maxCooldown = Math.max(60, gameState.player.ability.maxCooldown - 20);
              break;
          }
        }
      }
    }
    
    // Remove inactive loot
    gameState.loot = gameState.loot.filter(item => item.active);
    
    // Update level timer
    gameState.levelTimer++;
    gameState.score += 1 / 60; // Time bonus
    
    // Update zone - only shrink if enemies are still alive
    if (levelConfig && !allEnemiesDefeated && gameState.levelTimer > levelConfig.zoneStartDelay) {
      if (gameState.zoneRadius > gameState.zoneTargetRadius) {
        gameState.zoneRadius -= levelConfig.zoneShrinkSpeed;
        if (gameState.zoneRadius < gameState.zoneTargetRadius) {
          gameState.zoneRadius = gameState.zoneTargetRadius;
        }
      }
    }
    
    // Check if player is outside zone (only damage if enemies still alive)
    if (gameState.player && !allEnemiesDefeated) {
      const distToZoneCenter = p.dist(gameState.player.x, gameState.player.y, gameState.zoneCenterX, gameState.zoneCenterY);
      if (distToZoneCenter > gameState.zoneRadius - gameState.player.radius) {
        gameState.zoneDamageTimer++;
        if (gameState.zoneDamageTimer % 30 === 0) {
          gameState.player.takeDamage(5);
        }
      } else {
        gameState.zoneDamageTimer = 0;
      }
    }
    
    // Check win/lose conditions
    if (gameState.player && gameState.player.health <= 0) {
      endGame(false);
    } else if (allEnemiesDefeated) {
      // All enemies defeated - advance level immediately
      gameState.score += 200; // Level completion bonus
      
      if (gameState.currentLevel >= LEVELS.length) {
        // Game won
        endGame(true);
      } else {
        // Next level - show transition screen
        gameState.currentLevel++;
        gameState.gamePhase = GAME_PHASE.LEVEL_TRANSITION;
        gameState.transitionTimer = 0;
        logGameInfo(`Level ${gameState.currentLevel - 1} completed`);
      }
    }
  }

  function renderGame() {
    // Background
    p.background(60, 80, 50);
    
    // Render zone (as background layer before entities)
    renderZone(p);
    
    // Render obstacles
    for (const obstacle of gameState.obstacles) {
      obstacle.render();
    }
    
    // Render loot
    for (const loot of gameState.loot) {
      loot.render();
    }
    
    // Render entities
    for (const entity of gameState.entities) {
      if (entity.constructor.name === 'Enemy' && entity.active) {
        entity.render();
      }
    }
    
    // Render player
    if (gameState.player) {
      gameState.player.render();
    }
    
    // Render projectiles
    for (const projectile of gameState.projectiles) {
      projectile.render();
    }
  }

  function startGame() {
    gameState.score = 0;
    gameState.currentLevel = 1;
    gameState.enemiesDefeated = 0;
    gameState.framesSinceStart = 0;
    gameState.gamePhase = GAME_PHASE.PLAYING;
    
    // Create player
    gameState.player = new Player(p, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    // Initialize level
    levelConfig = initLevel(p, gameState.currentLevel);
    
    logGameInfo('Game started');
  }

  function endGame(isWin) {
    gameState.gamePhase = isWin ? GAME_PHASE.GAME_OVER_WIN : GAME_PHASE.GAME_OVER_LOSE;
    
    // Update high score
    if (gameState.score > gameState.highScore) {
      gameState.highScore = Math.floor(gameState.score);
      localStorage.setItem('wildArenaHighScore', gameState.highScore.toString());
    }
    
    logGameInfo(isWin ? 'Game won' : 'Game over');
  }

  p.keyPressed = function() {
    logInput('keyPressed', p.key, p.keyCode);
    
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASE.START) {
        startGame();
      }
    } else if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASE.PLAYING) {
        gameState.gamePhase = GAME_PHASE.PAUSED;
        logGameInfo('Game paused');
      } else if (gameState.gamePhase === GAME_PHASE.PAUSED) {
        gameState.gamePhase = GAME_PHASE.PLAYING;
        logGameInfo('Game resumed');
      }
    } else if (p.keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASE.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASE.GAME_OVER_LOSE || gameState.gamePhase === GAME_PHASE.PAUSED) {
        gameState.gamePhase = GAME_PHASE.START;
        gameState.entities = [];
        gameState.projectiles = [];
        gameState.loot = [];
        gameState.obstacles = [];
        gameState.player = null;
        logGameInfo('Game restarted');
      }
    }
    
    return false;
  };

  p.keyReleased = function() {
    logInput('keyReleased', p.key, p.keyCode);
    return false;
  };

  function logGameInfo(data) {
    p.logs.game_info.push({
      data: data,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function logInput(inputType, key, keyCode) {
    p.logs.inputs.push({
      input_type: inputType,
      data: { key: key, keyCode: keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function logPlayerInfo() {
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
});

// Expose game instance and state globally
window.gameInstance = gameInstance;
// Expose level loading for dev mode
window.loadLevel = function(levelNum) {
  const state = window.getGameState ? window.getGameState() : (window.gameState || (window.gameInstance && window.gameInstance.gameState));
  if (state) {
    // Set level using the property this game uses
    state.currentLevel = levelNum;
    state.currentLevel = levelNum; // Also set for compatibility
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
// Expose level loading for dev mode
// Expose level loading for dev mode
window.getGameState = function() {
  return gameState;
};

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
  
  const activeBtn = document.getElementById(`${mode === 'HUMAN' ? 'human' : mode.toLowerCase()}ModeBtn`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};