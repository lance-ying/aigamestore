// collision.js - Collision detection and response

import { gameState, ENTITY_ZOMBIE, ENTITY_HUMAN, ENTITY_OBSTACLE, ENTITY_EXIT, ENTITY_PIT, MUTATION_JUMPER } from './globals.js';
import { Zombie } from './entities.js';

export function checkCollisions(p) {
  const groundY = 350;
  
  // Check zombie-human collisions
  for (let zombie of gameState.zombies) {
    if (!zombie.active) continue;
    
    for (let human of gameState.humans) {
      if (!human.active || human.infected) continue;
      
      if (checkRectCollision(zombie, human)) {
        infectHuman(human, zombie);
      }
    }
    
    // Check zombie-obstacle collisions
    for (let obstacle of gameState.obstacles) {
      if (!obstacle.active) continue;
      
      if (checkRectCollision(zombie, obstacle)) {
        // Zombies turn around when hitting obstacles
        if (!zombie.blockerActive) {
          zombie.velocityX *= -1;
        }
      }
    }
    
    // Check zombie-pit collisions
    for (let pit of gameState.pits) {
      if (!pit.active) continue;
      
      if (checkRectCollision(zombie, pit)) {
        // Jumper can cross pits
        if (zombie.mutation === MUTATION_JUMPER && zombie.onGround && zombie.jumpCooldown <= 0) {
          zombie.velocityY = -12;
          zombie.jumpCooldown = 60;
        } else if (zombie.y + zombie.height >= pit.y + 10) {
          zombie.active = false;
          gameState.zombieCount--;
        }
      }
    }
    
    // Check zombie-exit collisions
    for (let exit of gameState.exits) {
      if (!exit.active) continue;
      
      if (checkRectCollision(zombie, exit)) {
        zombie.reachedExit = true;
      }
    }
  }
  
  // Check human escapes
  for (let human of gameState.humans) {
    if (!human.active || human.infected) continue;
    
    // Check if critical human reached edge
    if (human.isCritical && human.x < -50) {
      return { criticalEscape: true };
    }
    
    // Check if human fell in pit
    for (let pit of gameState.pits) {
      if (!pit.active) continue;
      
      if (checkRectCollision(human, pit)) {
        human.active = false;
      }
    }
  }
  
  return null;
}

function checkRectCollision(entity1, entity2) {
  return entity1.x < entity2.x + entity2.width &&
         entity1.x + entity1.width > entity2.x &&
         entity1.y < entity2.y + entity2.height &&
         entity1.y + entity1.height > entity2.y;
}

function infectHuman(human, zombie) {
  human.infected = true;
  human.active = false;
  
  // Spawn new zombie at human's position
  const newZombie = new Zombie(human.x, human.y);
  newZombie.velocityX = zombie.velocityX > 0 ? 1 : -1;
  gameState.zombies.push(newZombie);
  gameState.entities.push(newZombie);
  gameState.zombieCount++;
  
  // Award mutation points
  gameState.mutationPoints += 15;
  gameState.score += 100;
  
  p.logs.game_info.push({
    data: { event: "human_infected", points: 15 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function handleExplosion(x, y, p) {
  const explosionRadius = 60;
  
  // Damage nearby obstacles
  for (let obstacle of gameState.obstacles) {
    if (!obstacle.active || !obstacle.destructible) continue;
    
    const dx = obstacle.x + obstacle.width / 2 - x;
    const dy = obstacle.y + obstacle.height / 2 - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < explosionRadius) {
      if (obstacle.takeDamage(100)) {
        gameState.score += 50;
        p.logs.game_info.push({
          data: { event: "obstacle_destroyed" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
  
  // Damage nearby zombies
  for (let zombie of gameState.zombies) {
    if (!zombie.active) continue;
    
    const dx = zombie.x + zombie.width / 2 - x;
    const dy = zombie.y + zombie.height / 2 - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < explosionRadius * 0.7 && distance > 5) {
      zombie.active = false;
      gameState.zombieCount--;
    }
  }
}