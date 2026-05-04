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
      
      // Spawn drop at zombie location
      spawnDropAtLocation(p, dropX, dropY);
    } else {
      gameState.armor = Math.max(0, gameState.armor - GAME_CONFIG.DAMAGE_FROM_COLLISION * 1.5);
      gameState.damageFlash = 10;
      zombie.destroy();
      
      // Spawn drop even on low speed collision
      spawnDropAtLocation(p, dropX, dropY);
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
    spawnDropAtLocation(p, dropX, dropY);
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
    
    // Bullets now do 2 damage, killing zombies in one shot
    if (zombie.takeDamage(2)) {
      gameState.score += 25;
      // Spawn drop when zombie destroyed by bullet
      spawnDropAtLocation(p, dropX, dropY);
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
  
  // Bullets now damage obstacles
  if (obstacle && !obstacle.destroyed) {
    const dropX = obstacleBody.position.x;
    const dropY = obstacleBody.position.y;
    
    // Bullets do 2 damage to obstacles
    if (obstacle.takeDamage(2)) {
      gameState.score += 30;
      // Spawn drop when obstacle destroyed by bullet
      spawnDropAtLocation(p, dropX, dropY);
    }
  }
}