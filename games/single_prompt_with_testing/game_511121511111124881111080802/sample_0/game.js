// game.js - Main game loop and p5.js instance

import {
  gameState,
  resetGameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  INITIAL_SNAKE_LENGTH,
  COLORS
} from './globals.js';

import { Snake } from './entities.js';

import {
  handleKeyPress,
  handleKeyRelease,
  handlePlayerInput,
  getAutomatedAction,
  processAutomatedInput
} from './input.js';

import {
  renderStartScreen,
  renderUI,
  renderPausedOverlay,
  renderGameOver,
  renderBackground,
  renderScreenEffects
} from './ui.js';

import {
  updateCamera,
  updateGameObjects,
  applyScreenShake
} from './physics.js';

import { updateSpawning } from './spawning.js';

// Get p5 from window
const p5 = window.p5;

// Create p5 instance
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
    gameState.frameCount = 0;
    gameState.lastFrameTime = p.millis();

    // Log initial state
    p.logs.game_info.push({
      data: { 
        gamePhase: gameState.gamePhase,
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Update frame count
    gameState.frameCount = p.frameCount;

    // Update delta time
    const currentTime = p.millis();
    gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = currentTime;

    // Single background call
    p.background(...COLORS.background);

    // Handle game phases
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;

      case "PLAYING":
        updatePlaying(p);
        renderPlaying(p);
        break;

      case "PAUSED":
        renderPlaying(p);
        renderPausedOverlay(p);
        break;

      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderPlaying(p);
        renderGameOver(p);
        break;
    }
  };

  p.keyPressed = function() {
    handleKeyPress(p);
  };

  p.keyReleased = function() {
    handleKeyRelease(p);
  };

  // Update game logic during playing phase
  function updatePlaying(p) {
    // Handle input based on control mode
    if (gameState.controlMode === "HUMAN") {
      handlePlayerInput(p);
    } else {
      // Automated testing
      const action = getAutomatedAction();
      if (action) {
        processAutomatedInput(action);
      }
    }

    // Update camera
    updateCamera();

    // Update spawning system
    updateSpawning(p);

    // Update all game objects
    updateGameObjects(p);

    // Check game over condition
    if (gameState.player && gameState.player.getLength() <= 0) {
      gameState.gamePhase = "GAME_OVER_LOSE";

      // Update high score
      if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
      }

      p.logs.game_info.push({
        data: { 
          gamePhase: "GAME_OVER_LOSE",
          finalScore: gameState.score,
          distance: gameState.rowsPassed
        },
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }

  // Render game during playing phase
  function renderPlaying(p) {
    p.push();

    // Apply screen shake
    applyScreenShake(p);

    // Translate for camera
    p.translate(0, gameState.cameraY);

    // Render background
    renderBackground(p);

    // Render bricks
    gameState.bricks.forEach(brick => {
      brick.render(p);
    });

    // Render collectibles
    gameState.collectibles.forEach(collectible => {
      collectible.render(p);
    });

    // Render player/snake
    if (gameState.player) {
      gameState.player.render(p);
    }

    // Render particles
    gameState.particles.forEach(particle => {
      particle.render(p);
    });

    p.pop();

    // Render UI (not affected by camera)
    renderUI(p);

    // Render screen effects
    renderScreenEffects(p);
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Reset game to initial state
export function resetGame(p) {
  resetGameState();

  // Create new snake
  const snake = new Snake(CANVAS_WIDTH / 2, 100, INITIAL_SNAKE_LENGTH);
  gameState.player = snake;

  // Reset target position
  gameState.targetX = CANVAS_WIDTH / 2;

  // Initialize game phase
  gameState.gamePhase = "START";
}

// Initialize game when starting
export function initGame(p) {
  resetGameState();

  // Create snake
  const snake = new Snake(CANVAS_WIDTH / 2, 100, INITIAL_SNAKE_LENGTH);
  gameState.player = snake;

  // Set initial target
  gameState.targetX = CANVAS_WIDTH / 2;
}

// Set control mode
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

  console.log(`Control mode set to: ${mode}`);
};

// Helper function to draw star shape
p5.prototype.star = function(x, y, radius1, radius2, npoints) {
  let angle = Math.PI * 2 / npoints;
  let halfAngle = angle / 2.0;
  this.beginShape();
  for (let a = -Math.PI / 2; a < Math.PI * 2 - Math.PI / 2; a += angle) {
    let sx = x + Math.cos(a) * radius2;
    let sy = y + Math.sin(a) * radius2;
    this.vertex(sx, sy);
    sx = x + Math.cos(a + halfAngle) * radius1;
    sy = y + Math.sin(a + halfAngle) * radius1;
    this.vertex(sx, sy);
  }
  this.endShape(this.CLOSE);
};