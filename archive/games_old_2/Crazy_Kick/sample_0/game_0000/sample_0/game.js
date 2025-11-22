// game.js - Main game file

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, LEVEL_CONFIGS } from './globals.js';
import { Ball, Opponent, Obstacle, Goal } from './entities.js';
import { drawStartScreen, drawPlayingScreen, drawPausedScreen, drawLevelCompleteScreen, drawGameOverScreen } from './rendering.js';
import { updatePhysics } from './physics.js';
import { handleKeyPressed, handleMovementInput } from './input.js';
import { handleTestingMode } from './testing.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize the logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Load high score from localStorage
    if (typeof localStorage !== 'undefined') {
      const savedHighScore = localStorage.getItem('crazyKickHighScore');
      if (savedHighScore) {
        gameState.highScore = parseInt(savedHighScore, 10);
      }
    }
    
    // Log initial game phase
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Handle automated testing
    handleTestingMode(p);
    
    // Update game state based on phase
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGameplay(p);
    }
    
    // Render based on phase
    if (gameState.gamePhase === GAME_PHASES.START) {
      drawStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      drawPlayingScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      drawPausedScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.LEVEL_COMPLETE) {
      drawLevelCompleteScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
      drawGameOverScreen(p, true);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      drawGameOverScreen(p, false);
    }
  };

  p.keyPressed = function() {
    handleKeyPressed(p);
  };

  function updateGameplay(p) {
    // Handle movement input
    handleMovementInput(p);
    
    // Update physics
    updatePhysics(p);
    
    // Update timer
    const elapsed = (Date.now() - gameState.levelStartTime) / 1000;
    const config = LEVEL_CONFIGS[gameState.currentLevel - 1];
    gameState.timeRemaining = config.timeLimit - elapsed;
    
    // Check lose conditions
    if (gameState.tacklesRemaining <= 0) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      updateHighScore();
      logGamePhase(p);
    }
    
    if (gameState.timeRemaining <= 0) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      updateHighScore();
      logGamePhase(p);
    }
    
    // Log player info periodically
    if (p.frameCount % 10 === 0 && gameState.player) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
  }

  function updateHighScore() {
    if (gameState.score > gameState.highScore) {
      gameState.highScore = gameState.score;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('crazyKickHighScore', gameState.highScore.toString());
      }
    }
  }

  function logGamePhase(p) {
    if (p.logs) {
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase, level: gameState.currentLevel, score: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  function setupLevel(p) {
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

  // Expose setupLevel for input.js
  p.setupLevel = setupLevel;
});

// Expose the game instance globally
window.gameInstance = gameInstance;

// Expose getGameState globally
window.getGameState = function() {
  return gameState;
};

// Expose setControlMode globally
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
};