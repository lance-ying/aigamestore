// entities.js - Entity management with Matter.js collision handling
import { gameState, BIRD_TYPES, MATERIAL_TYPES } from './globals.js';
import { removeBodies, getVelocityMagnitude, removeBody } from './physics.js';

export class Particle {
  constructor(x, y, vx, vy, size, color, lifetime) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.color = color;
    this.lifetime = lifetime;
    this.age = 0;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.3; // gravity
    this.age++;
    return this.age < this.lifetime;
  }
  
  draw(p) {
    const alpha = p.map(this.age, 0, this.lifetime, 255, 0);
    p.push();
    p.noStroke();
    p.fill(...this.color, alpha);
    p.circle(this.x, this.y, this.size);
    p.pop();
  }
}

export class ScorePopup {
  constructor(x, y, points) {
    this.x = x;
    this.y = y;
    this.points = points;
    this.lifetime = 60;
    this.age = 0;
  }
  
  update() {
    this.y -= 1;
    this.age++;
    return this.age < this.lifetime;
  }
  
  draw(p) {
    const alpha = p.map(this.age, 0, this.lifetime, 255, 0);
    p.push();
    p.fill(255, 255, 0, alpha);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text(`+${this.points}`, this.x, this.y);
    p.pop();
  }
}

export const particles = [];
export const scorePopups = [];

export function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    if (!particles[i].update()) {
      particles.splice(i, 1);
    }
  }
  
  for (let i = scorePopups.length - 1; i >= 0; i--) {
    if (!scorePopups[i].update()) {
      scorePopups.splice(i, 1);
    }
  }
}

export function drawParticles(p) {
  particles.forEach(particle => particle.draw(p));
  scorePopups.forEach(popup => popup.draw(p));
}

export function createImpactParticles(x, y, count = 8) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = 2 + Math.random() * 3;
    particles.push(new Particle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      3 + Math.random() * 3,
      [200, 200, 200],
      20 + Math.random() * 20
    ));
  }
}

export function createDestructionParticles(x, y, color, count = 12) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4;
    particles.push(new Particle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      4 + Math.random() * 4,
      color,
      30 + Math.random() * 30
    ));
  }
}

export function createExplosionParticles(x, y, count = 20) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 6;
    particles.push(new Particle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      5 + Math.random() * 5,
      [255, 150, 0],
      40 + Math.random() * 40
    ));
  }
}

export function addScorePopup(x, y, points) {
  scorePopups.push(new ScorePopup(x, y, points));
}

export function drawBird(p, bird) {
  const type = bird.birdType;
  p.push();
  p.translate(bird.position.x, bird.position.y);
  p.rotate(bird.angle);
  
  if (type === BIRD_TYPES.RED) {
    p.fill(220, 50, 50);
    p.circle(0, 0, 30);
    p.fill(0);
    p.circle(-5, -3, 4);
    p.circle(5, -3, 4);
  } else if (type === BIRD_TYPES.YELLOW) {
    p.fill(255, 220, 0);
    p.triangle(-15, 15, 15, 15, 0, -20);
    p.fill(0);
    p.circle(-5, 5, 3);
    p.circle(5, 5, 3);
  } else if (type === BIRD_TYPES.BLUE) {
    p.fill(50, 150, 255);
    p.circle(0, 0, 20);
    p.fill(0);
    p.circle(-3, -2, 3);
    p.circle(3, -2, 3);
  } else if (type === BIRD_TYPES.BLACK) {
    p.fill(40, 40, 40);
    p.circle(0, 0, 34);
    p.fill(0);
    p.circle(-6, -3, 4);
    p.circle(6, -3, 4);
    p.strokeWeight(2);
    p.stroke(255, 0, 0);
    p.line(-8, 5, -3, 8);
    p.line(3, 8, 8, 5);
  }
  p.pop();
  
  // Motion trail
  if (bird.velocity && getVelocityMagnitude(bird) > 2) {
    p.push();
    p.noStroke();
    const trailColor = type === BIRD_TYPES.YELLOW ? [255, 220, 0, 100] : 
                       type === BIRD_TYPES.BLUE ? [50, 150, 255, 100] :
                       type === BIRD_TYPES.BLACK ? [40, 40, 40, 100] : [220, 50, 50, 100];
    p.fill(...trailColor);
    for (let i = 1; i <= 3; i++) {
      const trailX = bird.position.x - bird.velocity.x * i * 0.5;
      const trailY = bird.position.y - bird.velocity.y * i * 0.5;
      const size = (type === BIRD_TYPES.BLUE ? 20 : type === BIRD_TYPES.YELLOW ? 25 : type === BIRD_TYPES.BLACK ? 34 : 30) * (1 - i * 0.2);
      p.circle(trailX, trailY, size);
    }
    p.pop();
  }
}

export function drawPig(p, pig) {
  p.push();
  p.translate(pig.position.x, pig.position.y);
  p.rotate(pig.angle);
  
  const radius = pig.isBoss ? 30 : 20;
  p.fill(100, 200, 100);
  p.stroke(80, 180, 80);
  p.strokeWeight(2);
  p.circle(0, 0, radius * 2);
  
  // Face features
  p.fill(80, 180, 80);
  p.noStroke();
  p.circle(-radius * 0.3, 0, radius * 0.3);
  p.circle(radius * 0.3, 0, radius * 0.3);
  
  p.fill(0);
  const eyeSize = pig.isBoss ? 5 : 3;
  p.circle(-radius * 0.3, -radius * 0.15, eyeSize);
  p.circle(radius * 0.3, -radius * 0.15, eyeSize);
  
  if (pig.isBoss) {
    p.stroke(0);
    p.strokeWeight(2);
    p.noFill();
    p.arc(0, radius * 0.2, radius * 0.8, radius * 0.6, 0, Math.PI);
  }
  
  p.pop();
}

export function drawBlock(p, block) {
  p.push();
  p.translate(block.position.x, block.position.y);
  p.rotate(block.angle);
  
  const color = block.blockColor;
  if (block.material === MATERIAL_TYPES.GLASS) {
    p.fill(...color);
    p.stroke(173, 216, 230);
  } else if (block.material === MATERIAL_TYPES.WOOD) {
    p.fill(...color);
    p.stroke(90, 46, 0);
  } else {
    p.fill(...color);
    p.stroke(64, 64, 64);
  }
  
  p.strokeWeight(2);
  p.rectMode(p.CENTER);
  p.rect(0, 0, block.bounds.max.x - block.bounds.min.x, block.bounds.max.y - block.bounds.min.y);
  p.pop();
}

// Matter.js collision handler
export function handleCollision(p, engine, bodyA, bodyB, eventType) {
  // Only process collisions during active gameplay
  if (gameState.gamePhase !== 'PLAYING') return;
  
  // Calculate impact force
  const relativeVelocity = {
    x: bodyA.velocity.x - bodyB.velocity.x,
    y: bodyA.velocity.y - bodyB.velocity.y
  };
  const impactSpeed = Math.sqrt(relativeVelocity.x ** 2 + relativeVelocity.y ** 2);
  const combinedMass = bodyA.mass + bodyB.mass;
  const impactForce = impactSpeed * combinedMass;
  
  // Create impact particles for significant collisions
  if (impactForce > 5 && eventType === 'start') {
    const contactX = (bodyA.position.x + bodyB.position.x) / 2;
    const contactY = (bodyA.position.y + bodyB.position.y) / 2;
    createImpactParticles(contactX, contactY, 4);
  }
  
  // Handle pig damage
  if (bodyA.label === 'pig' && !bodyA.destroyed && impactForce > 10) {
    handlePigDamage(p, bodyA, impactForce, engine);
  }
  if (bodyB.label === 'pig' && !bodyB.destroyed && impactForce > 10) {
    handlePigDamage(p, bodyB, impactForce, engine);
  }
  
  // Handle block destruction
  if (bodyA.label === 'block' && !bodyA.destroyed && impactForce > bodyA.threshold) {
    handleBlockDestruction(p, bodyA, engine);
  }
  if (bodyB.label === 'block' && !bodyB.destroyed && impactForce > bodyB.threshold) {
    handleBlockDestruction(p, bodyB, engine);
  }
}

function handlePigDamage(p, pig, force, engine) {
  if (pig.destroyed) return;
  
  // Calculate damage based on impact force
  const damage = Math.floor(force / 15);
  pig.health -= damage;
  
  if (pig.health <= 0) {
    pig.destroyed = true;
    const points = pig.isBoss ? 500 : 50;
    gameState.score += points;
    addScorePopup(pig.position.x, pig.position.y, points);
    createDestructionParticles(pig.position.x, pig.position.y, [100, 200, 100], 15);
    
    // Remove from physics world
    removeBody(engine, pig);
    
    // Remove from game state arrays
    const pigIndex = gameState.pigs.indexOf(pig);
    if (pigIndex > -1) {
      gameState.pigs.splice(pigIndex, 1);
    }
    const entityIndex = gameState.entities.indexOf(pig);
    if (entityIndex > -1) {
      gameState.entities.splice(entityIndex, 1);
    }
    
    p.logs.game_info.push({
      data: { event: 'pig_destroyed', isBoss: pig.isBoss, score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function handleBlockDestruction(p, block, engine) {
  if (block.destroyed) return;
  
  block.destroyed = true;
  
  const pointsMap = {
    [MATERIAL_TYPES.WOOD]: 10,
    [MATERIAL_TYPES.GLASS]: 15,
    [MATERIAL_TYPES.STONE]: 20
  };
  const points = pointsMap[block.material] || 10;
  gameState.score += points;
  addScorePopup(block.position.x, block.position.y, points);
  
  createDestructionParticles(block.position.x, block.position.y, block.blockColor, 12);
  
  // Remove from physics world
  removeBody(engine, block);
  
  // Remove from game state arrays
  const blockIndex = gameState.blocks.indexOf(block);
  if (blockIndex > -1) {
    gameState.blocks.splice(blockIndex, 1);
  }
  const entityIndex = gameState.entities.indexOf(block);
  if (entityIndex > -1) {
    gameState.entities.splice(entityIndex, 1);
  }
}