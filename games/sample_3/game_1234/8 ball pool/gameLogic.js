// gameLogic.js - Core game logic
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Body } = Matter;

import { gameState, BALL_COLORS, TABLE_X, TABLE_Y, TABLE_WIDTH, TABLE_HEIGHT } from './globals.js';
import { Ball, CueStick, Table } from './entities.js';
import { checkPockets, checkAllBallsStopped } from './physics.js';
import { aiTakeShot } from './ai.js';

export function initializeGame(p) {
  // Clear existing entities
  gameState.entities = [];
  gameState.ballsOnTable = [];
  gameState.pocketedBallsPlayer = [];
  gameState.pocketedBallsAI = [];
  
  // Create table
  gameState.table = new Table(p, gameState.world);
  
  // Set level parameters
  setLevelParameters();
  
  // Create balls in rack formation
  createBallRack(p);
  
  // Create cue stick
  gameState.cueStick = new CueStick(p);
  
  // Reset game state
  gameState.playingPhase = "AIMING";
  gameState.currentTurn = "PLAYER";
  gameState.playerBallsType = "open";
  gameState.aiBallsType = "open";
  gameState.aimAngle = 0;
  gameState.shotPower = 0;
  gameState.spinEffect = { x: 0, y: 0 };
  gameState.foulStatus = false;
  gameState.ballInHand = false;
  gameState.isBreak = true;
  gameState.waitingForBallsToStop = false;
  gameState.aiThinkTime = 0;
  gameState.lastPocketedBalls = [];
  gameState.firstContactBall = null;
  gameState.cushionHits = 0;
}

function setLevelParameters() {
  switch (gameState.level) {
    case 1:
      gameState.levelParams = {
        pocketSizeMultiplier: 1.0,
        tableFriction: 0.01,
        aiSkill: 0.2
      };
      break;
    case 2:
      gameState.levelParams = {
        pocketSizeMultiplier: 0.85,
        tableFriction: 0.015,
        aiSkill: 0.5
      };
      break;
    case 3:
      gameState.levelParams = {
        pocketSizeMultiplier: 1.0,
        tableFriction: 0.02,
        aiSkill: 0.75
      };
      break;
    case 4:
      gameState.levelParams = {
        pocketSizeMultiplier: 1.0,
        tableFriction: 0.008,
        aiSkill: 0.9
      };
      break;
  }
}

function createBallRack(p) {
  // Create cue ball
  const cueBall = new Ball(p, TABLE_X + 100, TABLE_Y + TABLE_HEIGHT / 2, 0);
  gameState.cueBall = cueBall;
  gameState.ballsOnTable.push(cueBall);
  gameState.entities.push(cueBall);
  
  // Rack position (right side of table)
  const rackX = TABLE_X + TABLE_WIDTH - 120;
  const rackY = TABLE_Y + TABLE_HEIGHT / 2;
  const spacing = 17;
  
  // 15-ball rack formation
  const rackOrder = [1, 9, 2, 10, 8, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15];
  let ballIndex = 0;
  
  // 5 rows
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col <= row; col++) {
      if (ballIndex >= rackOrder.length) break;
      
      const x = rackX + row * spacing * 0.866;
      const y = rackY + (col - row / 2) * spacing;
      
      const ball = new Ball(p, x, y, rackOrder[ballIndex]);
      gameState.ballsOnTable.push(ball);
      gameState.entities.push(ball);
      ballIndex++;
    }
  }
}

export function updateGame(p) {
  // Update physics
  gameState.ballsOnTable.forEach(ball => ball.update());
  
  // Handle different playing phases
  switch (gameState.playingPhase) {
    case "AIMING":
      handleAimingPhase(p);
      break;
    case "SHOT":
      handleShotPhase(p);
      break;
    case "WAITING":
      handleWaitingPhase(p);
      break;
    case "FOUL":
      handleFoulPhase(p);
      break;
  }
  
  // Check pockets
  checkPockets(p);
  
  // Log player position periodically
  if (p.frameCount % 60 === 0 && gameState.cueBall && !gameState.cueBall.pocketed) {
    p.logs.player_info.push({
      screen_x: gameState.cueBall.body.position.x,
      screen_y: gameState.cueBall.body.position.y,
      game_x: gameState.cueBall.body.position.x,
      game_y: gameState.cueBall.body.position.y,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function handleAimingPhase(p) {
  // AI turn
  if (gameState.currentTurn === "AI") {
    gameState.aiThinkTime++;
    
    if (gameState.aiThinkTime >= gameState.aiShotDelay) {
      aiTakeShot(p);
      executeShot(p);
      gameState.aiThinkTime = 0;
    }
  }
  
  // Test modes
  if (gameState.controlMode === "TEST_1" || gameState.controlMode === "TEST_2") {
    handleTestMode(p);
  }
}

function handleShotPhase(p) {
  // Transition to waiting immediately
  gameState.playingPhase = "WAITING";
  gameState.waitingForBallsToStop = true;
  gameState.lastPocketedBalls = [];
  gameState.firstContactBall = null;
  gameState.cushionHits = 0;
}

function handleWaitingPhase(p) {
  if (checkAllBallsStopped()) {
    // All balls have stopped
    evaluateShot(p);
  }
}

function handleFoulPhase(p) {
  // Display foul message, wait for ball placement
  if (gameState.ballInHand && gameState.currentTurn === "PLAYER") {
    // Player can place cue ball
    // Wait for Z key to confirm placement
  } else {
    // Auto-place for AI and continue
    setTimeout(() => {
      switchTurn();
      gameState.playingPhase = "AIMING";
      gameState.foulStatus = false;
    }, 1000);
  }
}

export function executeShot(p) {
  if (!gameState.cueBall || gameState.cueBall.pocketed) return;
  
  // Calculate force based on power and angle
  const force = gameState.shotPower / 1000;
  const forceX = Math.cos(gameState.aimAngle) * force;
  const forceY = Math.sin(gameState.aimAngle) * force;
  
  // Apply force to cue ball
  Body.applyForce(gameState.cueBall.body, gameState.cueBall.body.position, {
    x: forceX,
    y: forceY
  });
  
  // Apply spin (simplified)
  if (gameState.spinEffect.x !== 0 || gameState.spinEffect.y !== 0) {
    Body.setAngularVelocity(gameState.cueBall.body, gameState.spinEffect.x * 0.1);
  }
  
  gameState.playingPhase = "SHOT";
  gameState.isBreak = false;
  
  p.logs.game_info.push({
    data: { event: "shot_executed", turn: gameState.currentTurn, power: gameState.shotPower, angle: gameState.aimAngle },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function evaluateShot(p) {
  // Check for fouls and game-ending conditions
  let isFoul = false;
  let foulMessage = "";
  let isWin = false;
  let isLoss = false;
  
  // Check if cue ball was pocketed (scratch)
  const cueBallPocketed = gameState.cueBall.pocketed;
  
  if (cueBallPocketed) {
    isFoul = true;
    foulMessage = "SCRATCH!";
    
    // Check if 8-ball was also pocketed
    if (gameState.lastPocketedBalls.includes(8)) {
      isLoss = true;
    }
  }
  
  // Check if 8-ball was pocketed
  if (gameState.lastPocketedBalls.includes(8) && !cueBallPocketed) {
    // Check if player has cleared their balls
    const playerType = gameState.currentTurn === "PLAYER" ? gameState.playerBallsType : gameState.aiBallsType;
    
    if (playerType === "open") {
      // 8-ball pocketed before assignment
      isLoss = true;
    } else {
      const clearedBalls = checkPlayerClearedBalls(gameState.currentTurn);
      if (clearedBalls) {
        isWin = true;
      } else {
        isLoss = true;
      }
    }
  }
  
  // Check first contact
  if (!cueBallPocketed && gameState.firstContactBall !== null) {
    const firstContactType = BALL_COLORS[gameState.firstContactBall].type;
    const playerType = gameState.currentTurn === "PLAYER" ? gameState.playerBallsType : gameState.aiBallsType;
    
    if (playerType !== "open") {
      // Check if first contact was correct
      if ((playerType === "solids" && firstContactType !== "solid" && gameState.firstContactBall !== 8) ||
          (playerType === "stripes" && firstContactType !== "stripe" && gameState.firstContactBall !== 8)) {
        // Check if player should be hitting 8-ball
        const clearedBalls = checkPlayerClearedBalls(gameState.currentTurn);
        if (!clearedBalls || gameState.firstContactBall !== 8) {
          isFoul = true;
          foulMessage = "WRONG BALL FIRST!";
        }
      }
    }
  }
  
  // Assign ball types if still open
  if (gameState.playerBallsType === "open" && gameState.lastPocketedBalls.length > 0) {
    assignBallTypes(p);
  }
  
  // Award points
  if (!isFoul && gameState.currentTurn === "PLAYER") {
    gameState.lastPocketedBalls.forEach(ballNum => {
      if (ballNum !== 0 && ballNum !== 8) {
        gameState.score += 50;
      }
    });
    
    if (isWin) {
      gameState.score += 200;
    }
  }
  
  // Handle win/loss
  if (isWin) {
    if (gameState.currentTurn === "PLAYER") {
      handleGameWin(p);
    } else {
      handleGameLose(p);
    }
    return;
  }
  
  if (isLoss) {
    if (gameState.currentTurn === "PLAYER") {
      handleGameLose(p);
    } else {
      handleGameWin(p);
    }
    return;
  }
  
  // Handle foul
  if (isFoul) {
    gameState.foulStatus = true;
    gameState.foulMessage = foulMessage;
    gameState.playingPhase = "FOUL";
    gameState.ballInHand = true;
    
    // Respawn cue ball if pocketed
    if (cueBallPocketed) {
      respawnCueBall(p);
    }
    
    switchTurn();
    
    setTimeout(() => {
      gameState.playingPhase = "AIMING";
      gameState.foulStatus = false;
      gameState.ballInHand = false;
    }, 2000);
    
    return;
  }
  
  // Check if player continues turn (pocketed a ball)
  let continuesTurn = false;
  if (gameState.lastPocketedBalls.length > 0 && !gameState.lastPocketedBalls.includes(8)) {
    const playerType = gameState.currentTurn === "PLAYER" ? gameState.playerBallsType : gameState.aiBallsType;
    
    gameState.lastPocketedBalls.forEach(ballNum => {
      const ballType = BALL_COLORS[ballNum].type;
      if ((playerType === "solids" && ballType === "solid") ||
          (playerType === "stripes" && ballType === "stripe") ||
          playerType === "open") {
        continuesTurn = true;
      }
    });
  }
  
  if (!continuesTurn) {
    switchTurn();
  }
  
  gameState.playingPhase = "AIMING";
  gameState.shotPower = 0;
}

function assignBallTypes(p) {
  const pocketedSolids = gameState.lastPocketedBalls.filter(n => {
    const type = BALL_COLORS[n].type;
    return type === "solid";
  });
  
  const pocketedStripes = gameState.lastPocketedBalls.filter(n => {
    const type = BALL_COLORS[n].type;
    return type === "stripe";
  });
  
  if (pocketedSolids.length > 0 && pocketedStripes.length === 0) {
    if (gameState.currentTurn === "PLAYER") {
      gameState.playerBallsType = "solids";
      gameState.aiBallsType = "stripes";
    } else {
      gameState.playerBallsType = "stripes";
      gameState.aiBallsType = "solids";
    }
  } else if (pocketedStripes.length > 0 && pocketedSolids.length === 0) {
    if (gameState.currentTurn === "PLAYER") {
      gameState.playerBallsType = "stripes";
      gameState.aiBallsType = "solids";
    } else {
      gameState.playerBallsType = "solids";
      gameState.aiBallsType = "stripes";
    }
  }
}

function checkPlayerClearedBalls(turn) {
  const playerType = turn === "PLAYER" ? gameState.playerBallsType : gameState.aiBallsType;
  const pocketed = turn === "PLAYER" ? gameState.pocketedBallsPlayer : gameState.pocketedBallsAI;
  
  if (playerType === "solids") {
    return [1, 2, 3, 4, 5, 6, 7].every(n => pocketed.includes(n));
  } else if (playerType === "stripes") {
    return [9, 10, 11, 12, 13, 14, 15].every(n => pocketed.includes(n));
  }
  
  return false;
}

function switchTurn() {
  gameState.currentTurn = gameState.currentTurn === "PLAYER" ? "AI" : "PLAYER";
  gameState.aimAngle = 0;
  gameState.shotPower = 0;
  gameState.spinEffect = { x: 0, y: 0 };
  gameState.aiThinkTime = 0;
}

function respawnCueBall(p) {
  // Remove old cue ball body
  if (gameState.cueBall.body) {
    Matter.World.remove(gameState.world, gameState.cueBall.body);
  }
  
  // Create new cue ball
  const newCueBall = new Ball(p, TABLE_X + 100, TABLE_Y + TABLE_HEIGHT / 2, 0);
  gameState.cueBall = newCueBall;
  
  // Replace in array
  const index = gameState.ballsOnTable.findIndex(b => b.number === 0);
  if (index !== -1) {
    gameState.ballsOnTable[index] = newCueBall;
  }
}

function handleGameWin(p) {
  gameState.gamePhase = "GAME_OVER_WIN";
  gameState.score += 500; // Level completion bonus
  
  p.logs.game_info.push({
    data: { gamePhase: "GAME_OVER_WIN", score: gameState.score, level: gameState.level },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function handleGameLose(p) {
  gameState.gamePhase = "GAME_OVER_LOSE";
  
  p.logs.game_info.push({
    data: { gamePhase: "GAME_OVER_LOSE", score: gameState.score, level: gameState.level },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function handleTestMode(p) {
  if (gameState.controlMode === "TEST_1") {
    // Basic test: quick shots
    gameState.aimAngle = p.random() * Math.PI * 2;
    gameState.shotPower = 50;
    executeShot(p);
  } else if (gameState.controlMode === "TEST_2") {
    // Win test: pocket all balls quickly
    const targetBalls = gameState.ballsOnTable.filter(b => !b.pocketed && b.number !== 0);
    if (targetBalls.length > 0) {
      const target = targetBalls[0];
      const dx = target.body.position.x - gameState.cueBall.body.position.x;
      const dy = target.body.position.y - gameState.cueBall.body.position.y;
      gameState.aimAngle = Math.atan2(dy, dx);
      gameState.shotPower = 80;
      executeShot(p);
    }
  }
}

export function resetGame(p) {
  // Clear world
  if (gameState.world) {
    Matter.World.clear(gameState.world, false);
  }
  
  // Reset score only if going back to level 1
  if (gameState.level === 1) {
    gameState.score = 0;
  }
  
  initializeGame(p);
}