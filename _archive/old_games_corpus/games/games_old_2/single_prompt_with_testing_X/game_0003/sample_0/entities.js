// entities.js - Game entities: Worm, Food, Powerup
import { 
  WORM_SEGMENT_SIZE, 
  INITIAL_WORM_LENGTH, 
  NORMAL_SPEED, 
  BOOST_SPEED_MULTIPLIER,
  BOOST_MASS_COST,
  FOOD_SIZE,
  POWERUP_SIZE,
  ARENA_CENTER_X,
  ARENA_CENTER_Y
} from './globals.js';
import { isInsideArena, clampToArena, distance } from './utils.js';

export class Worm {
  constructor(x, y, isPlayer = false, color = null, p) {
    this.segments = [];
    this.isPlayer = isPlayer;
    this.color = color || [p.random(100, 255), p.random(100, 255), p.random(100, 255)];
    this.angle = p.random(0, p.TWO_PI);
    this.speed = NORMAL_SPEED;
    this.mass = INITIAL_WORM_LENGTH * 5;
    this.isBoosting = false;
    this.isAlive = true;
    this.targetAngle = this.angle;
    
    // Initialize segments
    for (let i = 0; i < INITIAL_WORM_LENGTH; i++) {
      this.segments.push({
        x: x - i * WORM_SEGMENT_SIZE * 0.8,
        y: y
      });
    }
  }

  getHead() {
    return this.segments[0];
  }

  getMass() {
    return this.mass;
  }

  addMass(amount) {
    this.mass += amount;
    // Add segments based on mass increase
    const segmentsToAdd = Math.floor(amount / 5);
    for (let i = 0; i < segmentsToAdd; i++) {
      const tail = this.segments[this.segments.length - 1];
      this.segments.push({ x: tail.x, y: tail.y });
    }
  }

  consumeMass(amount) {
    this.mass = Math.max(10, this.mass - amount);
  }

  setTargetAngle(angle) {
    this.targetAngle = angle;
  }

  update(p) {
    if (!this.isAlive) return;

    // Smooth angle transition
    let angleDiff = this.targetAngle - this.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    this.angle += angleDiff * 0.15;

    // Apply speed
    const currentSpeed = this.isBoosting ? this.speed * BOOST_SPEED_MULTIPLIER : this.speed;
    
    // Move head
    const head = this.getHead();
    const newX = head.x + Math.cos(this.angle) * currentSpeed;
    const newY = head.y + Math.sin(this.angle) * currentSpeed;

    // Check arena boundaries
    if (!isInsideArena(newX, newY)) {
      this.isAlive = false;
      return;
    }

    // Add new head position
    this.segments.unshift({ x: newX, y: newY });

    // Remove tail segments to maintain length
    const maxSegments = Math.floor(this.mass / 5);
    while (this.segments.length > maxSegments) {
      this.segments.pop();
    }

    // Consume mass if boosting
    if (this.isBoosting && this.isPlayer) {
      this.consumeMass(BOOST_MASS_COST);
      if (this.mass <= 10) {
        this.isBoosting = false;
      }
    }
  }

  checkSelfCollision() {
    const head = this.getHead();
    for (let i = 4; i < this.segments.length; i++) {
      const seg = this.segments[i];
      if (distance(head.x, head.y, seg.x, seg.y) < WORM_SEGMENT_SIZE * 0.8) {
        return true;
      }
    }
    return false;
  }

  checkCollisionWithWorm(otherWorm) {
    if (!this.isAlive || !otherWorm.isAlive) return false;
    
    const head = this.getHead();
    
    // Check collision with other worm's body (not head)
    for (let i = 2; i < otherWorm.segments.length; i++) {
      const seg = otherWorm.segments[i];
      if (distance(head.x, head.y, seg.x, seg.y) < WORM_SEGMENT_SIZE) {
        return true;
      }
    }
    return false;
  }

  render(p) {
    if (!this.isAlive) return;

    // Draw segments
    for (let i = this.segments.length - 1; i >= 0; i--) {
      const seg = this.segments[i];
      const alpha = 255 * (1 - i / this.segments.length * 0.3);
      
      p.push();
      p.noStroke();
      
      // Body color
      p.fill(...this.color, alpha);
      const size = WORM_SEGMENT_SIZE * (1 - i / this.segments.length * 0.2);
      p.ellipse(seg.x, seg.y, size, size);
      
      // Highlight on head
      if (i === 0) {
        p.fill(255, 255, 255, 150);
        p.ellipse(seg.x - 2, seg.y - 2, size * 0.4, size * 0.4);
        
        // Eyes
        const eyeOffsetX = Math.cos(this.angle) * 3;
        const eyeOffsetY = Math.sin(this.angle) * 3;
        const eyePerpX = Math.cos(this.angle + Math.PI / 2) * 2;
        const eyePerpY = Math.sin(this.angle + Math.PI / 2) * 2;
        
        p.fill(0);
        p.ellipse(seg.x + eyeOffsetX + eyePerpX, seg.y + eyeOffsetY + eyePerpY, 2, 2);
        p.ellipse(seg.x + eyeOffsetX - eyePerpX, seg.y + eyeOffsetY - eyePerpY, 2, 2);
      }
      p.pop();
    }

    // Boost indicator
    if (this.isBoosting) {
      p.push();
      p.noFill();
      p.stroke(255, 200, 0, 180);
      p.strokeWeight(2);
      const head = this.getHead();
      p.ellipse(head.x, head.y, WORM_SEGMENT_SIZE * 2, WORM_SEGMENT_SIZE * 2);
      p.pop();
    }
  }
}

export class Food {
  constructor(x, y, color, mass = 5) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.mass = mass;
    this.active = true;
    this.pulsePhase = Math.random() * Math.PI * 2;
  }

  render(p, frameCount) {
    if (!this.active) return;
    
    p.push();
    p.noStroke();
    const pulse = 1 + Math.sin(frameCount * 0.1 + this.pulsePhase) * 0.2;
    p.fill(...this.color);
    p.ellipse(this.x, this.y, FOOD_SIZE * pulse, FOOD_SIZE * pulse);
    
    // Sparkle effect
    p.fill(255, 255, 255, 150);
    p.ellipse(this.x - 1, this.y - 1, FOOD_SIZE * 0.3, FOOD_SIZE * 0.3);
    p.pop();
  }
}

export class Powerup {
  constructor(x, y, type, p) {
    this.x = x;
    this.y = y;
    this.type = type; // 'magnet' or 'shield'
    this.active = true;
    this.rotation = p.random(0, p.TWO_PI);
    this.duration = type === 'magnet' ? 300 : 360; // frames (5-6 seconds)
    
    this.color = type === 'magnet' ? [255, 100, 200] : [100, 200, 255];
  }

  render(p, frameCount) {
    if (!this.active) return;
    
    p.push();
    p.translate(this.x, this.y);
    p.rotate(frameCount * 0.05);
    
    // Outer glow
    p.noStroke();
    p.fill(...this.color, 50);
    p.ellipse(0, 0, POWERUP_SIZE * 2, POWERUP_SIZE * 2);
    
    // Main shape
    p.fill(...this.color);
    if (this.type === 'magnet') {
      // Magnet symbol
      p.rectMode(p.CENTER);
      p.rect(0, 0, POWERUP_SIZE * 0.8, POWERUP_SIZE * 0.4);
      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(10);
      p.text('M', 0, 0);
    } else {
      // Shield symbol
      p.beginShape();
      for (let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3;
        const r = POWERUP_SIZE * 0.5;
        p.vertex(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      p.endShape(p.CLOSE);
      
      p.fill(255);
      p.ellipse(0, 0, POWERUP_SIZE * 0.3, POWERUP_SIZE * 0.3);
    }
    
    p.pop();
  }
}

export class WormRemains {
  constructor(segments, color) {
    this.foods = [];
    // Create food from segments
    for (let i = 0; i < segments.length; i += 2) {
      const seg = segments[i];
      this.foods.push(new Food(seg.x, seg.y, color, 10));
    }
  }

  getFoods() {
    return this.foods;
  }
}