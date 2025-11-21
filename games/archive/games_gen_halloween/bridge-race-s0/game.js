// game.js - Main game file

const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies, Body, Events } = Matter;

import {
  gameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAYER_START_X,
  PLAYER_START_Y,
  NUM_LANES,
  LANE_WIDTH,
  COLORS,
  GAME_PHASES,
  CONTROL_MODES,
  getGameState
} from './globals.js';

import { Racer } from './entities.js';
import { setupCollisionHandling } from './physics.js';
import { updateAI } from './ai.js';
import { generateLevel } from './levelgen.js';
import {
  renderStartScreen,
  renderGame,
  renderPausedOverlay,
  renderGameOver
} from './render.js';
import {
  handlePlayerInput,
  handleKeyPressed,
  handleKeyReleased
} from './controls.js';

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Create Matter.js engine
    gameState.engine = Engine.create();
    gameState.world = gameState.engine.world;
    gameState.world.gravity.y = 0; // Top-down view, no gravity
    
    // Setup collision handling
    setupCollisionHandling(p);
    
    // Initialize p5.logs
    p.logs = {
      game_info: [],
      player_info: [],
      inputs: []
    };
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, level: gameState.level },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Update Matter.js physics
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      Engine.update(gameState.engine, 1000 / 60);
    }
    
    // Game loop
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
    return handleKeyPressed(p);
  };
  
  p.keyReleased = function() {
    return handleKeyReleased(p);
  };
});

function initializeGame(p) {
  // Generate level
  const levelData = generateLevel(p, gameState.level);
  gameState.blocks = levelData.blocks;
  gameState.bridges = levelData.bridges;
  
  // Create player
  gameState.player = new Racer(
    p,
    PLAYER_START_X,
    PLAYER_START_Y,
    COLORS.PLAYER,
    true
  );
  
  // Create AI racers
  const trackLeft = (CANVAS_WIDTH - NUM_LANES * LANE_WIDTH) / 2;
  const aiColors = [COLORS.AI_1, COLORS.AI_2, COLORS.AI_3];
  const aiLanes = [1, 2, 3];
  
  for (let i = 0; i < 3; i++) {
    const aiX = trackLeft + aiLanes[i] * LANE_WIDTH + LANE_WIDTH / 2;
    const aiY = PLAYER_START_Y + (i + 1) * 40;
    const ai = new Racer(p, aiX, aiY, aiColors[i], false);
    gameState.aiRacers.push(ai);
  }
  
  // Reset game state
  gameState.camera = { y: 0 };
  gameState.raceFinished = false;
  gameState.finishResults = [];
  gameState.droppedBlocks = [];
  
  // Log initialization
  p.logs.player_info.push({
    screen_x: gameState.player.body.position.x,
    screen_y: gameState.player.body.position.y,
    game_x: gameState.player.body.position.x,
    game_y: gameState.player.worldY,
    blocks: 0,
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function updateGame(p) {
  // Initialize game on first frame of playing
  if (!gameState.player) {
    initializeGame(p);
  }
  
  // Update player
  if (gameState.player) {
    handlePlayerInput(p);
    gameState.player.update();
  }
  
  // Update AI
  gameState.aiRacers.forEach(ai => {
    updateAI(ai);
    ai.update();
  });
  
  // Update blocks
  gameState.blocks.forEach(block => {
    block.update();
    
    // Check collision with player
    if (gameState.player && !gameState.player.finished) {
      block.checkCollision(gameState.player);
    }
    
    // Check collision with AI
    gameState.aiRacers.forEach(ai => {
      if (!ai.finished) {
        block.checkCollision(ai);
      }
    });
  });
  
  // Update dropped blocks
  gameState.droppedBlocks = gameState.droppedBlocks.filter(block => {
    block.update();
    
    // Check collision with player
    if (gameState.player && !gameState.player.finished) {
      block.checkCollision(gameState.player);
    }
    
    // Check collision with AI
    gameState.aiRacers.forEach(ai => {
      if (!ai.finished) {
        block.checkCollision(ai);
      }
    });
    
    return !block.collected;
  });
  
  // Update bridges
  const allRacers = [gameState.player, ...gameState.aiRacers];
  gameState.bridges.forEach(bridge => {
    bridge.update(allRacers);
  });
  
  // Check win/lose conditions
  if (gameState.raceFinished && gameState.player.finished) {
    const playerPosition = gameState.finishResults.findIndex(r => r.isPlayer) + 1;
    
    if (playerPosition === 1) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    } else {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    }
    
    p.logs.game_info.push({
      data: {
        gamePhase: gameState.gamePhase,
        position: playerPosition,
        level: gameState.level
      },
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
    Object.keys(CONTROL_MODES).forEach(key => {
      const btn = document.getElementById(`${key.toLowerCase()}ModeBtn`);
      if (btn) {
        if (key === mode) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      }
    });
    
    console.log(`Control mode set to: ${mode}`);
  }
};