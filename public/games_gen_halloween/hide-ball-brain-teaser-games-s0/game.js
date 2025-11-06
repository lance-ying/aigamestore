// game.js
const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies, Body, Events } = Matter;

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  FPS,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE
} from './globals.js';

import { 
  GoodBall, 
  MonsterBall, 
  MovableBlock, 
  Wall 
} from './entities.js';

import { setupCollisionHandling } from './physics.js';
import { loadLevel } from './levels.js';
import { handlePlayerControls, handleTestMode } from './controls.js';
import { 
  renderStartScreen, 
  renderPausedOverlay, 
  renderGameOver, 
  renderUI 
} from './ui.js';

let gameInstance = new p5(p => {
  let engine, world;

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(FPS);
    p.randomSeed(42);

    // Create Matter.js engine and world
    engine = Engine.create();
    world = engine.world;
    world.gravity.y = 0.5;

    gameState.engine = engine;
    gameState.world = world;

    // Initialize p5.logs
    p.logs = {
      game_info: [],
      player_info: [],
      inputs: []
    };

    // Log initial game state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Setup collision handling
    setupCollisionHandling();

    // Load first level
    loadLevel(p, gameState.level);
  };

  p.draw = function() {
    // Update Matter.js physics engine only when playing
    if (gameState.gamePhase === PHASE_PLAYING) {
      Engine.update(engine, 1000 / 60);
    }

    // Update game logic based on game phase
    switch (gameState.gamePhase) {
      case PHASE_START:
        renderStartScreen(p);
        break;
      case PHASE_PLAYING:
        updateGame(p);
        renderGame(p);
        break;
      case PHASE_PAUSED:
        renderGame(p);
        renderPausedOverlay(p);
        break;
      case PHASE_GAME_OVER_WIN:
      case PHASE_GAME_OVER_LOSE:
        renderGameOver(p);
        break;
    }
  };

  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Handle phase controls
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === PHASE_START) {
        gameState.gamePhase = PHASE_PLAYING;
        p.logs.game_info.push({
          data: { gamePhase: PHASE_PLAYING },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
        // Next level
        gameState.level++;
        gameState.score += 100;
        loadLevel(p, gameState.level);
        gameState.gamePhase = PHASE_PLAYING;
        p.logs.game_info.push({
          data: { gamePhase: PHASE_PLAYING, level: gameState.level },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }

    if (p.keyCode === 27) { // ESC - Pause/Unpause
      if (gameState.gamePhase === PHASE_PLAYING) {
        gameState.gamePhase = PHASE_PAUSED;
        p.logs.game_info.push({
          data: { gamePhase: PHASE_PAUSED },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === PHASE_PAUSED) {
        gameState.gamePhase = PHASE_PLAYING;
        p.logs.game_info.push({
          data: { gamePhase: PHASE_PLAYING },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }

    if (p.keyCode === 82) { // R - Restart
      if (gameState.gamePhase === PHASE_GAME_OVER_WIN ||
          gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
        resetGame(p);
        gameState.gamePhase = PHASE_START;
        p.logs.game_info.push({
          data: { gamePhase: PHASE_START },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }

    // Space to select/deselect block
    if (p.keyCode === 32) { // SPACE
      if (gameState.gamePhase === PHASE_PLAYING && !gameState.monsterActivated) {
        if (gameState.selectedBlock) {
          gameState.selectedBlock.deselect();
          gameState.selectedBlock = null;
        } else if (gameState.movableBlocks.length > 0) {
          // Select next available block
          let nextBlock = null;
          for (let block of gameState.movableBlocks) {
            if (!block.isSelected) {
              nextBlock = block;
              break;
            }
          }
          if (!nextBlock) {
            nextBlock = gameState.movableBlocks[0];
          }
          gameState.selectedBlock = nextBlock;
          gameState.selectedBlock.select();
        }
      }
    }

    return false; // Prevent default
  };

  function updateGame(p) {
    // Handle test mode
    if (gameState.controlMode !== "HUMAN") {
      handleTestMode(p);
    } else {
      // Handle player controls
      handlePlayerControls(p);
    }

    // Check if moves exhausted and activate monsters
    if (gameState.movesRemaining <= 0 && !gameState.monsterActivated) {
      activateMonsters();
    }

    // Update monster activation timer
    if (gameState.monsterActivated) {
      gameState.monsterActivationTimer++;
      
      const secondsElapsed = gameState.monsterActivationTimer / 60;
      if (secondsElapsed >= gameState.monsterActivationDuration) {
        // Check win condition
        checkWinCondition();
      }
    }

    // Update entities
    gameState.entities.forEach(entity => {
      if (entity.update) {
        entity.update();
      }
      if (entity instanceof MonsterBall && gameState.monsterActivated) {
        entity.updateMovement();
      }
    });
  }

  function renderGame(p) {
    // Background
    p.background(240, 240, 250);
    
    // Draw grid pattern
    p.stroke(220, 220, 230);
    p.strokeWeight(1);
    for (let x = 0; x < CANVAS_WIDTH; x += 20) {
      p.line(x, 0, x, CANVAS_HEIGHT);
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 20) {
      p.line(0, y, CANVAS_WIDTH, y);
    }

    // Render all entities
    gameState.entities.forEach(entity => {
      if (entity.render) {
        entity.render();
      }
    });

    // Render UI
    renderUI(p);
  }

  function activateMonsters() {
    gameState.monsterActivated = true;
    gameState.monsterActivationTimer = 0;
    
    gameState.monsterBalls.forEach(monster => {
      monster.activate();
    });
    
    p.logs.game_info.push({
      data: { event: "monsters_activated" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function checkWinCondition() {
    const allGoodBallsSafe = gameState.goodBalls.every(ball => ball.isAlive);
    
    if (allGoodBallsSafe) {
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
      gameState.score += 50 + (gameState.movesRemaining * 5);
      p.logs.game_info.push({
        data: { gamePhase: PHASE_GAME_OVER_WIN, score: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  function resetGame(p) {
    // Clear Matter.js world
    World.clear(world, false);
    Engine.clear(engine);
    
    // Reset game state
    gameState.level = 1;
    gameState.score = 0;
    gameState.movesRemaining = 0;
    gameState.maxMoves = 0;
    gameState.monsterActivated = false;
    gameState.monsterActivationTimer = 0;
    gameState.selectedBlock = null;
    gameState.entities = [];
    gameState.goodBalls = [];
    gameState.monsterBalls = [];
    gameState.movableBlocks = [];
    gameState.walls = [];
    
    // Setup collision handling again
    setupCollisionHandling();
    
    // Load first level
    loadLevel(p, gameState.level);
  }
});

// Expose globally
window.gameInstance = gameInstance;

// Control mode switching
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