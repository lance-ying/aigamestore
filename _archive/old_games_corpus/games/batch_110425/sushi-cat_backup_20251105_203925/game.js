// game.js - Main game file

const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Events } = Matter;

import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES } from './globals.js';
import { setupCollisionHandling } from './physics.js';
import { createLevel, nextLevel } from './levels.js';
import { renderStartScreen, renderPausedOverlay, renderGameOver, renderUI } from './ui.js';
import { handleInput, dropCat } from './controls.js';

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Create Matter.js engine and world
    const engine = Engine.create();
    const world = engine.world;
    world.gravity.y = 0.8;
    
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
    
    // Create initial level
    createLevel(p, gameState.currentLevel);
  };
  
  p.draw = function() {
    // Update physics
    if (gameState.gamePhase === "PLAYING") {
      Engine.update(gameState.engine, 1000 / 60);
    }
    
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
  
  function updateGame(p) {
    // Handle input
    handleInput(p);
    
    // Update player
    if (gameState.player) {
      gameState.player.update();
    }
  }
  
  function renderGame(p) {
    // Background gradient
    for (let y = 0; y < CANVAS_HEIGHT; y++) {
      const inter = y / CANVAS_HEIGHT;
      const c = p.lerpColor(p.color(200, 230, 255), p.color(255, 240, 220), inter);
      p.stroke(c);
      p.line(0, y, CANVAS_WIDTH, y);
    }
    
    // Render obstacles
    gameState.obstacles.forEach(obstacle => {
      obstacle.render();
    });
    
    // Render sushi
    gameState.sushiPieces.forEach(sushi => {
      sushi.render();
    });
    
    // Render player
    if (gameState.player) {
      gameState.player.render();
    }
    
    // Render UI
    renderUI(p);
  }
  
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Phase controls
    if (p.keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) { // ENTER
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
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
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
        nextLevel(p);
      } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        resetGame(p);
      }
    }
    
    // Gameplay controls
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (p.keyCode === 32) { // SPACE - Drop cat
        dropCat(p);
      }
    }
    
    return false;
  };
  
  function resetGame(p) {
    // Clear all entities
    if (gameState.player) {
      gameState.player.remove();
      gameState.player = null;
    }
    
    gameState.sushiPieces.forEach(s => {
      if (s.body && !s.collected) {
        try {
          World.remove(gameState.world, s.body);
        } catch(e) {}
      }
    });
    
    gameState.obstacles.forEach(o => {
      if (o.body) {
        try {
          World.remove(gameState.world, o.body);
        } catch(e) {}
      }
    });
    
    // Reset state
    gameState.currentLevel = 1;
    gameState.score = 0;
    gameState.bellyMeter = 0;
    gameState.dropsRemaining = gameState.maxDrops;
    gameState.catDropped = false;
    gameState.dropPositionX = CANVAS_WIDTH / 2;
    gameState.sushiPieces = [];
    gameState.obstacles = [];
    gameState.entities = [];
    gameState.testTimer = 0;
    gameState.testState = 0;
    
    // Recreate level
    createLevel(p, gameState.currentLevel);
    
    // Return to start screen
    gameState.gamePhase = GAME_PHASES.START;
    
    p.logs.game_info.push({
      data: { gamePhase: GAME_PHASES.START, action: "reset" },
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
  gameState.testTimer = 0;
  gameState.testState = 0;
  
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
  
  console.log('Control mode set to:', mode);
};