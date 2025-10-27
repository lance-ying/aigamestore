import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events, Body } = Matter;
import { gameState, GAME_CONFIG } from './globals.js';
import { spawnDropAtLocation } from './game.js';

export function setupPhysics(p) {
  Events.on(gameState.engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      
      if ((bodyA.label === 'player' && bodyB.label === 'zombie') ||
          (bodyB.label === 'player' && bodyA.label === 'zombie')) {
        handlePlayerZombieCollision(p, bodyA, bodyB);
      }
      
      if ((bodyA.label === 'player' && bodyB.label === 'obstacle') ||
          (bodyB.label === 'player' && bodyA.label === 'obstacle')) {
        handlePlayerObstacleCollision(p, bodyA, bodyB);
      }
      
      if ((bodyA.label === 'player' && bodyB.label === 'fuel') ||
          (bodyB.label === 'player' && bodyA.label === 'fuel')) {
        handlePlayerFuelCollision(p, bodyA, bodyB);
      }
      
      if ((bodyA.label === 'player' && bodyB.label === 'armor') ||
          (bodyB.label === 'player' && bodyA.label === 'armor')) {
        handlePlayerArmorCollision(p, bodyA, bodyB);
      }
      
      if ((bodyA.label === 'bullet' && bodyB.label === 'zombie') ||
          (bodyB.label === 'bullet' && bodyA.label === 'zombie')) {
        handleBulletZombieCollision(p, bodyA, bodyB);
      }
      
      if ((bodyA.label === 'bullet' && bodyB.label === 'obstacle') ||
          (bodyB.label === 'bullet' && bodyA.label === 'obstacle')) {
        handleBulletObstacleCollision(p, bodyA, bodyB);
      }
    });
  });
}

function handlePlayerZombieCollision(p, bodyA, bodyB) {
  const playerBody = bodyA.label === 'player' ? bodyA : bodyB;
  const zombieBody = bodyA.label === 'zombie' ? bodyA : bodyB;
  
  const zombie = gameState.entities.find(e => e.body === zombieBody);
  
  if (zombie && !zombie.destroyed) {
    const velocity = Math.sqrt(
      Math.pow(playerBody.velocity.x, 2) + Math.pow(playerBody.velocity.y, 2)
    );
    
    const dropX = zombieBody.position.x;
    const dropY = zombieBody.position.y;
    
    if (velocity > 3) {
      zombie.destroy();
      const points = Math.floor(velocity * 10);
      gameState.score += points;
      
      // 30% chance to spawn drop at zombie location
      if (Math.random() < 0.3) {
        spawnDropAtLocation(p, dropX, dropY);
      }
    } else {
      gameState.armor = Math.max(0, gameState.armor - GAME_CONFIG.DAMAGE_FROM_COLLISION * 1.5);
      gameState.damageFlash = 10;
      zombie.destroy();
      
      // 30% chance to spawn drop even on low speed collision
      if (Math.random() < 0.3) {
        spawnDropAtLocation(p, dropX, dropY);
      }
    }
  }
}

function handlePlayerObstacleCollision(p, bodyA, bodyB) {
  const playerBody = bodyA.label === 'player' ? bodyA : bodyB;
  const obstacleBody = bodyA.label === 'obstacle' ? bodyA : bodyB;
  
  const obstacle = gameState.entities.find(e => e.body === obstacleBody);
  
  const velocity = Math.sqrt(
    Math.pow(playerBody.velocity.x, 2) + Math.pow(playerBody.velocity.y, 2)
  );
  
  if (velocity > 2) {
    const damage = Math.min(velocity * 1.5, GAME_CONFIG.DAMAGE_FROM_COLLISION);
    gameState.armor = Math.max(0, gameState.armor - damage);
    gameState.damageFlash = 10;
  }
  
  // High speed collision destroys obstacle and spawns drop
  if (velocity > 4 && obstacle && !obstacle.destroyed) {
    const dropX = obstacleBody.position.x;
    const dropY = obstacleBody.position.y;
    obstacle.destroy();
    gameState.score += 15;
    
    // 30% chance to spawn drop
    if (Math.random() < 0.3) {
      spawnDropAtLocation(p, dropX, dropY);
    }
  }
}

function handlePlayerFuelCollision(p, bodyA, bodyB) {
  const fuelBody = bodyA.label === 'fuel' ? bodyA : bodyB;
  
  const fuel = gameState.entities.find(e => e.body === fuelBody);
  if (fuel && !fuel.collected) {
    fuel.collect();
    gameState.score += 50;
  }
}

function handlePlayerArmorCollision(p, bodyA, bodyB) {
  const armorBody = bodyA.label === 'armor' ? bodyA : bodyB;
  
  const armor = gameState.entities.find(e => e.body === armorBody);
  if (armor && !armor.collected) {
    armor.collect();
    gameState.score += 75;
  }
}

function handleBulletZombieCollision(p, bodyA, bodyB) {
  const bulletBody = bodyA.label === 'bullet' ? bodyA : bodyB;
  const zombieBody = bodyA.label === 'zombie' ? bodyA : bodyB;
  
  const bullet = gameState.bullets.find(b => b.body === bulletBody);
  const zombie = gameState.entities.find(e => e.body === zombieBody);
  
  if (bullet && !bullet.destroyed) {
    bullet.destroy();
  }
  
  if (zombie && !zombie.destroyed) {
    const dropX = zombieBody.position.x;
    const dropY = zombieBody.position.y;
    
    // Bullets now do 1 damage, requiring 2 shots to kill zombies (health = 2)
    if (zombie.takeDamage(1)) {
      gameState.score += 25;
      
      // 30% chance to spawn drop when zombie destroyed by bullet
      if (Math.random() < 0.3) {
        spawnDropAtLocation(p, dropX, dropY);
      }
    }
  }
}

function handleBulletObstacleCollision(p, bodyA, bodyB) {
  const bulletBody = bodyA.label === 'bullet' ? bodyA : bodyB;
  const obstacleBody = bodyA.label === 'obstacle' ? bodyA : bodyB;
  
  const bullet = gameState.bullets.find(b => b.body === bulletBody);
  const obstacle = gameState.entities.find(e => e.body === obstacleBody);
  
  if (bullet && !bullet.destroyed) {
    bullet.destroy();
  }
  
  // Apply physics force to push obstacle instead of dealing heavy damage
  if (obstacle && !obstacle.destroyed) {
    // Apply a strong horizontal force to push the obstacle
    const pushForce = { x: 0.05, y: -0.01 };
    Body.applyForce(obstacleBody, obstacleBody.position, pushForce);
    
    // Deal minimal damage (1 damage, obstacles have 3 health)
    obstacle.takeDamage(1);
    
    // Only spawn drop if obstacle is destroyed (after 3 hits)
    if (obstacle.destroyed) {
      gameState.score += 30;
      
      const dropX = obstacleBody.position.x;
      const dropY = obstacleBody.position.y;
      
      // 30% chance to spawn drop when obstacle destroyed by bullet
      if (Math.random() < 0.3) {
        spawnDropAtLocation(p, dropX, dropY);
      }
    }
  }
}