// game.js - Main game file
import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player, HitParticle } from './player.js';
import { Enemy, DeathParticle } from './enemy.js';
import { createLevelPlatforms } from './platform.js';
import { SoulPickup, DashPickup } from './pickup.js';
import { drawStartScreen, drawPauseOverlay, drawGameOverScreen, drawHUD } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let keys = {};
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs (write-only)
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    initGame();
  };
  
  function initGame() {
    gameState.player = null;
    gameState.entities = [];
    gameState.platforms = createLevelPlatforms(p);
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.particles = [];
    gameState.pickups = [];
    gameState.score = 0;
    gameState.highestY = CANVAS_HEIGHT - 50;
    gameState.gamePhase = "START";
    gameState.dashUnlocked = false;
    gameState.gameTime = 0;
    gameState.cameraY = 0;
  }
  
  function startGame() {
    gameState.player = new Player(CANVAS_WIDTH / 2, 300);
    gameState.entities.push(gameState.player);
    gameState.gamePhase = "PLAYING";
    
    // Spawn enemies at various heights
    gameState.enemies.push(new Enemy(p, 150, 310, 'crawler'));
    gameState.enemies.push(new Enemy(p, 450, 310, 'crawler'));
    gameState.enemies.push(new Enemy(p, 300, 290, 'flyer'));
    
    gameState.enemies.push(new Enemy(p, 200, 240, 'crawler'));
    gameState.enemies.push(new Enemy(p, 450, 230, 'flyer'));
    
    gameState.enemies.push(new Enemy(p, 120, 170, 'heavy'));
    gameState.enemies.push(new Enemy(p, 350, 180, 'crawler'));
    gameState.enemies.push(new Enemy(p, 520, 170, 'flyer'));
    
    gameState.enemies.push(new Enemy(p, 180, 110, 'crawler'));
    gameState.enemies.push(new Enemy(p, 450, 120, 'heavy'));
    
    // Add dash pickup at mid-level
    gameState.pickups.push(new DashPickup(400, 250));
    
    p.logs.game_info.push({
      data: { phase: "PLAYING", enemyCount: gameState.enemies.length },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  p.draw = function() {
    p.background(30, 25, 40);
    
    if (gameState.gamePhase === "START") {
      drawStartScreen(p);
      return;
    }
    
    if (gameState.gamePhase.startsWith("GAME_OVER")) {
      drawGameOverScreen(p, gameState.gamePhase === "GAME_OVER_WIN");
      return;
    }
    
    if (gameState.gamePhase === "PLAYING") {
      gameState.gameTime++;
      
      // Handle input
      handleInput();
      
      // Update camera to follow player
      if (gameState.player) {
        let targetCameraY = gameState.player.y - CANVAS_HEIGHT / 2;
        targetCameraY = Math.max(0, targetCameraY);
        targetCameraY = Math.min(targetCameraY, 400 - CANVAS_HEIGHT);
        gameState.cameraY += (targetCameraY - gameState.cameraY) * 0.1;
      }
      
      // Update player
      if (gameState.player) {
        gameState.player.update(p);
        
        // Log player info periodically
        if (p.frameCount % 30 === 0) {
          p.logs.player_info.push({
            screen_x: gameState.player.x,
            screen_y: gameState.player.y - gameState.cameraY,
            game_x: gameState.player.x,
            game_y: gameState.player.y,
            framecount: p.frameCount
          });
        }
        
        // Check win condition (reached citadel)
        if (gameState.player.y < 70 && gameState.player.x > 210 && gameState.player.x < 390) {
          gameState.gamePhase = "GAME_OVER_WIN";
          p.logs.game_info.push({
            data: { phase: "GAME_OVER_WIN", score: gameState.score },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
        
        // Check lose condition
        if (gameState.player.health <= 0) {
          gameState.gamePhase = "GAME_OVER_LOSE";
          p.logs.game_info.push({
            data: { phase: "GAME_OVER_LOSE", score: gameState.score },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      }
      
      // Update enemies
      for (let enemy of gameState.enemies) {
        enemy.update(p);
      }
      
      // Update particles
      for (let i = gameState.particles.length - 1; i >= 0; i--) {
        gameState.particles[i].update();
        if (gameState.particles[i].isDead()) {
          gameState.particles.splice(i, 1);
        }
      }
      
      // Update pickups
      for (let pickup of gameState.pickups) {
        pickup.update();
      }
      
      // Render
      renderGame();
      
      // Draw HUD
      drawHUD(p, gameState.cameraY);
    }
    
    if (gameState.gamePhase === "PAUSED") {
      renderGame();
      drawHUD(p, gameState.cameraY);
      drawPauseOverlay(p);
    }
  };
  
  function renderGame() {
    // Background elements
    p.push();
    p.noStroke();
    for (let i = 0; i < 30; i++) {
      let x = (i * 157) % CANVAS_WIDTH;
      let y = ((i * 219) % 300) - gameState.cameraY * 0.3;
      p.fill(50, 40, 60, 80);
      p.circle(x, y, 2);
    }
    p.pop();
    
    // Platforms
    for (let platform of gameState.platforms) {
      platform.draw(p, gameState.cameraY);
    }
    
    // Pickups
    for (let pickup of gameState.pickups) {
      pickup.draw(p, gameState.cameraY);
    }
    
    // Particles
    for (let particle of gameState.particles) {
      particle.draw(p, gameState.cameraY);
    }
    
    // Enemies
    for (let enemy of gameState.enemies) {
      enemy.draw(p, gameState.cameraY);
    }
    
    // Player
    if (gameState.player) {
      gameState.player.draw(p, gameState.cameraY);
    }
  }
  
  function handleInput() {
    if (gameState.controlMode === "HUMAN") {
      handleHumanInput();
    } else {
      handleAutomatedInput();
    }
  }
  
  function handleHumanInput() {
    if (!gameState.player) return;
    
    // Movement
    if (keys[37]) { // Left
      gameState.player.move(-1);
    } else if (keys[39]) { // Right
      gameState.player.move(1);
    } else {
      gameState.player.move(0);
    }
    
    // Jump
    if (keys[32]) { // Space
      gameState.player.jump();
    } else {
      gameState.player.releaseJump();
    }
    
    // Attack
    if (keys[90]) { // Z
      gameState.player.attack(p);
    }
    
    // Dash
    if (keys[16]) { // Shift
      gameState.player.dash();
    }
  }
  
  function handleAutomatedInput() {
    if (!gameState.player) return;
    
    let actions = get_automated_testing_action(gameState);
    
    if (actions && actions.length > 0) {
      // Reset all inputs
      gameState.player.move(0);
      gameState.player.releaseJump();
      
      for (let keyCode of actions) {
        if (keyCode === 37) { // Left
          gameState.player.move(-1);
        } else if (keyCode === 39) { // Right
          gameState.player.move(1);
        } else if (keyCode === 32) { // Space
          gameState.player.jump();
        } else if (keyCode === 90) { // Z
          gameState.player.attack(p);
        } else if (keyCode === 16) { // Shift
          gameState.player.dash();
        }
      }
    } else {
      gameState.player.move(0);
      gameState.player.releaseJump();
    }
  }
  
  p.keyPressed = function() {
    keys[p.keyCode] = true;
    
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Game state transitions
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === "START") {
        startGame();
      }
    } else if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === "PLAYING") {
        gameState.gamePhase = "PAUSED";
        p.logs.game_info.push({
          data: { phase: "PAUSED" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === "PAUSED") {
        gameState.gamePhase = "PLAYING";
        p.logs.game_info.push({
          data: { phase: "PLAYING" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (p.keyCode === 82) { // R
      if (gameState.gamePhase.startsWith("GAME_OVER")) {
        initGame();
        p.logs.game_info.push({
          data: { phase: "START" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    return false;
  };
  
  p.keyReleased = function() {
    keys[p.keyCode] = false;
    
    // Log input
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    return false;
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
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
  
  const activeBtnId = mode === 'HUMAN' ? 'humanModeBtn' : 
                     mode === 'TEST_1' ? 'test_1_ModeBtn' : 
                     mode === 'TEST_2' ? 'test_2_ModeBtn' : null;
  
  if (activeBtnId) {
    const activeBtn = document.getElementById(activeBtnId);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
  }
};