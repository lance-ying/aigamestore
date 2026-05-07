// game.js - Main game logic with p5.js and Matter.js integration

const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies } = Matter;

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { generateLevelData } from './levels.js';
import { SugarParticle, Barrier, Cup, Spawner, ColorFilter, GravitySwitch, Teleporter } from './entities.js';
import { setupPhysics, checkParticleInteractions } from './physics.js';
import { handleKeyPressed, handleKeyReleased, handleTestMode, updateDrawing } from './input.js';
import { renderStartScreen, renderGame, renderGameOver } from './renderer.js';

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Create Matter.js engine and world with improved collision detection
    const engine = Engine.create();
    const world = engine.world;
    world.gravity.y = 0.5; // Reduced from 1 to make sugar fall slower
    
    // Increase collision iterations for more accurate detection
    engine.positionIterations = 10;
    engine.velocityIterations = 8;
    
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
    
    // Setup physics event handlers
    setupPhysics(engine);
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
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOver(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p);
    return false;
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p);
    return false;
  };
});

function updateGame(p) {
  // Handle test mode automation
  handleTestMode(p);
  
  // Update drawing (continuous while keys held)
  updateDrawing(p);
  
  // Update spawners
  gameState.spawners.forEach(spawner => spawner.update(p));
  
  // Update particles
  gameState.sugarParticles.forEach(particle => particle.update());
  
  // Update special elements
  gameState.gravitySwitches.forEach(gs => gs.update());
  gameState.teleporters.forEach(tp => tp.update());
  
  // Check interactions
  checkParticleInteractions();
  
  // Remove marked particles
  gameState.sugarParticles = gameState.sugarParticles.filter(particle => {
    if (particle.markedForRemoval) {
      particle.remove();
      return false;
    }
    return true;
  });
  
  // Check win/lose conditions
  checkGameConditions(p);
}

function checkGameConditions(p) {
  // Check overflow (lose condition)
  for (let cup of gameState.cups) {
    if (cup.isOverflowing()) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.GAME_OVER_LOSE, reason: 'overflow' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return;
    }
  }
  
  // Check win condition (all cups filled)
  let allFilled = gameState.cups.length > 0;
  for (let cup of gameState.cups) {
    if (!cup.isFull()) {
      allFilled = false;
      break;
    }
  }
  
  if (allFilled) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { gamePhase: GAME_PHASES.GAME_OVER_WIN, level: gameState.currentLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Advance to next level after a delay
    setTimeout(() => {
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
        gameState.scoreAtLevelStart = gameState.score; // Save score checkpoint
        gameState.currentLevel++;
        if (gameState.currentLevel > gameState.maxLevel) {
          gameState.currentLevel = 1; // Loop back
        }
        startLevel(p, gameState.currentLevel);
        gameState.gamePhase = GAME_PHASES.PLAYING;
      }
    }, 2000);
  }
}

export function startLevel(p, levelNumber) {
  // Clear existing entities
  clearLevel();
  
  // Reset test state
  gameState.testFrameCount = 0;
  gameState.testBarriersDrawn = false;
  
  // Generate level
  gameState.levelData = generateLevelData(levelNumber);
  
  // Reset gravity
  gameState.gravityDirection = 1;
  gameState.world.gravity.y = 0.5; // Reduced from 1 to make sugar fall slower
  
  // Create spawners
  gameState.levelData.spawners.forEach(data => {
    const spawner = new Spawner(data);
    gameState.spawners.push(spawner);
    gameState.entities.push(spawner);
  });
  
  // Create cups
  gameState.levelData.cups.forEach(data => {
    const cup = new Cup(data);
    gameState.cups.push(cup);
    gameState.entities.push(cup);
  });
  
  // Create color filters
  gameState.levelData.colorFilters.forEach(data => {
    const filter = new ColorFilter(data);
    gameState.colorFilters.push(filter);
    gameState.entities.push(filter);
  });
  
  // Create gravity switches
  gameState.levelData.gravitySwitches.forEach(data => {
    const gswitch = new GravitySwitch(data);
    gameState.gravitySwitches.push(gswitch);
    gameState.entities.push(gswitch);
  });
  
  // Create teleporters
  gameState.levelData.teleporters.forEach(data => {
    const teleporter = new Teleporter(data);
    gameState.teleporters.push(teleporter);
    gameState.entities.push(teleporter);
  });
  
  // Create static barriers
  gameState.levelData.staticBarriers.forEach(data => {
    const barrier = new Barrier(data.x1, data.y1, data.x2, data.y2, true);
    gameState.barriers.push(barrier);
    gameState.entities.push(barrier);
  });
  
  // Reset stats
  gameState.sugarSpawned = 0;
  gameState.sugarInCups = 0;
  gameState.isDrawing = false;
  gameState.drawingPoints = [];
  
  p.logs.game_info.push({
    data: { event: 'level_start', level: levelNumber },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function clearLevel() {
  // Remove all dynamic entities
  gameState.sugarParticles.forEach(particle => particle.remove());
  gameState.barriers.forEach(barrier => barrier.remove());
  gameState.cups.forEach(cup => cup.remove());
  
  gameState.entities = [];
  gameState.sugarParticles = [];
  gameState.barriers = [];
  gameState.cups = [];
  gameState.spawners = [];
  gameState.colorFilters = [];
  gameState.gravitySwitches = [];
  gameState.teleporters = [];
}

// Expose globally
window.gameInstance = gameInstance;
// Expose level loading for dev mode
window.loadLevel = function(levelNum) {
  const state = window.getGameState ? window.getGameState() : (window.gameState || (window.gameInstance && window.gameInstance.gameState));
  if (state) {
    state.currentLevel = levelNum;
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

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const buttonMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn',
    'TEST_3': 'test_3_ModeBtn',
    'TEST_4': 'test_4_ModeBtn',
    'TEST_5': 'test_5_ModeBtn',
    'TEST_6': 'test_6_ModeBtn',
    'TEST_7': 'test_7_ModeBtn'
  };
  
  const btnId = buttonMap[mode];
  if (btnId) {
    const btn = document.getElementById(btnId);
    if (btn) btn.classList.add('active');
  }
  
  console.log('Control mode set to:', mode);
};