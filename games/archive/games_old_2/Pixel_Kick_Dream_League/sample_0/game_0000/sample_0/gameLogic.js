// gameLogic.js - Core game logic
import { gameState, GAME_PHASES, LEVELS } from './globals.js';
import { Ball, Defender, Goalkeeper } from './entities.js';

export function initializeGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.currentLevel = 1;
  gameState.score = 0;
  
  p.logs.game_info.push({
    data: { phase: gameState.gamePhase, message: 'Game initialized' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function startGame() {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.currentLevel = 1;
  gameState.score = 0;
  loadLevel(gameState.currentLevel);
  
  window.gameInstance.logs.game_info.push({
    data: { phase: gameState.gamePhase, level: gameState.currentLevel },
    framecount: window.gameInstance.frameCount,
    timestamp: Date.now()
  });
}

export function loadLevel(levelNum) {
  const levelConfig = LEVELS[levelNum - 1];
  gameState.levelData = levelConfig;
  
  // Create ball
  const ballStart = levelConfig.ballStart;
  gameState.player = new Ball(ballStart.x, ballStart.y);
  
  // Create defenders
  gameState.entities = [gameState.player];
  levelConfig.defenders.forEach(defConfig => {
    const defender = new Defender(defConfig);
    gameState.entities.push(defender);
  });
  
  // Create goalkeeper
  const goalkeeper = new Goalkeeper(levelConfig.goalkeeper);
  gameState.entities.push(goalkeeper);
  
  // Reset state
  gameState.aimAngle = -Math.PI / 2;
  gameState.shotPower = 50;
  gameState.shotCurveDirection = 'NONE';
  gameState.isShotTaken = false;
  gameState.isGoal = false;
  gameState.shotPhase = 'AIMING';
  gameState.defenderCollisions = 0;
  gameState.ballStopped = false;
  gameState.goalKeeperPosition = 300;
  
  logPlayerInfo();
}

export function updateGame(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  const ball = gameState.player;
  const levelData = gameState.levelData;
  
  // Update all entities
  gameState.entities.forEach(entity => {
    if (entity.update) {
      entity.update(p);
    }
  });
  
  // Update goalkeeper
  const goalkeeper = gameState.entities.find(e => e instanceof Goalkeeper);
  if (goalkeeper) {
    goalkeeper.update(p, ball, levelData.goalWidth);
    gameState.goalKeeperPosition = goalkeeper.x;
  }
  
  if (gameState.shotPhase === 'FLYING') {
    // Check collisions with defenders
    const defenders = gameState.entities.filter(e => e instanceof Defender);
    defenders.forEach(defender => {
      if (defender.checkCollision(ball)) {
        defender.deflectBall(ball);
        gameState.defenderCollisions++;
      }
    });
    
    // Check collision with goalkeeper
    if (goalkeeper && goalkeeper.checkCollision(ball)) {
      goalkeeper.blockBall(ball);
    }
    
    // Check for goal
    checkGoal(ball, levelData);
    
    // Check for miss conditions
    if (ball.outOfBounds || (ball.stopped && !gameState.isGoal)) {
      gameState.shotPhase = 'COMPLETE';
      setTimeout(() => {
        if (gameState.isGoal) {
          handleLevelWin();
        } else {
          handleLevelLose();
        }
      }, 1000);
    }
  }
  
  // Log player info periodically
  if (p.frameCount % 10 === 0) {
    logPlayerInfo();
  }
}

function checkGoal(ball, levelData) {
  const goalWidth = levelData.goalWidth;
  const goalLeft = 300 - goalWidth / 2;
  const goalRight = 300 + goalWidth / 2;
  const goalTop = 50;
  const goalBottom = 90;
  
  if (ball.x > goalLeft && ball.x < goalRight && 
      ball.y > goalTop && ball.y < goalBottom &&
      ball.active) {
    gameState.isGoal = true;
    ball.active = false;
    ball.stopped = true;
  }
}

function handleLevelWin() {
  let points = 100;
  if (gameState.defenderCollisions === 0) {
    points += 50;
  }
  gameState.score += points;
  
  if (gameState.currentLevel < gameState.totalLevels) {
    gameState.currentLevel++;
    loadLevel(gameState.currentLevel);
  } else {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    window.gameInstance.logs.game_info.push({
      data: { phase: gameState.gamePhase, finalScore: gameState.score },
      framecount: window.gameInstance.frameCount,
      timestamp: Date.now()
    });
  }
}

function handleLevelLose() {
  gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
  window.gameInstance.logs.game_info.push({
    data: { phase: gameState.gamePhase, level: gameState.currentLevel },
    framecount: window.gameInstance.frameCount,
    timestamp: Date.now()
  });
}

export function togglePause() {
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    gameState.gamePhase = GAME_PHASES.PAUSED;
    window.gameInstance.noLoop();
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    window.gameInstance.loop();
  }
  
  window.gameInstance.logs.game_info.push({
    data: { phase: gameState.gamePhase },
    framecount: window.gameInstance.frameCount,
    timestamp: Date.now()
  });
}

export function restartGame() {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.currentLevel = 1;
  gameState.score = 0;
  
  window.gameInstance.logs.game_info.push({
    data: { phase: gameState.gamePhase, message: 'Game restarted' },
    framecount: window.gameInstance.frameCount,
    timestamp: Date.now()
  });
}

function logPlayerInfo() {
  if (!gameState.player) return;
  
  window.gameInstance.logs.player_info.push({
    screen_x: gameState.player.x,
    screen_y: gameState.player.y,
    game_x: gameState.player.x,
    game_y: gameState.player.y,
    framecount: window.gameInstance.frameCount
  });
}