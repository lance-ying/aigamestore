// game.js - Main game file

import { gameState, GAME_PHASES, CONTROL_MODES, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState, LANGUAGES } from './globals.js';
import { Player } from './player.js';
import { Floor } from './floor.js';
import { Notebook } from './notebook.js';
import { InputHandler } from './inputHandler.js';
import { drawUI } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let inputHandler;
  let notebook;

  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);

    inputHandler = new InputHandler();
    notebook = new Notebook();

    initializeGame(p);

    p.logs.game_info.push({
      data: { event: "game_initialized", gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    p.background(30, 25, 50);

    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGame(p, inputHandler);
      renderGame(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      renderGame(p);
    }

    drawUI(p);
    notebook.draw(p);

    // Clear interaction prompt each frame
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.interactionPrompt = null;
    }
  };

  p.keyPressed = function() {
    inputHandler.handleKeyPressed(p.key, p.keyCode, p);
    return false;
  };

  p.keyReleased = function() {
    inputHandler.handleKeyReleased(p.keyCode, p);
    return false;
  };

  p.mousePressed = function() {
    if (gameState.notebookOpen) {
      notebook.handleClick(p.mouseX, p.mouseY, p);
    }
  };

  function initializeGame(p) {
    // Create floors
    gameState.floors = [];
    LANGUAGES.forEach((lang, i) => {
      const floor = new Floor(i, lang, p);
      gameState.floors.push(floor);
    });

    // Collect all NPCs and objects
    gameState.npcs = [];
    gameState.glyphObjects = [];
    gameState.floors.forEach(floor => {
      gameState.npcs.push(...floor.npcs);
      gameState.glyphObjects.push(...floor.glyphObjects);
    });

    // Create player
    gameState.player = new Player(CANVAS_WIDTH / 2, 350);
    gameState.entities = [gameState.player, ...gameState.npcs, ...gameState.glyphObjects];
  }

  function updateGame(p, inputHandler) {
    // Apply automated testing actions if in test mode
    if (gameState.controlMode !== CONTROL_MODES.HUMAN) {
      const action = get_automated_testing_action(gameState);
      inputHandler.applyAutomatedAction(action);
    }

    // Update player
    if (gameState.player) {
      gameState.player.update(inputHandler.keys, p);

      // Log player info periodically
      if (p.frameCount % 10 === 0) {
        const screenPos = gameState.player.getScreenPosition();
        const gamePos = gameState.player.getGamePosition();
        p.logs.player_info.push({
          screen_x: screenPos.x,
          screen_y: screenPos.y,
          game_x: gamePos.x,
          game_y: gamePos.y,
          framecount: p.frameCount
        });
      }
    }

    // Update NPCs
    gameState.npcs.forEach(npc => npc.update(p));

    // Update glyph objects
    gameState.glyphObjects.forEach(obj => obj.update(p));
  }

  function renderGame(p) {
    p.push();

    // Draw current floor
    const currentFloor = gameState.floors[gameState.currentFloor];
    if (currentFloor) {
      currentFloor.draw(p);

      // Draw entities on current floor
      currentFloor.npcs.forEach(npc => npc.draw(p));
      currentFloor.glyphObjects.forEach(obj => obj.draw(p));
    }

    // Draw player
    if (gameState.player) {
      gameState.player.draw(p);
    }

    p.pop();
  }
}, document.body);

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (mode === CONTROL_MODES.HUMAN) {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === CONTROL_MODES.TEST_1) {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === CONTROL_MODES.TEST_2) {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
};