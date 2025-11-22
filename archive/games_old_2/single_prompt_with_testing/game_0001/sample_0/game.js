// game.js
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { initializeLevel } from './level.js';
import { setupInput, handleContinuousInput } from './input.js';
import { drawStartScreen, drawPlayingScreen, drawPausedScreen, drawGameOverScreen } from './renderer.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);

    // Initialize logs (write-only)
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };

    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Initialize level
    initializeLevel(p);

    // Setup input handlers
    setupInput(p);
  };

  p.draw = function() {
    gameState.frameCount = p.frameCount;

    // Update cooldowns
    for (const mutation in gameState.mutationCooldowns) {
      if (gameState.mutationCooldowns[mutation] > 0) {
        gameState.mutationCooldowns[mutation]--;
      }
    }

    // Handle continuous input
    handleContinuousInput(p);

    // Update game logic based on phase
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGame(p);
    }

    // Render based on phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        drawStartScreen(p);
        break;
      case GAME_PHASES.PLAYING:
        drawPlayingScreen(p);
        break;
      case GAME_PHASES.PAUSED:
        drawPausedScreen(p);
        break;
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        drawGameOverScreen(p);
        break;
    }
  };

  function updateGame(p) {
    // Update all entities
    for (const entity of gameState.entities) {
      if (entity.update) {
        entity.update();
      }
    }

    // Log player info periodically
    if (gameState.player && p.frameCount % 30 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.player.x - gameState.cameraX,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }

    // Check win condition
    if (gameState.humans.length === 0 && gameState.totalHumans > 0) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      p.logs.game_info.push({
        data: { phase: "GAME_OVER_WIN", score: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }

    // Check lose condition
    if (gameState.zombies.length === 0) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      p.logs.game_info.push({
        data: { phase: "GAME_OVER_LOSE", score: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
});

// Expose globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn'];
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
    'TEST_3': 'test_3_ModeBtn'
  };

  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};