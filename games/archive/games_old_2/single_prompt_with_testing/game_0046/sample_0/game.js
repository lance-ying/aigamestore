import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES } from './globals.js';
import { Player } from './player.js';
import { createScenes } from './scenes_data.js';
import { renderUI, renderStartScreen, renderPauseScreen, renderGameOverScreen } from './ui.js';
import { handleKeyPressed, updateHotspotHighlight } from './input.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let scenes = [];

let gameInstance = new p5(p => {
  // Store p5 instance reference
  gameState.p = p;

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

    // Create scenes
    scenes = createScenes(p);

    // Create player
    gameState.player = new Player(300, 280);
    gameState.entities.push(gameState.player);

    // Initialize game state
    gameState.messageText = "";
    gameState.messageTimer = 0;
    gameState.selectedActionIndex = 0;

    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    p.background(30, 30, 40);

    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        handleKeyPressed(p, action.keyCode, scenes);
      }
    }

    // Render based on game phase
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      renderGameplay(p);
      if (gameState.messageTimer > 0) {
        gameState.messageTimer--;
      }
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      renderGameplay(p);
      renderPauseScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
      renderGameOverScreen(p, true);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGameOverScreen(p, false);
    }
  };

  function renderGameplay(p) {
    // Update hotspot highlighting
    updateHotspotHighlight(scenes);

    // Render current scene
    const currentScene = scenes[gameState.currentScene];
    currentScene.render(p);

    // Render player
    if (gameState.player) {
      gameState.player.render(p);
    }

    // Render UI
    renderUI(p, scenes);
  }

  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.keyCode, scenes);
    }
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ["humanModeBtn", "test_1_ModeBtn", "test_2_ModeBtn"];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove("active");
    }
  });
  
  const activeBtn = document.getElementById(
    mode === "HUMAN" ? "humanModeBtn" : 
    mode === "TEST_1" ? "test_1_ModeBtn" : 
    "test_2_ModeBtn"
  );
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
};