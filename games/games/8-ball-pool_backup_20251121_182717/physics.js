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

function isNearPocket(pos, tableX, tableY, tableWidth, tableHeight) {
  // Check if a position is near any pocket to exclude it from boundary enforcement
  const pockets = getPockets(tableX, tableY, tableWidth, tableHeight);
  const pocketRadius = POCKET_RADIUS * gameState.levelParams.pocketSizeMultiplier;
  const safeZone = pocketRadius + BALL_RADIUS * 3; // Larger zone to prevent conflicts
  
  for (let pocket of pockets) {
    const dx = pos.x - pocket.x;
    const dy = pos.y - pocket.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < safeZone) {
      return true;
    }
  }
  
  return false;
}

export function enforceBoundaries() {
  // Keep balls strictly within the playable table area
  // BUT: don't enforce near pockets - let pocket detection handle those areas
  const { tableX, tableY, tableWidth, tableHeight } = gameState.levelParams;
  
  const margin = BALL_RADIUS;
  const minX = tableX + margin;
  const maxX = tableX + tableWidth - margin;
  const minY = tableY + margin;
  const maxY = tableY + tableHeight - margin;
  
  gameState.ballsOnTable.forEach(ball => {
    if (ball.pocketed) return;
    
    const pos = ball.body.position;
    
    // Skip boundary enforcement if ball is near a pocket - let pocket detection handle it
    if (isNearPocket(pos, tableX, tableY, tableWidth, tableHeight)) {
      return;
    }
    
    const vel = ball.body.velocity;
    let corrected = false;
    let newX = pos.x;
    let newY = pos.y;
    let newVelX = vel.x;
    let newVelY = vel.y;
    
    // Hard clamp positions - keep balls on the felt away from pockets
    if (pos.x < minX) {
      newX = minX;
      newVelX = Math.abs(vel.x) * 0.7;
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
    
    if (corrected) {
      Body.setPosition(ball.body, { x: newX, y: newY });
      Body.setVelocity(ball.body, { x: newVelX, y: newVelY });
    }
  });
}

export function checkPockets(p) {
  const { tableX, tableY, tableWidth, tableHeight } = gameState.levelParams;
  const pockets = getPockets(tableX, tableY, tableWidth, tableHeight);
  const pocketRadius = POCKET_RADIUS * gameState.levelParams.pocketSizeMultiplier;
  const ballsToPocket = [];
  
  gameState.ballsOnTable.forEach(ball => {
    if (ball.pocketed) return;
    
    const ballPos = ball.body.position;
    const ballVel = ball.body.velocity;
    const speed = Math.sqrt(ballVel.x * ballVel.x + ballVel.y * ballVel.y);
    
    // Check each pocket
    for (let pocket of pockets) {
      const dx = ballPos.x - pocket.x;
      const dy = ballPos.y - pocket.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Primary capture threshold - generous to ensure reliable pocketing
      const primaryThreshold = pocketRadius + BALL_RADIUS * 1.2;
      
      // Extended threshold for slow-moving balls or balls in gap zones
      const extendedThreshold = pocketRadius + BALL_RADIUS * 2.0;
      
      // Check if ball is in the pocket gap zone (beyond table edge but near pocket)
      const isInGapZone = 
        (pocket.x === tableX && ballPos.x < tableX + BALL_RADIUS * 2) ||
        (pocket.x === tableX + tableWidth && ballPos.x > tableX + tableWidth - BALL_RADIUS * 2) ||
        (pocket.y === tableY && ballPos.y < tableY + BALL_RADIUS * 2) ||
        (pocket.y === tableY + tableHeight && ballPos.y > tableY + tableHeight - BALL_RADIUS * 2);
      
      // Primary capture: ball center is close to pocket center
      if (dist < primaryThreshold) {
        ballsToPocket.push(ball);
        break;
      }
      
      // Extended capture for slow balls near pockets
      if (speed < 2.0 && dist < extendedThreshold) {
        ballsToPocket.push(ball);
        break;
      }
      
      // Gap zone capture: if ball is in a gap near a pocket, capture it aggressively
      if (isInGapZone && dist < extendedThreshold * 1.5) {
        ballsToPocket.push(ball);
        break;
      }
      
      // Edge case: ball is beyond table boundaries near a pocket
      const beyondEdge = 
        (ballPos.x < tableX - BALL_RADIUS || ballPos.x > tableX + tableWidth + BALL_RADIUS ||
         ballPos.y < tableY - BALL_RADIUS || ballPos.y > tableY + tableHeight + BALL_RADIUS);
      
      if (beyondEdge && dist < extendedThreshold * 2.0) {
        ballsToPocket.push(ball);
        break;
      }
    }
    
    // Emergency capture: ball far outside table boundaries
    const emergencyMargin = BALL_RADIUS * 8;
    if (ballPos.x < tableX - emergencyMargin || 
        ballPos.x > tableX + tableWidth + emergencyMargin ||
        ballPos.y < tableY - emergencyMargin || 
        ballPos.y > tableY + tableHeight + emergencyMargin) {
      ballsToPocket.push(ball);
    }
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