// entities.js - Entity classes
import { CANVAS_WIDTH, CANVAS_HEIGHT, WORLD_WIDTH, WORLD_HEIGHT, PAL_TYPES, gameState } from './globals.js';

export class Entity {
  constructor(x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.vx = 0;
    this.vy = 0;
    this.active = true;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    
    // Keep in world bounds
    this.x = Math.max(this.radius, Math.min(WORLD_WIDTH - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(WORLD_HEIGHT - this.radius, this.y));
  }

  getScreenPos(camera) {
    return {
      x: this.x - camera.x + CANVAS_WIDTH / 2,
      y: this.y - camera.y + CANVAS_HEIGHT / 2
    };
  }

  isOnScreen(camera) {
    const pos = this.getScreenPos(camera);
    return pos.x > -this.radius && pos.x < CANVAS_WIDTH + this.radius &&
           pos.y > -this.radius && pos.y < CANVAS_HEIGHT + this.radius;
  }
}

export class Player extends Entity {
  constructor(x, y) {
    super(x, y, 15);
    this.health = 100;
    this.maxHealth = 100;
    this.speed = 3;
    this.attackCooldown = 0;
    this.invulnerable = 0;
  }

  update() {
    super.update();
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.invulnerable > 0) this.invulnerable--;
  }

  takeDamage(amount) {
    if (this.invulnerable > 0) return;
    this.health -= amount;
    this.invulnerable = 60;
    if (this.health <= 0) {
      this.health = 0;
    }
  }

  canAttack() {
    return this.attackCooldown === 0;
  }

  attack() {
    this.attackCooldown = 30;
  }
}

export class Pal extends Entity {
  constructor(x, y, type) {
    super(x, y, 12);
    this.type = type;
    this.palData = PAL_TYPES[type];
    this.health = 50;
    this.maxHealth = 50;
    this.isCaptured = false;
    this.assignedStation = null;
    this.workProgress = 0;
    this.moveTimer = 0;
    this.targetX = x;
    this.targetY = y;
  }

  update() {
    if (!this.isCaptured) {
      // Wild Pal behavior - wander
      this.moveTimer--;
      if (this.moveTimer <= 0) {
        this.targetX = this.x + (Math.random() - 0.5) * 100;
        this.targetY = this.y + (Math.random() - 0.5) * 100;
        this.targetX = Math.max(50, Math.min(WORLD_WIDTH - 50, this.targetX));
        this.targetY = Math.max(50, Math.min(WORLD_HEIGHT - 50, this.targetY));
        this.moveTimer = 60 + Math.floor(Math.random() * 120);
      }
      
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 5) {
        this.vx = (dx / dist) * 1;
        this.vy = (dy / dist) * 1;
      } else {
        this.vx = 0;
        this.vy = 0;
      }
    } else if (this.assignedStation) {
      // Move to station
      const dx = this.assignedStation.x - this.x;
      const dy = this.assignedStation.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 30) {
        this.vx = (dx / dist) * 2;
        this.vy = (dy / dist) * 2;
      } else {
        this.vx = 0;
        this.vy = 0;
        // Work at station
        this.workProgress += 0.02;
      }
    } else {
      // Follow player loosely
      const player = gameState.player;
      if (player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 100) {
          this.vx = (dx / dist) * 2;
          this.vy = (dy / dist) * 2;
        } else {
          this.vx *= 0.9;
          this.vy *= 0.9;
        }
      }
    }
    
    super.update();
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health < 0) this.health = 0;
  }

  canBeCaptured() {
    return !this.isCaptured && this.health < this.maxHealth * 0.3;
  }

  capture() {
    this.isCaptured = true;
    this.health = this.maxHealth;
  }
}

export class Poacher extends Entity {
  constructor(x, y) {
    super(x, y, 13);
    this.health = 40;
    this.maxHealth = 40;
    this.speed = 1.5;
    this.attackCooldown = 0;
    this.target = null;
    this.state = "patrol"; // patrol, chase, steal
    this.patrolTimer = 0;
    this.targetX = x;
    this.targetY = y;
  }

  update() {
    if (this.attackCooldown > 0) this.attackCooldown--;
    
    const player = gameState.player;
    if (!player) return;
    
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distToPlayer = Math.sqrt(dx * dx + dy * dy);
    
    if (distToPlayer < 150) {
      // Chase player
      this.state = "chase";
      this.vx = (dx / distToPlayer) * this.speed;
      this.vy = (dy / distToPlayer) * this.speed;
    } else {
      // Look for captured pals to steal
      let nearestPal = null;
      let nearestDist = 200;
      
      for (const pal of gameState.capturedPals) {
        if (!pal.assignedStation) {
          const pdx = pal.x - this.x;
          const pdy = pal.y - this.y;
          const dist = Math.sqrt(pdx * pdx + pdy * pdy);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestPal = pal;
          }
        }
      }
      
      if (nearestPal) {
        const pdx = nearestPal.x - this.x;
        const pdy = nearestPal.y - this.y;
        this.vx = (pdx / nearestDist) * this.speed;
        this.vy = (pdy / nearestDist) * this.speed;
        this.state = "steal";
      } else {
        // Patrol
        this.state = "patrol";
        this.patrolTimer--;
        if (this.patrolTimer <= 0) {
          this.targetX = this.x + (Math.random() - 0.5) * 200;
          this.targetY = this.y + (Math.random() - 0.5) * 200;
          this.targetX = Math.max(50, Math.min(WORLD_WIDTH - 50, this.targetX));
          this.targetY = Math.max(50, Math.min(WORLD_HEIGHT - 50, this.targetY));
          this.patrolTimer = 120;
        }
        
        const ptdx = this.targetX - this.x;
        const ptdy = this.targetY - this.y;
        const ptdist = Math.sqrt(ptdx * ptdx + ptdy * ptdy);
        if (ptdist > 10) {
          this.vx = (ptdx / ptdist) * this.speed;
          this.vy = (ptdy / ptdist) * this.speed;
        }
      }
    }
    
    super.update();
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health < 0) this.health = 0;
  }

  canAttack() {
    return this.attackCooldown === 0;
  }

  attack() {
    this.attackCooldown = 60;
  }
}

export class Workstation extends Entity {
  constructor(x, y, type) {
    super(x, y, 25);
    this.type = type;
    this.stationData = type;
    this.assignedPal = null;
    this.productionProgress = 0;
    this.vx = 0;
    this.vy = 0;
  }

  update() {
    if (this.assignedPal && this.assignedPal.assignedStation === this) {
      const dx = this.assignedPal.x - this.x;
      const dy = this.assignedPal.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 50) {
        this.productionProgress += this.stationData.rate * 0.01;
        
        if (this.productionProgress >= 1) {
          this.productionProgress = 0;
          this.produce();
        }
      }
    }
  }

  produce() {
    const resource = this.stationData.produces;
    if (gameState.resources[resource] !== undefined) {
      gameState.resources[resource] += 1;
    }
  }

  assignPal(pal) {
    if (this.assignedPal) {
      this.assignedPal.assignedStation = null;
    }
    this.assignedPal = pal;
    pal.assignedStation = this;
  }

  unassignPal() {
    if (this.assignedPal) {
      this.assignedPal.assignedStation = null;
      this.assignedPal = null;
    }
  }
}

export class Projectile extends Entity {
  constructor(x, y, vx, vy, damage, source) {
    super(x, y, 4);
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.source = source;
    this.lifetime = 60;
  }

  update() {
    super.update();
    this.lifetime--;
    if (this.lifetime <= 0) {
      this.active = false;
    }
  }
}

export class Particle extends Entity {
  constructor(x, y, vx, vy, color, size, lifetime) {
    super(x, y, size);
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
  }

  update() {
    super.update();
    this.vx *= 0.95;
    this.vy *= 0.95;
    this.lifetime--;
    if (this.lifetime <= 0) {
      this.active = false;
    }
  }

  getAlpha() {
    return (this.lifetime / this.maxLifetime) * 255;
  }
}