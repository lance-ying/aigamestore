// game.js - Main game file with p5.js instance

const p5 = window.p5;

import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, INITIAL_SNAKE_LENGTH } from './globals.js';
import { SnakeBall } from './entities.js';
import { updatePhysics, checkCollisions, cleanupEntities } from './physics.js';
import { spawnEntities } from './spawner.js';
import { handlePlayerInput } from './controls.js';
import { renderStartScreen, renderGame, renderPausedOverlay, renderGameOver } from './rendering.js';

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
      case "START":
        renderStartScreen(p);
        break;
        
      case "PLAYING":
        updateGame(p);
        renderGame(p);
        logPlayerInfo(p);
        break;
        
      case "PAUSED":
        renderGame(p);
        renderPausedOverlay(p);
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
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
    
    // Handle phase controls
    if (p.keyCode === 13 && gameState.gamePhase === "START") { // ENTER
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { gamePhase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === "PLAYING") {
        gameState.gamePhase = "PAUSED";
        p.logs.game_info.push({
          data: { gamePhase: "PAUSED" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === "PAUSED") {
        gameState.gamePhase = "PLAYING";
        p.logs.game_info.push({
          data: { gamePhase: "PLAYING" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    if (p.keyCode === 82) { // R
      if (gameState.gamePhase === "GAME_OVER_WIN" || 
          gameState.gamePhase === "GAME_OVER_LOSE") {
        resetGame(p);
        gameState.gamePhase = "START";
        p.logs.game_info.push({
          data: { gamePhase: "START" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    return false;
  };
});

function initializeGame(p) {
  // Reset game state
  gameState.snakeBalls = [];
  gameState.blocks = [];
  gameState.collectibles = [];
  gameState.entities = [];
  gameState.snakeLength = INITIAL_SNAKE_LENGTH;
  gameState.snakeX = CANVAS_WIDTH / 2;
  gameState.score = 0;
  gameState.distance = 0;
  gameState.difficulty = 1;
  gameState.nextSpawnY = -100;
  gameState.framesSinceLastLog = 0;
  
  // Create initial snake
  for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
    const ball = new SnakeBall(
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2 + i * 18,
      i === 0
    );
    gameState.snakeBalls.push(ball);
  }
  
  gameState.lastLoggedX = CANVAS_WIDTH / 2;
  gameState.lastLoggedY = CANVAS_HEIGHT / 2;
}

function updateGame(p) {
  // Handle input
  handlePlayerInput(p);
  
  // Update physics
  updatePhysics(p);
  
  // Check collisions
  checkCollisions(p);
  
  // Spawn new entities
  spawnEntities(p);
  
  // Cleanup
  cleanupEntities();
}

function resetGame(p) {
  initializeGame(p);
}

function logPlayerInfo(p) {
  gameState.framesSinceLastLog++;
  
  const head = gameState.snakeBalls[0];
  if (!head) return;
  
  const dx = Math.abs(head.x - gameState.lastLoggedX);
  const dy = Math.abs(head.y - gameState.lastLoggedY);
  
  if (gameState.framesSinceLastLog >= 30 || dx > 20 || dy > 20) {
    p.logs.player_info.push({
      screen_x: head.x,
      screen_y: head.y,
      game_x: head.x,
      game_y: head.y,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    gameState.lastLoggedX = head.x;
    gameState.lastLoggedY = head.y;
    gameState.framesSinceLastLog = 0;
  }
}

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
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  console.log('Control mode set to:', mode);
};