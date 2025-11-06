// game.js - Main game file
import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_FPS, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { Player } from './player.js';
import { generateWorld, updateWorld, renderWorld } from './world.js';
import { renderUI, renderStartScreen, renderGameOverScreen } from './ui.js';
import { createInputHandler } from './input.js';
import { updateCamera, handlePlayerActions } from './game_logic.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let inputHandler;

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(GAME_FPS);
    p.randomSeed(42);

    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };

    // Log initial state
    p.logs.game_info.push({
      data: { phase: PHASE_START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Initialize game state
    gameState.player = new Player(300, 300);
    gameState.camera = { x: 0, y: 0 };

    // Generate world
    generateWorld(p);

    // Create input handler
    inputHandler = createInputHandler(p);

    // Add player to entities
    gameState.entities.push(gameState.player);
  };

  p.draw = function() {
    p.background(40, 50, 45);

    if (gameState.gamePhase === PHASE_START) {
      renderStartScreen(p);
      return;
    }

    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      // Still render the game world behind
      updateCamera(gameState.camera, gameState.player);
      renderWorld(p, gameState.camera);
      renderUI(p);
      renderGameOverScreen(p);
      return;
    }

    if (gameState.gamePhase === PHASE_PLAYING) {
      // Get automated testing input if in testing mode
      if (gameState.controlMode !== "HUMAN") {
        const action = get_automated_testing_action(gameState);
        inputHandler.processAutomatedInput(action);
      }

      // Update player
      gameState.player.update(p, inputHandler.inputs);

      // Handle player actions
      handlePlayerActions(p, inputHandler.inputs);

      // Update world
      updateWorld(p);

      // Update camera
      updateCamera(gameState.camera, gameState.player);
    }

    // Render
    renderWorld(p, gameState.camera);
    renderUI(p);
  };

  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      inputHandler.handleKeyPressed(p.keyCode, p.key);
    }
  };

  p.keyReleased = function() {
    if (gameState.controlMode === "HUMAN") {
      inputHandler.handleKeyReleased(p.keyCode, p.key);
    }
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ["humanModeBtn", "test_1_ModeBtn", "test_2_ModeBtn", "test_3_ModeBtn"];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove("active");
    }
  });

  const modeMap = {
    "HUMAN": "humanModeBtn",
    "TEST_1": "test_1_ModeBtn",
    "TEST_2": "test_2_ModeBtn",
    "TEST_3": "test_3_ModeBtn"
  };

  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
};