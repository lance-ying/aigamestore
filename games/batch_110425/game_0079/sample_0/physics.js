// physics.js - Matter.js physics and collision handling
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events, Body } = Matter;

import { gameState, SHOT_TYPES } from './globals.js';
import { Particle } from './entities.js';

export function setupPhysics(p) {
  // Listen for collisions
  Events.on(gameState.engine, 'collisionStart', (event) => {
    handleCollisions(p, event);
  });
}

function handleCollisions(p, event) {
  const pairs = event.pairs;
  
  pairs.forEach(pair => {
    const bodyA = pair.bodyA;
    const bodyB = pair.bodyB;
    
    // Ball hitting ground (wicket/out scenario)
    if ((bodyA.label === 'ball' && bodyB.label === 'ground') ||
        (bodyB.label === 'ball' && bodyA.label === 'ground')) {
      handleBallHitGround(p);
    }
    
    // Ball hitting boundary
    if ((bodyA.label === 'ball' && bodyB.label === 'boundary') ||
        (bodyB.label === 'ball' && bodyA.label === 'boundary')) {
      handleBallHitBoundary(p);
    }
  });
}

function handleBallHitGround(p) {
  if (!gameState.ball || gameState.ball.hit) return;
  
  // If ball hits ground and wasn't hit properly, it's potentially out
  if (gameState.shotPrepared && !gameState.ball.hit) {
    // Missed the ball - bowled out
    loseWicket(p, "Bowled!");
  }
}

function handleBallHitBoundary(p) {
  if (!gameState.ball || !gameState.ball.hit) return;
  
  // Ball hit boundary after being hit by batsman
  const runs = calculateBoundaryRuns();
  addRuns(p, runs);
  
  // Create celebration particles
  createHitParticles(p, gameState.ball.body.position.x, gameState.ball.body.position.y, runs);
  
  // Remove ball and prepare for next delivery
  if (gameState.ball) {
    gameState.ball.remove();
    gameState.ball = null;
  }
  
  gameState.ballInPlay = false;
  gameState.shotPrepared = false;
}

function calculateBoundaryRuns() {
  // Check if ball reached boundary on full (6) or after bounce (4)
  if (gameState.ball.body.position.y < 100) {
    return 6; // Hit over boundary
  }
  return 4; // Hit along ground to boundary
}

export function checkBatBallContact(p) {
  if (!gameState.ball || !gameState.player || gameState.ball.hit) return;
  
  const batPos = gameState.player.getBatPosition();
  const ballPos = gameState.ball.body.position;
  
  const distance = Math.sqrt(
    Math.pow(batPos.x - ballPos.x, 2) + 
    Math.pow(batPos.y - ballPos.y, 2)
  );
  
  // Check if bat and ball are in contact
  if (distance < 20 && gameState.player.isSwinging) {
    handleBatBallHit(p, batPos, ballPos);
  }
}

function handleBatBallHit(p, batPos, ballPos) {
  // Calculate timing quality
  const timing = calculateShotTiming();
  
  // Calculate shot power based on timing and shot type
  const basePower = gameState.isPowerShot ? 15 : 10;
  const timingMultiplier = timing > 0.8 ? 1.5 : timing > 0.5 ? 1.0 : 0.5;
  const power = basePower * timingMultiplier;
  
  // Calculate shot angle based on shot direction
  let angle = -Math.PI / 3; // Default upward angle
  
  switch (gameState.player.shotDirection) {
    case "left":
      angle = -Math.PI / 2.5 + Math.PI / 6;
      break;
    case "right":
      angle = -Math.PI / 2.5 - Math.PI / 6;
      break;
    case "straight":
      angle = -Math.PI / 2.5;
      break;
  }
  
  // Check if shot selection was appropriate for delivery
  const shotQuality = evaluateShotSelection(gameState.deliveryType, gameState.shotType);
  
  if (shotQuality < 0.3 || timing < 0.2) {
    // Poor shot - high chance of getting out
    if (Math.random() < 0.7) {
      loseWicket(p, getWicketType(shotQuality, timing));
      return;
    }
  }
  
  // Good contact - apply hit to ball
  gameState.ball.onHit(power, angle, timing);
  
  // Calculate runs based on power and direction
  const runs = calculateRuns(power, angle, timing);
  addRuns(p, runs);
  
  // Create hit particles
  createHitParticles(p, ballPos.x, ballPos.y, runs);
  
  // Reset for next ball
  setTimeout(() => {
    if (gameState.ball) {
      gameState.ball.remove();
      gameState.ball = null;
    }
    gameState.ballInPlay = false;
    gameState.shotPrepared = false;
  }, 2000);
}

function calculateShotTiming() {
  // Ball position relative to batsman
  const ballY = gameState.ball.body.position.y;
  const batsmanY = gameState.player.y;
  const optimalY = batsmanY - 20; // Optimal hitting zone
  
  const distance = Math.abs(ballY - optimalY);
  
  if (distance < 10) return 1.0; // Perfect timing
  if (distance < 25) return 0.7; // Good timing
  if (distance < 50) return 0.4; // Okay timing
  return 0.1; // Poor timing
}

function evaluateShotSelection(deliveryType, shotType) {
  // Matrix of good shot selections for each delivery type
  const goodShots = {
    FAST: [SHOT_TYPES.FRONT_FOOT, SHOT_TYPES.OFF_SIDE, SHOT_TYPES.ON_SIDE],
    SPINNER: [SHOT_TYPES.DEFENSIVE, SHOT_TYPES.FRONT_FOOT],
    YORKER: [SHOT_TYPES.FRONT_FOOT, SHOT_TYPES.DEFENSIVE],
    BOUNCER: [SHOT_TYPES.BACK_FOOT, SHOT_TYPES.LATE_CUT]
  };
  
  if (goodShots[deliveryType] && goodShots[deliveryType].includes(shotType)) {
    return 0.9;
  }
  
  return 0.3;
}

function calculateRuns(power, angle, timing) {
  const effectivePower = power * timing;
  
  if (effectivePower > 18) return 6;
  if (effectivePower > 12) return 4;
  if (effectivePower > 8) return 2;
  if (effectivePower > 4) return 1;
  return 0;
}

function addRuns(p, runs) {
  gameState.score += runs;
  gameState.ballsPlayed++;
  
  p.logs.game_info.push({
    data: { 
      event: "runs_scored",
      runs: runs,
      score: gameState.score,
      ballsPlayed: gameState.ballsPlayed
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Check win condition
  if (gameState.score >= gameState.targetScore) {
    gameState.gamePhase = "GAME_OVER_WIN";
    p.logs.game_info.push({
      data: { gamePhase: "GAME_OVER_WIN", finalScore: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function loseWicket(p, dismissalType) {
  gameState.wickets--;
  gameState.ballsPlayed++;
  
  p.logs.game_info.push({
    data: { 
      event: "wicket_lost",
      dismissalType: dismissalType,
      wickets: gameState.wickets,
      ballsPlayed: gameState.ballsPlayed
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Remove ball
  if (gameState.ball) {
    gameState.ball.remove();
    gameState.ball = null;
  }
  
  gameState.ballInPlay = false;
  gameState.shotPrepared = false;
  
  // Check lose condition
  if (gameState.wickets <= 0) {
    gameState.gamePhase = "GAME_OVER_LOSE";
    p.logs.game_info.push({
      data: { gamePhase: "GAME_OVER_LOSE", finalScore: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function getWicketType(shotQuality, timing) {
  if (timing < 0.2) return "Bowled!";
  if (shotQuality < 0.2) return "Caught!";
  return "LBW!";
}

function createHitParticles(p, x, y, runs) {
  const color = runs >= 6 ? [255, 215, 0] : runs >= 4 ? [50, 255, 50] : [100, 150, 255];
  
  for (let i = 0; i < runs * 3; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - 2;
    
    const particle = new Particle(p, x, y, vx, vy, color, 30);
    gameState.particles.push(particle);
  }
}