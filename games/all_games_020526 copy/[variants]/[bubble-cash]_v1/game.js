// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, SHOOTER_Y } from './globals.js';
import { createShooter, generateNextBubble, drawAimingGuide } from './shooter.js';
import { initializeLevel, calculateShotBonus } from './levels.js';
import { checkProjectileCollision, checkLoseCondition, checkWinCondition } from './collision.js';
import { drawUI, drawStartScreen, drawPausedIndicator, drawGameOverScreen, drawLevelTransition } from './ui.js';
import { handleKeyPressed, handleContinuousInput, restartGame, startNewGameAutomatically } from './input.js'; // Import startNewGameAutomatically

const p5 = window.p5;

let gameInstance = new p5(p => {
  let initialized = false;

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

    // Initialize game state
    gameState.player = createShooter();
    gameState.entities = [];

    initialized = true;

    // Log initial state
    p.logs.game_info.push({
      data: { event: 'game_initialized', gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    p.background(20, 30, 50);

    if (!initialized) return;

    // Handle game phases
    if (gameState.gamePhase === 'START') {
      drawStartScreen(p);
    } else if (gameState.gamePhase === 'PLAYING') {
      updatePlayingPhase(p);
      renderPlayingPhase(p);
    } else if (gameState.gamePhase === 'PAUSED') {
      renderPlayingPhase(p);
      drawPausedIndicator(p);
    } else if (gameState.gamePhase === 'LEVEL_TRANSITION') {
      updateLevelTransition(p);
      drawLevelTransition(p);
    } else if (gameState.gamePhase === 'GAME_OVER_WIN') {
      drawGameOverScreen(p, true);
      // Auto-restart logic for GAME_OVER_WIN
      if (!gameState.autoRestartScheduled) {
        gameState.autoRestartScheduled = true;
        gameState.autoRestartTimeoutId = setTimeout(() => {
          startNewGameAutomatically(p); // Call the new auto-restart function
        }, 1000); // 1 second delay
      }
    } else if (gameState.gamePhase === 'GAME_OVER_LOSE') {
      drawGameOverScreen(p, false);
      // Auto-restart logic for GAME_OVER_LOSE
      if (!gameState.autoRestartScheduled) {
        gameState.autoRestartScheduled = true;
        gameState.autoRestartTimeoutId = setTimeout(() => {
          startNewGameAutomatically(p); // Call the new auto-restart function
        }, 1000); // 1 second delay
      }
    }
  };

  function updatePlayingPhase(p) {
    // Initialize level if needed
    if (gameState.bubbleGrid.length === 0) {
      initializeLevel(gameState.currentLevel, p);
    }

    // Generate bubbles if needed
    if (!gameState.projectileBubble && gameState.canFire) {
      gameState.projectileBubble = generateNextBubble(p);
    }
    if (!gameState.nextBubble) {
      gameState.nextBubble = generateNextBubble(p);
    }

    // Handle input
    handleContinuousInput(p);
    // Removed: executeTestAction(p);

    // Update bubbles
    gameState.bubbleGrid = gameState.bubbleGrid.filter(bubble => {
      const shouldRemove = bubble.update();
      return !shouldRemove;
    });

    // Update projectiles
    for (let i = gameState.entities.length - 1; i >= 0; i--) {
      const projectile = gameState.entities[i];
      if (projectile.active) {
        projectile.x += projectile.vx * projectile.speed;
        projectile.y += projectile.vy * projectile.speed;

        // Wall bouncing
        if (projectile.x - projectile.radius < 0) {
          projectile.x = projectile.radius;
          projectile.vx = Math.abs(projectile.vx);
        }
        if (projectile.x + projectile.radius > CANVAS_WIDTH) {
          projectile.x = CANVAS_WIDTH - projectile.radius;
          projectile.vx = -Math.abs(projectile.vx);
        }

        // Check collisions
        if (checkProjectileCollision(projectile, p)) {
          gameState.entities.splice(i, 1);
          gameState.canFire = true;

          // Generate new next bubble
          if (!gameState.nextBubble) {
            gameState.nextBubble = generateNextBubble(p);
          }
        }
      }
    }

    // Check win/lose conditions
    if (checkLoseCondition()) {
      transitionToGameOver(false, p);
      return;
    }

    // Check shot limit lose condition
    // We lose if no shots remaining, no active projectiles, and no bubbles currently popping/falling
    const isGridStable = gameState.bubbleGrid.every(b => !b.popping && !b.falling);
    if (gameState.shotsRemaining <= 0 && gameState.entities.length === 0 && isGridStable && gameState.bubbleGrid.length > 0) {
      transitionToGameOver(false, p);
      return;
    }

    if (checkWinCondition() && gameState.bubbleGrid.length === 0) {
      // Add shot bonus
      const bonus = calculateShotBonus();
      gameState.score += bonus;

      // Check if more levels
      if (gameState.currentLevel < 9) {
        transitionToNextLevel(p);
      } else {
        transitionToGameOver(true, p);
      }
    }

    // Log player info periodically
    if (p.frameCount % 30 === 0 && gameState.player) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
  }

  function renderPlayingPhase(p) {
    // Draw lose line
    p.push();
    p.stroke(255, 0, 0, 50);
    p.strokeWeight(2);
    p.line(0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, CANVAS_HEIGHT - 100);
    p.pop();

    // Draw bubbles
    for (const bubble of gameState.bubbleGrid) {
      bubble.draw(p);
    }

    // Draw projectiles
    for (const projectile of gameState.entities) {
      if (projectile.active) {
        p.push();
        p.fill(...projectile.color);
        p.stroke(255, 255, 255, 200);
        p.strokeWeight(2);
        p.ellipse(projectile.x, projectile.y, projectile.radius * 2);
        p.pop();
      }
    }

    // Draw shooter
    if (gameState.player) {
      drawAimingGuide(gameState.player, p);
      gameState.player.draw(p);
    }

    // Draw current and next bubbles
    if (gameState.projectileBubble) {
      gameState.projectileBubble.x = CANVAS_WIDTH / 2;
      gameState.projectileBubble.y = SHOOTER_Y;
      gameState.projectileBubble.draw(p);
    }

    if (gameState.nextBubble) {
      gameState.nextBubble.x = CANVAS_WIDTH / 2 + 60;
      gameState.nextBubble.y = SHOOTER_Y;
      p.push();
      p.scale(0.7);
      p.translate((CANVAS_WIDTH / 2 + 60) * 0.3 / 0.7, SHOOTER_Y * 0.3 / 0.7);
      gameState.nextBubble.draw(p);
      p.pop();

      // Draw "NEXT" label
      p.push();
      p.fill(255);
      p.textSize(12);
      p.textAlign(p.CENTER, p.TOP);
      p.noStroke();
      p.text('NEXT', CANVAS_WIDTH / 2 + 60, SHOOTER_Y + 30);
      p.pop();
    }

    // Draw UI
    drawUI(p);
  }

  function transitionToNextLevel(p) {
    gameState.gamePhase = 'LEVEL_TRANSITION';
    gameState.currentLevel++;
    gameState.transitionTimer = p.millis();
    gameState.bubbleGrid = [];
    gameState.entities = [];

    p.logs.game_info.push({
      data: { event: 'level_complete', level: gameState.currentLevel - 1, score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function updateLevelTransition(p) {
    if (p.millis() - gameState.transitionTimer > 3000) {
      gameState.gamePhase = 'PLAYING';
      initializeLevel(gameState.currentLevel, p);
    }
  }

  function transitionToGameOver(isWin, p) {
    gameState.gamePhase = isWin ? 'GAME_OVER_WIN' : 'GAME_OVER_LOSE';
    gameState.finalScore = gameState.score;
    // Reset auto-restart flags when transitioning to Game Over
    gameState.autoRestartScheduled = false;
    if (gameState.autoRestartTimeoutId) {
      clearTimeout(gameState.autoRestartTimeoutId);
      gameState.autoRestartTimeoutId = null;
    }

    p.logs.game_info.push({
      data: { event: 'game_over', win: isWin, finalScore: gameState.finalScore },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  p.keyPressed = function() {
    handleKeyPressed(p);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;
// Expose level loading for dev mode
window.loadLevel = function(levelNum) {
  const state = window.getGameState(); // getGameState is exposed globally
  if (state) {
    state.currentLevel = levelNum;
    // Try common reset/start patterns
    if (typeof restartGame === 'function') { // Use the comprehensive restartGame
      restartGame(window.gameInstance); // Pass the p5 instance
    } else if (typeof startGame === 'function') {
      startGame(window.gameInstance);
    } else if (state.gamePhase !== undefined) {
      state.gamePhase = "PLAYING";
    }
  }
};

// Control mode setter (simplified as only HUMAN mode remains)
window.setControlMode = function(mode) {
  // Since only "HUMAN" mode remains, we simply ensure the button is active.
  // The mode parameter can still be used for consistency if other modes are added later.
  gameState.controlMode = mode;

  const humanModeBtn = document.getElementById('humanModeBtn');
  if (humanModeBtn) {
    humanModeBtn.classList.add('active');
  }
};