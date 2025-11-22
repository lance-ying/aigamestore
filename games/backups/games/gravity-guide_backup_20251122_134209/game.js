// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, PHASE_PLAYING, PHASE_START } from './globals.js';
import { handleKeyPressed, handleKeyReleased, getAIAction } from './input.js';
import { updateLevel } from './levelManager.js';
import { render } from './rendering.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let lastFrameTime = 0;
  let aiActionCooldown = 0;

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);

    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };

    // Load high score
    try {
      const savedHighScore = localStorage.getItem('gravityGuideHighScore');
      if (savedHighScore) {
        gameState.highScore = parseInt(savedHighScore, 10);
      }
    } catch (e) {
      console.log('Could not load high score');
    }

    // Log initial state
    p.logs.game_info.push({
      data: { phase: PHASE_START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    const currentTime = Date.now();
    const deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;

    // Handle AI control if in test mode - use cooldown for discrete tap-based actions
    if (gameState.controlMode !== 'HUMAN' && gameState.gamePhase === PHASE_PLAYING) {
      if (aiActionCooldown <= 0 && gameState.player) {
        const aiAction = getAIAction(gameState.controlMode);
        if (aiAction.left) {
          gameState.player.moveLeft();
        } else if (aiAction.right) {
          gameState.player.moveRight();
        }
        // Set cooldown so AI doesn't tap every frame (more realistic tap timing)
        aiActionCooldown = 8; // Wait 8 frames between AI taps
      }
      if (aiActionCooldown > 0) {
        aiActionCooldown--;
      }
    }

    // Update game logic
    if (gameState.gamePhase === PHASE_PLAYING) {
      updateLevel(p, deltaTime);
      
      // Log player position periodically
      if (p.frameCount % 30 === 0 && gameState.player) {
        p.logs.player_info.push({
          screen_x: gameState.player.x,
          screen_y: gameState.player.y,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          framecount: p.frameCount
        });
      }
    }

    // Render
    render(p);
  };

  p.keyPressed = function() {
    if (gameState.controlMode === 'HUMAN') {
      handleKeyPressed(p, p.key, p.keyCode);
    }
    return false;
  };

  p.keyReleased = function() {
    if (gameState.controlMode === 'HUMAN') {
      handleKeyReleased(p, p.key, p.keyCode);
    }
    return false;
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;
// Expose level loading for dev mode
window.loadLevel = function(levelNum) {
  const state = window.getGameState ? window.getGameState() : (window.gameState || (window.gameInstance && window.gameInstance.gameState));
  if (state) {
    state.currentLevel = levelNum;
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

// Expose getGameState function
window.getGameState = function() {
  return gameState;
};

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  if (mode === 'HUMAN') {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === 'TEST_1') {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === 'TEST_2') {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
  
  console.log(`Control mode set to: ${mode}`);
};

export { gameInstance };