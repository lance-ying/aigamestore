// game.js - Main game logic
const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies, Body } = Matter;

import { 
  gameState, 
  GAME_PHASES, 
  CONTROL_MODES, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  LEVELS,
  BIN_CONFIG
} from './globals.js';

import { 
  Ball, 
  Peg, 
  MultiplierGate, 
  Bin, 
  Dropper 
} from './entities.js';

import { setupPhysics, createWalls } from './physics.js';

let gameInstance = new p5(p => {
  let dropper;

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);

    // Create Matter.js engine and world
    gameState.engine = Engine.create();
    gameState.world = gameState.engine.world;
    gameState.world.gravity.y = 0.5;

    // Initialize p5.logs
    p.logs = {
      game_info: [],
      player_info: [],
      inputs: []
    };

    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    setupPhysics(p);
    createWalls();
    initializeLevel(p);
  };

  p.draw = function() {
    // Update Matter.js physics engine
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      Engine.update(gameState.engine, 1000 / 60);
    }

    // Handle automated testing
    if (gameState.gamePhase === GAME_PHASES.PLAYING && 
        gameState.controlMode !== CONTROL_MODES.HUMAN) {
      handleAutomatedTesting(p);
    }

    // Update game logic based on game phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
      case GAME_PHASES.PLAYING:
        updateGame(p);
        renderGame(p);
        break;
      case GAME_PHASES.PAUSED:
        renderGame(p);
        renderPausedOverlay(p);
        break;
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOver(p);
        break;
    }
  };

  p.keyPressed = function() {
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Phase controls
    if (p.keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }

    if (p.keyCode === 27) {
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        p.logs.game_info.push({
          data: { gamePhase: GAME_PHASES.PAUSED },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { gamePhase: GAME_PHASES.PLAYING },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }

    if (p.keyCode === 82) {
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ||
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        resetGame(p);
        gameState.gamePhase = GAME_PHASES.START;
        p.logs.game_info.push({
          data: { gamePhase: GAME_PHASES.START },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }

    // Gameplay controls
    if (gameState.gamePhase === GAME_PHASES.PLAYING && 
        gameState.controlMode === CONTROL_MODES.HUMAN) {
      handlePlayerInput(p);
    }

    return false;
  };

  function handlePlayerInput(p) {
    if (p.keyCode === 37) { // LEFT
      gameState.dropperX = Math.max(50, gameState.dropperX - 10);
    } else if (p.keyCode === 39) { // RIGHT
      gameState.dropperX = Math.min(CANVAS_WIDTH - 50, gameState.dropperX + 10);
    } else if (p.keyCode === 32) { // SPACE
      dropBall(p);
    }
  }

  function handleAutomatedTesting(p) {
    gameState.testFrameCounter++;

    switch (gameState.controlMode) {
      case CONTROL_MODES.TEST_1:
        // Basic testing - drop balls at regular intervals from different positions
        if (gameState.testFrameCounter % 90 === 0 && gameState.dropsRemaining > 0) {
          const positions = [150, 250, 350, 450];
          gameState.dropperX = positions[gameState.testFrameCounter % positions.length];
          dropBall(p);
        }
        break;

      case CONTROL_MODES.TEST_2:
        // Win test - rapidly drop balls targeting multipliers
        if (gameState.testFrameCounter % 30 === 0 && gameState.dropsRemaining > 0) {
          if (gameState.multiplierGates.length > 0) {
            const gate = gameState.multiplierGates[gameState.testFrameCounter % gameState.multiplierGates.length];
            gameState.dropperX = gate.x;
          }
          dropBall(p);
        }
        break;

      case CONTROL_MODES.TEST_3:
        // Multiplier testing - target multiplier gates specifically
        if (gameState.testFrameCounter % 60 === 0 && gameState.dropsRemaining > 0) {
          if (gameState.multiplierGates.length > 0) {
            const gate = gameState.multiplierGates[0];
            gameState.dropperX = gate.x;
            dropBall(p);
          }
        }
        break;

      case CONTROL_MODES.TEST_4:
        // Game over test - use all drops without scoring
        if (gameState.testFrameCounter % 45 === 0 && gameState.dropsRemaining > 0) {
          gameState.dropperX = 60; // Target lowest value bin
          dropBall(p);
        }
        break;

      case CONTROL_MODES.TEST_5:
        // Pause test - pause and unpause periodically
        if (gameState.testFrameCounter % 120 === 0) {
          if (gameState.dropsRemaining > 0) {
            gameState.dropperX = 300;
            dropBall(p);
          }
        }
        if (gameState.testFrameCounter % 180 === 60) {
          gameState.gamePhase = GAME_PHASES.PAUSED;
          gameState.pauseTestFrames = 60;
        }
        if (gameState.gamePhase === GAME_PHASES.PAUSED) {
          gameState.pauseTestFrames--;
          if (gameState.pauseTestFrames <= 0) {
            gameState.gamePhase = GAME_PHASES.PLAYING;
          }
        }
        break;

      case CONTROL_MODES.TEST_6:
        // Bin scoring test - target each bin specifically
        if (gameState.testFrameCounter % 90 === 0 && gameState.dropsRemaining > 0) {
          const binPositions = BIN_CONFIG.map(b => b.x + b.width / 2);
          gameState.dropperX = binPositions[gameState.testFrameCounter % binPositions.length];
          dropBall(p);
        }
        break;

      case CONTROL_MODES.TEST_7:
        // Edge case testing - extreme positions and rapid drops
        if (gameState.testFrameCounter % 40 === 0 && gameState.dropsRemaining > 0) {
          gameState.dropperX = gameState.testFrameCounter % 80 === 0 ? 50 : CANVAS_WIDTH - 50;
          dropBall(p);
        }
        break;
    }
  }

  function initializeLevel(p) {
    dropper = new Dropper(p);
    
    const levelData = LEVELS[gameState.currentLevel - 1];
    gameState.targetScore = levelData.targetScore;
    gameState.dropsRemaining = levelData.drops;

    // Create pegs
    levelData.pegs.forEach(pegData => {
      const peg = new Peg(
        p, 
        pegData.x, 
        pegData.y, 
        pegData.radius, 
        pegData.moving || false,
        pegData.moveRange || 0,
        pegData.moveSpeed || 0
      );
      gameState.pegs.push(peg);
      gameState.entities.push(peg);
    });

    // Create multiplier gates
    levelData.multipliers.forEach(multData => {
      const gate = new MultiplierGate(
        p,
        multData.x,
        multData.y,
        multData.width,
        multData.height,
        multData.value
      );
      gameState.multiplierGates.push(gate);
      gameState.entities.push(gate);
    });

    // Create bins
    BIN_CONFIG.forEach(binData => {
      const bin = new Bin(p, binData.x, binData.width, binData.value, binData.color);
      gameState.bins.push(bin);
      gameState.entities.push(bin);
    });
  }

  function dropBall(p) {
    if (gameState.dropsRemaining > 0) {
      const ball = new Ball(p, gameState.dropperX, 30);
      gameState.balls.push(ball);
      gameState.entities.push(ball);
      gameState.dropsRemaining--;
      gameState.ballsInPlay++;

      p.logs.player_info.push({
        screen_x: ball.body.position.x,
        screen_y: ball.body.position.y,
        game_x: ball.body.position.x,
        game_y: ball.body.position.y,
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  function updateGame(p) {
    // Update all entities
    gameState.entities.forEach(entity => {
      if (entity.update) {
        entity.update();
      }
    });

    // Check win condition
    if (gameState.score >= gameState.targetScore && 
        gameState.ballsInPlay === 0 && 
        !gameState.levelComplete) {
      gameState.levelComplete = true;
      
      if (gameState.currentLevel < LEVELS.length) {
        // Move to next level
        setTimeout(() => {
          gameState.currentLevel++;
          clearLevel(p);
          initializeLevel(p);
          gameState.levelComplete = false;
        }, 1000);
      } else {
        // All levels complete
        gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
        p.logs.game_info.push({
          data: { gamePhase: GAME_PHASES.GAME_OVER_WIN, finalScore: gameState.score },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }

    // Check lose condition
    if (gameState.dropsRemaining === 0 && 
        gameState.ballsInPlay === 0 && 
        gameState.score < gameState.targetScore) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.GAME_OVER_LOSE, finalScore: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }

    dropper.update();
  }

  function clearLevel(p) {
    // Remove all balls
    gameState.balls.forEach(ball => {
      World.remove(gameState.world, ball.body);
    });
    gameState.balls = [];

    // Remove all pegs
    gameState.pegs.forEach(peg => {
      World.remove(gameState.world, peg.body);
    });
    gameState.pegs = [];

    // Remove all multiplier gates
    gameState.multiplierGates.forEach(gate => {
      World.remove(gameState.world, gate.body);
    });
    gameState.multiplierGates = [];

    // Remove all bins
    gameState.bins.forEach(bin => {
      World.remove(gameState.world, [bin.leftWall, bin.rightWall, bin.bottom]);
    });
    gameState.bins = [];

    gameState.entities = [];
    
    // CRITICAL FIX: Reset ballsInPlay to 0 when clearing level
    gameState.ballsInPlay = 0;
  }

  function renderGame(p) {
    // Background gradient
    for (let y = 0; y < CANVAS_HEIGHT; y++) {
      const inter = p.map(y, 0, CANVAS_HEIGHT, 0, 1);
      const c = p.lerpColor(p.color(20, 30, 60), p.color(60, 40, 80), inter);
      p.stroke(c);
      p.line(0, y, CANVAS_WIDTH, y);
    }

    // Render all entities
    gameState.entities.forEach(entity => {
      if (entity.render) {
        entity.render();
      }
    });

    // Render dropper
    dropper.render();

    // UI
    renderUI(p);
  }

  function renderUI(p) {
    // Score panel - moved to right side to avoid covering pegs
    p.fill(0, 0, 0, 150);
    p.noStroke();
    p.rect(CANVAS_WIDTH - 210, 10, 200, 100, 5);

    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(14);
    p.textStyle(p.BOLD);
    p.text(`Level: ${gameState.currentLevel}/${LEVELS.length}`, CANVAS_WIDTH - 200, 20);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 200, 40);
    p.text(`Target: ${gameState.targetScore}`, CANVAS_WIDTH - 200, 60);
    p.text(`Drops: ${gameState.dropsRemaining}`, CANVAS_WIDTH - 200, 80);

    // Balls in play indicator
    if (gameState.ballsInPlay > 0) {
      p.fill(255, 220, 100);
      p.text(`Balls: ${gameState.ballsInPlay}`, CANVAS_WIDTH - 200, 100);
    }

    // Progress bar (also on right side)
    const barWidth = 180;
    const barHeight = 10;
    const progress = Math.min(gameState.score / gameState.targetScore, 1);
    
    p.fill(50, 50, 50);
    p.rect(CANVAS_WIDTH - 200, 120, barWidth, barHeight, 3);
    
    p.fill(100, 255, 100);
    p.rect(CANVAS_WIDTH - 200, 120, barWidth * progress, barHeight, 3);
  }

  function renderStartScreen(p) {
    p.background(20, 30, 60);

    // Title
    p.fill(255, 220, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.textStyle(p.BOLD);
    p.text("BOUNCE & COLLECT", CANVAS_WIDTH / 2, 80);

    // Description
    p.fill(255);
    p.textSize(14);
    p.textStyle(p.NORMAL);
    const desc = [
      "Drop balls from the top to bounce through pegs.",
      "Hit multiplier gates to duplicate your balls!",
      "Land in bins to score points.",
      "Reach the target score to advance levels.",
      "Watch out for moving pegs in later levels!"
    ];
    desc.forEach((line, i) => {
      p.text(line, CANVAS_WIDTH / 2, 140 + i * 25);
    });

    // Controls
    p.fill(200, 200, 255);
    p.textSize(12);
    p.textStyle(p.BOLD);
    p.text("CONTROLS", CANVAS_WIDTH / 2, 270);
    
    p.fill(255);
    p.textSize(11);
    p.textStyle(p.NORMAL);
    const controls = [
      "← → : Move drop position",
      "SPACE: Drop ball",
      "ESC: Pause"
    ];
    controls.forEach((line, i) => {
      p.text(line, CANVAS_WIDTH / 2, 295 + i * 20);
    });

    // Start prompt
    p.fill(255, 255, 100);
    p.textSize(18);
    p.textStyle(p.BOLD);
    const pulse = p.sin(p.frameCount * 0.1) * 20 + 235;
    p.fill(255, pulse, 100);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
  }

  function renderPausedOverlay(p) {
    p.fill(0, 0, 0, 150);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.textStyle(p.BOLD);
    p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

    p.textSize(16);
    p.textStyle(p.NORMAL);
    p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  }

  function renderGameOver(p) {
    p.background(20, 30, 60);

    const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;

    // Title
    p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.textStyle(p.BOLD);
    p.text(isWin ? "YOU WIN!" : "GAME OVER", CANVAS_WIDTH / 2, 100);

    // Score
    p.fill(255);
    p.textSize(24);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
    p.textSize(18);
    p.text(`Level Reached: ${gameState.currentLevel}`, CANVAS_WIDTH / 2, 220);

    // Message
    p.textSize(14);
    if (isWin) {
      p.text("Congratulations! You beat all levels!", CANVAS_WIDTH / 2, 270);
    } else {
      p.text(`You needed ${gameState.targetScore} points to advance.`, CANVAS_WIDTH / 2, 270);
      p.text("Better luck next time!", CANVAS_WIDTH / 2, 295);
    }

    // Restart prompt
    p.fill(255, 255, 100);
    p.textSize(18);
    p.textStyle(p.BOLD);
    const pulse = p.sin(p.frameCount * 0.1) * 20 + 235;
    p.fill(255, pulse, 100);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
  }

  function resetGame(p) {
    clearLevel(p);
    
    gameState.score = 0;
    gameState.currentLevel = 1;
    gameState.dropsRemaining = 10;
    gameState.ballsInPlay = 0;
    gameState.levelComplete = false;
    gameState.dropperX = CANVAS_WIDTH / 2;
    gameState.testFrameCounter = 0;
    gameState.pauseTestFrames = 0;

    initializeLevel(p);
  }
});

// Expose globally
window.gameInstance = gameInstance;
// Expose level loading for dev mode
window.loadLevel = function(levelNum) {
  const state = window.getGameState ? window.getGameState() : (window.gameState || (window.gameInstance && window.gameInstance.gameState));
  if (state) {
    // Set level using the property this game uses
    state.currentLevel = levelNum;
    state.currentLevel = levelNum; // Also set for compatibility
    // Try common reset/start patterns
    if (typeof resetGame === 'function') {
      resetGame();
    }
    if (typeof startGame === 'function') {
      startGame();
    } else if (state.gamePhase !== undefined) {
      state.gamePhase = "PLAYING";
    }
  }
};
// Expose level loading for dev mode
// Expose level loading for dev mode

// Export getGameState function
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;

// Control mode switching
window.setControlMode = function(mode) {
  if (CONTROL_MODES[mode]) {
    gameState.controlMode = CONTROL_MODES[mode];
    gameState.testFrameCounter = 0;
    gameState.pauseTestFrames = 0;
    
    // Update button states
    document.querySelectorAll('.control-button').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const modeMap = {
      'HUMAN': 'humanModeBtn',
      'TEST_1': 'test_1_ModeBtn',
      'TEST_2': 'test_2_ModeBtn'
    };
    
    const btnId = modeMap[mode];
    if (btnId) {
      const btn = document.getElementById(btnId);
      if (btn) btn.classList.add('active');
    }
  }
};