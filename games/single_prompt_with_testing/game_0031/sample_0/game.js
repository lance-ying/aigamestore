// game.js - Main game logic and p5 instance

import { CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, GAME_PHASES, KEY_CODES, gameState, resetGameState } from './globals.js';
import { Player } from './player.js';
import { Enemy, spawnEnemy } from './enemies.js';
import { createXPGem, updateParticles, drawParticles } from './items.js';
import { drawStartScreen, drawPausedIndicator, drawGameOverScreen, drawHUD, drawUpgradeScreen } from './ui.js';
import get_automated_testing_action from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs (write-only)
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };
  
  // Setup function
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  // Draw function
  p.draw = function() {
    p.background(20, 25, 40);
    
    switch(gameState.gamePhase) {
      case GAME_PHASES.START:
        drawStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
        updateGame(p);
        drawGame(p);
        if (gameState.isPendingUpgrade) {
          drawUpgradeScreen(p);
        }
        break;
        
      case GAME_PHASES.PAUSED:
        drawGame(p);
        if (gameState.isPendingUpgrade) {
          drawUpgradeScreen(p);
        }
        drawPausedIndicator(p);
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        drawGame(p);
        drawGameOverScreen(p, gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN);
        break;
    }
  };
  
  // Update game logic
  function updateGame(p) {
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
    
    // Handle automated testing mode
    if (gameState.controlMode !== "HUMAN") {
      const action = get_automated_testing_action(gameState);
      if (action) {
        handleAutomatedAction(p, action);
      }
    }
    
    // Update timer
    gameState.time = Date.now() - gameState.startTime;
    
    // Check win condition (90 seconds survival)
    if (gameState.time >= gameState.WIN_TIME) {
      setGamePhase(GAME_PHASES.GAME_OVER_WIN);
      return;
    }
    
    // Update difficulty over time
    gameState.difficulty = 1.0 + (gameState.time / 60000) * 0.5; // +0.5 per minute
    
    // Update wave
    gameState.waveNumber = Math.floor(gameState.time / 15000) + 1;
    
    // Spawn enemies
    const currentTime = p.frameCount;
    const adjustedInterval = Math.max(30, gameState.spawnInterval - gameState.waveNumber * 5);
    
    if (currentTime - gameState.lastSpawnTime >= adjustedInterval) {
      spawnEnemy(p);
      gameState.lastSpawnTime = currentTime;
    }
    
    // Update player
    if (gameState.player) {
      gameState.player.update(p);
      
      // Log player position periodically
      if (p.frameCount % 30 === 0) {
        p.logs.player_info.push({
          screen_x: gameState.player.x,
          screen_y: gameState.player.y,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          framecount: p.frameCount
        });
      }
      
      // Check lose condition
      if (gameState.player.health <= 0) {
        setGamePhase(GAME_PHASES.GAME_OVER_LOSE);
        return;
      }
    }
    
    // Update enemies
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
      const enemy = gameState.enemies[i];
      enemy.update(p, gameState.player);
    }
    
    // Update projectiles
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
      const proj = gameState.projectiles[i];
      proj.x += proj.vx;
      proj.y += proj.vy;
      proj.age++;
      
      // Check if out of bounds or expired
      if (proj.x < -50 || proj.x > CANVAS_WIDTH + 50 || 
          proj.y < -50 || proj.y > CANVAS_HEIGHT + 50 || 
          proj.age >= proj.lifetime) {
        gameState.projectiles.splice(i, 1);
        const entityIndex = gameState.entities.indexOf(proj);
        if (entityIndex !== -1) gameState.entities.splice(entityIndex, 1);
        continue;
      }
      
      // Check collisions
      if (proj.type === 'projectile') {
        // Player projectile vs enemies
        for (let j = gameState.enemies.length - 1; j >= 0; j--) {
          const enemy = gameState.enemies[j];
          const dist = Math.sqrt((proj.x - enemy.x) ** 2 + (proj.y - enemy.y) ** 2);
          
          if (dist < proj.size + enemy.size) {
            const isDead = enemy.takeDamage(proj.damage);
            
            if (isDead) {
              // Remove enemy
              gameState.enemies.splice(j, 1);
              const entityIndex = gameState.entities.indexOf(enemy);
              if (entityIndex !== -1) gameState.entities.splice(entityIndex, 1);
              
              // Create XP gems
              createXPGem(enemy.x, enemy.y, enemy.xpValue);
              gameState.score += enemy.scoreValue;
              gameState.enemiesDefeated++;
              
              // Death particles
              for (let k = 0; k < 10; k++) {
                const angle = (k / 10) * Math.PI * 2;
                gameState.particles.push({
                  x: enemy.x,
                  y: enemy.y,
                  vx: Math.cos(angle) * 3,
                  vy: Math.sin(angle) * 3,
                  life: 25,
                  color: enemy.color,
                  size: 6
                });
              }
            }
            
            // Remove projectile if not piercing
            if (!proj.piercing) {
              gameState.projectiles.splice(i, 1);
              const projEntityIndex = gameState.entities.indexOf(proj);
              if (projEntityIndex !== -1) gameState.entities.splice(projEntityIndex, 1);
              break;
            }
          }
        }
      } else if (proj.type === 'enemy_projectile') {
        // Enemy projectile vs player
        if (gameState.player) {
          const dist = Math.sqrt((proj.x - gameState.player.x) ** 2 + (proj.y - gameState.player.y) ** 2);
          if (dist < proj.size + gameState.player.size) {
            gameState.player.takeDamage(proj.damage);
            gameState.projectiles.splice(i, 1);
            const entityIndex = gameState.entities.indexOf(proj);
            if (entityIndex !== -1) gameState.entities.splice(entityIndex, 1);
          }
        }
      }
    }
    
    // Update XP gems
    for (let i = gameState.xpGems.length - 1; i >= 0; i--) {
      const gem = gameState.xpGems[i];
      const shouldRemove = gem.update(p, gameState.player);
      
      if (shouldRemove) {
        gameState.xpGems.splice(i, 1);
        const entityIndex = gameState.entities.indexOf(gem);
        if (entityIndex !== -1) gameState.entities.splice(entityIndex, 1);
      }
    }
    
    // Update particles
    updateParticles(p);
  }
  
  // Draw game
  function drawGame(p) {
    // Draw grid background
    p.stroke(30, 35, 50);
    p.strokeWeight(1);
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
      p.line(x, 0, x, CANVAS_HEIGHT);
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
      p.line(0, y, CANVAS_WIDTH, y);
    }
    
    // Draw particles (behind everything)
    drawParticles(p);
    
    // Draw XP gems
    for (const gem of gameState.xpGems) {
      gem.draw(p);
    }
    
    // Draw projectiles
    for (const proj of gameState.projectiles) {
      p.fill(...proj.color);
      p.noStroke();
      p.ellipse(proj.x, proj.y, proj.size * 2, proj.size * 2);
      
      // Trail effect
      p.fill(...proj.color, 100);
      p.ellipse(proj.x - proj.vx, proj.y - proj.vy, proj.size, proj.size);
    }
    
    // Draw enemies
    for (const enemy of gameState.enemies) {
      enemy.draw(p);
    }
    
    // Draw player
    if (gameState.player) {
      gameState.player.draw(p);
    }
    
    // Draw HUD
    if (gameState.player) {
      drawHUD(p, gameState.player);
    }
  }
  
  // Handle automated testing actions
  function handleAutomatedAction(p, action) {
    if (!gameState.player) return;
    
    if (action.move) {
      gameState.player.move(action.move.x, action.move.y);
    }
    
    if (action.shoot) {
      gameState.player.shoot(p);
    }
    
    if (action.dash) {
      gameState.player.dash(p);
    }
    
    if (action.special) {
      gameState.player.useSpecial(p);
    }
    
    if (action.selectUpgrade !== undefined && gameState.isPendingUpgrade) {
      const upgrade = gameState.upgradesAvailable[action.selectUpgrade];
      if (upgrade) {
        gameState.player.applyUpgrade(upgrade);
      }
    }
  }
  
  // Key pressed handler
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Start game
    if (p.keyCode === KEY_CODES.ENTER && gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
      return;
    }
    
    // Pause/unpause
    if (p.keyCode === KEY_CODES.ESC && 
        (gameState.gamePhase === GAME_PHASES.PLAYING || gameState.gamePhase === GAME_PHASES.PAUSED)) {
      togglePause();
      return;
    }
    
    // Restart
    if (p.keyCode === KEY_CODES.R && 
        (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE)) {
      restartGame();
      return;
    }
    
    // Gameplay controls (only in PLAYING phase)
    if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.controlMode === "HUMAN") {
      // Upgrade selection
      if (gameState.isPendingUpgrade) {
        if (p.key === '1' || p.key === '2' || p.key === '3') {
          const index = parseInt(p.key) - 1;
          if (index < gameState.upgradesAvailable.length) {
            const upgrade = gameState.upgradesAvailable[index];
            gameState.player.applyUpgrade(upgrade);
          }
        }
        return;
      }
      
      // Dash
      if (p.keyCode === KEY_CODES.SHIFT) {
        gameState.player.dash(p);
      }
      
      // Special ability
      if (p.keyCode === KEY_CODES.Z) {
        gameState.player.useSpecial(p);
      }
    }
  };
  
  // Key released handler (for continuous actions)
  p.keyReleased = function() {
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  // Continuous key handling (in draw loop for smooth movement)
  p.keyIsDownHandler = function() {
    if (gameState.gamePhase !== GAME_PHASES.PLAYING || gameState.controlMode !== "HUMAN") return;
    if (!gameState.player || gameState.isPendingUpgrade) return;
    
    let dx = 0;
    let dy = 0;
    
    if (p.keyIsDown(KEY_CODES.LEFT)) dx -= 1;
    if (p.keyIsDown(KEY_CODES.RIGHT)) dx += 1;
    if (p.keyIsDown(KEY_CODES.UP)) dy -= 1;
    if (p.keyIsDown(KEY_CODES.DOWN)) dy += 1;
    
    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
    }
    
    if (dx !== 0 || dy !== 0) {
      gameState.player.move(dx, dy);
    }
    
    // Continuous shooting
    if (p.keyIsDown(KEY_CODES.SPACE)) {
      gameState.player.shoot(p);
    }
  };
  
  // Call continuous key handler in draw
  const originalDraw = p.draw;
  p.draw = function() {
    originalDraw();
    p.keyIsDownHandler();
  };
  
  // Game state management functions
  function startGame(p) {
    resetGameState();
    gameState.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    gameState.entities.push(gameState.player);
    gameState.startTime = Date.now();
    setGamePhase(GAME_PHASES.PLAYING);
  }
  
  function togglePause() {
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      setGamePhase(GAME_PHASES.PAUSED);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      setGamePhase(GAME_PHASES.PLAYING);
    }
  }
  
  function restartGame() {
    setGamePhase(GAME_PHASES.START);
  }
  
  function setGamePhase(newPhase) {
    gameState.gamePhase = newPhase;
    p.logs.game_info.push({
      data: { gamePhase: newPhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode selection
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
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};