// input.js - Input handling

import { gameState, GAME_PHASES, MOVE_FORCE, DASH_FORCE_MULTIPLIER } from './globals.js';

export function handleKeyPressed(p) {
  const key = p.key;
  const keyCode = p.keyCode;
  
  // Log input
  if (p.logs) {
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: key, keyCode: keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Phase-specific controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    } else if (gameState.gamePhase === GAME_PHASES.LEVEL_COMPLETE) {
      nextLevel(p);
    }
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      logGamePhase(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      logGamePhase(p);
    }
  }
  
  if (keyCode === 82) { // R
    restartGame(p);
  }
  
  // Gameplay controls
  if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.player) {
    if (keyCode === 32) { // SPACE - Dash
      const now = Date.now();
      if (now - gameState.lastDashTime > gameState.dashCooldown) {
        dash(p);
        gameState.lastDashTime = now;
      }
    }
  }
}

export function handleMovementInput(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING || !gameState.player) return;
  
  let fx = 0;
  let fy = 0;
  
  // Arrow keys or WASD
  if (p.keyIsDown(37) || p.keyIsDown(65)) { // LEFT or A
    fx = -MOVE_FORCE;
  }
  if (p.keyIsDown(39) || p.keyIsDown(68)) { // RIGHT or D
    fx = MOVE_FORCE;
  }
  if (p.keyIsDown(38) || p.keyIsDown(87)) { // UP or W
    fy = -MOVE_FORCE;
  }
  if (p.keyIsDown(40) || p.keyIsDown(83)) { // DOWN or S
    fy = MOVE_FORCE;
  }
  
  if (fx !== 0 || fy !== 0) {
    gameState.player.applyForce(fx, fy);
    gameState.lastForceDirection = { x: fx, y: fy };
  }
}

function dash(p) {
  if (!gameState.player) return;
  
  let dx = gameState.lastForceDirection.x;
  let dy = gameState.lastForceDirection.y;
  
  // If no previous direction, use current velocity
  if (dx === 0 && dy === 0) {
    dx = gameState.player.vx;
    dy = gameState.player.vy;
  }
  
  // Normalize and apply dash force
  const mag = p.sqrt(dx * dx + dy * dy);
  if (mag > 0) {
    dx = (dx / mag) * MOVE_FORCE * DASH_FORCE_MULTIPLIER;
    dy = (dy / mag) * MOVE_FORCE * DASH_FORCE_MULTIPLIER;
    gameState.player.applyForce(dx, dy);
  }
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.currentLevel = 1;
  gameState.score = 0;
  setupLevel(p);
  logGamePhase(p);
}

function nextLevel(p) {
  gameState.currentLevel++;
  if (gameState.currentLevel <= 5) {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    setupLevel(p);
    logGamePhase(p);
  }
}

function restartGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.currentLevel = 1;
  gameState.score = 0;
  logGamePhase(p);
}

function setupLevel(p) {
  const { Ball, Opponent, Obstacle, Goal } = require('./entities.js');
  const { LEVEL_CONFIGS, CANVAS_WIDTH, CANVAS_HEIGHT } = require('./globals.js');
  
  const config = LEVEL_CONFIGS[gameState.currentLevel - 1];
  
  // Reset entities
  gameState.entities = [];
  gameState.opponents = [];
  gameState.obstacles = [];
  
  // Create ball
  gameState.player = new Ball(100, CANVAS_HEIGHT / 2, p);
  gameState.entities.push(gameState.player);
  
  // Create goal
  const goalWidth = 50;
  const goalHeight = 120;
  gameState.goal = new Goal(
    CANVAS_WIDTH - goalWidth - 20,
    CANVAS_HEIGHT / 2 - goalHeight / 2,
    goalWidth,
    goalHeight,
    p
  );
  
  // Create opponents
  for (let i = 0; i < config.opponents; i++) {
    let behavior = 'chase';
    let x = 300 + i * 80;
    let y = 100 + (i % 3) * 100;
    
    if (i === 0 && config.opponents > 2) {
      behavior = 'goalie';
      x = CANVAS_WIDTH - 80;
      y = CANVAS_HEIGHT / 2;
    } else if (i % 2 === 0) {
      behavior = 'patrol';
    }
    
    const opponent = new Opponent(x, y, behavior, config.opponentSpeed, p);
    gameState.opponents.push(opponent);
    gameState.entities.push(opponent);
  }
  
  // Create obstacles
  for (let i = 0; i < config.obstacleCount; i++) {
    const isMoving = i < config.movingObstacles;
    const x = 150 + (i % 3) * 120;
    const y = 80 + Math.floor(i / 3) * 120;
    const width = 30;
    const height = 80;
    const obstacle = new Obstacle(x, y, width, height, isMoving, p);
    gameState.obstacles.push(obstacle);
  }
  
  // Reset level state
  gameState.tacklesRemaining = config.tacklesAllowed;
  gameState.maxTackles = config.tacklesAllowed;
  gameState.timeRemaining = config.timeLimit;
  gameState.levelStartTime = Date.now();
  gameState.lastDashTime = 0;
}

function logGamePhase(p) {
  if (p.logs) {
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, level: gameState.currentLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

// Make setupLevel available globally for initialization
if (typeof window !== 'undefined') {
  window.setupLevel = setupLevel;
}