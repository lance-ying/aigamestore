// game.js - Main game file

import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS } from './globals.js';
import {
  PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN
} from './globals.js';
import { LevelManager } from './level_manager.js';
import { InputHandler } from './input_handler.js';
import { Renderer } from './renderer.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let levelManager;
let inputHandler;
let renderer;

const gameInstance = new p5(p => {
  // Initialize logs (write-only)
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);

    // Initialize managers
    levelManager = new LevelManager();
    inputHandler = new InputHandler(p);
    renderer = new Renderer(p);

    // Load first level
    levelManager.loadLevel(1, gameState);

    // Log initial game state
    p.logs.game_info.push({
      data: { phase: PHASE_START, level: 1 },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Handle game phase transitions
    handleGamePhaseTransitions();

    // Update game state
    if (gameState.gamePhase === PHASE_PLAYING) {
      updateGame();
    }

    // Render
    renderer.render();
  };

  function handleGamePhaseTransitions() {
    // Handle level completion
    if (gameState.levelComplete && gameState.gamePhase === PHASE_PLAYING) {
      if (gameState.currentLevel < gameState.maxLevel) {
        // Start transition to next level
        if (!gameState.transition.active) {
          gameState.transition.active = true;
          gameState.transition.progress = 0;
        }

        gameState.transition.progress += 1 / gameState.transition.duration;

        if (gameState.transition.progress >= 1) {
          gameState.currentLevel++;
          levelManager.loadLevel(gameState.currentLevel, gameState);
          gameState.transition.active = false;
          gameState.transition.progress = 0;

          p.logs.game_info.push({
            data: { action: 'next_level', level: gameState.currentLevel },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      } else {
        // All levels complete
        gameState.gamePhase = PHASE_GAME_OVER_WIN;
        p.logs.game_info.push({
          data: { phase: PHASE_GAME_OVER_WIN, final_score: gameState.score },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }

    // Handle restart
    if (gameState.gamePhase === PHASE_START && p.frameCount > 0) {
      levelManager.loadLevel(gameState.currentLevel, gameState);
    }
  }

  function updateGame() {
    // Handle automated testing input
    if (gameState.controlMode !== "HUMAN") {
      const action = get_automated_testing_action(gameState);
      if (action) {
        inputHandler.handleAutomatedInput(action);
      }
    }

    // Update all entities
    for (const entity of gameState.entities) {
      entity.update(p, gameState);
    }
  }

  p.keyPressed = function() {
    inputHandler.handleKeyPressed(p.keyCode);
    return false; // Prevent default browser behavior
  };
}, document.body);

// Expose globally
window.gameInstance = gameInstance;

// Control mode management
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
    mode === 'TEST_2' ? 'test_2_ModeBtn' : 'humanModeBtn'
  );
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};