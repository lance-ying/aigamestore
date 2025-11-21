// game_logic.js - Core game logic

import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_HEIGHT, BIRD_SIZE, 
  gameState, OBSTACLE_MIN_GAP, OBSTACLE_MAX_GAP, FEATHER_SPAWN_CHANCE,
  BIRD_SPEED
} from './globals.js';
import { Bird, Obstacle, Feather } from './entities.js';

export function initGame(p) {
  // Reset game state
  gameState.player = new Bird(p, 100, CANVAS_HEIGHT / 2);
  gameState.entities = [gameState.player];
  gameState.obstacles = [];
  gameState.feathers = [];
  gameState.eggs = [];
  gameState.score = 0;
  gameState.distance = 0;
  gameState.featherCount = 0;
  gameState.birdSpeed = BIRD_SPEED;
  gameState.obstacleTimer = 0;
  gameState.perfectLandings = 0;
  gameState.feverMode = false;
  gameState.feverTimer = 0;
  gameState.lastObstacleX = CANVAS_WIDTH;
  gameState.difficultyLevel = 1;
  gameState.framesSinceLastJump = 0;
  gameState.lastGroundTouchY = -1;
  gameState.wasInAir = true;

  p.logs.game_info.push({
    data: { phase: "PLAYING", message: "Game initialized" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateGame(p) {
  if (gameState.gamePhase !== "PLAYING") return;

  // Update bird
  gameState.player.update();

  // Update eggs
  gameState.eggs = gameState.eggs.filter(egg => egg.update());

  // Update fever mode
  if (gameState.feverMode) {
    gameState.feverTimer--;
    if (gameState.feverTimer <= 0) {
      gameState.feverMode = false;
      gameState.perfectLandings = 0;
    }
  }

  // Spawn obstacles
  gameState.obstacleTimer++;
  if (gameState.obstacleTimer > 60 && gameState.lastObstacleX < CANVAS_WIDTH - OBSTACLE_MIN_GAP) {
    spawnObstacle(p);
    gameState.obstacleTimer = 0;
  }

  // Update obstacles
  for (let obstacle of gameState.obstacles) {
    obstacle.update(gameState.birdSpeed);
    
    // Check collision
    if (obstacle.checkCollision(gameState.player)) {
      gameOver(p, false);
      return;
    }
  }

  // Update feathers
  for (let feather of gameState.feathers) {
    feather.update(gameState.birdSpeed);
    feather.checkCollection(gameState.player);
  }

  // Remove off-screen obstacles and feathers
  gameState.obstacles = gameState.obstacles.filter(o => !o.isOffScreen());
  gameState.feathers = gameState.feathers.filter(f => !f.isOffScreen() && !f.collected);

  // Update distance and score
  gameState.distance += gameState.birdSpeed;
  if (p.frameCount % 10 === 0) {
    gameState.score += gameState.feverMode ? 2 : 1;
  }

  // Increase difficulty
  if (gameState.distance > 1000 * gameState.difficultyLevel) {
    gameState.difficultyLevel++;
    gameState.birdSpeed = Math.min(BIRD_SPEED + gameState.difficultyLevel * 0.3, 6);
  }

  // Check if bird is alive
  if (!gameState.player.isAlive) {
    gameOver(p, false);
  }

  // Log player info periodically
  if (p.frameCount % 30 === 0) {
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.distance,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
}

function spawnObstacle(p) {
  const random = p.random();
  const isGap = random < 0.3; // 30% chance of gap
  
  let height;
  if (isGap) {
    height = 0; // Gap doesn't have height
  } else {
    // Barrier height increases with difficulty
    const minHeight = 2 + Math.floor(gameState.difficultyLevel / 3);
    const maxHeight = 4 + Math.floor(gameState.difficultyLevel / 2);
    height = Math.floor(p.random(minHeight, maxHeight + 1));
  }

  const obstacle = new Obstacle(p, CANVAS_WIDTH + 50, height, isGap);
  gameState.obstacles.push(obstacle);
  gameState.lastObstacleX = obstacle.x;

  // Spawn feather near obstacle
  if (p.random() < FEATHER_SPAWN_CHANCE) {
    const featherY = CANVAS_HEIGHT - GROUND_HEIGHT - p.random(50, 150);
    const feather = new Feather(p, obstacle.x + p.random(-30, 30), featherY);
    gameState.feathers.push(feather);
  }
}

export function handleInput(p, keyCode) {
  if (gameState.gamePhase !== "PLAYING") return;

  if (keyCode === 32) { // SPACE
    gameState.player.jump();
    gameState.player.layEgg();
    
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: " ", keyCode: 32, action: "jump_and_lay_egg" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function gameOver(p, won) {
  gameState.gamePhase = won ? "GAME_OVER_WIN" : "GAME_OVER_LOSE";
  
  p.logs.game_info.push({
    data: { 
      phase: gameState.gamePhase, 
      finalScore: gameState.score,
      distance: Math.floor(gameState.distance),
      feathers: gameState.featherCount
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}