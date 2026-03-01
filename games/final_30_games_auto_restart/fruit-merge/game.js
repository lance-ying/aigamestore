// game.js - Main game logic and initialization

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies, Body, Runner } = Matter;

import { 
  gameState, 
  logs,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CONTAINER_WIDTH,
  CONTAINER_HEIGHT,
  CONTAINER_X,
  CONTAINER_Y,
  CONTAINER_WALL_THICKNESS,
  FRUIT_TYPES,
  DANGER_LINE_Y,
  DANGER_LINE_GRACE_FRAMES,
  LEVELS
} from './globals.js';

import { Fruit, Container } from './entities.js';
import { setupPhysics, processMerges, checkDangerZone } from './physics.js';
import { setupInput, updateInput } from './input.js';
import { render } from './render.js';

// Initialize the game
function init() {
  // Seed random for reproducibility
  Math.seedrandom(42);
  
  // Get canvas and context
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  
  gameState.canvas = canvas;
  gameState.ctx = ctx;
  
  // Create Matter.js engine
  const engine = Engine.create();
  const world = engine.world;
  world.gravity.y = 1;
  
  gameState.engine = engine;
  gameState.world = world;
  
  // Create container
  const container = new Container(
    CONTAINER_X,
    CONTAINER_Y,
    CONTAINER_WIDTH,
    CONTAINER_HEIGHT,
    CONTAINER_WALL_THICKNESS
  );
  gameState.container = container;
  
  // Create container walls
  const leftWall = Bodies.rectangle(
    CONTAINER_X - CONTAINER_WIDTH / 2 - CONTAINER_WALL_THICKNESS / 2,
    CONTAINER_Y,
    CONTAINER_WALL_THICKNESS,
    CONTAINER_HEIGHT,
    { isStatic: true, label: 'wall' }
  );
  
  const rightWall = Bodies.rectangle(
    CONTAINER_X + CONTAINER_WIDTH / 2 + CONTAINER_WALL_THICKNESS / 2,
    CONTAINER_Y,
    CONTAINER_WALL_THICKNESS,
    CONTAINER_HEIGHT,
    { isStatic: true, label: 'wall' }
  );
  
  const bottomWall = Bodies.rectangle(
    CONTAINER_X,
    CONTAINER_Y + CONTAINER_HEIGHT / 2 + CONTAINER_WALL_THICKNESS / 2,
    CONTAINER_WIDTH + CONTAINER_WALL_THICKNESS * 2,
    CONTAINER_WALL_THICKNESS,
    { isStatic: true, label: 'wall' }
  );
  
  gameState.walls = [leftWall, rightWall, bottomWall];
  World.add(world, gameState.walls);
  
  // Setup physics
  setupPhysics();
  
  // Setup input
  setupInput();
  
  // Initialize danger line position (default)
  gameState.dangerLineY = LEVELS[0].dangerY || DANGER_LINE_Y;
  gameState.dangerGraceFrames = DANGER_LINE_GRACE_FRAMES;
  
  // Log initial state
  logs.game_info.push({
    game_status: 'START',
    data: {},
    framecount: 0,
    timestamp: Date.now()
  });
  
  // Start game loop
  gameLoop();
}

export function startGame() {
  gameState.gamePhase = 'PLAYING';
  gameState.score = 0;
  gameState.currentLevelIndex = 0;
  gameState.frameCount = 0;
  gameState.dangerFrameCount = 0;
  gameState.isDropping = false;
  gameState.dropX = CANVAS_WIDTH / 2;
  gameState.mergeQueue = [];
  
  // Set initial danger line
  gameState.dangerLineY = LEVELS[0].dangerY || DANGER_LINE_Y;
  
  // Clear all entities
  gameState.entities.forEach(entity => {
    if (entity instanceof Fruit) {
      World.remove(gameState.world, entity.body);
    }
  });
  gameState.entities = [];
  
  // Initialize both current and next fruit types
  gameState.currentFruitType = Math.floor(Math.random() * Math.min(5, FRUIT_TYPES.length));
  gameState.nextFruitType = Math.floor(Math.random() * Math.min(5, FRUIT_TYPES.length));
  gameState.currentFruit = true;
  
  logs.game_info.push({
    game_status: 'PLAYING',
    data: {},
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}

export function pauseGame() {
  gameState.gamePhase = 'PAUSED';
  
  logs.game_info.push({
    game_status: 'PAUSED',
    data: {},
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}

export function restartGame() {
  // Clear any pending auto-restart timer if a manual restart occurs
  if (gameState.autoRestartTimeoutId) {
    clearTimeout(gameState.autoRestartTimeoutId);
    gameState.autoRestartTimeoutId = null;
  }
  gameState.autoRestartScheduled = false; // Reset the flag

  gameState.gamePhase = 'START';
  
  // Clear all entities
  gameState.entities.forEach(entity => {
    if (entity instanceof Fruit) {
      World.remove(gameState.world, entity.body);
    }
  });
  gameState.entities = [];
  gameState.mergeQueue = [];
  
  // Reset level info
  gameState.currentLevelIndex = 0;
  gameState.dangerLineY = LEVELS[0].dangerY || DANGER_LINE_Y;
  
  logs.game_info.push({
    game_status: 'START',
    data: {},
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}

export function dropCurrentFruit(quickDrop) {
  if (gameState.isDropping || !gameState.currentFruit) return;
  
  gameState.isDropping = true;
  
  // Spawn fruit at y=80 (safely inside container) instead of y=50
  const spawnY = 80;
  
  // Use the current fruit type for dropping
  const fruit = new Fruit(gameState.dropX, spawnY, gameState.currentFruitType);
  
  // If quick drop, give it initial velocity
  if (quickDrop) {
    Body.setVelocity(fruit.body, { x: 0, y: 8 });
  }
  
  World.add(gameState.world, fruit.body);
  gameState.entities.push(fruit);
  
  logs.player_info.push({
    screen_x: gameState.dropX,
    screen_y: spawnY,
    game_x: fruit.body.position.x,
    game_y: fruit.body.position.y,
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
  
  // Move next fruit to current, and generate new next fruit
  gameState.currentFruitType = gameState.nextFruitType;
  gameState.nextFruitType = Math.floor(Math.random() * Math.min(5, FRUIT_TYPES.length));
  
  // Wait a moment before allowing next drop
  setTimeout(() => {
    gameState.isDropping = false;
  }, 500);
}

function updateGame() {
  if (gameState.gamePhase !== 'PLAYING') return;
  
  gameState.frameCount++;
  
  // Update input
  updateInput();
  
  // Process merges (now happens automatically in collision handler)
  processMerges();
  
  // Check danger zone
  checkDangerZone();
  
  // Log player info periodically
  if (gameState.frameCount % 60 === 0 && gameState.entities.length > 0) {
    const playerFruit = gameState.entities[0];
    if (playerFruit instanceof Fruit) {
      logs.player_info.push({
        screen_x: playerFruit.body.position.x,
        screen_y: playerFruit.body.position.y,
        game_x: playerFruit.body.position.x,
        game_y: playerFruit.body.position.y,
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

function gameLoop() {
  requestAnimationFrame(gameLoop);
  
  // Update physics
  if (gameState.gamePhase === 'PLAYING') {
    Engine.update(gameState.engine, 1000 / 60);
    updateGame();
  } else if (gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE') {
    // Auto-restart logic after game over
    if (!gameState.autoRestartScheduled) {
      gameState.autoRestartScheduled = true;
      gameState.autoRestartTimeoutId = setTimeout(() => {
        restartGame(); // This will also reset autoRestartScheduled and autoRestartTimeoutId
      }, 1000); // 1 second delay
    }
  }
  
  // Render
  render();
}

// Start the game
init();

// Expose level loading for dev mode
window.loadLevel = function(levelNum) {
  const state = window.getGameState ? window.getGameState() : window.gameState;
  if (state) {
    state.currentLevel = levelNum;
    if (typeof loadLevel === 'function') {
      loadLevel(levelNum);
    } else if (typeof initializeLevel === 'function') {
      initializeLevel(levelNum);
    }
    if (state.gamePhase !== undefined) {
      state.gamePhase = "PLAYING";
    }
  }
};