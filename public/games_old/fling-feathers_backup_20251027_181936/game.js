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
    const canvas = p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Initialize Matter.js physics engine
    engine = initMatter();
    p.engine = engine;
    
    if (engine) {
      // Create static ground
      createGround(engine);
      
      // Set up collision event handling
      setupCollisionEvents(engine, (bodyA, bodyB, eventType) => {
        handleCollision(p, engine, bodyA, bodyB, eventType);
      });
      
      // Create slingshot anchor point
      gameState.player = {
        x: 100,
        y: 300
      };
    }
    
    // Load high score from localStorage
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('flingFeathersHighScore');
      if (saved) {
        gameState.highScore = parseInt(saved, 10);
      }
    }
    
    p.logs.game_info.push({
      data: { event: 'game_initialized', phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
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
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p, p.key, p.keyCode);
  };
}, document.body);

// Expose globally
window.gameInstance = gameInstance;
window.getGameState = getGameState;

// Control mode switcher
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const activeBtn = document.getElementById(`${mode === 'HUMAN' ? 'humanModeBtn' : mode.toLowerCase() + '_ModeBtn'}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  console.log('Control mode set to:', mode);
};