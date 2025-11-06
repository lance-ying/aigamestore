// animations.js - Animation system

export class Animation {
  constructor(type, data, duration, onImpact = null) {
    this.type = type;
    this.data = data;
    this.duration = duration;
    this.elapsed = 0;
    this.completed = false;
    this.onImpact = onImpact;
    this.impactTriggered = false;
  }
  
  update(deltaTime = 1) {
    this.elapsed += deltaTime;
    
    // Trigger impact callback at ~80% progress (when projectile reaches target)
    const progress = this.getProgress();
    if (!this.impactTriggered && progress >= 0.8 && this.onImpact) {
      this.onImpact();
      this.impactTriggered = true;
    }
    
    if (this.elapsed >= this.duration) {
      this.completed = true;
    }
  }
  
  getProgress() {
    return Math.min(this.elapsed / this.duration, 1);
  }
}

export class Particle {
  constructor(x, y, vx, vy, color, size, lifetime) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.lifetime = lifetime;
    this.age = 0;
    this.dead = false;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.3; // Gravity
    this.vx *= 0.98; // Air resistance
    this.age++;
    
    if (this.age >= this.lifetime) {
      this.dead = true;
    }
  }
  
  getAlpha() {
    return (1 - this.age / this.lifetime) * 255;
  }
}

export function createAttackAnimation(attacker, target, damage, onDamageApply) {
  // Create animation with damage callback that triggers on impact
  return new Animation('ATTACK', {
    attacker: attacker,
    target: target,
    damage: damage,
    startX: attacker.x,
    startY: attacker.y,
    targetX: target.x,
    targetY: target.y,
    elementType: attacker.type
  }, 30, onDamageApply);
}

export function createHealAnimation(target, healAmount) {
  return new Animation('HEAL', {
    target: target,
    healAmount: healAmount
  }, 30);
}

export function createDamageNumberAnimation(x, y, damage, isHeal = false) {
  return new Animation('DAMAGE_NUMBER', {
    x: x,
    y: y,
    damage: damage,
    isHeal: isHeal,
    startY: y
  }, 40);
}

export function spawnImpactParticles(x, y, elementType, particles) {
  const particleCount = 15;
  const colors = getParticleColors(elementType);
  
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 2;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - 2; // Bias upward
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 4 + 2;
    const lifetime = Math.random() * 20 + 15;
    
    particles.push(new Particle(x, y, vx, vy, color, size, lifetime));
  }
}

function getParticleColors(elementType) {
  switch(elementType) {
    case 'FIRE':
      return [[255, 100, 0], [255, 200, 0], [255, 150, 50]];
    case 'WATER':
      return [[50, 150, 255], [100, 200, 255], [150, 220, 255]];
    case 'NATURE':
      return [[50, 200, 50], [80, 255, 80], [100, 220, 100]];
    default:
      return [[200, 200, 200], [150, 150, 150], [180, 180, 180]];
  }
}