// game.js - Main game file

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { handleKeyPressed, handleKeyReleased, processMovementInput } from './input.js';
import { initializeGame, setupArena, checkGameProgress, logPlayerInfo } from './game_manager.js';
import { renderArena } from './arena.js';
import { renderUI } from './ui.js';
import { checkCombat, checkCollisions } from './combat.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs - write-only, never reset
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);

    // Initialize game
    initializeGame(p);

    // Log setup
    p.logs.game_info.push({
      data: { action: "setup_complete", gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Clear canvas
    p.background(40, 30, 20);

    // Render arena
    renderArena(p);

    // Update and render based on game phase
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      // Process automated testing input
      if (gameState.controlMode !== "HUMAN") {
        const action = get_automated_testing_action(gameState);
        if (action && action.keys) {
          // Simulate key presses
          for (const keyCode of action.keys) {
            if (keyCode === 37) p.keyIsDown = (k) => k === 37 ? true : false; // LEFT
            if (keyCode === 39) p.keyIsDown = (k) => k === 39 ? true : false; // RIGHT
            if (keyCode === 38 && gameState.player) gameState.player.jump(); // UP
            if (keyCode === 90 && gameState.player) gameState.player.attack(); // Z
            if (keyCode === 32 && gameState.player) gameState.player.startBlock(); // SPACE
            if (keyCode === 16) {} // SHIFT handled in movement
          }

          // Process movement with automated keys
          if (action.keys.includes(37)) {
            const isSprinting = action.keys.includes(16);
            if (gameState.player) gameState.player.moveLeft(isSprinting);
          } else if (action.keys.includes(39)) {
            const isSprinting = action.keys.includes(16);
            if (gameState.player) gameState.player.moveRight(isSprinting);
          }

          // Release block if not pressed
          if (!action.keys.includes(32) && gameState.player && gameState.player.isBlocking) {
            gameState.player.stopBlock();
          }
        }
      } else {
        // Human input
        processMovementInput(p);
      }

      // Update player
      if (gameState.player) {
        gameState.player.update(p);
      }

      // Update enemies
      for (const enemy of gameState.enemies) {
        enemy.update(p);
      }

      // Update particles
      for (let i = gameState.particles.length - 1; i >= 0; i--) {
        gameState.particles[i].update();
        if (gameState.particles[i].isDead) {
          gameState.particles.splice(i, 1);
        }
      }

      // Check combat and collisions
      checkCombat(p);
      checkCollisions(p);

      // Check game progress
      checkGameProgress(p);

      // Log player info
      logPlayerInfo(p);
    }

    // Render entities
    for (const entity of gameState.entities) {
      if (entity && entity.render) {
        entity.render(p);
      }
    }

    // Render particles
    for (const particle of gameState.particles) {
      particle.render(p);
    }

    // Render UI
    renderUI(p);
  };

  p.keyPressed = function() {
    handleKeyPressed(p);
    return false; // Prevent default behavior
  };

  p.keyReleased = function() {
    handleKeyReleased(p);
    return false;
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn', 'test_5_ModeBtn'];
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

  console.log('Control mode set to:', mode);
};