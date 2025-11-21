// weapons.js - Weapon system and projectiles

import { gameState, WEAPONS } from './globals.js';

export class Projectile {
  constructor(x, y, vx, vy, damage, type = 'bullet') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.type = type;
    this.lifetime = 120;
    this.active = true;
    this.exploded = false;
    this.radius = type === 'bomb' ? 15 : type === 'rocket' ? 12 : 5;
  }

  update(gravity) {
    if (!this.active) return;
    
    this.lifetime--;
    if (this.lifetime <= 0) {
      if (this.type === 'bomb' || this.type === 'rocket') {
        this.explode();
      }
      this.active = false;
      return;
    }
    
    this.vy += gravity * 0.5;
    this.x += this.vx;
    this.y += this.vy;
    
    // Check bounds
    if (this.x < 0 || this.x > 600 || this.y < 0 || this.y > 400) {
      this.active = false;
    }
    
    // Check collision with Buddy
    if (gameState.buddy) {
      gameState.buddy.parts.forEach(part => {
        const dist = Math.sqrt((this.x - part.x) ** 2 + (this.y - part.y) ** 2);
        if (dist < this.radius + part.w / 2) {
          this.hitBuddy(part);
        }
      });
    }
  }

  hitBuddy(part) {
    if (!this.active) return;
    
    const damage = part.takeDamage(this.damage);
    gameState.score += 10 * gameState.comboMultiplier;
    
    // Apply impulse
    const dx = part.x - this.x;
    const dy = part.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    part.applyImpulse(dx / dist * 2, dy / dist * 2);
    
    if (this.type === 'bomb' || this.type === 'rocket') {
      this.explode();
    } else {
      this.active = false;
    }
    
    gameState.lastActionTime = Date.now();
    createImpactParticles(this.x, this.y);
  }

  explode() {
    if (this.exploded) return;
    this.exploded = true;
    
    const explosionRadius = this.type === 'rocket' ? 100 : 70;
    let hitParts = 0;
    
    if (gameState.buddy) {
      gameState.buddy.parts.forEach(part => {
        const dist = Math.sqrt((this.x - part.x) ** 2 + (this.y - part.y) ** 2);
        if (dist < explosionRadius) {
          const damage = part.takeDamage(this.damage);
          const dx = part.x - this.x;
          const dy = part.y - this.y;
          const force = (explosionRadius - dist) / explosionRadius;
          part.applyImpulse(dx / dist * force * 5, dy / dist * force * 5);
          hitParts++;
        }
      });
    }
    
    if (hitParts > 0) {
      gameState.score += 50 * gameState.comboMultiplier + hitParts * 10;
      gameState.lastActionTime = Date.now();
    }
    
    createExplosionParticles(this.x, this.y, explosionRadius);
    this.active = false;
  }

  render(p) {
    if (!this.active) return;
    
    p.push();
    p.noStroke();
    
    if (this.type === 'bomb') {
      p.fill(50, 50, 50);
      p.ellipse(this.x, this.y, this.radius * 2);
      p.fill(255, 100, 0);
      p.ellipse(this.x, this.y - this.radius, 5, 8);
    } else if (this.type === 'rocket') {
      p.fill(200, 50, 50);
      p.ellipse(this.x, this.y, this.radius * 2);
      p.fill(255, 150, 0);
      p.triangle(this.x - 5, this.y + 6, this.x + 5, this.y + 6, this.x, this.y + 15);
    } else {
      p.fill(255, 220, 100);
      p.ellipse(this.x, this.y, this.radius * 2);
    }
    
    p.pop();
  }
}

export class Particle {
  constructor(x, y, vx, vy, color, lifetime = 30) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.size = 4;
    this.active = true;
  }

  update(gravity) {
    this.lifetime--;
    if (this.lifetime <= 0) {
      this.active = false;
      return;
    }
    
    this.vy += gravity * 0.3;
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.98;
    this.vy *= 0.98;
  }

  render(p) {
    if (!this.active) return;
    
    const alpha = (this.lifetime / this.maxLifetime) * 255;
    p.push();
    p.noStroke();
    p.fill(...this.color, alpha);
    p.ellipse(this.x, this.y, this.size);
    p.pop();
  }
}

export function createImpactParticles(x, y) {
  const p = window.gameInstance;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const speed = 2 + Math.random() * 3;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const particle = new Particle(x, y, vx, vy, [255, 100, 100], 20);
    gameState.particles.push(particle);
  }
}

export function createExplosionParticles(x, y, radius) {
  const p = window.gameInstance;
  const count = Math.floor(radius / 3);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 5;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const color = Math.random() > 0.5 ? [255, 150, 0] : [255, 100, 50];
    const particle = new Particle(x, y, vx, vy, color, 40);
    gameState.particles.push(particle);
  }
}

export function fireWeapon(mouseX, mouseY) {
  const weapon = WEAPONS[gameState.activeWeaponIndex];
  const buddy = gameState.buddy;
  
  if (!buddy) return;
  
  gameState.usedWeapons.add(gameState.activeWeaponIndex);
  
  if (weapon.name === "Hand") {
    // Punch
    const dx = mouseX - buddy.x;
    const dy = mouseY - buddy.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    buddy.applyImpulseToClosest(mouseX, mouseY, dx / dist * 3, dy / dist * 3);
    const damage = buddy.takeDamage(mouseX, mouseY, weapon.damage);
    gameState.score += 20 * gameState.comboMultiplier;
    createImpactParticles(mouseX, mouseY);
  } else if (weapon.name === "Pistol") {
    const dx = mouseX - 300;
    const dy = mouseY - 350;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const projectile = new Projectile(300, 350, (dx / dist) * 8, (dy / dist) * 8, weapon.damage, 'bullet');
    gameState.projectiles.push(projectile);
  } else if (weapon.name === "Shotgun") {
    for (let i = 0; i < 5; i++) {
      const spread = (i - 2) * 0.15;
      const angle = Math.atan2(mouseY - 350, mouseX - 300) + spread;
      const projectile = new Projectile(300, 350, Math.cos(angle) * 10, Math.sin(angle) * 10, weapon.damage / 5, 'bullet');
      gameState.projectiles.push(projectile);
    }
  } else if (weapon.name === "Bomb") {
    const dx = mouseX - 300;
    const dy = mouseY - 350;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const projectile = new Projectile(300, 350, (dx / dist) * 5, (dy / dist) * 5 - 2, weapon.damage, 'bomb');
    projectile.lifetime = 60;
    gameState.projectiles.push(projectile);
  } else if (weapon.name === "Rocket") {
    const dx = mouseX - 300;
    const dy = mouseY - 350;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const projectile = new Projectile(300, 350, (dx / dist) * 12, (dy / dist) * 12, weapon.damage, 'rocket');
    projectile.lifetime = 90;
    gameState.projectiles.push(projectile);
  }
  
  gameState.lastActionTime = Date.now();
}