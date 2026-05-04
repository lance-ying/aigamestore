// game.js - Main game file

import {
  gameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TARGET_FPS,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  LEVEL_CONFIGS
} from './globals.js';
import { Player } from './player.js';
import { Background } from './background.js';
import { Spawner } from './spawner.js';
import { checkCollisions, updateTimers } from './collision.js';
import { drawUI, drawLevelComplete } from './ui.js';
import { handleKeyPressed, handleAutomatedInput } from './input.js';
import { TestController } from './testing.js';

const p5 = window.p5;

let background;
let spawner;
let testController;

// Initialize game instance
let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);

    // Load high score from localStorage
    const saved = localStorage.getItem('penguinDashHighScore');
    if (saved) {
      gameState.highScore = parseInt(saved, 10);
    }

    // Initialize systems
    background = new Background(p);
    spawner = new Spawner(p);
    testController = new TestController(gameState.controlMode);

    // Log initial state
    p.logs.game_info.push({
      data: { phase: PHASE_START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    p.background(180, 220, 255);

    const phase = gameState.gamePhase;

    if (phase === PHASE_START) {
      background.draw();
      drawUI(p);
    } else if (phase === PHASE_PLAYING || phase === PHASE_PAUSED) {
      // Update game (only if not paused)
      if (phase === PHASE_PLAYING) {
        updateGame(p);
      }

      // Render
      background.draw();
      renderEntities(p);
      drawUI(p);
    } else if (phase === "LEVEL_COMPLETE") {
      background.draw();
      renderEntities(p);
      drawLevelComplete(p);
    } else if (phase === "GAME_OVER") {
      background.draw();
      renderEntities(p);
      drawUI(p);

      // Update high score
      if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('penguinDashHighScore', gameState.highScore.toString());
      }
    }

    gameState.framesSinceStart++;
  };

  p.keyPressed = function() {
    handleKeyPressed(p);
    return false; // Prevent default
  };
});

function updateGame(p) {
  const config = gameState.levelConfig;
  if (!config) return;

  // Handle automated testing
  if (gameState.controlMode !== "HUMAN") {
    const action = testController.getAction();
    handleAutomatedInput(p, action);
  }

  // Update player
  if (gameState.player) {
    gameState.player.update();
  }

  // Update background
  background.update(gameState.scrollSpeed);

  // Update distance
  gameState.distanceTraveled += gameState.scrollSpeed;
  gameState.score += Math.floor(gameState.scrollSpeed / 10);

  // Check level completion
  if (gameState.distanceTraveled >= config.distanceTarget) {
    completeLevel(p);
    return;
  }

  // Update timers
  updateTimers();

  // Spawn objects
  spawner.update();

  // Update obstacles
  for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
    const obstacle = gameState.obstacles[i];
    obstacle.update(gameState.scrollSpeed);
    if (!obstacle.active) {
      gameState.obstacles.splice(i, 1);
      const idx = gameState.entities.indexOf(obstacle);
      if (idx > -1) gameState.entities.splice(idx, 1);
    }
  }

  // Update items
  for (let i = gameState.items.length - 1; i >= 0; i--) {
    const item = gameState.items[i];
    item.update(gameState.scrollSpeed);
    if (!item.active) {
      gameState.items.splice(i, 1);
      const idx = gameState.entities.indexOf(item);
      if (idx > -1) gameState.entities.splice(idx, 1);
    }
  }

  // Check collisions
  checkCollisions(p);
}

function renderEntities(p) {
  // Render obstacles and items
  for (const entity of gameState.entities) {
    if (entity !== gameState.player) {
      entity.draw();
    }
  }

  // Render player on top
  if (gameState.player) {
    gameState.player.draw();
  }
}

function completeLevel(p) {
  gameState.score += 100; // Level completion bonus

  if (gameState.currentLevel >= 3) {
    // Win condition
    gameState.gamePhase = "LEVEL_COMPLETE";
    p.logs.game_info.push({
      data: { phase: "LEVEL_COMPLETE", level: gameState.currentLevel, won: true },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else {
    gameState.gamePhase = "LEVEL_COMPLETE";
    p.logs.game_info.push({
      data: { phase: "LEVEL_COMPLETE", level: gameState.currentLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function initLevel(p) {
  // Clear entities
  gameState.entities = [];
  gameState.obstacles = [];
  gameState.items = [];
  gameState.powerUp.active = false;
  gameState.invulnerabilityTimer = 0;
  gameState.distanceTraveled = 0;

  // Set level config
  gameState.levelConfig = LEVEL_CONFIGS[gameState.currentLevel - 1];
  gameState.scrollSpeed = gameState.levelConfig.baseSpeed;

  // Create player
  gameState.player = new Player(p);
  gameState.entities.push(gameState.player);

  // Reset systems
  background.reset();
  spawner.reset();
  testController.reset();

  // Log player info
  p.logs.player_info.push({
    screen_x: gameState.player.x,
    screen_y: gameState.player.y,
    game_x: gameState.player.x,
    game_y: 0,
    framecount: p.frameCount
  });
}

// Expose game instance globally
window.gameInstance = gameInstance;

// Expose getGameState function that returns state with both 'gamePhase' and 'phase' fields
window.getGameState = function() {
  return {
    ...gameState,
    phase: gameState.gamePhase  // Add 'phase' alias for compatibility
  };
};

// Expose setControlMode function
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  testController = new TestController(mode);

  // Update button styles
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

export { gameInstance, initLevel };