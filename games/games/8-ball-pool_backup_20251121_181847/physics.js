// physics.js - Physics handling and collision detection
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events, Body } = Matter;

import { gameState, POCKET_RADIUS, BALL_RADIUS, getPockets } from './globals.js';

export function setupPhysics(p) {
  // Collision detection for ball contacts
  Events.on(gameState.engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      
      // Track first ball contact
      if (gameState.playingPhase === "WAITING" && !gameState.firstContactBall) {
        if (bodyA.label === "ball_0" && bodyB.label && bodyB.label.startsWith("ball_")) {
          gameState.firstContactBall = bodyB.number;
        } else if (bodyB.label === "ball_0" && bodyA.label && bodyA.label.startsWith("ball_")) {
          gameState.firstContactBall = bodyA.number;
        }
      }
      
      // Track cushion hits
      if (gameState.playingPhase === "WAITING") {
        if ((bodyA.label === "cushion" && bodyB.label && bodyB.label.startsWith("ball_")) ||
            (bodyB.label === "cushion" && bodyA.label && bodyA.label.startsWith("ball_"))) {
          gameState.cushionHits++;
        }
      }
    });
  });
}

export function enforceBoundaries() {
  // Strictly enforce table boundaries with immediate correction
  const { tableX, tableY, tableWidth, tableHeight } = gameState.levelParams;
  
  // Tight boundaries - prevent any escape
  const minX = tableX - BALL_RADIUS;
  const maxX = tableX + tableWidth + BALL_RADIUS;
  const minY = tableY - BALL_RADIUS;
  const maxY = tableY + tableHeight + BALL_RADIUS;
  
  gameState.ballsOnTable.forEach(ball => {
    if (ball.pocketed) return;
    
    const pos = ball.body.position;
    const vel = ball.body.velocity;
    let corrected = false;
    let newX = pos.x;
    let newY = pos.y;
    let newVelX = vel.x;
    let newVelY = vel.y;
    
    // Hard clamp positions - never allow balls outside valid area
    if (pos.x < minX) {
      newX = minX;
      newVelX = Math.abs(vel.x) * 0.7; // Bounce with damping
      corrected = true;
    }
    
    if (pos.x > maxX) {
      newX = maxX;
      newVelX = -Math.abs(vel.x) * 0.7;
      corrected = true;
    }
    
    if (pos.y < minY) {
      newY = minY;
      newVelY = Math.abs(vel.y) * 0.7;
      corrected = true;
    }
    
    if (pos.y > maxY) {
      newY = maxY;
      newVelY = -Math.abs(vel.y) * 0.7;
      corrected = true;
    }
    
    // Immediately correct position and velocity if out of bounds
    if (corrected) {
      Body.setPosition(ball.body, { x: newX, y: newY });
      Body.setVelocity(ball.body, { x: newVelX, y: newVelY });
    }
  });
}

export function checkPockets(p) {
  const pockets = getPockets();
  const pocketRadius = POCKET_RADIUS * gameState.levelParams.pocketSizeMultiplier;
  const { tableX, tableY, tableWidth, tableHeight } = gameState.levelParams;
  const ballsToPocket = [];
  
  gameState.ballsOnTable.forEach(ball => {
    if (ball.pocketed) return;
    
    const ballPos = ball.body.position;
    const ballVel = ball.body.velocity;
    const speed = Math.sqrt(ballVel.x * ballVel.x + ballVel.y * ballVel.y);
    
    // Emergency capture: if ball is far outside table, pocket it immediately
    const emergencyMargin = BALL_RADIUS * 5;
    if (ballPos.x < tableX - emergencyMargin || ballPos.x > tableX + tableWidth + emergencyMargin ||
        ballPos.y < tableY - emergencyMargin || ballPos.y > tableY + tableHeight + emergencyMargin) {
      ballsToPocket.push(ball);
      return;
    }
    
    // Simplified, predictable pocket detection
    pockets.forEach(pocket => {
      const dx = ballPos.x - pocket.x;
      const dy = ballPos.y - pocket.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Single unified threshold that accounts for ball radius and pocket radius
      // This makes behavior consistent and predictable
      const captureThreshold = pocketRadius + BALL_RADIUS * 0.8;
      
      if (dist < captureThreshold) {
        ballsToPocket.push(ball);
        return;
      }
      
      // Additional check for balls moving slowly near pocket edge
      // This prevents the "hovering at edge" bug
      if (speed < 1.0 && dist < captureThreshold + BALL_RADIUS * 1.2) {
        ballsToPocket.push(ball);
        return;
      }
    });
  });
  
  // Pocket the balls (remove duplicates)
  const uniqueBallsToPocket = [...new Set(ballsToPocket)];
  uniqueBallsToPocket.forEach(ball => {
    ball.pocketed = true;
    Matter.World.remove(gameState.world, ball.body);
    
    gameState.lastPocketedBalls.push(ball.number);
    gameState.pocketedBalls.push(ball.number);
    
    // Log pocketing
    p.logs.game_info.push({
      data: { event: "ball_pocketed", ball: ball.number },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  });
}

export function checkAllBallsStopped() {
  return gameState.ballsOnTable.every(ball => ball.pocketed || ball.isStopped());
}