// game.js - Main game file

import { gameState } from './globals.js';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TARGET_FPS,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE
} from './globals.js';
import { Player } from './player.js';
import { loadRooms, getCurrentRoom } from './room.js';
import { drawUI, drawStartScreen, drawGameOverScreen, updateMessages } from './ui.js';
import { handleKeyPress, applyAutomatedAction } from './input.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

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

    // Initialize game
    initGame();

    // Log initial state
    p.logs.game_info.push({
      data: { phase: PHASE_START, event: 'game_initialized' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Single background call
    p.background(20, 15, 30);

    // Handle different game phases
    if (gameState.gamePhase === PHASE_START) {
      drawStartScreen(p);
    } else if (gameState.gamePhase === PHASE_PLAYING || gameState.gamePhase === PHASE_PAUSED) {
      drawGameplay(p);
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      drawGameOverScreen(p);
    }

    // Apply automated testing actions
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === PHASE_PLAYING) {
      if (p.frameCount % 10 === 0) { // Apply action every 10 frames
        const action = get_automated_testing_action(gameState);
        applyAutomatedAction(action);
      }
    }
  };

  function drawGameplay(p) {
    // Draw current room
    const currentRoom = getCurrentRoom();
    if (currentRoom) {
      currentRoom.draw(p);
    }

    // Draw player
    if (gameState.player) {
      // Update player position to current hotspot
      if (currentRoom && currentRoom.hotspots[gameState.currentHotspot]) {
        const hotspot = currentRoom.hotspots[gameState.currentHotspot];
        gameState.player.x = hotspot.x;
        gameState.player.y = hotspot.y + 40;
      }
      gameState.player.draw(p);

      // Log player info periodically
      if (p.frameCount % 60 === 0) {
        p.logs.player_info.push({
          screen_x: gameState.player.x,
          screen_y: gameState.player.y,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          framecount: p.frameCount
        });
      }
    }

    // Update messages
    updateMessages();

    // Draw UI
    drawUI(p);
  }

  p.keyPressed = function() {
    handleKeyPress(p, p.key, p.keyCode);
  };

  function initGame() {
    // Create player
    gameState.player = new Player(300, 350);
    gameState.entities = [gameState.player];

    // Load rooms
    loadRooms();

    // Initialize game state
    gameState.gamePhase = PHASE_START;
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
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
  
  const activeBtn = mode === 'HUMAN' ? 'humanModeBtn' : 
                    mode === 'TEST_1' ? 'test_1_ModeBtn' :
                    mode === 'TEST_2' ? 'test_2_ModeBtn' : null;
  
  if (activeBtn) {
    const btn = document.getElementById(activeBtn);
    if (btn) {
      btn.classList.add('active');
    }
  }
};

export default gameInstance;