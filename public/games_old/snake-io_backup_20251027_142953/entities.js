// entities.js - Entity classes

import { SEGMENT_SIZE, BASE_SPEED, BOOST_SPEED, BOOST_COST, MIN_BOOST_LENGTH, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Snake {
  constructor(p, x, y, length, color, isPlayer = false) {
    this.p = p;
    this.segments = [];
    this.direction = p.createVector(1, 0);
    this.speed = BASE_SPEED;
    this.baseSpeed = BASE_SPEED;
    this.color = color;
    this.isPlayer = isPlayer;
    this.isBoosting = false;
    this.isAlive = true;
    this.turnRate = 0.08; // Smaller turn rate for smoother curves
  }

  getHead() {
    return this.segments[0];
  }

  getLength() {
    return this.segments.length;
  }

  turnLeft() {
    if (!this.isAlive) return;
    // Rotate direction by small angle for smooth turning
    const angle = -this.turnRate;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const newX = this.direction.x * cos - this.direction.y * sin;
    const newY = this.direction.x * sin + this.direction.y * cos;
    this.direction.x = newX;
    this.direction.y = newY;
    this.direction.normalize();
  }

  turnRight() {
    if (!this.isAlive) return;
    // Rotate direction by small angle for smooth turning
    const angle = this.turnRate;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const newX = this.direction.x * cos - this.direction.y * sin;
    const newY = this.direction.x * sin + this.direction.y * cos;
    this.direction.x = newX;
    this.direction.y = newY;
    this.direction.normalize();
  }

  activateBoost() {
    if (!this.isAlive || this.segments.length < MIN_BOOST_LENGTH) return false;
    this.isBoosting = true;
    this.speed = BOOST_SPEED;
    return true;
  }

  deactivateBoost() {
    this.isBoosting = false;
    this.speed = this.baseSpeed;
  }

  update() {
    if (!this.isAlive) return;

    // Move head
    const head = this.getHead();
    const newHead = this.p.createVector(
      head.x + this.direction.x * this.speed,
      head.y + this.direction.y * this.speed
    );

    // Add new head
    this.segments.unshift(newHead);

    // Remove tail (maintain length)
    this.segments.pop();
  }

  grow(amount = 1) {
    if (!this.isAlive) return;
    
    for (let i = 0; i < amount; i++) {
      const tail = this.segments[this.segments.length - 1];
      const beforeTail = this.segments[this.segments.length - 2] || tail;
      const direction = this.p.createVector(tail.x - beforeTail.x, tail.y - beforeTail.y);
      direction.normalize();
      const newSegment = this.p.createVector(
        tail.x + direction.x * SEGMENT_SIZE,
        tail.y + direction.y * SEGMENT_SIZE
      );
      this.segments.push(newSegment);
    }
  }

  ejectMass(count) {
    if (!this.isAlive || this.segments.length <= count) return [];
    
    const ejected = [];
    for (let i = 0; i < count && this.segments.length > MIN_BOOST_LENGTH; i++) {
      const tail = this.segments.pop();
      ejected.push({
        pos: tail.copy(),
        color: this.color,
      });
    }
    return ejected;
  }

  explode() {
    if (!this.isAlive) return [];
    
    this.isAlive = false;
    const mass = [];
    for (let segment of this.segments) {
      mass.push({
        pos: segment.copy(),
        color: this.color,
      });
    }
    return mass;
  }

  render() {
    if (!this.isAlive) return;
    
    const p = this.p;
    
    // Draw body segments
    for (let i = this.segments.length - 1; i >= 0; i--) {
      const segment = this.segments[i];
      const alpha = i === 0 ? 255 : 200;
      
      if (i === 0) {
        // Head - slightly larger and darker
        p.fill(this.color[0] * 0.7, this.color[1] * 0.7, this.color[2] * 0.7, alpha);
        p.circle(segment.x, segment.y, SEGMENT_SIZE * 1.5);
        
        // Eyes
        const eyeOffset = SEGMENT_SIZE * 0.4;
        const eyeDir = this.direction.copy().normalize();
        const eyePerpendicular = p.createVector(-eyeDir.y, eyeDir.x);
        
        p.fill(255);
        p.circle(
          segment.x + eyeDir.x * 2 + eyePerpendicular.x * eyeOffset,
          segment.y + eyeDir.y * 2 + eyePerpendicular.y * eyeOffset,
          3
        );
        p.circle(
          segment.x + eyeDir.x * 2 - eyePerpendicular.x * eyeOffset,
          segment.y + eyeDir.y * 2 - eyePerpendicular.y * eyeOffset,
          3
        );
      } else {
        // Body
        p.fill(this.color[0], this.color[1], this.color[2], alpha);
        p.circle(segment.x, segment.y, SEGMENT_SIZE);
      }
    }

    // Boost visual effect
    if (this.isBoosting && this.isPlayer) {
      const tail = this.segments[this.segments.length - 1];
      p.noFill();
      p.stroke(255, 200, 0, 100);
      p.strokeWeight(2);
      p.circle(tail.x, tail.y, SEGMENT_SIZE * 2);
      p.noStroke();
    }
  }
}

export class Pellet {
  constructor(p, x, y, type = 'normal') {
    this.p = p;
    this.pos = p.createVector(x, y);
    this.type = type;
    this.glowPhase = 0;
    this.size = type === 'normal' ? 5 : 4;
    this.value = type === 'normal' ? 1 : 5;
  }

  update() {
    this.glowPhase += 0.1;
  }

  render() {
    const p = this.p;
    const glowIntensity = p.map(p.sin(this.glowPhase), -1, 1, 150, 255);
    
    if (this.type === 'normal') {
      // Glowing pellet
      p.fill(255, 220, 0, 100);
      p.circle(this.pos.x, this.pos.y, this.size * 2);
      p.fill(255, 200, 0, glowIntensity);
      p.circle(this.pos.x, this.pos.y, this.size);
    } else {
      // Mass (no glow)
      p.fill(this.color || [150, 150, 150]);
      p.circle(this.pos.x, this.pos.y, this.size);
    }
  }
}

export class MassDrop {
  constructor(p, x, y, color) {
    this.p = p;
    this.pos = p.createVector(x, y);
    this.color = color;
    this.size = 4;
    this.value = 5;
  }

  render() {
    const p = this.p;
    p.fill(this.color[0], this.color[1], this.color[2]);
    p.circle(this.pos.x, this.pos.y, this.size);
  }
}

export class Obstacle {
  constructor(p, x, y, width, height, isDynamic = false) {
    this.p = p;
    this.pos = p.createVector(x, y);
    this.width = width;
    this.height = height;
    this.isDynamic = isDynamic;
    this.phase = 0;
    this.maxScale = 1.5;
    this.minScale = 0.5;
  }

  update() {
    if (this.isDynamic) {
      this.phase += 0.02;
    }
  }

  getScale() {
    if (!this.isDynamic) return 1;
    return this.p.map(this.p.sin(this.phase), -1, 1, this.minScale, this.maxScale);
  }

  render() {
    const p = this.p;
    const scale = this.getScale();
    
    p.fill(85, 85, 85);
    p.stroke(120, 120, 120);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(this.pos.x, this.pos.y, this.width * scale, this.height * scale);
    p.noStroke();
    p.rectMode(p.CORNER);
  }

  getBounds() {
    const scale = this.getScale();
    return {
      x: this.pos.x - (this.width * scale) / 2,
      y: this.pos.y - (this.height * scale) / 2,
      width: this.width * scale,
      height: this.height * scale,
    };
  }
}