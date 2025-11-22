// game.js - Main game logic with p5.js and Matter.js

const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies } = Matter;

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GAME_PHASES,
  TRICK_TYPES,
  TRICK_SCORES
} from './globals.js';

import { 
  Skateboard, 
  Obstacle, 
  Rail, 
  Ground 
} from './entities.js';

import { 
  setupCollisionHandling, 
  updateComboSystem,
  handleTrickScoring
} from './physics.js';

import { 
  handlePlayerInput, 
  handleKeyPressed,
  generateTestInputs,
  processTestInputs
} from './controls.js';

import { 
  renderStartScreen, 
  renderPausedOverlay, 
  renderGameOver,
  renderHUD
} from './ui.js';

function initializeGame(p) {
  // Clear previous entities
  if (gameState.world) {
    World.clear(gameState.world, false);
  }
  
  gameState.entities = [];
  gameState.obstacles = [];
  gameState.rails = [];
  gameState.score = 0;
  gameState.combo = 1;
  gameState.comboTimer = 0;
  gameState.currentTrick = null;
  gameState.framesSinceStart = 0;
  
  // Create Matter.js engine
  if (!gameState.engine) {
    gameState.engine = Engine.create();
    gameState.world = gameState.engine.world;
    gameState.world.gravity.y = 1;
    
    // Setup collision handling
    setupCollisionHandling(gameState.engine, p);
  }
  
  // Create ground
  const ground = new Ground(p, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20, CANVAS_WIDTH, 40);
  gameState.entities.push(ground);
  
  // Create obstacles
  const ramp1 = new Obstacle(p, 150, CANVAS_HEIGHT - 70, 80, 50, 'ramp');
  gameState.obstacles.push(ramp1);
  gameState.entities.push(ramp1);
  
  const box1 = new Obstacle(p, 350, CANVAS_HEIGHT - 60, 60, 40, 'box');
  gameState.obstacles.push(box1);
  gameState.entities.push(box1);
  
  const ramp2 = new Obstacle(p, 500, CANVAS_HEIGHT - 70, 80, 50, 'ramp');
  gameState.obstacles.push(ramp2);
  gameState.entities.push(ramp2);
  
  // Create rails
  const rail1 = new Rail(p, 250, CANVAS_HEIGHT - 100, 100);
  gameState.rails.push(rail1);
  gameState.entities.push(rail1);
  
  const rail2 = new Rail(p, 450, CANVAS_HEIGHT - 120, 80);
  gameState.rails.push(rail2);
  gameState.entities.push(rail2);
  
  // Create player skateboard
  const skateboard = new Skateboard(p, 100, CANVAS_HEIGHT - 100);
  gameState.player = skateboard;
  gameState.entities.push(skateboard);
  
  // Generate test inputs if in test mode
  if (gameState.controlMode !== 'HUMAN') {
    gameState.testModeInputs = generateTestInputs(gameState.controlMode);
  }
}

function updateGame(p) {
  gameState.framesSinceStart++;
  
  // Update physics engine
  Engine.update(gameState.engine, 1000 / 60);
  
  // Process test inputs
  if (gameState.controlMode !== 'HUMAN') {
    processTestInputs(p);
  } else {
    // Handle player input
    handlePlayerInput(p);
  }
  
  // Update entities
  for (const entity of gameState.entities) {
    if (entity.update) {
      entity.update();
    }
  }
  
  // Update combo system
  updateComboSystem(p);
  
  // Score points for ongoing tricks
  if (gameState.player) {
    if (gameState.player.isManual) {
      gameState.score += TRICK_SCORES[TRICK_TYPES.MANUAL] / 60 * gameState.combo;
    }
    if (gameState.player.isGrinding) {
      gameState.score += TRICK_SCORES[TRICK_TYPES.GRIND] / 60 * gameState.combo;
    }
  }
  
  // Check win condition (score threshold)
  if (gameState.score >= 10000) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { gamePhase: GAME_PHASES.GAME_OVER_WIN, finalScore: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Check if player fell off
  if (gameState.player && gameState.player.body.position.y > CANVAS_HEIGHT + 50) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    p.logs.game_info.push({
      data: { gamePhase: GAME_PHASES.GAME_OVER_LOSE, finalScore: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function renderGame(p) {
  // Background
  p.background(135, 206, 235); // Sky blue
  
  // Render entities
  for (const entity of gameState.entities) {
    if (entity.render) {
      entity.render();
    }
  }
  
  // Render HUD
  renderHUD(p);
}

function resetGame(p) {
  initializeGame(p);
}

// Create p5 instance
let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
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
    
    // Phase control - ENTER
    if (p.keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      gameState.framesSinceStart = 0;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // Phase control - ESC (Pause/Unpause)
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
    
    // Phase control - R (Restart)
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
    
    // Gameplay controls (only in PLAYING phase and HUMAN mode)
    if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.controlMode === 'HUMAN') {
      handleKeyPressed(p, p.keyCode);
    }
    
    return false; // Prevent default
  };
  
  p.keyReleased = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    return false;
  };
});

// Expose globally
window.gameInstance = gameInstance;

// Control mode setter
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
  
  const activeBtn = mode === 'HUMAN' ? 'humanModeBtn' : 
                    mode === 'TEST_1' ? 'test_1_ModeBtn' : 
                    'test_2_ModeBtn';
  const btn = document.getElementById(activeBtn);
  if (btn) {
    btn.classList.add('active');
  }
  
  // Reinitialize game if playing
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    resetGame(gameInstance);
    gameState.gamePhase = GAME_PHASES.PLAYING;
    gameState.testModeInputs = generateTestInputs(mode);
  }
};