// game.js - Main game file
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { Player } from './entities.js';
import { loadLevel } from './levels.js';
import { handleKeyPressed, processPlayerMovement } from './input.js';
import { drawStartScreen, drawPlayingScreen, drawPausedScreen, drawGameOverScreen } from './rendering.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Game variables
  let lastLoggedFrame = 0;

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

    // Log initial state
    p.logs.game_info.push({
      data: { phase: PHASE_START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Single background call at the top
    p.background(135, 206, 235);

    // Process automated testing
    if (gameState.controlMode !== 'HUMAN' && gameState.gamePhase === PHASE_PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action && action.keys) {
        action.keys.forEach(keyCode => {
          simulateKeyPress(p, keyCode);
        });
      }
    }

    // Update game state
    if (gameState.gamePhase === PHASE_PLAYING) {
      updateGame(p);
    }

    // Render appropriate screen
    if (gameState.gamePhase === PHASE_START) {
      drawStartScreen(p);
    } else if (gameState.gamePhase === PHASE_PLAYING) {
      drawPlayingScreen(p);
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      drawPausedScreen(p);
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      drawGameOverScreen(p);
    }

    // Log player info periodically
    if (gameState.player && p.frameCount % 30 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
  };

  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
  };

  function updateGame(p) {
    if (gameState.puzzleActive) {
      // Don't update game entities during puzzle
      return;
    }

    // Process player movement
    processPlayerMovement(p);

    // Update player
    if (gameState.player) {
      gameState.player.update(p);
    }

    // Update entities
    gameState.entities.forEach(entity => {
      if (entity !== gameState.player && entity.update) {
        entity.update(p);
      }
    });

    // Update hazards
    gameState.hazards.forEach(hazard => {
      hazard.update(p);
    });

    // Update collectibles
    gameState.collectibles.forEach(collectible => {
      collectible.update(p);
    });

    // Update chests
    gameState.chests.forEach(chest => {
      chest.update(p);
    });

    // Check game over conditions
    if (gameState.health <= 0) {
      gameState.gamePhase = PHASE_GAME_OVER_LOSE;
      p.logs.game_info.push({
        data: { phase: PHASE_GAME_OVER_LOSE, finalScore: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }

    // Check win condition
    if (gameState.sacredStones >= gameState.totalStones) {
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
      p.logs.game_info.push({
        data: { phase: PHASE_GAME_OVER_WIN, finalScore: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  function simulateKeyPress(p, keyCode) {
    if (gameState.gamePhase !== PHASE_PLAYING || !gameState.player) return;

    if (gameState.puzzleActive && gameState.mathPuzzle) {
      // Handle puzzle controls
      if (keyCode === 37 || keyCode === 38) {
        gameState.mathPuzzle.selectedOption = Math.max(0, gameState.mathPuzzle.selectedOption - 1);
      } else if (keyCode === 39 || keyCode === 40) {
        gameState.mathPuzzle.selectedOption = Math.min(3, gameState.mathPuzzle.selectedOption + 1);
      } else if (keyCode === 32) {
        if (!gameState.mathPuzzle.answered) {
          gameState.mathPuzzle.submitAnswer();
        }
      } else if (keyCode === 90) {
        if (gameState.mathPuzzle.answered) {
          if (gameState.mathPuzzle.correct) {
            gameState.puzzleActive = false;
            gameState.mathPuzzle = null;
            checkLevelComplete(p);
          } else {
            const MathPuzzle = require('./mathPuzzle.js');
            gameState.mathPuzzle = MathPuzzle.createMathPuzzle(gameState.currentLevel);
          }
        }
      }
    } else {
      // Handle gameplay controls
      const player = gameState.player;
      
      if (keyCode === 37) player.moveLeft();
      if (keyCode === 39) player.moveRight();
      if (keyCode === 38) player.jump();
      if (keyCode === 16) player.sprinting = true;
      
      if (keyCode === 90) {
        gameState.chests.forEach(chest => {
          if (chest.open()) {
            const MathPuzzle = require('./mathPuzzle.js');
            gameState.mathPuzzle = MathPuzzle.createMathPuzzle(gameState.currentLevel);
            gameState.puzzleActive = true;
          }
        });
      }
    }
  }

  function checkLevelComplete(p) {
    if (gameState.currentLevel < 5) {
      gameState.currentLevel++;
      const levelData = loadLevel(gameState.currentLevel);
      initializeLevel(p, levelData);
    } else {
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
      p.logs.game_info.push({
        data: { phase: PHASE_GAME_OVER_WIN, finalScore: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  function initializeLevel(p, levelData) {
    gameState.player = new Player(levelData.spawnX, levelData.spawnY);
    gameState.entities = [gameState.player];
    gameState.platforms = levelData.platforms;
    gameState.hazards = levelData.hazards;
    gameState.collectibles = levelData.collectibles;
    gameState.chests = levelData.chests;
    gameState.levelComplete = false;
    
    levelData.enemies.forEach(enemy => {
      gameState.entities.push(enemy);
    });
  }
});

// Expose globally
window.gameInstance = gameInstance;