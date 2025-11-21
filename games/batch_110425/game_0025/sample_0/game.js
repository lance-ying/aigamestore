// game.js - Main game file

const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World } = Matter;

import { 
  gameState,
  GAME_PHASES,
  CONTROL_MODES,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GRAVITY,
  getGameState
} from './globals.js';

import { setupPhysics } from './physics.js';
import { 
  initializeGame, 
  updateGame, 
  handleInput, 
  resetGame,
  launchBird
} from './gameLogic.js';
import { 
  renderStartScreen, 
  renderGame, 
  renderPausedOverlay, 
  renderGameOver 
} from './ui.js';
import { updateAutomation } from './automation.js';

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Create Matter.js engine and world
    gameState.engine = Engine.create();
    gameState.world = gameState.engine.world;
    gameState.world.gravity.y = GRAVITY;
    
    // Setup physics
    setupPhysics();
    
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
    initializeGame(p);
  };
  
  p.draw = function() {
    // Update physics
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      Engine.update(gameState.engine, 1000 / 60);
    }
    
    // Handle game phases
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
        handleInput(p);
        updateAutomation(p);
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
    
    // ENTER - Start game
    if (p.keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // ESC - Pause/Unpause
    if (p.keyCode === 27) {
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
    
    // R - Restart
    if (p.keyCode === 82) {
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ||
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        resetGame(p);
        gameState.gamePhase = GAME_PHASES.START;
        p.logs.game_info.push({
          data: { gamePhase: GAME_PHASES.START },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // SPACE - Launch bird
    if (p.keyCode === 32 && gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (gameState.controlMode === CONTROL_MODES.HUMAN) {
        launchBird(p);
      }
    }
    
    return false;
  };
});

// Expose globally
window.gameInstance = gameInstance;

// Control mode switcher
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  if (mode === CONTROL_MODES.HUMAN) {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === CONTROL_MODES.TEST_1) {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === CONTROL_MODES.TEST_2) {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
  
  console.log(`Control mode set to: ${mode}`);
};