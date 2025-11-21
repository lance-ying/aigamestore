// game.js - Main game file

import Matter from 'https://esm.sh/matter-js@0.19.0';
const { Engine } = Matter;

import { 
  gameState, 
  GAME_PHASES, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  CONTROL_MODES,
  getGameState 
} from './globals.js';

import { 
  Item, 
  Claw, 
  createLevelItems 
} from './entities.js';

import { 
  initializePhysics, 
  updatePhysics, 
  updateClawPosition 
} from './physics.js';

import { 
  renderStartScreen, 
  renderGame, 
  renderPausedOverlay, 
  renderShopScreen, 
  renderGameOver 
} from './rendering.js';

import { 
  handleKeyPressed, 
  resetGame 
} from './controls.js';

import { updateAI } from './ai.js';

let gameInstance = new window.p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize physics
    initializePhysics();
    
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
    updatePhysics();
    
    // Update AI if in test mode
    updateAI(p);
    
    // Update and render based on game phase
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
        
      case GAME_PHASES.SHOP:
        renderShopScreen(p);
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOver(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    return handleKeyPressed(p);
  };
});

function initializeGame(p) {
  // Create claw
  gameState.player = new Claw();
  
  // Create initial level items
  gameState.items = createLevelItems(p);
  
  // Initialize test timer
  gameState.testTimer = 0;
}

function updateGame(p) {
  // Update claw position
  updateClawPosition(p);
  
  // Update timer
  gameState.timeLeft -= 1 / 60;
  
  // Update strength potion timer
  if (gameState.strengthActive) {
    gameState.strengthTimeLeft -= 1 / 60;
    if (gameState.strengthTimeLeft <= 0) {
      gameState.strengthActive = false;
      gameState.strengthTimeLeft = 0;
    }
  }
  
  // Check win condition
  if (gameState.money >= gameState.target) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    
    p.logs.game_info.push({
      data: { 
        gamePhase: GAME_PHASES.GAME_OVER_WIN, 
        level: gameState.level,
        money: gameState.money,
        target: gameState.target
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Check lose condition
  if (gameState.timeLeft <= 0) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    
    p.logs.game_info.push({
      data: { 
        gamePhase: GAME_PHASES.GAME_OVER_LOSE,
        level: gameState.level,
        money: gameState.money,
        target: gameState.target
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Log player position periodically
  if (p.frameCount % 60 === 0) {
    p.logs.player_info.push({
      screen_x: gameState.clawX,
      screen_y: gameState.clawY,
      game_x: gameState.clawX,
      game_y: gameState.clawY,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

// Expose globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  if (CONTROL_MODES[mode]) {
    gameState.controlMode = mode;
    
    // Update button states
    document.querySelectorAll('.control-button').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const btnId = mode.toLowerCase() + 'ModeBtn';
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.add('active');
    }
    
    console.log(`Control mode set to: ${mode}`);
  }
};