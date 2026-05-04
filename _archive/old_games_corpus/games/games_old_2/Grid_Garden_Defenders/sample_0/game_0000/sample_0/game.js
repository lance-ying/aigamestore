// game.js - Main game file

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, initializeLevel, LEVEL_CONFIG } from './globals.js';
import { handleKeyPressed, TestController } from './input.js';
import { renderGame } from './render.js';
import { WaveManager } from './waveManager.js';

const p5 = window.p5;

let waveManager;
let testController = null;

let gameInstance = new p5(p => {
  let lastFrameTime = 0;
  
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
    
    // Load high score
    const savedHighScore = localStorage.getItem('gridGardenHighScore');
    if (savedHighScore) {
      gameState.highScore = parseInt(savedHighScore);
    }
    
    // Initialize game
    initializeLevel(1);
    waveManager = new WaveManager();
    
    lastFrameTime = Date.now();
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START", level: 1 },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    const currentTime = Date.now();
    const deltaTime = Math.min((currentTime - lastFrameTime) / 1000, 0.1); // Cap at 0.1s
    lastFrameTime = currentTime;
    
    // Handle control modes
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (!testController || testController.mode !== gameState.controlMode) {
        testController = new TestController(gameState.controlMode);
      }
      testController.update(p, deltaTime);
    }
    
    // Update game logic
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGame(p, deltaTime);
    }
    
    // Render
    renderGame(p);
    
    // Log player info periodically
    if (p.frameCount % 60 === 0 && gameState.gamePhase === GAME_PHASES.PLAYING) {
      p.logs.player_info.push({
        screen_x: gameState.cursorCol * (CANVAS_WIDTH / 9) + (CANVAS_WIDTH / 18),
        screen_y: gameState.cursorRow * (CANVAS_HEIGHT / 5) + (CANVAS_HEIGHT / 10),
        game_x: gameState.cursorCol,
        game_y: gameState.cursorRow,
        framecount: p.frameCount
      });
    }
  };
  
  function updateGame(p, deltaTime) {
    gameState.framesSinceStart++;
    
    // Update cooldowns
    for (let plantType in gameState.plantCooldowns) {
      if (gameState.plantCooldowns[plantType] > 0) {
        gameState.plantCooldowns[plantType] -= deltaTime;
        if (gameState.plantCooldowns[plantType] < 0) {
          gameState.plantCooldowns[plantType] = 0;
        }
      }
    }
    
    // Sun drop generation
    const levelConfig = LEVEL_CONFIG[gameState.currentLevel - 1];
    gameState.sunTimer += deltaTime;
    if (gameState.sunTimer >= levelConfig.sunDropInterval) {
      gameState.sunTimer = 0;
      const sunDrop = new (require('./entities.js').SunDrop)(
        p.random(50, CANVAS_WIDTH - 50),
        p.random(100, CANVAS_HEIGHT - 50),
        25
      );
      gameState.sunDrops.push(sunDrop);
    }
    
    // Wave management
    if (gameState.waveDelay > 0) {
      gameState.waveDelay -= deltaTime;
      if (gameState.waveDelay <= 0) {
        const hasMoreWaves = waveManager.startWave(gameState.currentWave);
        if (!hasMoreWaves) {
          // No more waves, but wait for zombies to be cleared
        }
      }
    } else if (!waveManager.isWaveActive() && !gameState.levelComplete) {
      // Check if there are more waves
      if (gameState.currentWave < levelConfig.waves.length) {
        gameState.currentWave++;
        gameState.waveDelay = 10; // 10 second delay between waves
        gameState.score += 50; // Wave completion bonus
      } else {
        // Level complete
        completeLevel();
      }
    }
    
    // Update wave manager
    waveManager.update(p, deltaTime);
    
    // Update entities
    updateEntities(p, deltaTime);
    
    // Clean up inactive entities
    gameState.plants = gameState.plants.filter(e => e.active);
    gameState.zombies = gameState.zombies.filter(e => e.active);
    gameState.projectiles = gameState.projectiles.filter(e => e.active);
    gameState.sunDrops = gameState.sunDrops.filter(e => e.active);
    gameState.entities = [...gameState.plants, ...gameState.zombies, ...gameState.projectiles, ...gameState.sunDrops];
    
    // Handle level complete transition
    if (gameState.levelComplete) {
      gameState.waveDelay += deltaTime;
      if (gameState.waveDelay > 3) { // 3 second delay
        if (gameState.currentLevel < 5) {
          // Next level
          initializeLevel(gameState.currentLevel + 1);
          waveManager = new WaveManager();
          gameState.waveDelay = 10;
        } else {
          // Win!
          gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
          updateHighScore();
          p.logs.game_info.push({
            data: { phase: "GAME_OVER_WIN", score: gameState.score },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      }
    }
  }
  
  function updateEntities(p, deltaTime) {
    for (let plant of gameState.plants) {
      if (plant.active) plant.update(p, deltaTime);
    }
    
    for (let zombie of gameState.zombies) {
      if (zombie.active) zombie.update(p, deltaTime);
    }
    
    for (let projectile of gameState.projectiles) {
      if (projectile.active) projectile.update(p, deltaTime);
    }
    
    for (let sunDrop of gameState.sunDrops) {
      if (sunDrop.active) sunDrop.update(p, deltaTime);
    }
  }
  
  function completeLevel() {
    gameState.levelComplete = true;
    gameState.waveDelay = 0;
    
    // Bonus for remaining plants
    const remainingPlants = gameState.plants.filter(p => p.active).length;
    gameState.score += remainingPlants * 50;
    
    // Level completion bonus
    gameState.score += 100;
    
    p.logs.game_info.push({
      data: { event: "level_complete", level: gameState.currentLevel, score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function updateHighScore() {
    if (gameState.score > gameState.highScore) {
      gameState.highScore = gameState.score;
      localStorage.setItem('gridGardenHighScore', gameState.highScore.toString());
    }
  }
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.keyCode);
    return false; // Prevent default
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Expose getGameState function
window.getGameState = function() {
  return gameState;
};

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
  
  testController = null; // Reset test controller
};