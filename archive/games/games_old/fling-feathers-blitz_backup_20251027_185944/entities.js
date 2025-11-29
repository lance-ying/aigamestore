import { gameState, BIRD_TYPES, SCORE_SMALL_PIG, SCORE_LARGE_PIG, SCORE_WOOD_BLOCK, SCORE_STONE_BLOCK } from './globals.js';
import { createParticleEffect } from './physics.js';

const Matter = window.Matter;
const Bodies = Matter.Bodies;
const Body = Matter.Body;
const World = Matter.World;

export class Bird {
  constructor(x, y, birdType) {
    this.type = 'bird';
    this.birdType = birdType;
    this.body = Bodies.circle(x, y, 10, {
      density: 0.004,
      restitution: 0.4,
      friction: 0.3,
      frictionAir: 0.01
    });
    this.active = true;
    this.abilityUsed = false;
    this.trail = [];
    this.maxTrailLength = 15;
    this.size = 20;
    
    World.add(gameState.matterWorld, this.body);
  }

  updateTrail() {
    this.trail.push({ x: this.body.position.x, y: this.body.position.y });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }
  }

  useAbility(gameState, p) {
    if (this.abilityUsed) return null;
    this.abilityUsed = true;

    if (this.birdType === BIRD_TYPES.BLUE) {
      // Split into three birds
      const miniBirds = [];
      for (let i = -1; i <= 1; i++) {
        const miniBird = new Bird(this.body.position.x, this.body.position.y, BIRD_TYPES.BLUE);
        miniBird.size = 12;
        
        // Recreate body with smaller size
        World.remove(gameState.matterWorld, miniBird.body);
        miniBird.body = Bodies.circle(this.body.position.x, this.body.position.y, 6, {
          density: 0.003,
          restitution: 0.4,
          friction: 0.3,
          frictionAir: 0.01
        });
        World.add(gameState.matterWorld, miniBird.body);
        
        Body.setVelocity(miniBird.body, {
          x: this.body.velocity.x + i * 2,
          y: this.body.velocity.y - 2 + i * 0.5
        });
        miniBird.abilityUsed = true; // Mini birds can't split again
        miniBirds.push(miniBird);
      }
      this.active = false;
      World.remove(gameState.matterWorld, this.body);
      return miniBirds;
    } else if (this.birdType === BIRD_TYPES.YELLOW) {
      // Speed boost
      const speed = Math.sqrt(
        this.body.velocity.x * this.body.velocity.x +
        this.body.velocity.y * this.body.velocity.y
      );
      if (speed > 0) {
        const multiplier = 2.5;
        Body.setVelocity(this.body, {
          x: this.body.velocity.x * multiplier,
          y: this.body.velocity.y * multiplier
        });
      }
    }
    
    return null;
  }
}

export class Pig {
  constructor(x, y, isLarge = false) {
    this.type = 'pig';
    const size = isLarge ? 15 : 10;
    this.body = Bodies.circle(x, y, size, {
      density: 0.003,
      restitution: 0.3,
      friction: 0.5,
      frictionAir: 0.01
    });
    this.isLarge = isLarge;
    this.health = isLarge ? 2 : 1;
    this.size = isLarge ? 30 : 20;
    this.active = true;
    
    World.add(gameState.matterWorld, this.body);
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.active = false;
      World.remove(gameState.matterWorld, this.body);
      
      // Add score
      const points = this.isLarge ? SCORE_LARGE_PIG : SCORE_SMALL_PIG;
      gameState.score += points;
      gameState.levelScore += points;
      gameState.pigsRemaining--;
      
      // Particle effect
      const particles = createParticleEffect(this.body.position.x, this.body.position.y, [100, 200, 100], 10);
      gameState.particleEffects.push(...particles);
      
      return true;
    }
    return false;
  }
}

export class StructureBlock {
  constructor(x, y, width, height, material) {
    this.type = 'block';
    this.material = material; // 'WOOD' or 'STONE'
    this.width = width;
    this.height = height;
    
    if (material === 'WOOD') {
      this.body = Bodies.rectangle(x, y, width, height, {
        density: 0.0015,
        restitution: 0.2,
        friction: 0.8,
        frictionAir: 0.01
      });
      this.durability = 5;
      this.health = 1;
    } else if (material === 'STONE') {
      this.body = Bodies.rectangle(x, y, width, height, {
        density: 0.003,
        restitution: 0.15,
        friction: 0.9,
        frictionAir: 0.01
      });
      this.durability = 10;
      this.health = 2;
    }
    
    this.active = true;
    World.add(gameState.matterWorld, this.body);
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.active = false;
      World.remove(gameState.matterWorld, this.body);
      
      // Add score
      const points = this.material === 'WOOD' ? SCORE_WOOD_BLOCK : SCORE_STONE_BLOCK;
      gameState.score += points;
      gameState.levelScore += points;
      
      // Particle effect
      const color = this.material === 'WOOD' ? [139, 90, 43] : [120, 120, 120];
      const particles = createParticleEffect(this.body.position.x, this.body.position.y, color, 6);
      gameState.particleEffects.push(...particles);
      
      return true;
    }
    return false;
  }
}