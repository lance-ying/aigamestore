// game.js - Main game file
import { gameState, getGameState, PHASE, HAT_TYPE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './player.js';
import { createWorld, updateCamera } from './world.js';
import { handleHumanInput, handleAutomatedInput, useHatAbilityFixed } from './input.js';
import { drawStartScreen, drawHUD, drawGameOverScreen } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Game state is imported from globals.js
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs (write-only)
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };

    // Log initial game state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Initialize world
    createWorld();

    // Create player
    gameState.player = new Player(50, 300);
    gameState.entities.push(gameState.player);
    gameState.explosions = [];
  };

  p.draw = function() {
    p.background(135, 206, 235);
    gameState.frameCount = p.frameCount;

    if (gameState.gamePhase === PHASE.START) {
      drawStartScreen(p);
      return;
    }

    if (gameState.gamePhase === PHASE.PLAYING) {
      // Handle input
      if (gameState.controlMode === "HUMAN") {
        handleHumanInput(p);
      } else {
        const action = get_automated_testing_action(gameState);
        handleAutomatedInput(p, action);
        
        // Handle hat switching in automated mode
        if (action.hatSwitch && gameState.unlockedHats.includes(action.hatSwitch)) {
          gameState.currentHat = action.hatSwitch;
        }
      }

      // Update game state
      updateGame(p);

      // Update camera
      updateCamera(gameState.player, gameState.camera);

      // Render game
      renderGame(p);

      // Draw HUD
      drawHUD(p);

      // Check win/lose conditions
      checkGameOver(p);
    } else if (gameState.gamePhase === PHASE.PAUSED) {
      // Render paused game
      renderGame(p);
      drawHUD(p);
    } else if (gameState.gamePhase === PHASE.GAME_OVER_WIN || gameState.gamePhase === PHASE.GAME_OVER_LOSE) {
      // Render final game state
      renderGame(p);
      drawGameOverScreen(p);
    }
  };

  function updateGame(p) {
    // Update player
    if (gameState.player) {
      const prevX = gameState.player.x;
      const prevY = gameState.player.y;
      
      gameState.player.update(p, gameState);

      // Log player position changes
      if (prevX !== gameState.player.x || prevY !== gameState.player.y) {
        if (p.frameCount % 10 === 0) { // Log every 10 frames to reduce spam
          p.logs.player_info.push({
            screen_x: gameState.player.x - gameState.camera.x,
            screen_y: gameState.player.y - gameState.camera.y,
            game_x: gameState.player.x,
            game_y: gameState.player.y,
            framecount: p.frameCount
          });
        }
      }
    }

    // Update time pieces
    for (let tp of gameState.timePieces) {
      tp.update(p);
      if (tp.checkCollision(gameState.player)) {
        tp.collected = true;
        gameState.timePiecesCollected++;
        gameState.score += 100;
        
        p.logs.game_info.push({
          data: { event: "time_piece_collected", id: tp.id, total: gameState.timePiecesCollected },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }

    // Update yarn
    for (let yarn of gameState.yarn) {
      yarn.update(p);
      if (yarn.checkCollision(gameState.player)) {
        yarn.collected = true;
        gameState.yarnCollected++;
        gameState.score += 10;
        
        // Unlock hats
        if (gameState.yarnCollected >= 3 && !gameState.unlockedHats.includes(HAT_TYPE.SPRINT)) {
          gameState.unlockedHats.push(HAT_TYPE.SPRINT);
          p.logs.game_info.push({
            data: { event: "hat_unlocked", hat: HAT_TYPE.SPRINT },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
        if (gameState.yarnCollected >= 6 && !gameState.unlockedHats.includes(HAT_TYPE.BREWING)) {
          gameState.unlockedHats.push(HAT_TYPE.BREWING);
          p.logs.game_info.push({
            data: { event: "hat_unlocked", hat: HAT_TYPE.BREWING },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
        if (gameState.yarnCollected >= 9 && !gameState.unlockedHats.includes(HAT_TYPE.DIMENSION)) {
          gameState.unlockedHats.push(HAT_TYPE.DIMENSION);
          p.logs.game_info.push({
            data: { event: "hat_unlocked", hat: HAT_TYPE.DIMENSION },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      }
    }

    // Update explosions
    gameState.explosions = gameState.explosions || [];
    for (let i = gameState.explosions.length - 1; i >= 0; i--) {
      const explosion = gameState.explosions[i];
      explosion.update();
      
      // Check collision with destructible blocks
      if (gameState.destructibleBlocks) {
        for (let block of gameState.destructibleBlocks) {
          if (block.checkExplosionCollision(explosion)) {
            block.takeDamage();
          }
        }
      }
      
      if (explosion.isDone()) {
        gameState.explosions.splice(i, 1);
      }
    }

    // Update dimension timer
    if (gameState.dimensionActive) {
      gameState.dimensionTimer--;
      if (gameState.dimensionTimer <= 0) {
        gameState.dimensionActive = false;
      }
    }

    // Check spike collisions
    for (let spike of gameState.spikes) {
      if (spike.checkCollision(gameState.player)) {
        if (gameState.player.takeDamage()) {
          p.logs.game_info.push({
            data: { event: "player_damaged", health: gameState.player.health },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      }
    }
  }

  function renderGame(p) {
    const camera = gameState.camera;

    // Sky gradient
    for (let i = 0; i < CANVAS_HEIGHT; i++) {
      const inter = i / CANVAS_HEIGHT;
      p.stroke(135 + inter * 50, 206 - inter * 100, 235);
      p.line(0, i, CANVAS_WIDTH, i);
    }

    // Clouds
    p.noStroke();
    p.fill(255, 255, 255, 150);
    for (let i = 0; i < 5; i++) {
      const x = ((i * 157 + p.frameCount * 0.3) % (gameState.worldWidth + 200)) - camera.x;
      const y = 50 + (i * 23) % 100;
      p.ellipse(x, y, 60, 30);
      p.ellipse(x + 30, y, 50, 25);
      p.ellipse(x - 30, y, 50, 25);
    }

    // Draw platforms
    for (let platform of gameState.platforms) {
      platform.draw(p, camera);
    }

    // Draw ladders
    for (let ladder of gameState.ladders) {
      ladder.draw(p, camera);
    }

    // Draw spikes
    for (let spike of gameState.spikes) {
      spike.draw(p, camera);
    }

    // Draw destructible blocks
    if (gameState.destructibleBlocks) {
      for (let block of gameState.destructibleBlocks) {
        block.draw(p, camera);
      }
    }

    // Draw yarn
    for (let yarn of gameState.yarn) {
      yarn.draw(p, camera);
    }

    // Draw time pieces
    for (let tp of gameState.timePieces) {
      tp.draw(p, camera);
    }

    // Draw explosions
    if (gameState.explosions) {
      for (let explosion of gameState.explosions) {
        explosion.draw(p, camera);
      }
    }

    // Draw player
    if (gameState.player) {
      gameState.player.currentHat = gameState.currentHat;
      gameState.player.draw(p, camera);
    }

    // Dimension effect overlay
    if (gameState.dimensionActive) {
      p.fill(150, 150, 255, 30 + Math.sin(p.frameCount * 0.2) * 20);
      p.noStroke();
      p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  }

  function checkGameOver(p) {
    // Win condition
    if (gameState.timePiecesCollected >= gameState.totalTimePieces) {
      gameState.gamePhase = PHASE.GAME_OVER_WIN;
      p.logs.game_info.push({
        data: { phase: PHASE.GAME_OVER_WIN, message: "Player won!" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }

    // Lose condition
    if (gameState.player && gameState.player.health <= 0) {
      gameState.gamePhase = PHASE.GAME_OVER_LOSE;
      p.logs.game_info.push({
        data: { phase: PHASE.GAME_OVER_LOSE, message: "Player lost!" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Game phase transitions
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === PHASE.START) {
        gameState.gamePhase = PHASE.PLAYING;
        p.logs.game_info.push({
          data: { phase: PHASE.PLAYING, message: "Game started" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === PHASE.PLAYING) {
        gameState.gamePhase = PHASE.PAUSED;
        p.logs.game_info.push({
          data: { phase: PHASE.PAUSED, message: "Game paused" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === PHASE.PAUSED) {
        gameState.gamePhase = PHASE.PLAYING;
        p.logs.game_info.push({
          data: { phase: PHASE.PLAYING, message: "Game resumed" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (p.keyCode === 82) { // R
      if (gameState.gamePhase === PHASE.GAME_OVER_WIN || gameState.gamePhase === PHASE.GAME_OVER_LOSE) {
        resetGame();
        p.logs.game_info.push({
          data: { phase: PHASE.START, message: "Game restarted" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }

    // Gameplay controls (only during PLAYING phase and HUMAN mode)
    if (gameState.gamePhase === PHASE.PLAYING && gameState.controlMode === "HUMAN") {
      if (p.keyCode === 32) { // SPACE - Jump
        gameState.player.jump();
      } else if (p.keyCode === 90) { // Z - Hat ability
        useHatAbilityFixed(p);
      } else if (p.keyCode >= 49 && p.keyCode <= 52) { // 1-4 - Hat switching
        const hatIndex = p.keyCode - 49;
        const hats = [HAT_TYPE.NONE, HAT_TYPE.SPRINT, HAT_TYPE.BREWING, HAT_TYPE.DIMENSION];
        if (gameState.unlockedHats.includes(hats[hatIndex])) {
          gameState.currentHat = hats[hatIndex];
        }
      }
    }

    return false; // Prevent default
  };

  p.keyReleased = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    return false;
  };

  function resetGame() {
    gameState.gamePhase = PHASE.START;
    gameState.score = 0;
    gameState.timePiecesCollected = 0;
    gameState.yarnCollected = 0;
    gameState.currentHat = HAT_TYPE.NONE;
    gameState.unlockedHats = [HAT_TYPE.NONE];
    gameState.dimensionActive = false;
    gameState.dimensionTimer = 0;
    gameState.camera = { x: 0, y: 0 };
    gameState.explosions = [];

    // Recreate world
    createWorld();

    // Recreate player
    gameState.entities = [];
    gameState.player = new Player(50, 300);
    gameState.entities.push(gameState.player);
  }
});

// Expose globally
window.gameInstance = gameInstance;

// Control mode switcher
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn'];
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
    'TEST_4': 'test_4_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};