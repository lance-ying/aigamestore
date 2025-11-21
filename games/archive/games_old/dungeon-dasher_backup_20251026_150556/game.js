// game.js - Main game file

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { handleKeyPressed } from './input.js';
import { renderGame } from './render.js';
import { checkProjectileCollisions } from './collision.js';
import { updateEnemyAI, playerAutoAttack } from './ai.js';
import { generateUpgradeChoices } from './upgrades.js';
import { getTestAction, applyTestAction } from './testing.js';
import { loadRoom } from './rooms.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);

    // Load high score
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('dungeonDasherHighScore');
      if (saved) {
        gameState.highScore = parseInt(saved, 10);
      }
    }

    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Handle test mode
    if (gameState.controlMode !== "HUMAN") {
      const action = getTestAction(p);
      if (action) {
        applyTestAction(action, p);
        handleKeyPressed(p);
      }
    }

    // Update game logic
    updateGameLogic(p);

    // Render
    renderGame(p);
  };

  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p);
    }
  };

  function updateGameLogic(p) {
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      // Update cooldowns
      if (gameState.attackCooldown > 0) {
        gameState.attackCooldown--;
      }

      gameState.framesSinceLastMove++;

      // Update entities
      for (const entity of gameState.entities) {
        if (entity && entity.update) {
          entity.update();
        }
      }

      // Update AI
      updateEnemyAI(p);

      // Player auto-attack
      playerAutoAttack(p);

      // Update projectiles
      for (const proj of gameState.projectiles) {
        proj.update();
      }

      // Check collisions
      checkProjectileCollisions(p);

      // Remove dead entities
      gameState.entities = gameState.entities.filter(e => !e.isDead());
      gameState.enemies = gameState.enemies.filter(e => !e.isDead());

      // Remove off-screen projectiles
      gameState.projectiles = gameState.projectiles.filter(
        proj => !proj.isOffScreen(CANVAS_WIDTH, CANVAS_HEIGHT)
      );

      // Check if room is cleared
      if (gameState.enemies.every(e => !e.isAlive()) && !gameState.roomCleared) {
        gameState.roomCleared = true;
        gameState.availableUpgrades = generateUpgradeChoices();
        gameState.selectedUpgradeIndex = 0;
        gameState.gamePhase = GAME_PHASES.UPGRADE_SELECTION;

        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }

      // Check game over
      if (gameState.player && !gameState.player.isAlive()) {
        gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
        updateHighScore();

        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (gameState.gamePhase === GAME_PHASES.LEVEL_TRANSITION) {
      gameState.levelTransitionTimer--;
      if (gameState.levelTransitionTimer <= 0) {
        loadRoom(gameState.currentLevel, gameState.currentRoom);
        gameState.gamePhase = GAME_PHASES.UPGRADE_SELECTION;

        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }

  function updateHighScore() {
    if (gameState.score > gameState.highScore) {
      gameState.highScore = gameState.score;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('dungeonDasherHighScore', gameState.highScore.toString());
      }
    }
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Expose getGameState function
window.getGameState = function() {
  return gameState;
};

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
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : 
                                           mode === 'TEST_1' ? 'test_1_ModeBtn' : 
                                           'test_2_ModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};