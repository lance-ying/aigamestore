// physics.js - Physics and collision handling

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;

import { gameState, GAME_PHASES, MAX_LANDING_VERTICAL_SPEED } from './globals.js';

export function setupPhysicsEvents() {
  // Collision detection
  Events.on(gameState.engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      
      // Check for aircraft collision
      if ((bodyA.label === 'aircraft' && bodyB.label === 'runway') ||
          (bodyB.label === 'aircraft' && bodyA.label === 'runway')) {
        handleRunwayCollision(pair);
      }
      
      if ((bodyA.label === 'aircraft' && bodyB.label === 'ground') ||
          (bodyB.label === 'aircraft' && bodyA.label === 'ground')) {
        handleGroundCollision();
      }
    });
  });
}

function handleRunwayCollision(pair) {
  // Only handle if we're in playing state
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Calculate impact velocity
  const relativeVelocity = Math.sqrt(
    Math.pow(pair.bodyA.velocity.x - pair.bodyB.velocity.x, 2) +
    Math.pow(pair.bodyA.velocity.y - pair.bodyB.velocity.y, 2)
  );
  
  // Record touchdown metrics
  gameState.touchdownSpeed = gameState.speed;
  gameState.touchdownVerticalSpeed = Math.abs(gameState.verticalSpeed);
  gameState.touchdownAlignment = Math.abs(gameState.player.body.position.x - gameState.runway.body.position.x);
  
  // Check landing criteria
  const safeVerticalSpeed = gameState.touchdownVerticalSpeed < MAX_LANDING_VERTICAL_SPEED;
  const gearDown = gameState.gearDeployed;
  const reasonableSpeed = gameState.touchdownSpeed < 200 && gameState.touchdownSpeed > 100;
  const goodAlignment = gameState.touchdownAlignment < 50;
  const levelAngle = Math.abs(gameState.pitch) < 15;
  
  if (safeVerticalSpeed && gearDown && reasonableSpeed && goodAlignment && levelAngle) {
    // Successful landing
    gameState.landedSafely = true;
    gameState.score += 1000;
    gameState.score += Math.floor((MAX_LANDING_VERTICAL_SPEED - gameState.touchdownVerticalSpeed) * 2);
    gameState.score -= Math.floor(gameState.touchdownAlignment * 5);
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
  } else {
    // Crash
    const reasons = [];
    if (!gearDown) reasons.push("Gear not deployed");
    if (!safeVerticalSpeed) reasons.push("Vertical speed too high");
    if (!reasonableSpeed) reasons.push("Approach speed incorrect");
    if (!goodAlignment) reasons.push("Poor runway alignment");
    if (!levelAngle) reasons.push("Excessive pitch angle");
    
    gameState.crashReason = reasons.join(", ");
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
  }
}

function handleGroundCollision() {
  // Crash - hit ground instead of runway
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    gameState.crashReason = "Crashed into terrain";
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
  }
}

export function checkBoundaries() {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  const aircraft = gameState.player;
  if (!aircraft) return;
  
  // Check if aircraft went out of bounds
  if (aircraft.body.position.x < -50 || aircraft.body.position.x > 650 ||
      aircraft.body.position.y < -50) {
    gameState.crashReason = "Aircraft left operational area";
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
  }
  
  // Check for stall
  if (gameState.speed < 100 && gameState.altitude > 50) {
    gameState.crashReason = "Aircraft stalled";
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
  }
}