// Physics setup and collision handling
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, Events, Body, Vector } = Matter;
import { gameState } from './globals.js';

export function createPhysicsEngine() {
  const engine = Engine.create();
  
  // Disable gravity for top-down view
  engine.world.gravity.x = 0;
  engine.world.gravity.y = 0;
  engine.world.gravity.scale = 0;
  
  return engine;
}

export function setupCollisionEvents(engine, p) {
  Events.on(engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const { bodyA, bodyB } = pair;
      
      handleCollision(bodyA, bodyB, p);
    });
  });
}

function handleCollision(bodyA, bodyB, p) {
  // Identify bodies
  const labelA = bodyA.label;
  const labelB = bodyB.label;
  
  // Resolve Entity References
  // We assume custom 'entity' property is attached to bodies during creation in entities.js
  // However, Matter.js bodies don't serialize custom props well if not careful, 
  // so we'll look up by body reference in the entities array if needed, 
  // or rely on the fact that we can attach small props to body.
  
  // Helper to get entity
  const getEntity = (body) => {
    if (body.label === 'player') return gameState.player;
    return gameState.entities.find(e => e.body === body);
  };
  
  const entityA = getEntity(bodyA);
  const entityB = getEntity(bodyB);

  // Player vs Enemy (Collision Damage)
  if ((labelA === 'player' && labelB === 'enemy') || (labelB === 'player' && labelA === 'enemy')) {
    const player = labelA === 'player' ? entityA : entityB;
    const enemy = labelA === 'enemy' ? entityA : entityB;
    
    if (player && enemy) {
      // Calculate knockback
      const knockbackDir = Vector.normalise(Vector.sub(player.body.position, enemy.body.position));
      Body.applyForce(player.body, player.body.position, Vector.mult(knockbackDir, 0.05));
      
      // Apply damage
      player.takeDamage(10);
      
      // Screen shake or flash could go here
    }
  }

  // Player vs Collectible
  if ((labelA === 'player' && labelB === 'collectible') || (labelB === 'player' && labelA === 'collectible')) {
    const collectibleBody = labelA === 'collectible' ? bodyA : bodyB;
    const collectible = getEntity(collectibleBody);
    
    if (collectible) {
      collectible.collect();
    }
  }
  
  // Projectile vs Enemy
  if ((labelA === 'projectile' && labelB === 'enemy') || (labelB === 'projectile' && labelA === 'enemy')) {
    const projectile = labelA === 'projectile' ? entityA : entityB;
    const enemy = labelA === 'enemy' ? entityA : entityB;
    
    if (projectile && enemy) {
      enemy.takeDamage(projectile.damage);
      projectile.destroy();
      
      // Knockback enemy
      const force = Vector.normalise(projectile.body.velocity);
      Body.applyForce(enemy.body, enemy.body.position, Vector.mult(force, 0.02));
    }
  }
  
  // Projectile vs Wall
  if ((labelA === 'projectile' && labelB === 'wall') || (labelB === 'projectile' && labelA === 'wall')) {
    const projectile = labelA === 'projectile' ? entityA : entityB;
    if (projectile) projectile.destroy();
  }
  
  // Attack Sensor (Melee) vs Enemy
  if ((labelA === 'attackSensor' && labelB === 'enemy') || (labelB === 'attackSensor' && labelA === 'enemy')) {
    const enemy = labelA === 'enemy' ? entityA : entityB;
    if (enemy) {
      enemy.takeDamage(25); // Melee damage
      const knockback = Vector.sub(enemy.body.position, gameState.player.body.position);
      Body.applyForce(enemy.body, enemy.body.position, Vector.mult(Vector.normalise(knockback), 0.1));
    }
  }
}