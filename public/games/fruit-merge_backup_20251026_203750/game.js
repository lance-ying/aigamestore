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
  DANGER_LINE_GRACE_FRAMES
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
  
  // Initialize danger line position
  gameState.dangerLineY = DANGER_LINE_Y;
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
  gameState.frameCount = 0;
  gameState.dangerFrameCount = 0;
  gameState.isDropping = false;
  gameState.dropX = CANVAS_WIDTH / 2;
  gameState.mergeQueue = [];
  
  // Clear all entities
  gameState.entities.forEach(entity => {
    if (entity instanceof Fruit) {
      World.remove(gameState.world, entity.body);
    }
  });
  gameState.entities = [];
  
  // Create first fruit
  createNextFruit();
  
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
  gameState.gamePhase = 'START';
  
  // Clear all entities
  gameState.entities.forEach(entity => {
    if (entity instanceof Fruit) {
      World.remove(gameState.world, entity.body);
    }
  });
  gameState.entities = [];
  gameState.mergeQueue = [];
  
  logs.game_info.push({
    game_status: 'START',
    data: {},
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}

function createNextFruit() {
  // Random fruit type from the first 5 types
  gameState.nextFruitType = Math.floor(Math.random() * Math.min(5, FRUIT_TYPES.length));
  gameState.currentFruit = true;
  gameState.isDropping = false;
}

export function dropCurrentFruit(quickDrop) {
  if (gameState.isDropping || !gameState.currentFruit) return;
  
  gameState.isDropping = true;
  
  const fruit = new Fruit(gameState.dropX, 50, gameState.nextFruitType);
  
  // If quick drop, give it initial velocity (reduced from 15 to 8 to prevent phasing)
  if (quickDrop) {
    Body.setVelocity(fruit.body, { x: 0, y: 8 });
  }
  
  World.add(gameState.world, fruit.body);
  gameState.entities.push(fruit);
  
  logs.player_info.push({
    screen_x: gameState.dropX,
    screen_y: 50,
    game_x: fruit.body.position.x,
    game_y: fruit.body.position.y,
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
  
  // Wait a moment before allowing next drop
  setTimeout(() => {
    createNextFruit();
  }, 500);
}

function updateGame() {
  if (gameState.gamePhase !== 'PLAYING') return;
  
  gameState.frameCount++;
  
  // Update input
  updateInput();
  
  // Process merges
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
  }
  
  // Render
  render();
}

// Start the game
init();