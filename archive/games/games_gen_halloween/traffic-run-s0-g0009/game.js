// game.js - Main game logic with p5.js and Matter.js integration

const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies, Body, Events } = Matter;

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_LOSE
} from './globals.js';

import { Player } from './entities.js';
import { setupCollisionHandling } from './physics.js';
import { setupLevel, completeLevel } from './levelManager.js';
import { spawnTraffic, updateTraffic, clearTraffic } from './trafficManager.js';
import { updateAI } from './ai.js';
import { 
  renderStartScreen, 
  renderGame, 
  renderPausedOverlay, 
  renderGameOver 
} from './renderer.js';

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Create Matter.js engine and world
    const engine = Engine.create();
    const world = engine.world;
    world.gravity.y = 0; // Top-down view, no gravity
    
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
    setupCollisionHandling(p);
    
    // Setup first level configuration
    setupLevel(gameState.level);
    
    console.log('Game initialized');
  };
  
  p.draw = function() {
    // Update Matter.js physics
    if (gameState.gamePhase === PHASE_PLAYING) {
      Engine.update(gameState.engine, 1000 / 60);
    }
    
    // Update game based on phase
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
        
      case PHASE_GAME_OVER_LOSE:
        renderGameOver(p);
        break;
    }
  };
  
  function updateGame(p) {
    // Update AI if in test mode
    updateAI(p);
    
    // Spawn traffic
    spawnTraffic(p);
    
    // Update traffic
    updateTraffic();
    
    // Update player
    if (gameState.player) {
      gameState.player.update();
      
      // Check if player has crossed the intersection
      if (gameState.player.body.position.y < gameState.intersectionBounds.start - 60) {
        completeLevel(p);
      }
    }
  }
  
  function initializeGame(p) {
    // Clear existing entities
    if (gameState.player) {
      gameState.player.destroy();
    }
    clearTraffic();
    
    gameState.entities = [];
    
    // Create player
    const playerStartY = gameState.intersectionBounds.end + 80;
    gameState.player = new Player(p, CANVAS_WIDTH / 2, playerStartY);
    gameState.entities.push(gameState.player);
    
    console.log('Game initialized for playing');
  }
  
  function resetGame(p) {
    // Clear all entities
    if (gameState.player) {
      gameState.player.destroy();
    }
    clearTraffic();
    
    // Reset game state
    gameState.player = null;
    gameState.entities = [];
    gameState.traffic = [];
    gameState.score = 0;
    gameState.coins = 0;
    gameState.level = 1;
    gameState.keys.space = false;
    gameState.testState = {
      timer: 0,
      phase: 0,
      waitTimer: 0
    };
    
    // Setup level 1
    setupLevel(1);
    
    console.log('Game reset');
  }
  
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Phase control keys
    if (p.keyCode === 13 && gameState.gamePhase === PHASE_START) { // ENTER
      gameState.gamePhase = PHASE_PLAYING;
      initializeGame(p);
      
      p.logs.game_info.push({
        data: { gamePhase: PHASE_PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
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
      if (gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
        resetGame(p);
        gameState.gamePhase = PHASE_START;
        
        p.logs.game_info.push({
          data: { gamePhase: PHASE_START },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Gameplay keys
    if (gameState.gamePhase === PHASE_PLAYING) {
      if (p.keyCode === 32) { // SPACE
        gameState.keys.space = true;
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
    
    if (p.keyCode === 32) { // SPACE
      gameState.keys.space = false;
    }
    
    return false;
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;