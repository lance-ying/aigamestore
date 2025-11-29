import { gameState, GROUND_Y, PIG_DEFEAT_THRESHOLD, WOOD_DESTROY_THRESHOLD, STONE_DESTROY_THRESHOLD, SCORE_SMALL_PIG, SCORE_LARGE_PIG, SCORE_WOOD_BLOCK, SCORE_STONE_BLOCK } from './globals.js';

// Simple physics body class
export class PhysicsBody {
  constructor(x, y, width, height, type, isStatic = false) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type; // 'rect' or 'circle'
    this.vx = 0;
    this.vy = 0;
    this.rotation = 0;
    this.angularVelocity = 0;
    this.isStatic = isStatic;
    this.active = true;
    this.mass = isStatic ? Infinity : (width * height) / 100;
    this.restitution = 0.3;
    this.friction = 0.5;
  }

  applyForce(fx, fy) {
    if (!this.isStatic) {
      this.vx += fx / this.mass;
      this.vy += fy / this.mass;
    }
  }

  update(gravity = 0.4) {
    if (!this.isStatic && this.active) {
      this.vy += gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.angularVelocity;
      
      // Apply friction
      this.vx *= (1 - this.friction * 0.01);
      this.vy *= (1 - this.friction * 0.01);
      this.angularVelocity *= 0.98;
      
      // Check if fell off screen
      if (this.y > GROUND_Y + 100) {
        this.active = false;
      }
    }
  }

  getSpeed() {
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
  }
}

// Collision detection and response
export function checkCollision(body1, body2) {
  if (!body1.active || !body2.active) return false;
  
  if (body1.type === 'circle' && body2.type === 'circle') {
    const dx = body2.x - body1.x;
    const dy = body2.y - body1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDist = body1.width / 2 + body2.width / 2;
    return distance < minDist;
  } else if (body1.type === 'circle' && body2.type === 'rect') {
    return checkCircleRectCollision(body1, body2);
  } else if (body1.type === 'rect' && body2.type === 'circle') {
    return checkCircleRectCollision(body2, body1);
  } else if (body1.type === 'rect' && body2.type === 'rect') {
    return checkRectRectCollision(body1, body2);
  }
  return false;
}

function checkCircleRectCollision(circle, rect) {
  const closestX = Math.max(rect.x - rect.width / 2, Math.min(circle.x, rect.x + rect.width / 2));
  const closestY = Math.max(rect.y - rect.height / 2, Math.min(circle.y, rect.y + rect.height / 2));
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < circle.width / 2;
}

function checkRectRectCollision(rect1, rect2) {
  return !(rect1.x + rect1.width / 2 < rect2.x - rect2.width / 2 ||
           rect1.x - rect1.width / 2 > rect2.x + rect2.width / 2 ||
           rect1.y + rect1.height / 2 < rect2.y - rect2.height / 2 ||
           rect1.y - rect1.height / 2 > rect2.y + rect2.height / 2);
}

export function resolveCollision(body1, body2) {
  if (body1.isStatic && body2.isStatic) return;
  
  const dx = body2.x - body1.x;
  const dy = body2.y - body1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance === 0) return;
  
  const nx = dx / distance;
  const ny = dy / distance;
  
  // Relative velocity
  const dvx = body2.vx - body1.vx;
  const dvy = body2.vy - body1.vy;
  const dvn = dvx * nx + dvy * ny;
  
  // Don't resolve if velocities are separating
  if (dvn > 0) return;
  
  const impactForce = Math.abs(dvn) * (body1.mass + body2.mass) / 2;
  
  // Calculate impulse
  const e = Math.min(body1.restitution, body2.restitution);
  const impulse = -(1 + e) * dvn / (1 / body1.mass + 1 / body2.mass);
  
  // Apply impulse
  if (!body1.isStatic) {
    body1.vx -= impulse * nx / body1.mass;
    body1.vy -= impulse * ny / body1.mass;
    body1.angularVelocity += (Math.random() - 0.5) * 0.1;
  }
  if (!body2.isStatic) {
    body2.vx += impulse * nx / body2.mass;
    body2.vy += impulse * ny / body2.mass;
    body2.angularVelocity += (Math.random() - 0.5) * 0.1;
  }
  
  return impactForce;
}

export function handleGroundCollision(body, groundY) {
  if (!body.active || body.isStatic) return 0;
  
  let collisionForce = 0;
  
  if (body.type === 'circle') {
    const radius = body.width / 2;
    if (body.y + radius > groundY) {
      body.y = groundY - radius;
      collisionForce = Math.abs(body.vy * body.mass);
      body.vy *= -body.restitution;
      body.vx *= 0.95;
      if (Math.abs(body.vy) < 0.5) body.vy = 0;
    }
  } else if (body.type === 'rect') {
    const bottom = body.y + body.height / 2;
    if (bottom > groundY) {
      body.y = groundY - body.height / 2;
      collisionForce = Math.abs(body.vy * body.mass);
      body.vy *= -body.restitution;
      body.vx *= 0.95;
      body.angularVelocity *= 0.8;
      if (Math.abs(body.vy) < 0.5) body.vy = 0;
    }
  }
  
  return collisionForce;
}

export function createParticleEffect(x, y, color, count = 8) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = 2 + Math.random() * 3;
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 30,
      maxLife: 30,
      color: color,
      size: 3 + Math.random() * 3
    });
  }
  return particles;
}