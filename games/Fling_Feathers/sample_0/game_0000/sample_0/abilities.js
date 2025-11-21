// abilities.js - Bird special abilities
import { gameState, BIRD_TYPES } from './globals.js';
import { createBird, setVelocity, World, applyForce, removeBodies } from './physics.js';
import { createExplosionParticles, createDestructionParticles } from './entities.js';

export function activateBirdAbility(p) {
  if (!gameState.birdInFlight || gameState.abilityUsed) return;
  
  const bird = gameState.birdInFlight;
  const type = bird.birdType;
  
  gameState.abilityUsed = true;
  
  if (type === BIRD_TYPES.YELLOW) {
    activateYellowAbility(p, bird);
  } else if (type === BIRD_TYPES.BLUE) {
    activateBlueAbility(p, bird);
  } else if (type === BIRD_TYPES.BLACK) {
    activateBlackAbility(p, bird);
  }
  
  p.logs.game_info.push({
    data: { event: 'ability_activated', birdType: type },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function activateYellowAbility(p, bird) {
  // Accelerate forward
  const speedMultiplier = 2.5;
  const currentVel = bird.velocity;
  setVelocity(bird, {
    x: currentVel.x * speedMultiplier,
    y: currentVel.y * speedMultiplier
  });
  
  // Visual effect - create trail particles
  for (let i = 0; i < 10; i++) {
    import('./entities.js').then(module => {
      module.particles.push(new module.Particle(
        bird.position.x,
        bird.position.y,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
        4,
        [255, 220, 0],
        20
      ));
    });
  }
}

function activateBlueAbility(p, bird) {
  // Split into 3 birds
  const engine = p.engine;
  const splitBirds = [];
  
  const angles = [-0.3, 0, 0.3];
  const speed = Math.sqrt(bird.velocity.x ** 2 + bird.velocity.y ** 2);
  
  for (let i = 0; i < 3; i++) {
    const angle = Math.atan2(bird.velocity.y, bird.velocity.x) + angles[i];
    const newBird = createBird(bird.position.x, bird.position.y, BIRD_TYPES.BLUE);
    setVelocity(newBird, {
      x: Math.cos(angle) * speed * 0.9,
      y: Math.sin(angle) * speed * 0.9
    });
    World.add(engine.world, newBird);
    splitBirds.push(newBird);
  }
  
  // Remove original bird
  removeBodies(engine, [bird]);
  const index = gameState.entities.indexOf(bird);
  if (index > -1) {
    gameState.entities.splice(index, 1);
  }
  
  // Add split birds
  splitBirds.forEach(b => gameState.entities.push(b));
  
  // Set first split bird as active
  gameState.birdInFlight = splitBirds[0];
}

function activateBlackAbility(p, bird) {
  // Explosion effect
  const engine = p.engine;
  const explosionRadius = 80;
  const explosionForce = 0.15;
  
  createExplosionParticles(bird.position.x, bird.position.y, 30);
  
  // Apply force to nearby objects
  const allBodies = [...gameState.pigs, ...gameState.blocks];
  allBodies.forEach(body => {
    if (body.destroyed) return;
    
    const dx = body.position.x - bird.position.x;
    const dy = body.position.y - bird.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < explosionRadius && distance > 0) {
      const forceMagnitude = explosionForce * (1 - distance / explosionRadius);
      const forceX = (dx / distance) * forceMagnitude;
      const forceY = (dy / distance) * forceMagnitude;
      applyForce(body, { x: forceX, y: forceY });
      
      // Damage pigs in range
      if (body.label === 'pig') {
        body.health -= 2;
        if (body.health <= 0 && !body.destroyed) {
          body.destroyed = true;
          const points = body.isBoss ? 500 : 50;
          gameState.score += points;
          import('./entities.js').then(module => {
            module.addScorePopup(body.position.x, body.position.y, points);
            module.createDestructionParticles(body.position.x, body.position.y, [100, 200, 100], 15);
          });
          removeBodies(engine, [body]);
          const index = gameState.pigs.indexOf(body);
          if (index > -1) {
            gameState.pigs.splice(index, 1);
          }
        }
      }
      
      // Damage blocks in range
      if (body.label === 'block') {
        const reducedThreshold = body.threshold * 0.3;
        if (distance < explosionRadius * 0.5 && !body.destroyed) {
          body.destroyed = true;
          const pointsMap = { WOOD: 10, GLASS: 15, STONE: 20 };
          const points = pointsMap[body.material] || 10;
          gameState.score += points;
          import('./entities.js').then(module => {
            module.addScorePopup(body.position.x, body.position.y, points);
            module.createDestructionParticles(body.position.x, body.position.y, body.blockColor, 12);
          });
          removeBodies(engine, [body]);
          const index = gameState.blocks.indexOf(body);
          if (index > -1) {
            gameState.blocks.splice(index, 1);
          }
        }
      }
    }
  });
  
  // Remove explosion bird
  removeBodies(engine, [bird]);
  const index = gameState.entities.indexOf(bird);
  if (index > -1) {
    gameState.entities.splice(index, 1);
  }
  gameState.birdInFlight = null;
}