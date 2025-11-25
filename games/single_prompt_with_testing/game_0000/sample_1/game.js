// game.js - Main game loop and p5.js instance

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, KEYS, getGameState } from './globals.js';
import { handleKeyPress, handleKeyRelease, isKeyPressed } from './input.js';
import { Player } from './entities.js';
import { generateLevel, resetLevel } from './level.js';
import { updateCamera } from './camera.js';
import { renderStartScreen, renderUI, renderPausedOverlay, renderGameOver, renderBackground } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };
  
  let keys = {};
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize game state
    gameState.gamePhase = "START";
    gameState.controlMode = "HUMAN";
    gameState.lastFrameTime = p.millis();
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: "START", event: "game_initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Generate level
    generateLevel();
  };
  
  p.draw = function() {
    // Update frame count and delta time
    gameState.frameCount = p.frameCount;
    const currentTime = p.millis();
    gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = currentTime;
    
    // Clear screen
    p.background(10, 10, 15);
    
    // Handle game phases
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
        
      case "PLAYING":
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
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN") {
      const action = get_automated_testing_action(gameState);
      if (action) {
        simulateKeyPress(p, action.keyCode);
      }
    }
    
    // Handle player input
    if (gameState.player) {
      handlePlayerInput(p);
    }
    
    // Update player
    if (gameState.player) {
      gameState.player.update(p);
    }
    
    // Update enemies
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
      gameState.enemies[i].update(p);
    }
    
    // Update collectibles
    for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
      gameState.collectibles[i].update(p);
    }
    
    // Update relic
    if (gameState.relic) {
      gameState.relic.update(p);
    }
    
    // Update particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
      gameState.particles[i].update();
      if (gameState.particles[i].isDead()) {
        gameState.particles.splice(i, 1);
      }
    }
    
    // Update camera
    updateCamera(p);
  }
  
  function handlePlayerInput(p) {
    const player = gameState.player;
    
    // Movement
    if (isKeyPressed(KEYS.LEFT)) {
      player.moveLeft();
    }
    if (isKeyPressed(KEYS.RIGHT)) {
      player.moveRight();
    }
    
    // Jump
    if (isKeyPressed(KEYS.UP)) {
      if (!keys[KEYS.UP]) {
        player.jump();
        keys[KEYS.UP] = true;
      }
    } else {
      keys[KEYS.UP] = false;
    }
    
    // Attack
    if (isKeyPressed(KEYS.Z)) {
      if (!keys[KEYS.Z]) {
        const isDownAttack = isKeyPressed(KEYS.DOWN) && !player.onGround;
        player.attack(isDownAttack);
        keys[KEYS.Z] = true;
      }
    } else {
      keys[KEYS.Z] = false;
    }
    
    // Dash
    if (isKeyPressed(KEYS.SPACE)) {
      if (!keys[KEYS.SPACE]) {
        player.dash();
        keys[KEYS.SPACE] = true;
      }
    } else {
      keys[KEYS.SPACE] = false;
    }
  }
  
  function renderGame(p) {
    // Render background
    renderBackground(p);
    
    // Render platforms
    for (const platform of gameState.platforms) {
      platform.render(p);
    }
    
    // Render collectibles
    for (const collectible of gameState.collectibles) {
      collectible.render(p);
    }
    
    // Render relic
    if (gameState.relic) {
      gameState.relic.render(p);
    }
    
    // Render enemies
    for (const enemy of gameState.enemies) {
      enemy.render(p);
    }
    
    // Render player
    if (gameState.player) {
      gameState.player.render(p);
    }
    
    // Render particles
    for (const particle of gameState.particles) {
      particle.render(p);
    }
  }
  
  function simulateKeyPress(p, keyCode) {
    // Simulate a key press for automated testing
    if (!keys[keyCode]) {
      keys[keyCode] = true;
      setTimeout(() => {
        keys[keyCode] = false;
      }, 100);
    }
  }
  
  function startGame(p) {
    // Reset level
    resetLevel();
    
    // Create new player
    gameState.player = new Player(100, 650);
    
    // Set game phase to playing
    gameState.gamePhase = "PLAYING";
    
    p.logs.game_info.push({
      data: { event: "game_started", gamePhase: "PLAYING" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  p.keyPressed = function() {
    const wasStartPhase = gameState.gamePhase === "START";
    
    handleKeyPress(p);
    
    // Start game when ENTER is pressed from start screen
    if (p.keyCode === KEYS.ENTER && wasStartPhase) {
      startGame(p);
    }
    
    // Special handling for restart
    if (p.keyCode === KEYS.R) {
      if (gameState.gamePhase === "GAME_OVER_WIN" || 
          gameState.gamePhase === "GAME_OVER_LOSE") {
        restartGame(p);
      }
    }
  };
  
  p.keyReleased = function() {
    handleKeyRelease(p);
  };
  
  function restartGame(p) {
    // Reset level
    resetLevel();
    
    // Create new player
    gameState.player = new Player(100, 650);
    
    // Reset game phase
    gameState.gamePhase = "START";
    
    p.logs.game_info.push({
      data: { event: "game_restarted", gamePhase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Expose startGame for use by control mode buttons
  window.startGameInternal = function() {
    startGame(gameInstance);
  };
});

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
  
  const activeBtn = document.getElementById(
    mode === 'HUMAN' ? 'humanModeBtn' : 
    mode === 'TEST_1' ? 'test_1_ModeBtn' : 
    'test_2_ModeBtn'
  );
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  // Start game if not already playing
  if (gameState.gamePhase === "START") {
    window.startGameInternal();
  }
};