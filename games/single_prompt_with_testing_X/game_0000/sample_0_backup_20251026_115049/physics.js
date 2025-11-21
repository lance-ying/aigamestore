// physics.js - Physics and collision handling

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies, Events } = Matter;

import { gameState, CLAW_CONFIG, CANVAS_HEIGHT } from './globals.js';

export function initializePhysics() {
  // Create Matter.js engine
  const engine = Engine.create();
  const world = engine.world;
  
  // Disable gravity for this game
  world.gravity.y = 0;
  
  gameState.engine = engine;
  gameState.world = world;
  
  return { engine, world };
}

export function updatePhysics() {
  if (gameState.engine) {
    Engine.update(gameState.engine, 1000 / 60);
  }
}

export function checkClawItemCollision() {
  if (gameState.clawState !== "DEPLOYING") return null;
  if (gameState.grabbedItem) return null;
  
  const clawX = gameState.clawX;
  const clawY = gameState.clawY;
  const clawRadius = 15;
  
  for (let item of gameState.items) {
    if (item.grabbed || item.markedForRemoval) continue;
    
    const dx = item.body.position.x - clawX;
    const dy = item.body.position.y - clawY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < clawRadius + item.size) {
      return item;
    }
  }
  
  return null;
}

export function updateClawPosition(p) {
  switch (gameState.clawState) {
    case "SWINGING":
      // Swing the claw left and right
      gameState.clawAngle += CLAW_CONFIG.SWING_SPEED * gameState.clawDirection;
      
      if (gameState.clawAngle > CLAW_CONFIG.SWING_ANGLE) {
        gameState.clawAngle = CLAW_CONFIG.SWING_ANGLE;
        gameState.clawDirection = -1;
      } else if (gameState.clawAngle < -CLAW_CONFIG.SWING_ANGLE) {
        gameState.clawAngle = -CLAW_CONFIG.SWING_ANGLE;
        gameState.clawDirection = 1;
      }
      
      gameState.clawX = CLAW_CONFIG.CABLE_START_X;
      gameState.clawY = CLAW_CONFIG.CABLE_START_Y;
      gameState.clawLength = 0;
      break;
      
    case "DEPLOYING":
      // Extend the claw downward
      gameState.clawLength += CLAW_CONFIG.DEPLOY_SPEED;
      
      const deployAngle = gameState.clawAngle;
      gameState.clawX = CLAW_CONFIG.CABLE_START_X + Math.sin(deployAngle) * gameState.clawLength;
      gameState.clawY = CLAW_CONFIG.CABLE_START_Y + gameState.clawLength * Math.cos(deployAngle);
      
      // Check for collision with items
      const hitItem = checkClawItemCollision();
      if (hitItem) {
        gameState.grabbedItem = hitItem;
        hitItem.grabbed = true;
        gameState.clawState = "RETRACTING";
      }
      
      // Check if reached bottom
      if (gameState.clawY >= CANVAS_HEIGHT - 20 || gameState.clawLength >= CLAW_CONFIG.MAX_LENGTH) {
        gameState.clawState = "RETRACTING";
      }
      break;
      
    case "RETRACTING":
      // Retract the claw with grabbed item
      let retractSpeed = CLAW_CONFIG.BASE_RETRACT_SPEED;
      
      // Slow down based on item weight
      if (gameState.grabbedItem) {
        const weightFactor = gameState.grabbedItem.weight;
        retractSpeed = retractSpeed / (1 + (weightFactor - 1) * 0.5);
      }
      
      // Speed up with strength potion
      if (gameState.strengthActive) {
        retractSpeed *= 1.5;
      }
      
      gameState.clawLength -= retractSpeed;
      
      const retractAngle = gameState.clawAngle;
      gameState.clawX = CLAW_CONFIG.CABLE_START_X + Math.sin(retractAngle) * gameState.clawLength;
      gameState.clawY = CLAW_CONFIG.CABLE_START_Y + gameState.clawLength * Math.cos(retractAngle);
      
      // Check if reached top
      if (gameState.clawLength <= 0) {
        if (gameState.grabbedItem) {
          // Add money
          gameState.money += gameState.grabbedItem.value;
          gameState.grabbedItem.destroy();
          gameState.grabbedItem = null;
        }
        
        gameState.clawState = "SWINGING";
        gameState.clawAngle = 0;
        gameState.clawDirection = 1;
      }
      break;
  }
}