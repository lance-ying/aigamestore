// game.js - Main game file with p5.js instance mode

const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Events } = Matter;

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  TARGET_FPS,
  GAME_PHASES,
  getGameState
} from './globals.js';

import {
  SugarParticle,
  Cup,
  ColorFilter,
  DrawnLine,
  SugarSource
} from './entities.js';

import { setupPhysics } from './physics.js';
import { initializeLevel, checkLevelComplete } from './levels.js';
import {
  renderStartScreen,
  renderGame,
  renderPausedOverlay,
  renderGameOver
} from './rendering.js';

import {
  handleHumanInput,
  handleSpacePress,
  clearAllLines,
  setupTestMode,
  executeTestActions
} from './controls.js';

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    p.rectMode(p.CENTER);
    
    // Create Matter.js engine and world
    const engine = Engine.create();
    const world = engine.world;
    world.gravity.y = 0.5; // Gentle gravity for sugar
    
    gameState.engine = engine;
    gameState.world = world;
    
    // Setup physics collision handling
    setupPhysics(engine);
    
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
    
    // Initialize game
    initializeGameState(p);
  };
  
  p.draw = function() {
    // Update Matter.js physics
    Engine.update(gameState.engine, 1000 / TARGET_FPS);
    
    // Handle game phases
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
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Phase transitions
    if (p.keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) { // ENTER
      startGame(p);
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
    }
    
    if (p.keyCode === 82) { // R - Restart
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ||
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        resetGame(p);
      }
    }
    
    // Gameplay controls
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (p.keyCode === 32) { // SPACE - Draw line
        handleSpacePress(p);
      }
      
      if (p.keyCode === 16) { // SHIFT - Clear lines
        clearAllLines();
      }
    }
    
    return false;
  };
  
  function initializeGameState(p) {
    gameState.currentLevel = 1;
    gameState.score = 0;
    gameState.entities = [];
    gameState.sugarParticles = [];
    gameState.cups = [];
    gameState.drawnLines = [];
    gameState.colorFilters = [];
    gameState.totalSugarProduced = 0;
    gameState.lineDrawingUsed = 0;
    gameState.cursorX = CANVAS_WIDTH / 2;
    gameState.cursorY = CANVAS_HEIGHT / 2;
    gameState.drawingLine = false;
  }
  
  function startGame(p) {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    
    p.logs.game_info.push({
      data: { gamePhase: GAME_PHASES.PLAYING, level: gameState.currentLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Initialize level
    initializeLevel(p, gameState.currentLevel);
    
    // Create sugar source
    gameState.sugarSource = new SugarSource(p, CANVAS_WIDTH / 2, 50);
    
    // Setup test mode if needed
    if (gameState.controlMode !== 'HUMAN') {
      setupTestMode(gameState.controlMode);
    }
  }
  
  function updateGame(p) {
    // Handle human input
    if (gameState.controlMode === 'HUMAN') {
      handleHumanInput(p);
    } else {
      executeTestActions(p);
    }
    
    // Update sugar source
    if (gameState.sugarSource) {
      gameState.sugarSource.update();
    }
    
    // Update sugar particles
    gameState.sugarParticles.forEach(particle => {
      if (particle.active) {
        particle.update();
        
        // Check if particle is collected by any cup
        gameState.cups.forEach(cup => {
          cup.checkParticleInside(particle);
        });
      }
    });
    
    // Remove inactive particles
    gameState.sugarParticles = gameState.sugarParticles.filter(p => p.active);
    
    // Check win/lose conditions
    const levelStatus = checkLevelComplete();
    if (levelStatus === 'win') {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.GAME_OVER_WIN, level: gameState.currentLevel },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (levelStatus === 'lose') {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.GAME_OVER_LOSE, level: gameState.currentLevel },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  function resetGame(p) {
    // Clear physics world
    World.clear(gameState.world);
    Engine.clear(gameState.engine);
    
    // Reset game state
    initializeGameState(p);
    gameState.gamePhase = GAME_PHASES.START;
    
    p.logs.game_info.push({
      data: { gamePhase: GAME_PHASES.START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
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
  
  console.log(`Control mode set to: ${mode}`);
};