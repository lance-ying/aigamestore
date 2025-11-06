// game.js - Main game file

import { gameState, GAME_PHASE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { LEVELS } from './levels.js';
import { loadLevel, updateLevel } from './levelManager.js';
import { checkCollisions } from './collision.js';
import { handleKeyPress } from './input.js';
import { renderGame, renderStartScreen, renderGameOverScreen, renderLevelCompleteScreen } from './rendering.js';
import { getTestAction } from './testController.js';

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
    p.frameRate(60);
    p.randomSeed(42);

    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN") {
      const action = getTestAction(p);
      if (action) {
        handleKeyPress(p, action.key, action.keyCode);
      }
    }

    // Render based on game phase
    if (gameState.gamePhase === GAME_PHASE.START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASE.PLAYING) {
      // Update game
      const level = LEVELS[gameState.currentLevel];
      gameState.player.update(level.speed);
      
      // Update obstacles
      for (const obstacle of gameState.obstacles) {
        obstacle.update();
      }
      
      // Update particles
      gameState.particles = gameState.particles.filter(particle => {
        particle.update();
        return !particle.isDead();
      });
      
      // Update tap feedback
      gameState.tapFeedback = gameState.tapFeedback.filter(feedback => {
        feedback.update();
        return !feedback.isDead();
      });
      
      // Add segment points
      if (p.frameCount % 10 === 0) {
        gameState.score += 10;
        gameState.levelScore += 10;
      }
      
      // Check collisions
      checkCollisions(p);
      
      // Update level
      updateLevel(p);
      
      // Log player info
      if (p.frameCount % 10 === 0) {
        p.logs.player_info.push({
          screen_x: gameState.player.x - gameState.cameraOffset,
          screen_y: gameState.player.y,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          framecount: p.frameCount
        });
      }
      
      // Render
      renderGame(p);
    } else if (gameState.gamePhase === GAME_PHASE.PAUSED) {
      renderGame(p);
    } else if (gameState.gamePhase === GAME_PHASE.GAME_OVER_WIN || 
               gameState.gamePhase === GAME_PHASE.GAME_OVER_LOSE) {
      renderGame(p);
      renderGameOverScreen(p);
    } else if (gameState.gamePhase === GAME_PHASE.LEVEL_COMPLETE) {
      renderGame(p);
      renderLevelCompleteScreen(p);
    }
  };

  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPress(p, p.key, p.keyCode);
    }
    return false;
  };
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
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : 
                                           mode === 'TEST_1' ? 'test_1_ModeBtn' : 
                                           'test_2_ModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};