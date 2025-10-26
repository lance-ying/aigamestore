// collision.js - Collision detection and handling
import { gameState } from './globals.js';
import { getPhysics } from './physics.js';

export function setupCollisionHandling() {
  const { Matter, engine } = getPhysics();
  if (!Matter || !engine) return;
  
  Matter.Events.on(engine, 'collisionStart', handleCollisionStart);
  Matter.Events.on(engine, 'collisionActive', handleCollisionActive);
}

function handleCollisionStart(event) {
  const pairs = event.pairs;
  
  pairs.forEach(pair => {
    const { bodyA, bodyB } = pair;
    
    // Check package collision with hazards
    if (isPackage(bodyA) || isPackage(bodyB)) {
      const other = isPackage(bodyA) ? bodyB : bodyA;
      
      if (other.label === 'spike' || other.label === 'enemy') {
        if (gameState.player && !gameState.player.destroyed) {
          gameState.player.destroy();
        }
      } else if (other.label === 'destructible') {
        // Destroy destructible block
        const block = findEntityByBody(other);
        if (block && block.destroy) {
          block.destroy();
        }
      }
    }
  });
}

function handleCollisionActive(event) {
  const pairs = event.pairs;
  
  pairs.forEach(pair => {
    const { bodyA, bodyB } = pair;
    
    // Check if package is in goal
    if ((isPackage(bodyA) && bodyB.label === 'goal') ||
        (isPackage(bodyB) && bodyA.label === 'goal')) {
      if (!gameState.packageInGoal) {
        gameState.packageInGoal = true;
        gameState.packageInGoalTime = Date.now();
        if (gameState.goalZone) {
          gameState.goalZone.triggerGlow();
        }
      }
    }
  });
}

function isPackage(body) {
  return body.label === 'package';
}

function findEntityByBody(body) {
  return gameState.entities.find(e => e.body === body);
}

export function checkGoalCompletion() {
  if (!gameState.packageInGoal) return false;
  
  const timeInGoal = Date.now() - gameState.packageInGoalTime;
  if (timeInGoal > 500) { // 0.5 seconds in goal
    return true;
  }
  
  return false;
}

export function checkPackageInGoal() {
  if (!gameState.player || !gameState.goalZone) return;
  
  const packagePos = gameState.player.getPosition();
  const goalBody = gameState.goalZone.body;
  
  const inGoal = packagePos.x > goalBody.bounds.min.x &&
                 packagePos.x < goalBody.bounds.max.x &&
                 packagePos.y > goalBody.bounds.min.y &&
                 packagePos.y < goalBody.bounds.max.y;
  
  if (!inGoal && gameState.packageInGoal) {
    gameState.packageInGoal = false;
    gameState.packageInGoalTime = 0;
  }
}