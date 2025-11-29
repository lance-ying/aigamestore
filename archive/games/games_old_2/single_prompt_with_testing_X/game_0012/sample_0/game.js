// game.js - Main game file

import { 
  gameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TARGET_FPS,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  BASE_SPEED,
  SPEED_INCREASE_INTERVAL,
  SPEED_INCREASE_FACTOR,
  INITIAL_NECK_LENGTH,
  LANE_Y,
  PLAYER_COLORS
} from './globals.js';

import { Player, Ring, Obstacle } from './entities.js';
import { Spawner } from './spawner.js';
import { Renderer } from './renderer.js';
import { handleKeyPressed, handleKeyReleased } from './input.js';
import { checkRingCollisions, checkObstacleCollisions, updateEntities } from './physics.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let spawner;
  let renderer;
  let lastSpawnFrame = 0;

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize logs (write-only)
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };

    // Initialize game systems
    spawner = new Spawner(p);
    renderer = new Renderer(p);

    // Initial game state
    gameState.gamePhase = PHASE_START;
    gameState.controlMode = "HUMAN";
    
    p.logs.game_info.push({
      event: "game_initialized",
      data: { phase: PHASE_START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    p.background(20, 30, 50);

    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === PHASE_PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        simulateKeyPress(action.keyCode);
      }
    }

    // Game loop based on phase
    if (gameState.gamePhase === PHASE_PLAYING) {
      updateGame();
    }

    // Render
    renderer.render(gameState);

    // Log player info
    if (gameState.player && gameState.gamePhase === PHASE_PLAYING) {
      if (p.frameCount % 10 === 0) { // Log every 10 frames
        p.logs.player_info.push({
          screen_x: gameState.player.x,
          screen_y: gameState.player.y,
          game_x: gameState.player.x,
          game_y: gameState.distance,
          framecount: p.frameCount
        });
      }
    }
  };

  function updateGame() {
    if (!gameState.player) {
      gameState.player = new Player(300, LANE_Y);
      gameState.playerColor = Math.floor(p.random() * PLAYER_COLORS.length);
    }

    gameState.framesSinceStart++;

    // Update player
    gameState.player.update();

    // Update speed over time
    const speedIncreases = Math.floor(gameState.framesSinceStart / SPEED_INCREASE_INTERVAL);
    gameState.currentSpeed = BASE_SPEED * Math.pow(1 + SPEED_INCREASE_FACTOR, speedIncreases);

    // Update distance
    gameState.distance += gameState.currentSpeed * 0.5;

    // Spawn entities
    if (p.frameCount - lastSpawnFrame > 60) {
      spawnEntities();
      lastSpawnFrame = p.frameCount;
    }

    // Update entities
    updateEntities(gameState, gameState.currentSpeed);

    // Check collisions
    checkRingCollisions(gameState, p);
    checkObstacleCollisions(gameState, p);

    // Check game over conditions
    if (gameState.neckLength <= 0) {
      endGame(false);
    }

    // Check win condition (arbitrary: distance > 3000)
    if (gameState.distance > 3000) {
      endGame(true);
    }
  }

  function spawnEntities() {
    // Spawn rings
    if (p.random() > 0.3) {
      const colorIndex = p.random() > 0.4 ? gameState.playerColor : 
        Math.floor(p.random() * PLAYER_COLORS.length);
      const lane = Math.floor(p.random() * 3);
      const x = CANVAS_WIDTH + 50;
      const y = LANE_Y - p.random(40, 90);
      
      gameState.rings.push(new Ring(x, y, lane, colorIndex));
    }

    // Spawn obstacles
    if (p.random() > 0.7) {
      const types = ["barrier", "zipline", "low_barrier"];
      const type = types[Math.floor(p.random() * types.length)];
      const lane = Math.floor(p.random() * 3);
      const x = CANVAS_WIDTH + 50;
      
      let minNeckHeight = 0;
      if (type === "zipline") {
        minNeckHeight = Math.floor(p.random(3, 7));
      }
      
      gameState.obstacles.push(new Obstacle(x, lane, type, minNeckHeight));
    }
  }

  function endGame(isWin) {
    gameState.gamePhase = isWin ? PHASE_GAME_OVER_WIN : PHASE_GAME_OVER_LOSE;
    
    // Calculate rewards
    gameState.keys = Math.floor(gameState.distance / 100);
    gameState.gems = Math.floor(gameState.neckLength / 2);
    
    p.logs.game_info.push({
      event: "game_ended",
      data: { 
        phase: gameState.gamePhase,
        distance: gameState.distance,
        neckLength: gameState.neckLength,
        isWin: isWin
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function simulateKeyPress(keyCode) {
    // Simulate key press for automated testing
    if (gameState.player && gameState.gamePhase === PHASE_PLAYING) {
      if (keyCode === 37) { // LEFT
        gameState.player.moveLeft();
      } else if (keyCode === 39) { // RIGHT
        gameState.player.moveRight();
      } else if (keyCode === 38) { // UP
        gameState.player.jump();
      } else if (keyCode === 40) { // DOWN
        gameState.player.duck();
      }
    }
  }

  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
  };

  p.keyReleased = function() {
    handleKeyReleased(p, p.key, p.keyCode);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn'];
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
    'TEST_3': 'test_3_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  console.log(`Control mode set to: ${mode}`);
};