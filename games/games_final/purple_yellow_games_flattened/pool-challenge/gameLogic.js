// gameLogic.js - Core game logic
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Body } = Matter;

import { gameState, BALL_COLORS } from './globals.js';
import { Ball, CueStick, Table } from './entities.js';
import { checkPockets, checkAllBallsStopped } from './physics.js';

export function initializeGame(p) {
  // Clear existing entities
  gameState.entities = [];
  gameState.ballsOnTable = [];
  gameState.pocketedBalls = [];
  
  // Set level parameters FIRST
  setLevelParameters();
  
  // Create table with updated parameters
  gameState.table = new Table(p, gameState.world);
  
  // Create balls in rack formation
  createBallRack(p);
  
  // Create cue stick
  gameState.cueStick = new CueStick(p);
  
  // Reset game state
  gameState.playingPhase = "AIMING";
  gameState.aimAngle = 0;
  gameState.shotPower = 0;
  gameState.spinEffect = { x: 0, y: 0 };
  gameState.foulStatus = false;
  gameState.ballInHand = false;
  gameState.isBreak = true;
  gameState.waitingForBallsToStop = false;
  gameState.lastPocketedBalls = [];
  gameState.firstContactBall = null;
  gameState.cushionHits = 0;
}

function setLevelParameters() {
  // 9 levels with difficulty based on NUMBER OF BALLS first, then table/pocket parameters
  // Easy (1-3): 3, 6, 9 balls with MUCH smaller tables and MUCH larger pockets
  // Medium (4-6): 10, 12, 15 balls with smaller tables and larger pockets
  // Hard (7-9): 15 balls with small pockets and challenging tables
  
  switch (gameState.level) {
    case 1: // Easy - Only 3 balls, much smaller table, very large pockets
      gameState.levelParams = {
        numberOfBalls: 3,
        pocketSizeMultiplier: 2.0,
        tableFriction: 0.008,
        tableX: 100,
        tableY: 90,
        tableWidth: 400,
        tableHeight: 220,
        rackDistance: 60
      };
      break;
    case 2: // Easy - 6 balls, much smaller table, very large pockets
      gameState.levelParams = {
        numberOfBalls: 6,
        pocketSizeMultiplier: 1.8,
        tableFriction: 0.009,
        tableX: 90,
        tableY: 83,
        tableWidth: 420,
        tableHeight: 235,
        rackDistance: 70
      };
      break;
    case 3: // Easy - 9 balls, much smaller table, large pockets
      gameState.levelParams = {
        numberOfBalls: 9,
        pocketSizeMultiplier: 1.6,
        tableFriction: 0.01,
        tableX: 80,
        tableY: 75,
        tableWidth: 440,
        tableHeight: 250,
        rackDistance: 80
      };
      break;
    case 4: // Medium - 10 balls, smaller table, larger pockets
      gameState.levelParams = {
        numberOfBalls: 10,
        pocketSizeMultiplier: 1.4,
        tableFriction: 0.01,
        tableX: 65,
        tableY: 60,
        tableWidth: 470,
        tableHeight: 280,
        rackDistance: 100
      };
      break;
    case 5: // Medium - 12 balls, smaller table, larger pockets
      gameState.levelParams = {
        numberOfBalls: 12,
        pocketSizeMultiplier: 1.3,
        tableFriction: 0.012,
        tableX: 60,
        tableY: 55,
        tableWidth: 480,
        tableHeight: 290,
        rackDistance: 110
      };
      break;
    case 6: // Medium - 15 balls, slightly smaller table, larger pockets
      gameState.levelParams = {
        numberOfBalls: 15,
        pocketSizeMultiplier: 1.2,
        tableFriction: 0.013,
        tableX: 55,
        tableY: 53,
        tableWidth: 490,
        tableHeight: 295,
        rackDistance: 120
      };
      break;
    case 7: // Hard - 15 balls, standard table, smaller pockets
      gameState.levelParams = {
        numberOfBalls: 15,
        pocketSizeMultiplier: 0.9,
        tableFriction: 0.015,
        tableX: 40,
        tableY: 40,
        tableWidth: 520,
        tableHeight: 320,
        rackDistance: 150
      };
      break;
    case 8: // Hard - 15 balls, larger table, small pockets
      gameState.levelParams = {
        numberOfBalls: 15,
        pocketSizeMultiplier: 0.85,
        tableFriction: 0.016,
        tableX: 35,
        tableY: 35,
        tableWidth: 530,
        tableHeight: 330,
        rackDistance: 160
      };
      break;
    case 9: // Hard - 15 balls, largest table, tiny pockets
      gameState.levelParams = {
        numberOfBalls: 15,
        pocketSizeMultiplier: 0.8,
        tableFriction: 0.018,
        tableX: 30,
        tableY: 30,
        tableWidth: 540,
        tableHeight: 340,
        rackDistance: 170
      };
      break;
    default:
      // Fallback to level 1 parameters
      gameState.levelParams = {
        numberOfBalls: 3,
        pocketSizeMultiplier: 2.0,
        tableFriction: 0.008,
        tableX: 100,
        tableY: 90,
        tableWidth: 400,
        tableHeight: 220,
        rackDistance: 60
      };
  }
}

function createBallRack(p) {
  const { tableX, tableY, tableWidth, tableHeight, rackDistance, numberOfBalls } = gameState.levelParams;
  
  // Create cue ball on left side
  const cueBallX = tableX + 100;
  const cueBallY = tableY + tableHeight / 2;
  const cueBall = new Ball(p, cueBallX, cueBallY, 0);
  gameState.cueBall = cueBall;
  gameState.ballsOnTable.push(cueBall);
  gameState.entities.push(cueBall);
  
  // Rack position (distance from right edge controlled by rackDistance)
  const rackX = tableX + tableWidth - rackDistance;
  const rackY = tableY + tableHeight / 2;
  const spacing = 17;
  
  // Ball order for full 15-ball rack
  const fullRackOrder = [1, 9, 2, 10, 8, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15];
  
  // Only use the first N balls based on numberOfBalls
  const rackOrder = fullRackOrder.slice(0, numberOfBalls);
  let ballIndex = 0;
  
  // Determine rack formation based on number of balls
  // 3 balls: 2 rows (1, 2)
  // 6 balls: 3 rows (1, 2, 3)
  // 9 balls: 4 rows (1, 2, 3, 3) - compact
  // 10 balls: 4 rows (1, 2, 3, 4)
  // 12 balls: 4-5 rows
  // 15 balls: 5 rows (1, 2, 3, 4, 5)
  
  let maxRows = 5;
  if (numberOfBalls <= 3) maxRows = 2;
  else if (numberOfBalls <= 6) maxRows = 3;
  else if (numberOfBalls <= 10) maxRows = 4;
  
  // Create rack formation
  for (let row = 0; row < maxRows && ballIndex < rackOrder.length; row++) {
    for (let col = 0; col <= row && ballIndex < rackOrder.length; col++) {
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
      // No specific actions for AIMING phase other than input handling in game.js
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
  if (gameState.ballInHand) {
    // Player can place cue ball
    // Wait for Z key to confirm placement
  }
}

export function executeShot(p) {
  if (!gameState.cueBall || gameState.cueBall.pocketed) return;
  
  // Calculate force based on power and angle - increased multiplier for stronger shots
  const force = gameState.shotPower / 850;
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
    data: { event: "shot_executed", power: gameState.shotPower, angle: gameState.aimAngle },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function evaluateShot(p) {
  // Check for fouls and game-ending conditions
  let isFoul = false;
  let foulMessage = "";
  
  // Check if cue ball was pocketed (scratch)
  const cueBallPocketed = gameState.cueBall.pocketed;
  
  if (cueBallPocketed) {
    isFoul = true;
    foulMessage = "SCRATCH!";
  }
  
  // Award points for pocketed balls
  gameState.lastPocketedBalls.forEach(ballNum => {
    if (ballNum !== 0) { // Don't award points for cue ball
      gameState.score += 50;
    }
  });
  
  // Check win condition: all non-cue balls pocketed
  const ballsRemaining = gameState.ballsOnTable.filter(b => !b.pocketed && b.number !== 0).length;
  
  if (ballsRemaining === 0 && !cueBallPocketed) {
    handleGameWin(p);
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
    
    setTimeout(() => {
      gameState.playingPhase = "AIMING";
      gameState.foulStatus = false;
      gameState.ballInHand = false;
      // Reset aim and power for new shot
      gameState.aimAngle = 0;
      gameState.shotPower = 0;
      gameState.spinEffect = { x: 0, y: 0 };
    }, 2000);
    
    return;
  }
  
  // Continue playing - reset aim and power for new shot
  gameState.playingPhase = "AIMING";
  gameState.aimAngle = 0;
  gameState.shotPower = 0;
  gameState.spinEffect = { x: 0, y: 0 };
}

function respawnCueBall(p) {
  const { tableX, tableY, tableHeight } = gameState.levelParams;
  
  // Remove old cue ball body
  if (gameState.cueBall.body) {
    Matter.World.remove(gameState.world, gameState.cueBall.body);
  }
  
  // Create new cue ball
  const newCueBall = new Ball(p, tableX + 100, tableY + tableHeight / 2, 0);
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