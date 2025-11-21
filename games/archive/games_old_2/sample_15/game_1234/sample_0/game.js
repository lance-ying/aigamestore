// game.js - Main game file with p5.js instance and game loop

const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Body } = Matter;

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GAME_PHASES,
  CONTROL_MODES,
  LEVELS,
  getGameState 
} from './globals.js';

import { generateTerrain, generateObstacles, generateCollectibles } from './terrain.js';
import { createVehicle, applyGas, applyBrake, checkCrashConditions } from './vehicle.js';
import { setupCollisionHandling } from './physics.js';
import { 
  renderStartScreen, 
  renderGame, 
  renderPausedOverlay, 
  renderGameOver,
  renderLevelComplete 
} from './rendering.js';

let gameInstance = new p5(p => {
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Create Matter.js engine and world
    const engine = Engine.create();
    const world = engine.world;
    world.gravity.y = 1.0;
    
    gameState.engine = engine;
    gameState.world = world;
    
    // Initialize p5.logs
    p.logs = {
      game_info: [],
      player_info: [],
      inputs: []
    };
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Setup collision handling
    setupCollisionHandling(p);
    
    // Load high score from localStorage
    const savedHighScore = localStorage.getItem('hillClimbHighScore');
    if (savedHighScore) {
      gameState.highScore = parseInt(savedHighScore);
    }
  };
  
  p.draw = function() {
    // Update Matter.js physics
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      Engine.update(gameState.engine, 1000 / 60);
    }
    
    // Game loop based on phase
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
        
      case GAME_PHASES.LEVEL_COMPLETE:
        renderLevelComplete(p);
        break;
    }
  };
  
  function updateGame(p) {
    // Handle input based on control mode
    if (gameState.controlMode === CONTROL_MODES.HUMAN) {
      handleHumanInput();
    } else if (gameState.controlMode === CONTROL_MODES.TEST_1) {
      handleTest1Input(p);
    } else if (gameState.controlMode === CONTROL_MODES.TEST_2) {
      handleTest2Input(p);
    }
    
    // Update fuel
    if (gameState.keys.gas) {
      const levelConfig = LEVELS[gameState.currentLevel - 1];
      gameState.fuelLevel -= 0.15 * levelConfig.fuelMultiplier;
    } else if (gameState.keys.brake) {
      const levelConfig = LEVELS[gameState.currentLevel - 1];
      gameState.fuelLevel -= 0.05 * levelConfig.fuelMultiplier;
    } else {
      const levelConfig = LEVELS[gameState.currentLevel - 1];
      gameState.fuelLevel -= 0.02 * levelConfig.fuelMultiplier;
    }
    
    gameState.fuelLevel = Math.max(0, gameState.fuelLevel);
    
    // Update distance
    if (gameState.vehicleBody) {
      gameState.currentDistance = Math.max(0, gameState.vehicleBody.position.x - 100);
      
      // Add distance points
      gameState.currentScore += 0.016; // About 1 point per meter
    }
    
    // Update camera
    if (gameState.vehicleBody) {
      const targetCameraX = gameState.vehicleBody.position.x - CANVAS_WIDTH / 3;
      gameState.cameraX += (targetCameraX - gameState.cameraX) * 0.1;
      gameState.cameraX = Math.max(0, gameState.cameraX);
    }
    
    // Log player position periodically
    if (gameState.vehicleBody) {
      const dx = Math.abs(gameState.vehicleBody.position.x - gameState.lastLoggedX);
      const dy = Math.abs(gameState.vehicleBody.position.y - gameState.lastLoggedY);
      
      if (dx > 50 || dy > 50) {
        p.logs.player_info.push({
          screen_x: gameState.vehicleBody.position.x,
          screen_y: gameState.vehicleBody.position.y,
          game_x: gameState.vehicleBody.position.x,
          game_y: gameState.vehicleBody.position.y,
          framecount: p.frameCount,
          timestamp: Date.now()
        });
        
        gameState.lastLoggedX = gameState.vehicleBody.position.x;
        gameState.lastLoggedY = gameState.vehicleBody.position.y;
      }
    }
    
    // Check win condition (reached end)
    if (gameState.currentDistance >= gameState.levelEndX - 100) {
      completeLevel(p);
      return;
    }
    
    // Check lose conditions
    if (gameState.fuelLevel <= 0 || checkCrashConditions(p)) {
      gameOver(p, false);
      return;
    }
  }
  
  function handleHumanInput() {
    if (gameState.keys.gas) {
      applyGas();
    }
    if (gameState.keys.brake) {
      applyBrake();
    }
  }
  
  function handleTest1Input(p) {
    // Basic test: just accelerate
    if (p.frameCount % 120 < 60) {
      applyGas();
    }
  }
  
  function handleTest2Input(p) {
    // Win test: smart driving
    if (gameState.vehicleBody) {
      const angle = gameState.vehicleBody.angle % (2 * Math.PI);
      const normalizedAngle = angle < 0 ? angle + 2 * Math.PI : angle;
      
      // If tilting forward too much, brake
      if (normalizedAngle > 0.3 && normalizedAngle < Math.PI) {
        applyBrake(0.0015);
      }
      // If tilting backward, gas
      else if (normalizedAngle > Math.PI && normalizedAngle < 2 * Math.PI - 0.3) {
        applyGas(0.003);
      }
      // Normal driving
      else {
        applyGas(0.0025);
      }
    }
  }
  
  function completeLevel(p) {
    gameState.currentScore += 1000; // Level bonus
    
    p.logs.game_info.push({
      data: { 
        event: 'level_complete', 
        level: gameState.currentLevel,
        score: gameState.currentScore 
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    if (gameState.currentLevel < 3) {
      gameState.gamePhase = GAME_PHASES.LEVEL_COMPLETE;
    } else {
      // Won the game!
      gameOver(p, true);
    }
  }
  
  function gameOver(p, isWin) {
    if (isWin) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    } else {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    }
    
    // Update high score
    if (gameState.currentScore > gameState.highScore) {
      gameState.highScore = gameState.currentScore;
      localStorage.setItem('hillClimbHighScore', gameState.highScore.toString());
    }
    
    p.logs.game_info.push({
      data: { 
        gamePhase: gameState.gamePhase,
        finalScore: gameState.currentScore,
        isWin: isWin
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function initializeLevel(p) {
    // Clear existing entities
    if (gameState.world) {
      World.clear(gameState.world, false);
    }
    
    // Reset level-specific state
    gameState.fuelLevel = 100;
    gameState.currentDistance = 0;
    gameState.currentCoins = 0;
    gameState.cameraX = 0;
    gameState.invertedStartTime = null;
    gameState.isCrashed = false;
    gameState.lastLoggedX = 0;
    gameState.lastLoggedY = 0;
    
    const levelConfig = LEVELS[gameState.currentLevel - 1];
    gameState.levelEndX = levelConfig.length;
    
    // Set gravity for level
    gameState.world.gravity.y = levelConfig.gravity;
    
    // Generate terrain
    gameState.terrainSegments = generateTerrain(p, gameState.currentLevel);
    
    // Generate obstacles
    gameState.obstacles = generateObstacles(p, gameState.currentLevel);
    
    // Generate collectibles
    const collectibles = generateCollectibles(p, gameState.currentLevel);
    gameState.fuelCanisters = collectibles.fuelCanisters;
    gameState.coins = collectibles.coins;
    
    // Create vehicle
    createVehicle(p, 100, 200);
    
    // Reset input state
    gameState.keys.gas = false;
    gameState.keys.brake = false;
    
    p.logs.game_info.push({
      data: { 
        event: 'level_start', 
        level: gameState.currentLevel,
        levelName: levelConfig.name
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function startGame(p) {
    gameState.currentLevel = 1;
    gameState.currentScore = 0;
    initializeLevel(p);
    gameState.gamePhase = GAME_PHASES.PLAYING;
    
    p.logs.game_info.push({
      data: { gamePhase: GAME_PHASES.PLAYING },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function nextLevel(p) {
    gameState.currentLevel++;
    initializeLevel(p);
    gameState.gamePhase = GAME_PHASES.PLAYING;
    
    p.logs.game_info.push({
      data: { gamePhase: GAME_PHASES.PLAYING, level: gameState.currentLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function resetGame(p) {
    gameState.gamePhase = GAME_PHASES.START;
    gameState.currentLevel = 1;
    gameState.currentScore = 0;
    gameState.currentCoins = 0;
    gameState.currentDistance = 0;
    gameState.fuelLevel = 100;
    
    // Clear world
    if (gameState.world) {
      World.clear(gameState.world, false);
    }
    
    p.logs.game_info.push({
      data: { gamePhase: GAME_PHASES.START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Phase-specific controls
    if (p.keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) { // ENTER
      startGame(p);
      return false;
    }
    
    if (p.keyCode === 27) { // ESC - Pause/Unpause
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
      return false;
    }
    
    if (p.keyCode === 82) { // R - Restart
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ||
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE ||
          gameState.gamePhase === GAME_PHASES.PAUSED) {
        resetGame(p);
      }
      return false;
    }
    
    // Level complete -> next level
    if (p.keyCode === 32 && gameState.gamePhase === GAME_PHASES.LEVEL_COMPLETE) { // SPACE
      if (gameState.currentLevel < 3) {
        nextLevel(p);
      }
      return false;
    }
    
    // Gameplay controls
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (p.keyCode === 39) { // Arrow Right - Gas
        gameState.keys.gas = true;
      }
      if (p.keyCode === 37) { // Arrow Left - Brake
        gameState.keys.brake = true;
      }
    }
    
    return false;
  };
  
  p.keyReleased = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    if (p.keyCode === 39) { // Arrow Right
      gameState.keys.gas = false;
    }
    if (p.keyCode === 37) { // Arrow Left
      gameState.keys.brake = false;
    }
    
    return false;
  };
});

// Expose globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (mode === CONTROL_MODES.HUMAN) {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === CONTROL_MODES.TEST_1) {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === CONTROL_MODES.TEST_2) {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
};