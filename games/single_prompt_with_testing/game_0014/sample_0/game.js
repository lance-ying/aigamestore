// game.js
import { 
  gameState, 
  CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS,
  PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE,
  WORLD_WIDTH, WORLD_HEIGHT
} from './globals.js';
import { Player } from './entities.js';
import { generateWorld, drawWorld, drawMinimap } from './world.js';
import { updateCamera } from './camera.js';
import { checkCollisions, endGame } from './collision.js';
import { drawUI, drawStartScreen, drawGameOverScreen } from './ui.js';
import { handleKeyPressed, handleKeyReleased, handleMovement } from './input.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let initialized = false;

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);

    // Initialize logs (write-only)
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };

    // Initialize game
    initializeGame(p);

    // Log initial state
    p.logs.game_info.push({
      data: { phase: PHASE_START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    initialized = true;
    p.noLoop(); // Start paused on START screen
  };

  p.draw = function() {
    if (!initialized) return;

    p.background(20, 20, 35);

    if (gameState.gamePhase === PHASE_START) {
      drawStartScreen(p);
      return;
    }

    if (gameState.gamePhase === PHASE_PLAYING) {
      // Handle automated testing
      if (gameState.controlMode !== "HUMAN") {
        const actions = get_automated_testing_action(gameState);
        applyAutomatedActions(p, actions);
      } else {
        handleMovement(p);
      }

      // Update game state
      updateGame(p);

      // Check win/lose conditions
      if (gameState.player.health <= 0) {
        endGame(p, false);
      }
    }

    // Render game
    if (gameState.gamePhase === PHASE_PLAYING || gameState.gamePhase === PHASE_PAUSED) {
      renderGame(p);
    }

    // Game over screens
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
      renderGame(p);
      drawGameOverScreen(p, true);
    }

    if (gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      renderGame(p);
      drawGameOverScreen(p, false);
    }
  };

  p.keyPressed = function() {
    handleKeyPressed(p);
    return false; // Prevent default
  };

  p.keyReleased = function() {
    handleKeyReleased(p);
    return false;
  };

  function initializeGame(p) {
    // Reset game state
    gameState.score = 0;
    gameState.memoriesCollected = 0;
    gameState.npcInteractions = 0;
    gameState.elapsedTime = 0;
    gameState.playerPath = "neutral";
    gameState.entities = [];

    // Create player
    gameState.player = new Player(WORLD_WIDTH / 4, WORLD_HEIGHT / 2);
    gameState.entities.push(gameState.player);

    // Generate world
    generateWorld(p);

    // Add all entities to entities array
    gameState.entities.push(...gameState.memoryFragments);
    gameState.entities.push(...gameState.npcs);
    gameState.entities.push(...gameState.hostiles);
    gameState.entities.push(gameState.portal);

    // Initialize camera
    gameState.camera = { x: 0, y: 0 };
    updateCamera();
  }

  function updateGame(p) {
    gameState.elapsedTime++;

    // Update player
    gameState.player.update();

    // Update hostiles
    for (const hostile of gameState.hostiles) {
      hostile.update(gameState.player);
    }

    // Update camera
    updateCamera();

    // Check collisions
    checkCollisions(p);

    // Log player info periodically
    if (p.frameCount % 10 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.player.x - gameState.camera.x,
        screen_y: gameState.player.y - gameState.camera.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
  }

  function renderGame(p) {
    // Draw world
    drawWorld(p, gameState.camera);

    // Draw entities
    const camera = gameState.camera;

    // Draw memory fragments
    for (const fragment of gameState.memoryFragments) {
      fragment.draw(p, camera);
    }

    // Draw NPCs
    for (const npc of gameState.npcs) {
      npc.draw(p, camera);
    }

    // Draw hostiles
    for (const hostile of gameState.hostiles) {
      hostile.draw(p, camera);
    }

    // Draw portal
    gameState.portal.draw(p, camera);

    // Draw player
    gameState.player.draw(p, camera);

    // Draw UI
    drawUI(p);

    // Draw minimap
    drawMinimap(p);
  }

  function applyAutomatedActions(p, actions) {
    if (!actions || actions.length === 0) return;

    // Simulate key presses for automated testing
    const keys = new Set(actions);

    let dx = 0;
    let dy = 0;

    if (keys.has(37)) dx -= 1; // LEFT
    if (keys.has(39)) dx += 1; // RIGHT
    if (keys.has(38)) dy -= 1; // UP
    if (keys.has(40)) dy += 1; // DOWN

    gameState.player.isSprinting = keys.has(16); // SHIFT
    gameState.player.move(dx, dy);

    if (keys.has(90)) { // Z
      if (gameState.player.energy > 20) {
        gameState.player.isShielded = true;
      }
    } else {
      gameState.player.isShielded = false;
    }

    if (keys.has(32)) { // SPACE
      const { handleNPCInteraction, handlePortalEntry } = require('./collision.js');
      handleNPCInteraction(p);
      handlePortalEntry(p);
    }
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switcher
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

export default gameInstance;