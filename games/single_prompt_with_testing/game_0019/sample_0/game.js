// game.js
import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY } from './globals.js';
import { Player } from './player.js';
import { createLevel } from './level.js';
import { checkPlatformCollision, checkPizzaCollision, checkBlockCollision, checkExitCollision } from './physics.js';
import { renderStartScreen, renderPausedOverlay, renderGameOverScreen, renderHUD } from './ui.js';
import { handleKeyPressed, handleContinuousInput } from './input.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let lastPhase = "";
  
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
    
    // Initialize game
    initGame();
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  function initGame() {
    gameState.score = 0;
    gameState.gamePhase = "START";
    gameState.frameCount = 0;
    gameState.exitReached = false;
    gameState.cameraY = 0;
    gameState.timeElapsed = 0;
    gameState.entities = [];
    
    // Create player
    gameState.player = new Player(CANVAS_WIDTH / 2, 340);
    gameState.entities.push(gameState.player);
    
    // Create level
    createLevel();
  }
  
  p.draw = function() {
    gameState.frameCount = p.frameCount;
    
    // Handle game phases
    if (gameState.gamePhase === "START") {
      renderStartScreen(p);
      return;
    }
    
    if (gameState.gamePhase.startsWith("GAME_OVER")) {
      const won = gameState.gamePhase === "GAME_OVER_WIN";
      renderGameOverScreen(p, won);
      return;
    }
    
    if (gameState.gamePhase === "PAUSED") {
      // Render game state but frozen
      renderGame(p);
      renderPausedOverlay(p);
      return;
    }
    
    if (gameState.gamePhase === "PLAYING") {
      // Handle automated testing
      if (gameState.controlMode !== "HUMAN") {
        const actions = get_automated_testing_action(gameState);
        for (let action of actions) {
          simulateKeyPress(action);
        }
      }
      
      // Handle continuous input
      handleContinuousInput(p);
      
      // Update game
      updateGame(p);
      
      // Render game
      renderGame(p);
      
      // Update time
      gameState.timeElapsed++;
    }
    
    // Log phase changes
    if (gameState.gamePhase !== lastPhase) {
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      lastPhase = gameState.gamePhase;
    }
  };
  
  function simulateKeyPress(keyCode) {
    if (keyCode === 37 || keyCode === 39 || keyCode === 38 || keyCode === 32 || keyCode === 90) {
      const key = String.fromCharCode(keyCode);
      handleKeyPressed(p, keyCode, key);
    }
  }
  
  function updateGame(p) {
    if (!gameState.player) return;
    
    const player = gameState.player;
    
    // Reset ground state
    player.onGround = false;
    
    // Update player
    player.update(p);
    
    // Platform collisions
    for (let platform of gameState.platforms) {
      checkPlatformCollision(p, player, platform);
    }
    
    // Pizza collection
    for (let pizza of gameState.pizzas) {
      pizza.update(p);
      if (checkPizzaCollision(p, player, pizza)) {
        pizza.collect();
      }
    }
    
    // Destructible block collisions
    for (let block of gameState.destructibleBlocks) {
      if (checkBlockCollision(p, player, block)) {
        if (player.dashing) {
          block.destroy();
        } else if (player.groundPounding) {
          // Check if player is above the block
          if (player.y < block.y) {
            block.destroy();
          }
        } else {
          // Solid collision - push player back
          if (player.velX > 0) {
            player.x = block.x - player.width / 2;
          } else if (player.velX < 0) {
            player.x = block.x + block.size + player.width / 2;
          }
          player.velX = 0;
        }
      }
    }
    
    // Exit collision
    if (gameState.exit) {
      gameState.exit.update(p);
      if (checkExitCollision(p, player, gameState.exit)) {
        gameState.exitReached = true;
        gameState.gamePhase = "GAME_OVER_WIN";
      }
    }
    
    // Update camera to follow player (with some lag)
    const targetCameraY = player.y - CANVAS_HEIGHT / 2;
    gameState.cameraY += (targetCameraY - gameState.cameraY) * 0.1;
    
    // Clamp camera
    gameState.cameraY = Math.max(-250, gameState.cameraY);
    gameState.cameraY = Math.min(100, gameState.cameraY);
    
    // Log player info periodically
    if (p.frameCount % 10 === 0) {
      p.logs.player_info.push({
        screen_x: player.x,
        screen_y: player.y - gameState.cameraY,
        game_x: player.x,
        game_y: player.y,
        framecount: p.frameCount
      });
    }
  }
  
  function renderGame(p) {
    // Background
    p.background(60, 80, 120);
    
    // Draw background elements (parallax effect)
    p.push();
    p.translate(0, -gameState.cameraY * 0.3);
    p.fill(80, 100, 140, 100);
    p.noStroke();
    for (let i = 0; i < 8; i++) {
      const y = i * 100 - 100;
      p.rect(0, y, CANVAS_WIDTH, 80);
    }
    p.pop();
    
    // Draw platforms
    for (let platform of gameState.platforms) {
      platform.render(p);
    }
    
    // Draw destructible blocks
    for (let block of gameState.destructibleBlocks) {
      block.render(p);
    }
    
    // Draw pizzas
    for (let pizza of gameState.pizzas) {
      pizza.render(p);
    }
    
    // Draw exit
    if (gameState.exit) {
      gameState.exit.render(p);
    }
    
    // Draw player
    if (gameState.player) {
      gameState.player.render(p);
    }
    
    // Draw HUD
    renderHUD(p);
  }
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.keyCode, p.key);
    }
  };
}, document.body);

// Expose globally
window.gameInstance = gameInstance;
window.getGameState = getGameState;

// Control mode switcher
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : mode.toLowerCase() + '_ModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};