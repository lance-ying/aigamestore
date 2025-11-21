import { PhysicsBody } from './physics.js';
import { BIRD_TYPES } from './globals.js';

export class Bird {
  constructor(x, y, birdType) {
    this.birdType = birdType;
    this.body = new PhysicsBody(x, y, 20, 20, 'circle');
    this.body.restitution = 0.4;
    this.body.mass = 2;
    this.abilityUsed = false;
    this.trail = [];
    this.maxTrailLength = 15;
  }

  updateTrail() {
    this.trail.push({ x: this.body.x, y: this.body.y });
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
        const miniBird = new Bird(this.body.x, this.body.y, BIRD_TYPES.BLUE);
        miniBird.body.width = 12;
        miniBird.body.height = 12;
        miniBird.body.vx = this.body.vx + i * 2;
        miniBird.body.vy = this.body.vy - 2 + i * 0.5;
        miniBird.abilityUsed = true; // Mini birds can't split again
        miniBirds.push(miniBird);
      }
      this.body.active = false;
      return miniBirds;
    } else if (this.birdType === BIRD_TYPES.YELLOW) {
      // Speed boost
      const speed = Math.sqrt(this.body.vx * this.body.vx + this.body.vy * this.body.vy);
      if (speed > 0) {
        const multiplier = 2.5;
        this.body.vx *= multiplier;
        this.body.vy *= multiplier;
      }
    }
    
    return null;
  }
}

export class Pig {
  constructor(x, y, isLarge = false) {
    const size = isLarge ? 30 : 20;
    this.body = new PhysicsBody(x, y, size, size, 'circle');
    this.body.mass = isLarge ? 3 : 1.5;
    this.body.restitution = 0.3;
    this.isLarge = isLarge;
    this.health = isLarge ? 2 : 1;
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.body.active = false;
      return true;
    }
    return false;
  }
}

export class StructureBlock {
  constructor(x, y, width, height, material) {
    this.body = new PhysicsBody(x, y, width, height, 'rect');
    this.material = material; // 'WOOD' or 'STONE'
    
    if (material === 'WOOD') {
      this.body.mass = width * height / 150;
      this.body.restitution = 0.2;
      this.durability = WOOD_DESTROY_THRESHOLD;
      this.health = 1;
    } else if (material === 'STONE') {
      this.body.mass = width * height / 80;
      this.body.restitution = 0.15;
      this.durability = STONE_DESTROY_THRESHOLD;
      this.health = 2;
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.body.active = false;
      return true;
    }
    return false;
  }
}

// Import to avoid circular dependency
const WOOD_DESTROY_THRESHOLD = 5;
const STONE_DESTROY_THRESHOLD = 10;