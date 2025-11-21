// game.js - Main game logic with p5.js and Matter.js integration

const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Body, Events } = Matter;

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PLATFORM_Y, PLATFORM_HEIGHT } from './globals.js';
import { Shape, Platform } from './entities.js';
import { generateLevel } from './levels.js';
import { setupPhysics, checkStability, checkWinCondition } from './physics.js';
import { renderStartScreen, renderGameUI, renderPausedOverlay, renderGameOver } from './ui.js';

let gameInstance = new p5(p => {
  let platform;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Create Matter.js engine and world
    const engine = Engine.create();
    const world = engine.world;
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
    
    setupPhysics();
    
    // Create platform
    platform = new Platform(p, CANVAS_WIDTH / 2, PLATFORM_Y + PLATFORM_HEIGHT / 2, 
                           CANVAS_WIDTH - 100, PLATFORM_HEIGHT);
  };
  
  p.draw = function() {
    // Update Matter.js physics engine
    if (gameState.gamePhase === 'PLAYING') {
      Engine.update(gameState.engine, 1000 / 60);
    }
    
    // Handle control modes
    if (gameState.controlMode !== 'HUMAN' && gameState.gamePhase === 'PLAYING') {
      handleAutomatedControl(p);
    }
    
    // Update game logic based on game phase
    switch (gameState.gamePhase) {
      case 'START':
        renderStartScreen(p);
        break;
      case 'PLAYING':
        updateGame(p);
        renderGame(p);
        break;
      case 'PAUSED':
        renderGame(p);
        renderPausedOverlay(p);
        break;
      case 'GAME_OVER_WIN':
      case 'GAME_OVER_LOSE':
        renderGame(p);
        renderGameOver(p, gameState.gamePhase === 'GAME_OVER_WIN');
        break;
    }
  };
  
  function updateGame(p) {
    // Update all entities
    for (let entity of gameState.entities) {
      if (!entity.removed) {
        entity.update();
      }
    }
    
    // Check stability
    if (checkStability()) {
      gameState.stabilityTimer++;
      if (gameState.stabilityTimer > gameState.stabilityThreshold) {
        gameState.isStable = true;
      }
    } else {
      gameState.stabilityTimer = 0;
      gameState.isStable = false;
    }
    
    // Check win/lose conditions when stable
    if (gameState.isStable && !gameState.checkingWinLose) {
      gameState.checkingWinLose = true;
      
      const result = checkWinCondition();
      
      // Check lose conditions first
      if (!result.allGreenOnPlatform) {
        // Green fell off - lose
        gameState.gamePhase = 'GAME_OVER_LOSE';
        p.logs.game_info.push({
          data: { gamePhase: 'GAME_OVER_LOSE', reason: 'green_fell_off' },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.clicksRemaining <= 0 && !result.allRedGone) {
        // Out of clicks with red remaining - lose
        gameState.gamePhase = 'GAME_OVER_LOSE';
        p.logs.game_info.push({
          data: { gamePhase: 'GAME_OVER_LOSE', reason: 'out_of_clicks' },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (result.allRedGone && result.allGreenOnPlatform) {
        // All red gone and green safe - win
        gameState.gamePhase = 'GAME_OVER_WIN';
        p.logs.game_info.push({
          data: { gamePhase: 'GAME_OVER_WIN', level: gameState.currentLevel },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else {
        gameState.checkingWinLose = false;
      }
    }
  }
  
  function renderGame(p) {
    // Background gradient
    for (let y = 0; y < CANVAS_HEIGHT; y++) {
      const inter = y / CANVAS_HEIGHT;
      const c = p.lerpColor(p.color(135, 206, 235), p.color(200, 230, 255), inter);
      p.stroke(c);
      p.line(0, y, CANVAS_WIDTH, y);
    }
    
    // Draw platform
    platform.render();
    
    // Draw all entities
    for (let entity of gameState.entities) {
      entity.render();
    }
    
    // Draw UI
    renderGameUI(p);
  }
  
  p.mousePressed = function() {
    if (gameState.gamePhase !== 'PLAYING' || gameState.controlMode !== 'HUMAN') {
      return;
    }
    
    handleClick(p.mouseX, p.mouseY);
    return false;
  };
  
  function handleClick(x, y) {
    if (gameState.clicksRemaining <= 0) return;
    
    // Find clicked shape
    for (let entity of gameState.entities) {
      if (entity.containsPoint(x, y)) {
        entity.remove();
        gameState.clicksRemaining--;
        gameState.isStable = false;
        gameState.stabilityTimer = 0;
        
        p.logs.inputs.push({
          input_type: 'mouseClick',
          data: { x: x, y: y, shapeType: entity.type, clicksRemaining: gameState.clicksRemaining },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
        
        break;
      }
    }
  }
  
  function handleAutomatedControl(p) {
    gameState.testClickTimer++;
    
    if (gameState.controlMode === 'TEST_1') {
      // Random clicking every interval
      if (gameState.testClickTimer >= gameState.testClickInterval) {
        gameState.testClickTimer = 0;
        
        // Find random non-removed shape
        const availableShapes = gameState.entities.filter(e => !e.removed);
        if (availableShapes.length > 0 && gameState.clicksRemaining > 0) {
          const randomShape = availableShapes[Math.floor(p.random(availableShapes.length))];
          randomShape.remove();
          gameState.clicksRemaining--;
          gameState.isStable = false;
          gameState.stabilityTimer = 0;
        }
      }
    } else if (gameState.controlMode === 'TEST_2') {
      // Click only red shapes
      if (gameState.testClickTimer >= gameState.testClickInterval) {
        gameState.testClickTimer = 0;
        
        // Find red shapes
        const redShapes = gameState.entities.filter(e => !e.removed && e.type === 'red');
        if (redShapes.length > 0 && gameState.clicksRemaining > 0) {
          // Click the topmost red shape
          redShapes.sort((a, b) => a.body.position.y - b.body.position.y);
          redShapes[0].remove();
          gameState.clicksRemaining--;
          gameState.isStable = false;
          gameState.stabilityTimer = 0;
        }
      }
    } else if (gameState.controlMode === 'TEST_3') {
      // Click shapes that support green shapes
      if (gameState.testClickTimer >= gameState.testClickInterval) {
        gameState.testClickTimer = 0;
        
        // Find shapes under green shapes
        const greenShapes = gameState.entities.filter(e => !e.removed && e.type === 'green');
        if (greenShapes.length > 0 && gameState.clicksRemaining > 0) {
          // Find shape below first green
          const green = greenShapes[0];
          const below = gameState.entities.find(e => 
            !e.removed && 
            e !== green && 
            Math.abs(e.body.position.x - green.body.position.x) < 50 &&
            e.body.position.y > green.body.position.y &&
            e.body.position.y - green.body.position.y < 100
          );
          
          if (below) {
            below.remove();
            gameState.clicksRemaining--;
            gameState.isStable = false;
            gameState.stabilityTimer = 0;
          }
        }
      }
    } else if (gameState.controlMode === 'TEST_4') {
      // Use up all clicks randomly
      if (gameState.testClickTimer >= 30 && gameState.clicksRemaining > 0) {
        gameState.testClickTimer = 0;
        
        const availableShapes = gameState.entities.filter(e => !e.removed);
        if (availableShapes.length > 0) {
          const randomShape = availableShapes[Math.floor(p.random(availableShapes.length))];
          randomShape.remove();
          gameState.clicksRemaining--;
          gameState.isStable = false;
          gameState.stabilityTimer = 0;
        }
      }
    } else if (gameState.controlMode === 'TEST_5') {
      // Efficiently complete levels
      if (gameState.testClickTimer >= 45) {
        gameState.testClickTimer = 0;
        
        const redShapes = gameState.entities.filter(e => !e.removed && e.type === 'red');
        if (redShapes.length > 0 && gameState.clicksRemaining > 0) {
          redShapes[0].remove();
          gameState.clicksRemaining--;
          gameState.isStable = false;
          gameState.stabilityTimer = 0;
        }
      }
      
      // Auto-advance on win
      if (gameState.gamePhase === 'GAME_OVER_WIN') {
        if (p.frameCount % 120 === 0) {
          nextLevel(p);
        }
      }
    }
  }
  
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: 'keyPressed',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Handle phase controls
    if (p.keyCode === 13 && gameState.gamePhase === 'START') {
      startGame(p);
      p.logs.game_info.push({
        data: { gamePhase: 'PLAYING' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    if (p.keyCode === 27) {
      if (gameState.gamePhase === 'PLAYING') {
        gameState.gamePhase = 'PAUSED';
        p.logs.game_info.push({
          data: { gamePhase: 'PAUSED' },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === 'PAUSED') {
        gameState.gamePhase = 'PLAYING';
        p.logs.game_info.push({
          data: { gamePhase: 'PLAYING' },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    if (p.keyCode === 82) {
      if (gameState.gamePhase === 'GAME_OVER_WIN' || 
          gameState.gamePhase === 'GAME_OVER_LOSE') {
        resetGame(p);
        p.logs.game_info.push({
          data: { gamePhase: 'START' },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    if (p.keyCode === 32 && gameState.gamePhase === 'GAME_OVER_WIN') {
      nextLevel(p);
    }
    
    return false;
  };
  
  function startGame(p) {
    gameState.gamePhase = 'PLAYING';
    loadLevel(gameState.currentLevel);
  }
  
  function loadLevel(levelNum) {
    // Clear existing entities
    for (let entity of gameState.entities) {
      if (!entity.removed) {
        World.remove(gameState.world, entity.body);
      }
    }
    gameState.entities = [];
    
    // Generate level
    const level = generateLevel(levelNum);
    gameState.maxClicks = level.clicksAllowed;
    gameState.clicksRemaining = level.clicksAllowed;
    gameState.isStable = false;
    gameState.stabilityTimer = 0;
    gameState.checkingWinLose = false;
    
    // Create shapes
    for (let shapeData of level.shapes) {
      let color;
      if (shapeData.type === 'red') {
        color = [255, 100, 100];
      } else if (shapeData.type === 'green') {
        color = [100, 255, 100];
      } else {
        color = [150, 150, 150];
      }
      
      const shape = new Shape(p, shapeData.x, shapeData.y, 
                             shapeData.type, shapeData.shapeType, 
                             shapeData.size, color);
      gameState.entities.push(shape);
    }
  }
  
  function nextLevel(p) {
    if (gameState.currentLevel < gameState.maxLevel) {
      gameState.currentLevel++;
      gameState.gamePhase = 'PLAYING';
      loadLevel(gameState.currentLevel);
      
      p.logs.game_info.push({
        data: { gamePhase: 'PLAYING', level: gameState.currentLevel },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  function resetGame(p) {
    gameState.currentLevel = 1;
    gameState.gamePhase = 'START';
    gameState.score = 0;
    
    // Clear entities
    for (let entity of gameState.entities) {
      if (!entity.removed) {
        World.remove(gameState.world, entity.body);
      }
    }
    gameState.entities = [];
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