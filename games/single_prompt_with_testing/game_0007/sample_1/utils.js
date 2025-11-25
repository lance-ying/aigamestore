// Utility functions

import { gameState } from './globals.js';

// Math utilities
export function lerp(start, end, t) {
  return start + (end - start) * t;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function angleBetween(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

export function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

export function randomInt(min, max) {
  return Math.floor(randomRange(min, max + 1));
}

export function randomChoice(array) {
  return array[randomInt(0, array.length - 1)];
}

// Vector utilities
export class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  
  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }
  
  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }
  
  mult(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }
  
  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  
  normalize() {
    const mag = this.magnitude();
    if (mag > 0) {
      this.x /= mag;
      this.y /= mag;
    }
    return this;
  }
  
  limit(max) {
    const mag = this.magnitude();
    if (mag > max) {
      this.normalize();
      this.mult(max);
    }
    return this;
  }
  
  copy() {
    return new Vector2(this.x, this.y);
  }
  
  static fromAngle(angle) {
    return new Vector2(Math.cos(angle), Math.sin(angle));
  }
}

// Easing functions
export function easeInQuad(t) {
  return t * t;
}

export function easeOutQuad(t) {
  return 1 - (1 - t) * (1 - t);
}

export function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function easeInCubic(t) {
  return t * t * t;
}

export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// Animation utilities
export class AnimationTimer {
  constructor(duration) {
    this.duration = duration;
    this.elapsed = 0;
    this.isComplete = false;
  }
  
  update(deltaTime = 1) {
    if (!this.isComplete) {
      this.elapsed += deltaTime;
      if (this.elapsed >= this.duration) {
        this.elapsed = this.duration;
        this.isComplete = true;
      }
    }
  }
  
  progress() {
    return this.duration > 0 ? this.elapsed / this.duration : 1;
  }
  
  reset() {
    this.elapsed = 0;
    this.isComplete = false;
  }
}

// Oscillate between 0 and 1 over time
export function oscillate(speed = 0.05) {
  return (Math.sin(gameState.frameCount * speed) + 1) / 2;
}

// Pulse effect (0 to 1 to 0)
export function pulse(speed = 0.05) {
  const osc = oscillate(speed);
  return osc < 0.5 ? osc * 2 : (1 - osc) * 2;
}

// Array shuffle (Fisher-Yates)
export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Remove element from array
export function removeFromArray(array, element) {
  const index = array.indexOf(element);
  if (index > -1) {
    array.splice(index, 1);
  }
}

// Rectangle collision check
export function checkRectCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
  return (
    x1 < x2 + w2 &&
    x1 + w1 > x2 &&
    y1 < y2 + h2 &&
    y1 + h1 > y2
  );
}

// Circle collision check
export function checkCircleCollision(x1, y1, r1, x2, y2, r2) {
  const dist = distance(x1, y1, x2, y2);
  return dist < (r1 + r2);
}