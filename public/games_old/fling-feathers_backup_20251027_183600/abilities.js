// abilities.js - Bird special abilities with Matter.js physics
import { gameState, BIRD_TYPES } from './globals.js';
import { createBird, setVelocity, addBody, removeBodies, applyForce, removeBody } from './physics.js';
import { createExplosionParticles, createDestructionParticles, addScorePopup, particles, Particle } from './entities.js';

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
  // Speed boost - accelerate forward
  const speedMultiplier = 2.5;
  const currentVel = bird.velocity;
  setVelocity(bird, {
    x: currentVel.x * speedMultiplier,
    y: currentVel.y * speedMultiplier
  });
  
  // Create visual trail particles
  for (let i = 0; i < 10; i++) {
    particles.push(new Particle(
      bird.position.x,
      bird.position.y,
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 4,
      4,
      [255, 220, 0],
      20
    ));
  }
}

function activateBlueAbility(p, bird) {
  // Split into 3 birds
  const engine = p.engine;
  const splitBirds = [];
  
  const angles = [-0.3, 0, 0.3];
  const speed = Math.sqrt(bird.velocity.x ** 2 + bird.velocity.y ** 2);
  
  // Create 3 split birds
  for (let i = 0; i < 3; i++) {
    const angle = Math.atan2(bird.velocity.y, bird.velocity.x) + angles[i];
    const newBird = createBird(bird.position.x, bird.position.y, BIRD_TYPES.BLUE);
    
    setVelocity(newBird, {
      x: Math.cos(angle) * speed * 0.9,
      y: Math.sin(angle) * speed * 0.9
    });
    
    addBody(engine, newBird);
    splitBirds.push(newBird);
    gameState.entities.push(newBird);
  }
  
  // Remove original bird from physics world and game state
  removeBody(engine, bird);
  const index = gameState.entities.indexOf(bird);
  if (index > -1) {
    gameState.entities.splice(index, 1);
  }
  
  // Set first split bird as the active bird
  gameState.birdInFlight = splitBirds[0];
}

function activateBlackAbility(p, bird) {
  // Explosion effect with area damage
  const engine = p.engine;
  const explosionRadius = 80;
  const explosionForce = 0.15;
  
  // Create explosion visual effect
  createExplosionParticles(bird.position.x, bird.position.y, 30);
  
  // Apply explosion force to all nearby bodies
  const allBodies = [...gameState.pigs, ...gameState.blocks];
  allBodies.forEach(body => {
    if (body.destroyed) return;
    
    const dx = body.position.x - bird.position.x;
    const dy = body.position.y - bird.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < explosionRadius && distance > 0) {
      // Calculate force based on distance (closer = stronger)
      const forceMagnitude = explosionForce * (1 - distance / explosionRadius);
      const forceX = (dx / distance) * forceMagnitude;
      const forceY = (dy / distance) * forceMagnitude;
      
      // Apply force using Matter.js
      applyForce(body, { x: forceX, y: forceY });
      
      // Damage pigs in explosion radius
      if (body.label === 'pig') {
        body.health -= 2;
        if (body.health <= 0 && !body.destroyed) {
          body.destroyed = true;
          const points = body.isBoss ? 500 : 50;
          gameState.score += points;
          addScorePopup(body.position.x, body.position.y, points);
          createDestructionParticles(body.position.x, body.position.y, [100, 200, 100], 15);
          
          removeBody(engine, body);
          const pigIndex = gameState.pigs.indexOf(body);
          if (pigIndex > -1) {
            gameState.pigs.splice(pigIndex, 1);
          }
          const entityIndex = gameState.entities.indexOf(body);
          if (entityIndex > -1) {
            gameState.entities.splice(entityIndex, 1);
          }
        }
      }
      
      // Damage blocks in explosion radius
      if (body.label === 'block') {
        const reducedThreshold = body.threshold * 0.3;
        if (distance < explosionRadius * 0.5 && !body.destroyed) {
          body.destroyed = true;
          const pointsMap = { 
            WOOD: 10, 
            GLASS: 15, 
            STONE: 20 
          };
          const points = pointsMap[body.material] || 10;
          gameState.score += points;
          addScorePopup(body.position.x, body.position.y, points);
          createDestructionParticles(body.position.x, body.position.y, body.blockColor, 12);
          
          removeBody(engine, body);
          const blockIndex = gameState.blocks.indexOf(body);
          if (blockIndex > -1) {
            gameState.blocks.splice(blockIndex, 1);
          }
          const entityIndex = gameState.entities.indexOf(body);
          if (entityIndex > -1) {
            gameState.entities.splice(entityIndex, 1);
          }
        }
      }
    }
  });
  
  // Remove explosion bird from physics world
  removeBody(engine, bird);
  const index = gameState.entities.indexOf(bird);
  if (index > -1) {
    gameState.entities.splice(index, 1);
  }
  gameState.birdInFlight = null;
}