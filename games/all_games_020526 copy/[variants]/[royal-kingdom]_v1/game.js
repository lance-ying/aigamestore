// game.js - Main game file
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { initializeLevel, findMatches, clearMatches, applyGravity, refillBoard, 
         removeMarkedTiles, checkObjectivesComplete, isStable } from './boardLogic.js';
import { handleKeyPressed, setupControlMode } from './input.js';
import { renderStartScreen, renderGame, renderGameOver } from './rendering.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };

  // Renamed: Function to fully reset the game to the start screen (used by 'R' key)
  p.resetGameToStartScreen = function() {
    // Clear any pending auto-restart
    clearTimeout(gameState.autoRestartTimeoutId);
    gameState.autoRestartScheduled = false;
    gameState.autoRestartTimeoutId = null;

    gameState.gamePhase = 'START';
    gameState.currentLevel = 1; // Reset to level 1 for full restart
    gameState.totalScore = 0; // Reset total score for full restart
    initializeLevel(gameState.currentLevel, p); // Re-initialize level 1
    
    p.logs.game_info.push({
      data: { phase: 'START', action: 'game_reset_to_start_screen' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.randomSeed(42);
    p.frameRate(60);
    
    // Initialize control mode
    setupControlMode();
    
    // Initialize first level
    initializeLevel(1, p);
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: 'START', level: 1 },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Render based on phase
    if (gameState.gamePhase === 'START') {
      renderStartScreen(p);
    } else if (gameState.gamePhase === 'PLAYING' || gameState.gamePhase === 'PAUSED') {
      // Update entities
      gameState.entities.forEach(tile => tile.update());
      
      // Handle animations and cascades
      if (gameState.isAnimating) {
        handleAnimations(p);
      }
      
      // Check win/lose conditions
      if (!gameState.isAnimating && gameState.movesRemaining === 0 && !checkObjectivesComplete()) {
        gameState.gamePhase = 'GAME_OVER_LOSE';
        p.logs.game_info.push({
          data: { phase: 'GAME_OVER_LOSE', finalScore: gameState.score },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (!gameState.isAnimating && checkObjectivesComplete() && gameState.movesRemaining >= 0) {
        // Add bonus
        const bonus = gameState.movesRemaining * 20;
        gameState.score += bonus;
        
        if (gameState.currentLevel < 5) {
          gameState.gamePhase = 'GAME_OVER_WIN';
          p.logs.game_info.push({
            data: { phase: 'GAME_OVER_WIN', finalScore: gameState.score, level: gameState.currentLevel },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        } else {
          gameState.gamePhase = 'GAME_OVER_WIN';
          gameState.totalScore += gameState.score;
          p.logs.game_info.push({
            data: { phase: 'GAME_OVER_WIN', finalScore: gameState.score, totalScore: gameState.totalScore },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      }
      
      renderGame(p);
    } else if (gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE') {
      renderGameOver(p);

      // Auto-restart logic: Only auto-restart if game lost, or if all levels complete.
      // If win and not final level, player should press ENTER to advance.
      if (!gameState.autoRestartScheduled) {
        let restartAction = null;
        if (gameState.gamePhase === 'GAME_OVER_LOSE') {
          restartAction = () => {
            gameState.gamePhase = 'PLAYING'; // Go directly to playing
            initializeLevel(gameState.currentLevel, p); // Restart current level
            p.logs.game_info.push({
              data: { phase: 'PLAYING', level: gameState.currentLevel, action: 'auto_restart_level_lost' },
              framecount: p.frameCount,
              timestamp: Date.now()
            });
          };
        } else if (gameState.gamePhase === 'GAME_OVER_WIN' && gameState.currentLevel === 5) {
          restartAction = () => {
            gameState.gamePhase = 'PLAYING'; // Go directly to playing
            gameState.currentLevel = 1; // Restart from level 1
            gameState.totalScore = 0; // Reset total score for a new game
            initializeLevel(gameState.currentLevel, p);
            p.logs.game_info.push({
              data: { phase: 'PLAYING', level: 1, action: 'auto_restart_game_complete' },
              framecount: p.frameCount,
              timestamp: Date.now()
            });
          };
        }

        if (restartAction) {
          gameState.autoRestartScheduled = true;
          gameState.autoRestartTimeoutId = setTimeout(() => {
            // Clear flags inside the timeout callback to ensure it's cleared even if another event cancels it
            clearTimeout(gameState.autoRestartTimeoutId);
            gameState.autoRestartScheduled = false;
            gameState.autoRestartTimeoutId = null;
            restartAction(); // Execute the determined restart action
          }, 1000); // 1 second delay
        }
      }
    }
    
    // Log player info periodically
    if (p.frameCount % 60 === 0 && gameState.gamePhase === 'PLAYING') {
      p.logs.player_info.push({
        screen_x: gameState.cursorX,
        screen_y: gameState.cursorY,
        game_x: gameState.cursorX,
        game_y: gameState.cursorY,
        framecount: p.frameCount
      });
    }
  };

  function handleAnimations(p) {
    // Remove marked tiles that are fully faded
    removeMarkedTiles();
    
    // Check if all animations are done
    if (isStable()) {
      // Apply gravity
      const moved = applyGravity();
      if (moved) {
        return; // Wait for gravity to settle
      }
      
      // Refill board
      const refilled = refillBoard(p);
      if (refilled) {
        return; // Wait for new tiles to settle
      }
      
      // Check for new matches (cascades)
      const matches = findMatches();
      if (matches.length > 0) {
        gameState.comboMultiplier += 0.25;
        clearMatches(matches, p);
        return;
      }
      
      // No more matches, animation complete
      gameState.isAnimating = false;
      gameState.comboMultiplier = 1.0;
    }
  }

  p.keyPressed = function() {
    handleKeyPressed(p);
    return false; // Prevent default
  };
}, document.body);

// Expose game instance and state getter
window.gameInstance = gameInstance;
// Expose level loading for dev mode
window.loadLevel = function(levelNum) {
  const state = window.getGameState ? window.getGameState() : (window.gameState || (window.gameInstance && window.gameInstance.gameState));
  if (state) {
    // Clear any pending auto-restart
    clearTimeout(state.autoRestartTimeoutId);
    state.autoRestartScheduled = false;
    state.autoRestartTimeoutId = null;

    state.currentLevel = levelNum;
    state.gamePhase = "PLAYING"; // Go directly to playing
    state.totalScore = 0; // Reset total score when loading a level via dev tools
    initializeLevel(levelNum, gameInstance); // Initialize the specified level
    gameInstance.logs.game_info.push({
      data: { phase: 'PLAYING', level: levelNum, action: 'dev_load_level' },
      framecount: gameInstance.frameCount,
      timestamp: Date.now()
    });
  }
};
window.getGameState = function() {
  return gameState;
};

// Handle game over for level progression
document.addEventListener('keydown', (e) => {
  if (gameState.gamePhase === 'GAME_OVER_WIN' && e.keyCode === 13 && gameState.currentLevel < 5) {
    // New: Clear any pending auto-restart if user presses ENTER to go to next level
    clearTimeout(gameState.autoRestartTimeoutId);
    gameState.autoRestartScheduled = false;
    gameState.autoRestartTimeoutId = null;

    // ENTER to next level
    gameState.currentLevel++;
    initializeLevel(gameState.currentLevel, gameInstance);
    gameState.gamePhase = 'PLAYING';
    gameInstance.logs.game_info.push({
      data: { phase: 'PLAYING', level: gameState.currentLevel },
      framecount: gameInstance.frameCount,
      timestamp: Date.now()
    });
  }
});