// game.js - Main game file

import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, CONTROL_MODES, KEYS, gameState } from './globals.js';
import { Player, Projectile } from './player.js';
import { Enemy, Boss } from './enemies.js';
import { initializeWorld, renderBackground, renderUI } from './world.js';
import { renderStartScreen, renderGameOverScreen, renderPausedIndicator } from './screens.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let pressedKeys = new Set();

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
    
    // Log game start
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Initialize world
    initializeWorld(p);
    
    // Create player
    gameState.player = new Player(p, CANVAS_WIDTH/2 - 8, 100);
    gameState.entities.push(gameState.player);
  };

  p.draw = function() {
    // Handle game phases
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
      return;
    }
    
    if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      // Render game state but show paused indicator
      renderGame();
      renderPausedIndicator(p);
      return;
    }
    
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGame();
      renderGameOverScreen(p);
      return;
    }
    
    // Playing phase
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      handleAutomatedTesting();
      updateGame();
      renderGame();
    }
  };

  function handleAutomatedTesting() {
    if (gameState.controlMode === CONTROL_MODES.HUMAN) return;
    
    const action = get_automated_testing_action(gameState);
    
    if (action && action.keys) {
      pressedKeys.clear();
      action.keys.forEach(key => pressedKeys.add(key));
    }
  }

  function updateGame() {
    const player = gameState.player;
    if (!player) return;
    
    // Handle player input
    if (pressedKeys.has(KEYS.LEFT)) {
      player.moveLeft();
    } else if (pressedKeys.has(KEYS.RIGHT)) {
      player.moveRight();
    } else {
      player.stop();
    }
    
    if (pressedKeys.has(KEYS.UP)) {
      player.jump();
    }
    
    if (pressedKeys.has(KEYS.SPACE)) {
      player.attack();
    }
    
    if (pressedKeys.has(KEYS.SHIFT)) {
      player.dash();
    }
    
    if (pressedKeys.has(KEYS.Z)) {
      player.castSpell();
    }
    
    // Update entities
    player.update();
    
    // Update enemies
    for (let enemy of gameState.enemies) {
      enemy.update();
    }
    
    // Update bosses
    for (let boss of gameState.bosses) {
      boss.update();
    }
    
    // Update projectiles
    for (let proj of gameState.projectiles) {
      if (proj.type === 'projectile') {
        proj.update();
      } else if (proj.type === 'enemy_projectile') {
        proj.x += proj.vx;
        proj.y += proj.vy;
        proj.lifetime--;
        
        if (proj.lifetime <= 0 || proj.x < -20 || proj.x > CANVAS_WIDTH + 20) {
          proj.dead = true;
        }
        
        // Hit player
        if (proj.room === gameState.currentRoom && !player.invulnerable) {
          const dist = p.dist(proj.x, proj.y, 
                             player.x + player.width/2, player.y + player.height/2);
          if (dist < 15) {
            player.takeDamage(1);
            proj.dead = true;
          }
        }
      }
    }
    
    // Update abilities
    for (let ability of gameState.abilities) {
      ability.update();
    }
    
    // Update particles
    for (let particle of gameState.particles) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.2;
      particle.life--;
    }
    
    // Clean up dead entities
    gameState.projectiles = gameState.projectiles.filter(p => !p.dead);
    gameState.particles = gameState.particles.filter(p => p.life > 0);
    
    // Log player info periodically
    if (p.frameCount % 30 === 0) {
      p.logs.player_info.push({
        screen_x: player.x,
        screen_y: player.y,
        game_x: player.x,
        game_y: player.y + gameState.currentRoom * CANVAS_HEIGHT,
        framecount: p.frameCount
      });
    }
  }

  function renderGame() {
    // Background
    renderBackground(p, gameState.currentRoom);
    
    // Platforms
    for (let platform of gameState.platforms) {
      if (platform.room === gameState.currentRoom) {
        platform.render();
      }
    }
    
    // Abilities
    for (let ability of gameState.abilities) {
      if (ability.room === gameState.currentRoom) {
        ability.render();
      }
    }
    
    // Enemies
    for (let enemy of gameState.enemies) {
      if (enemy.room === gameState.currentRoom) {
        enemy.render();
      }
    }
    
    // Bosses
    for (let boss of gameState.bosses) {
      if (boss.room === gameState.currentRoom) {
        boss.render();
      }
    }
    
    // Projectiles
    for (let proj of gameState.projectiles) {
      if (proj.room === gameState.currentRoom) {
        if (proj.type === 'projectile') {
          proj.render();
        } else if (proj.type === 'enemy_projectile') {
          p.push();
          p.fill(255, 100, 0, 200);
          p.noStroke();
          p.ellipse(proj.x, proj.y, 10, 10);
          p.pop();
        }
      }
    }
    
    // Particles
    for (let particle of gameState.particles) {
      if (particle.room === gameState.currentRoom) {
        p.push();
        const alpha = (particle.life / particle.maxLife) * 255;
        p.fill(255, 150, 50, alpha);
        p.noStroke();
        p.ellipse(particle.x, particle.y, 4, 4);
        p.pop();
      }
    }
    
    // Player
    if (gameState.player) {
      gameState.player.render();
    }
    
    // UI
    renderUI(p);
  }

  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: 'keyPressed',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Game phase transitions
    if (p.keyCode === KEYS.ENTER && gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return;
    }
    
    if (p.keyCode === KEYS.ESC && gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return;
    }
    
    if (p.keyCode === KEYS.ESC && gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return;
    }
    
    if (p.keyCode === KEYS.R && (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
                                  gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE)) {
      restartGame();
      return;
    }
    
    // Gameplay keys
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      pressedKeys.add(p.keyCode);
    }
  };

  p.keyReleased = function() {
    // Log input
    p.logs.inputs.push({
      input_type: 'keyReleased',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    pressedKeys.delete(p.keyCode);
  };

  function restartGame() {
    // Reset game state
    gameState.gamePhase = GAME_PHASES.START;
    gameState.currentRoom = 0;
    gameState.score = 0;
    gameState.defeatedBosses = [];
    gameState.unlockedAbilities = {
      dash: false,
      spell: false
    };
    
    // Clear entities
    gameState.entities = [];
    gameState.enemies = [];
    gameState.bosses = [];
    gameState.projectiles = [];
    gameState.particles = [];
    gameState.platforms = [];
    gameState.abilities = [];
    
    // Reinitialize
    initializeWorld(p);
    gameState.player = new Player(p, CANVAS_WIDTH/2 - 8, 100);
    gameState.entities.push(gameState.player);
    
    pressedKeys.clear();
    
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, action: 'restart' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const modes = ['HUMAN', 'TEST_1', 'TEST_2', 'TEST_3', 'TEST_4', 'TEST_5'];
  modes.forEach(m => {
    const btnId = m === 'HUMAN' ? 'humanModeBtn' : `test_${m.split('_')[1]}_ModeBtn`;
    const btn = document.getElementById(btnId);
    if (btn) {
      if (m === mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });
};