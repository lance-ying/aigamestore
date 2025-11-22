// game.js - Main game logic

const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World } = Matter;

import { 
  gameState, 
  GAME_PHASES, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  LEVELS,
  BALL_RADIUS
} from './globals.js';

import { 
  Ball, 
  Peg, 
  Multiplier, 
  MovingObstacle 
} from './entities.js';

import { 
  setupCollisionHandling, 
  createWalls 
} from './physics.js';

import { handleInput } from './controls.js';

import {
  renderStartScreen,
  renderGame,
  renderPausedOverlay,
  renderGameOver
} from './render.js';

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    p.rectMode(p.CENTER);
    p.imageMode(p.CENTER);
    
    // Create Matter.js engine and world
    const engine = Engine.create();
    const world = engine.world;
    world.gravity.y = 0.5;
    
    gameState.engine = engine;
    gameState.world = world;
    
    // Initialize p5.logs (write-only)
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
    
    // Setup physics collision handling
    setupCollisionHandling(p);
    
    // Create walls
    createWalls(p);
  };
  
  p.draw = function() {
    // Update physics engine only when playing
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      Engine.update(gameState.engine, 1000 / 60);
    }
    
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
        handleInput(p);
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
    
    // Phase transitions
    if (p.keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) { // ENTER
      startLevel(p, gameState.currentLevel);
      gameState.gamePhase = GAME_PHASES.PLAYING;
      
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.PLAYING, level: gameState.currentLevel },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    if (p.keyCode === 27) { // ESC
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
    
    if (p.keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ||
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        resetGame(p);
      }
    }
    
    // Gameplay controls
    if (gameState.gamePhase === GAME_PHASES.PLAYING && 
        gameState.controlMode === "HUMAN") {
      gameState.keys[p.keyCode] = true;
      
      if (p.keyCode === 32) { // SPACE
        dropBall(p);
      }
    }
    
    return false;
  };
  
  p.keyReleased = function() {
    gameState.keys[p.keyCode] = false;
    
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

function updateGame(p) {
  // Update entities
  gameState.balls.forEach(ball => ball.update());
  gameState.pegs.forEach(peg => peg.update());
  gameState.multipliers.forEach(mult => mult.update());
  gameState.movingObstacles.forEach(obs => obs.update());
  
  // Update particles
  gameState.particles = gameState.particles.filter(particle => {
    particle.update();
    return !particle.isDead();
  });
  
  // Remove inactive balls
  gameState.balls = gameState.balls.filter(ball => ball.active);
  
  // Check win/lose conditions
  const levelConfig = LEVELS[gameState.currentLevel - 1];
  
  // Win condition
  if (gameState.score >= levelConfig.targetScore) {
    if (gameState.currentLevel < LEVELS.length) {
      // Advance to next level
      gameState.currentLevel++;
      startLevel(p, gameState.currentLevel);
    } else {
      // Game complete
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      p.logs.game_info.push({
        data: { 
          gamePhase: GAME_PHASES.GAME_OVER_WIN,
          finalScore: gameState.score,
          allLevelsComplete: true
        },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  // Lose condition
  if (gameState.ballsRemaining === 0 && 
      gameState.ballsInPlay === 0 && 
      gameState.score < levelConfig.targetScore) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    p.logs.game_info.push({
      data: { 
        gamePhase: GAME_PHASES.GAME_OVER_LOSE,
        finalScore: gameState.score,
        targetScore: levelConfig.targetScore
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function startLevel(p, levelNum) {
  // Clear existing entities
  clearLevel();
  
  const levelConfig = LEVELS[levelNum - 1];
  
  // Reset level state
  gameState.ballsRemaining = levelConfig.ballsAllowed;
  gameState.ballsInPlay = 0;
  gameState.score = 0;
  
  // Create pegs
  levelConfig.pegs.forEach(pegData => {
    const peg = new Peg(p, pegData.x, pegData.y, pegData.radius);
    gameState.pegs.push(peg);
  });
  
  // Create multipliers
  levelConfig.multipliers.forEach(multData => {
    const mult = new Multiplier(
      p, 
      multData.x, 
      multData.y, 
      multData.width, 
      multData.height,
      multData.type,
      multData.value
    );
    gameState.multipliers.push(mult);
  });
  
  // Create moving obstacles
  levelConfig.movingObstacles.forEach(obsData => {
    const obs = new MovingObstacle(
      p,
      obsData.startX,
      obsData.endX,
      obsData.y,
      obsData.speed,
      obsData.width,
      obsData.height
    );
    gameState.movingObstacles.push(obs);
  });
  
  p.logs.game_info.push({
    data: { 
      event: 'level_start',
      level: levelNum,
      targetScore: levelConfig.targetScore,
      ballsAllowed: levelConfig.ballsAllowed
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function clearLevel() {
  // Remove all balls
  gameState.balls.forEach(ball => ball.remove());
  gameState.balls = [];
  
  // Remove pegs
  gameState.pegs.forEach(peg => {
    if (peg.body) {
      World.remove(gameState.world, peg.body);
    }
  });
  gameState.pegs = [];
  
  // Remove multipliers
  gameState.multipliers.forEach(mult => {
    if (mult.body) {
      World.remove(gameState.world, mult.body);
    }
  });
  gameState.multipliers = [];
  
  // Remove moving obstacles
  gameState.movingObstacles.forEach(obs => {
    if (obs.body) {
      World.remove(gameState.world, obs.body);
    }
  });
  gameState.movingObstacles = [];
  
  // Clear particles
  gameState.particles = [];
}

export function dropBall(p) {
  if (gameState.ballsRemaining > 0 && gameState.gamePhase === GAME_PHASES.PLAYING) {
    const ball = new Ball(p, gameState.dropX, 70, gameState.currentBallColor);
    gameState.balls.push(ball);
    gameState.ballsRemaining--;
    gameState.ballsInPlay++;
    
    gameState.currentBallColor = (gameState.currentBallColor + 1) % 6;
    
    // Log player action
    p.logs.player_info.push({
      screen_x: ball.body.position.x,
      screen_y: ball.body.position.y,
      game_x: ball.body.position.x,
      game_y: ball.body.position.y,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    p.logs.game_info.push({
      data: { 
        event: 'ball_dropped',
        ballsRemaining: gameState.ballsRemaining,
        dropX: gameState.dropX
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function resetGame(p) {
  clearLevel();
  
  gameState.currentLevel = 1;
  gameState.score = 0;
  gameState.gamePhase = GAME_PHASES.START;
  gameState.testState = {
    actionQueue: [],
    currentActionIndex: 0,
    frameCounter: 0
  };
  
  p.logs.game_info.push({
    data: { gamePhase: GAME_PHASES.START, event: 'game_reset' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

// Expose globally
window.gameInstance = gameInstance;