// game.js - Main game file

import { 
  gameState, 
  getGameState, 
  GAME_PHASES, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  TARGET_FPS 
} from './globals.js';

import { Player } from './player.js';
import { createLevel, getTotalLevels } from './levels.js';
import { 
  handlePlatformCollisions, 
  checkCoinCollisions, 
  checkHazardCollisions,
  checkExitCollision,
  checkOutOfBounds 
} from './physics.js';

import { 
  renderStartScreen, 
  renderGameOverScreen, 
  renderUI,
  renderPauseOverlay,
  updateCamera,
  renderBackground
} from './rendering.js';

import { handleKeyPressed, loadNextLevel, playerDied } from './input.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup
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

    // Initialize game state
    gameState.totalLevels = getTotalLevels();
    
    // Create player (will be positioned when level loads)
    gameState.player = new Player(100, 200);

    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  // Draw
  p.draw = function() {
    // Handle game phases
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updatePlaying(p);
      renderPlaying(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      renderPlaying(p);
      renderPauseOverlay(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
               gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGameOverScreen(p, gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN);
    }
  };

  function updatePlaying(p) {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN") {
      const actions = get_automated_testing_action(gameState);
      // Simulate key presses
      for (let keyCode of actions) {
        if (!p.keyIsDown(keyCode)) {
          // We can't actually press keys, so we'll track them separately
          // The automated testing will be handled in the player update
        }
      }
      
      // Override keyIsDown for automated testing
      const originalKeyIsDown = p.keyIsDown.bind(p);
      p.keyIsDown = function(k) {
        if (gameState.controlMode !== "HUMAN") {
          return actions.includes(k);
        }
        return originalKeyIsDown(k);
      };
    }

    // Update player
    if (gameState.player && gameState.player.alive) {
      let prevX = gameState.player.x;
      let prevY = gameState.player.y;
      
      gameState.player.update(p);
      handlePlatformCollisions(gameState.player, p);
      checkCoinCollisions(gameState.player, p);

      // Log player info if position changed
      if (Math.abs(prevX - gameState.player.x) > 1 || 
          Math.abs(prevY - gameState.player.y) > 1) {
        p.logs.player_info.push({
          screen_x: gameState.player.x,
          screen_y: gameState.player.y,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          framecount: p.frameCount
        });
      }

      // Check hazards
      if (checkHazardCollisions(gameState.player, p)) {
        gameState.player.die();
        playerDied(p);
      }

      // Check out of bounds
      if (checkOutOfBounds(gameState.player)) {
        gameState.player.die();
        playerDied(p);
      }

      // Check exit
      if (checkExitCollision(gameState.player, p) && !gameState.levelCompleted) {
        gameState.levelCompleted = true;
        loadNextLevel(p);
      }
    }

    // Update entities
    for (let entity of gameState.entities) {
      if (entity.update) {
        entity.update(p);
      }
    }

    // Update camera
    if (gameState.player) {
      updateCamera(gameState.player);
    }
  }

  function renderPlaying(p) {
    renderBackground(p);

    // Render entities
    for (let entity of gameState.entities) {
      if (entity.draw) {
        entity.draw(p, gameState.cameraOffsetX, gameState.cameraOffsetY);
      }
    }

    // Render player
    if (gameState.player) {
      gameState.player.draw(p, gameState.cameraOffsetX, gameState.cameraOffsetY);
    }

    // Render UI
    renderUI(p);
  }

  // Input handling
  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
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

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 
                   'test_3_ModeBtn', 'test_4_ModeBtn', 'test_5_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });

  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn',
    'TEST_3': 'test_3_ModeBtn',
    'TEST_4': 'test_4_ModeBtn',
    'TEST_5': 'test_5_ModeBtn'
  };

  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

export default gameInstance;