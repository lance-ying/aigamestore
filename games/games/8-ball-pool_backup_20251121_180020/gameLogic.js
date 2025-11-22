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
  
  // Initialize turns remaining based on level
  gameState.turnsRemaining = gameState.turnsLimit;
}

function setLevelParameters() {
  // 9 levels with difficulty based on NUMBER OF BALLS first, then table/pocket parameters
  // Easy (1-3): 3, 6, 9 balls with large pockets
  // Medium (4-6): 10, 12, 15 balls with normal pockets
  // Hard (7-9): 15 balls with small pockets and challenging tables
  
  switch (gameState.level) {
    case 1: // Easy - Only 3 balls, very large pockets, smaller table
      gameState.levelParams = {
        numberOfBalls: 3,
        pocketSizeMultiplier: 1.5,
        tableFriction: 0.008,
        tableX: 75,
        tableY: 75,
        tableWidth: 450,
        tableHeight: 250,
        rackDistance: 80
      };
      gameState.turnsLimit = 10;
      break;
    case 2: // Easy - 6 balls, large pockets, smaller table
      gameState.levelParams = {
        numberOfBalls: 6,
        pocketSizeMultiplier: 1.4,
        tableFriction: 0.009,
        tableX: 70,
        tableY: 70,
        tableWidth: 460,
        tableHeight: 260,
        rackDistance: 90
      };
      gameState.turnsLimit = 12;
      break;
    case 3: // Easy - 9 balls, large pockets, smaller table
      gameState.levelParams = {
        numberOfBalls: 9,
        pocketSizeMultiplier: 1.3,
        tableFriction: 0.01,
        tableX: 65,
        tableY: 65,
        tableWidth: 470,
        tableHeight: 270,
        rackDistance: 100
      };
      gameState.turnsLimit = 15;
      break;
    case 4: // Medium - 10 balls, normal+ pockets, standard table
      gameState.levelParams = {
        numberOfBalls: 10,
        pocketSizeMultiplier: 1.2,
        tableFriction: 0.01,
        tableX: 50,
        tableY: 50,
        tableWidth: 500,
        tableHeight: 300,
        rackDistance: 120
      };
      gameState.turnsLimit = 18;
      break;
    case 5: // Medium - 12 balls, normal pockets, standard table
      gameState.levelParams = {
        numberOfBalls: 12,
        pocketSizeMultiplier: 1.1,
        tableFriction: 0.012,
        tableX: 50,
        tableY: 50,
        tableWidth: 500,
        tableHeight: 300,
        rackDistance: 130
      };
      gameState.turnsLimit = 20;
      break;
    case 6: // Medium - 15 balls, normal pockets, standard table
      gameState.levelParams = {
        numberOfBalls: 15,
        pocketSizeMultiplier: 1.0,
        tableFriction: 0.013,
        tableX: 50,
        tableY: 50,
        tableWidth: 500,
        tableHeight: 300,
        rackDistance: 140
      };
      gameState.turnsLimit: 25;
      break;
    case 7: // Hard - 15 balls, smaller pockets, larger table
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
      gameState.turnsLimit = 25;
      break;
    case 8: // Hard - 15 balls, small pockets, larger table
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
      gameState.turnsLimit = 25;
      break;
    case 9: // Hard - 15 balls, tiny pockets, largest table
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
      gameState.turnsLimit = 30;
      break;
    default:
      // Fallback to level 1 parameters
      gameState.levelParams = {
        numberOfBalls: 3,
        pocketSizeMultiplier: 1.5,
        tableFriction: 0.008,
        tableX: 75,
        tableY: 75,
        tableWidth: 450,
        tableHeight: 250,
        rackDistance: 80
      };
      gameState.turnsLimit = 10;
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
  if (gameState.ballInHand) {
    // Player can place cue ball
    // Wait for Z key to confirm placement
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
    data: { event: "shot_executed", power: gameState.shotPower, angle: gameState.aimAngle },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function evaluateShot(p) {
  // Decrement turns remaining
  gameState.turnsRemaining--;
  
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
  
  // Check lose condition: no turns remaining and balls still on table
  if (gameState.turnsRemaining <= 0 && ballsRemaining > 0) {
    handleGameLose(p);
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
      
      // Reset aim and power for next turn
      gameState.aimAngle = 0;
      gameState.shotPower = 0;
      gameState.spinEffect = { x: 0, y: 0 };
    }, 2000);
    
    return;
  }
  
  // Continue playing - reset aim and power for next turn
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

function handleTestMode(p) {
  if (gameState.controlMode === "TEST_1") {
    // Basic test: quick shots
    gameState.aimAngle = p.random() * Math.PI * 2;
    gameState.shotPower = 30;
    executeShot(p);
  } else if (gameState.controlMode === "TEST_2") {
    // Win test: pocket all balls quickly
    const targetBalls = gameState.ballsOnTable.filter(b => !b.pocketed && b.number !== 0);
    if (targetBalls.length > 0) {
      const target = targetBalls[0];
      const dx = target.body.position.x - gameState.cueBall.body.position.x;
      const dy = target.body.position.y - gameState.cueBall.body.position.y;
      gameState.aimAngle = Math.atan2(dy, dx);
      gameState.shotPower = 40;
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