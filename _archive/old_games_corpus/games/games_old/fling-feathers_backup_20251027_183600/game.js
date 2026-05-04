// game.js - Main game file with comprehensive Matter.js integration
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { initMatter, createGround, setupCollisionEvents, Engine } from './physics.js';
import { handleKeyPressed, handleKeyReleased, updateSlingshotAiming } from './input.js';
import { updateGameLogic } from './gameLogic.js';
import { drawBackground, drawSlingshot, drawUI, drawStartScreen, drawGameOverScreen, drawEntities } from './rendering.js';
import { updateParticles, drawParticles, handleCollision } from './entities.js';
import { getTestAction, executeTestAction } from './testing.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let engine;
  
  p.setup = function() {
    console.log('[MAIN] ========== GAME SETUP START ==========');
    
    const canvas = p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    console.log('[MAIN] Canvas created:', { width: CANVAS_WIDTH, height: CANVAS_HEIGHT });
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Initialize Matter.js physics engine
    console.log('[MAIN] Initializing physics engine...');
    engine = initMatter();
    p.engine = engine;
    
    if (engine) {
      console.log('[MAIN] Physics engine initialized successfully');
      
      // Create static ground
      createGround(engine);
      console.log('[MAIN] Ground created');
      
      // Set up collision event handling
      setupCollisionEvents(engine, (bodyA, bodyB, eventType) => {
        handleCollision(p, engine, bodyA, bodyB, eventType);
      });
      console.log('[MAIN] Collision events set up');
      
      // Create slingshot anchor point
      gameState.player = {
        x: 100,
        y: 300
      };
      console.log('[MAIN] Slingshot anchor created');
    } else {
      console.error('[MAIN] Failed to initialize physics engine!');
    }
    
    // Load high score from localStorage
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('flingFeathersHighScore');
      if (saved) {
        gameState.highScore = parseInt(saved, 10);
        console.log('[MAIN] Loaded high score:', gameState.highScore);
      }
    }
    
    p.logs.game_info.push({
      data: { event: 'game_initialized', phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    console.log('[MAIN] ========== GAME SETUP COMPLETE ==========');
  };
  
  p.draw = function() {
    try {
      // Draw background
      drawBackground(p);
      
      // Update physics engine
      if (engine && gameState.gamePhase === GAME_PHASES.PLAYING) {
        // Update Matter.js engine with fixed timestep
        Engine.update(engine, 1000 / 60);
      }
      
      // Game phase logic
      if (gameState.gamePhase === GAME_PHASES.START) {
        drawStartScreen(p);
      } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        // Update game logic
        updateSlingshotAiming(p);
        updateGameLogic(p);
        updateParticles();
        
        // Render game
        drawSlingshot(p);
        drawEntities(p);
        drawParticles(p);
        drawUI(p);
        
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        // Draw frozen game state
        drawSlingshot(p);
        drawEntities(p);
        drawParticles(p);
        drawUI(p);
        
      } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
                 gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        drawGameOverScreen(p);
      }
      
      // Automated testing mode
      if (gameState.controlMode !== 'HUMAN') {
        const action = getTestAction(p);
        executeTestAction(p, action);
      }
    } catch (error) {
      console.error('[MAIN] ERROR in draw loop:', error);
      console.error('[MAIN] Stack trace:', error.stack);
    }
  };
  
  p.keyPressed = function() {
    try {
      handleKeyPressed(p, p.key, p.keyCode);
    } catch (error) {
      console.error('[MAIN] ERROR in keyPressed:', error);
    }
  };
  
  p.keyReleased = function() {
    try {
      handleKeyReleased(p, p.key, p.keyCode);
    } catch (error) {
      console.error('[MAIN] ERROR in keyReleased:', error);
    }
  };
}, document.body);

// Expose globally
window.gameInstance = gameInstance;
window.getGameState = getGameState;

// Control mode switcher
window.setControlMode = function(mode) {
  console.log('[MAIN] Setting control mode to:', mode);
  gameState.controlMode = mode;
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const activeBtn = document.getElementById(`${mode === 'HUMAN' ? 'humanModeBtn' : mode.toLowerCase() + '_ModeBtn'}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

console.log('[MAIN] Game module loaded');