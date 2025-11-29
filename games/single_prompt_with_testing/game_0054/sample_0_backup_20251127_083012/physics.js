// physics.js - Physics and collision detection

import { gameState, WALL_BOUNCE, BALL_RADIUS } from './globals.js';
import { Particle } from './entities.js';

export function updatePhysics(p) {
  if (!gameState.ball) return;
  
  const ball = gameState.ball;
  
  // Wall collisions
  for (const wall of gameState.walls) {
    if (checkWallCollision(ball, wall, p)) {
      handleWallCollision(ball, wall, p);
    }
  }
  
  // Bounds checking
  checkBoundsCollision(ball);
}

function checkWallCollision(ball, wall, p) {
  // Use global p5.collide2d function
  return p.collideRectCircle(
    wall.x,
    wall.y,
    wall.width,
    wall.height,
    ball.x,
    ball.y,
    ball.radius * 2
  );
}

function handleWallCollision(ball, wall, p) {
  // Find which side of the wall the ball hit
  const ballLeft = ball.x - ball.radius;
  const ballRight = ball.x + ball.radius;
  const ballTop = ball.y - ball.radius;
  const ballBottom = ball.y + ball.radius;
  
  const wallLeft = wall.x;
  const wallRight = wall.x + wall.width;
  const wallTop = wall.y;
  const wallBottom = wall.y + wall.height;
  
  // Calculate overlap on each side
  const overlapLeft = ballRight - wallLeft;
  const overlapRight = wallRight - ballLeft;
  const overlapTop = ballBottom - wallTop;
  const overlapBottom = wallBottom - ballTop;
  
  // Find minimum overlap
  const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
  
  // Resolve collision based on minimum overlap
  if (minOverlap === overlapLeft) {
    ball.x = wallLeft - ball.radius - 1;
    ball.vx = -Math.abs(ball.vx) * WALL_BOUNCE;
  } else if (minOverlap === overlapRight) {
    ball.x = wallRight + ball.radius + 1;
    ball.vx = Math.abs(ball.vx) * WALL_BOUNCE;
  } else if (minOverlap === overlapTop) {
    ball.y = wallTop - ball.radius - 1;
    ball.vy = -Math.abs(ball.vy) * WALL_BOUNCE;
  } else if (minOverlap === overlapBottom) {
    ball.y = wallBottom + ball.radius + 1;
    ball.vy = Math.abs(ball.vy) * WALL_BOUNCE;
  }
  
  // Create bounce particles
  for (let i = 0; i < 3; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 1;
    gameState.particles.push(new Particle(
      ball.x,
      ball.y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      [200, 150, 100]
    ));
  }
}

function checkBoundsCollision(ball) {
  const margin = ball.radius;
  
  // Left bound
  if (ball.x - margin < 0) {
    ball.x = margin;
    ball.vx = Math.abs(ball.vx) * WALL_BOUNCE;
  }
  
  // Right bound
  if (ball.x + margin > 600) {
    ball.x = 600 - margin;
    ball.vx = -Math.abs(ball.vx) * WALL_BOUNCE;
  }
  
  // Top bound
  if (ball.y - margin < 0) {
    ball.y = margin;
    ball.vy = Math.abs(ball.vy) * WALL_BOUNCE;
  }
  
  // Bottom bound
  if (ball.y + margin > 400) {
    ball.y = 400 - margin;
    ball.vy = -Math.abs(ball.vy) * WALL_BOUNCE;
  }
}

export function checkRampInteraction(ball, ramp) {
  // Simple point-in-triangle check
  const inRamp = pointInTriangle(
    ball.x, ball.y,
    ramp.x, ramp.y + ramp.height,
    ramp.x + ramp.width, ramp.y + ramp.height,
    ramp.slopeDirection === 1 ? ramp.x + ramp.width : ramp.x,
    ramp.y
  );
  
  if (inRamp) {
    // Add slight upward velocity to simulate ramp effect
    ball.vy -= 0.2;
  }
}

function pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
  const v0x = cx - ax;
  const v0y = cy - ay;
  const v1x = bx - ax;
  const v1y = by - ay;
  const v2x = px - ax;
  const v2y = py - ay;
  
  const dot00 = v0x * v0x + v0y * v0y;
  const dot01 = v0x * v1x + v0y * v1y;
  const dot02 = v0x * v2x + v0y * v2y;
  const dot11 = v1x * v1x + v1y * v1y;
  const dot12 = v1x * v2x + v1y * v2y;
  
  const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
  const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
  const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
  
  return (u >= 0) && (v >= 0) && (u + v < 1);
}