// entities.js - Game entity classes

import { 
  PLAYER_SIZE, PLAYER_SPEED, PLAYER_SPRINT_SPEED, PLAYER_MAX_HEALTH, 
  PLAYER_MAX_STAMINA, PLAYER_STAMINA_DRAIN, PLAYER_STAMINA_REGEN,
  ENEMY_SIZE, ENEMY_SPEED, ENEMY_HEALTH, ENEMY_DAMAGE, ENEMY_SHOOT_COOLDOWN, ENEMY_DETECTION_RANGE,
  INNOCENT_SIZE, INNOCENT_SPEED, INNOCENT_PANIC_SPEED, INNOCENT_PANIC_RANGE,
  PARTICLE_LIFETIME, WEAPONS, CANVAS_WIDTH, CANVAS_HEIGHT
} from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = PLAYER_SIZE;
    this.health = PLAYER_MAX_HEALTH;
    this.stamina = PLAYER_MAX_STAMINA;
    this.isSprinting = false;
    this.shootCooldown = 0;
    this.hitCooldown = 0;
    this.type = 'player';
  }

  update(p, inputs) {
    // Movement
    let speed = inputs.sprint && this.stamina > 0 ? PLAYER_SPRINT_SPEED : PLAYER_SPEED;
    this.isSprinting = inputs.sprint && this.stamina > 0 && (inputs.left || inputs.right || inputs.up || inputs.down);

    let dx = 0, dy = 0;
    if (inputs.left) dx -= speed;
    if (inputs.right) dx += speed;
    if (inputs.up) dy -= speed;
    if (inputs.down) dy += speed;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      dx *= 0.707;
      dy *= 0.707;
    }

    this.x += dx;
    this.y += dy;

    // Boundary check
    this.x = p.constrain(this.x, this.size, CANVAS_WIDTH - this.size);
    this.y = p.constrain(this.y, this.size, CANVAS_HEIGHT - this.size);

    // Stamina management
    if (this.isSprinting) {
      this.stamina -= PLAYER_STAMINA_DRAIN;
      if (this.stamina < 0) this.stamina = 0;
    } else {
      this.stamina += PLAYER_STAMINA_REGEN;
      if (this.stamina > PLAYER_MAX_STAMINA) this.stamina = PLAYER_MAX_STAMINA;
    }

    // Cooldowns
    if (this.shootCooldown > 0) this.shootCooldown--;
    if (this.hitCooldown > 0) this.hitCooldown--;
  }

  takeDamage(amount) {
    if (this.hitCooldown <= 0) {
      this.health -= amount;
      this.hitCooldown = 30;
      return true;
    }
    return false;
  }

  render(p) {
    p.push();
    
    // Shadow
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.ellipse(this.x + 2, this.y + 2, this.size * 1.2);

    // Body (dark suit)
    if (this.hitCooldown > 0 && p.frameCount % 4 < 2) {
      p.fill(255, 100, 100);
    } else {
      p.fill(20, 20, 30);
    }
    p.stroke(200);
    p.strokeWeight(2);
    p.ellipse(this.x, this.y, this.size);

    // Red tie
    p.noStroke();
    p.fill(180, 20, 20);
    p.rect(this.x - 2, this.y - 5, 4, 10);

    // Face
    p.fill(220, 180, 150);
    p.ellipse(this.x, this.y - 3, this.size * 0.6);

    // Eyes
    p.fill(50);
    p.ellipse(this.x - 3, this.y - 4, 2, 3);
    p.ellipse(this.x + 3, this.y - 4, 2, 3);

    p.pop();
  }
}

export class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = ENEMY_SIZE;
    this.health = ENEMY_HEALTH;
    this.speed = ENEMY_SPEED;
    this.shootCooldown = ENEMY_SHOOT_COOLDOWN;
    this.detectionRange = ENEMY_DETECTION_RANGE;
    this.hitCooldown = 0;
    this.type = 'enemy';
    this.state = 'patrol'; // patrol, chase, shoot
    this.patrolAngle = Math.random() * Math.PI * 2;
    this.patrolTimer = 0;
  }

  update(p, player) {
    const dist = p.dist(this.x, this.y, player.x, player.y);
    
    // AI behavior
    if (dist < this.detectionRange) {
      this.state = 'chase';
      
      // Move toward player
      const angle = Math.atan2(player.y - this.y, player.x - this.x);
      
      if (dist > 150) {
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;
      } else if (dist < 100) {
        // Back away if too close
        this.x -= Math.cos(angle) * this.speed * 0.5;
        this.y -= Math.sin(angle) * this.speed * 0.5;
      }
      
      // Shooting
      if (this.shootCooldown <= 0 && dist < 250) {
        this.shootCooldown = ENEMY_SHOOT_COOLDOWN;
        return { shoot: true, angle: angle };
      }
    } else {
      this.state = 'patrol';
      // Simple patrol movement
      this.patrolTimer++;
      if (this.patrolTimer > 120) {
        this.patrolAngle = Math.random() * Math.PI * 2;
        this.patrolTimer = 0;
      }
      this.x += Math.cos(this.patrolAngle) * this.speed * 0.3;
      this.y += Math.sin(this.patrolAngle) * this.speed * 0.3;
    }

    // Boundary check
    this.x = p.constrain(this.x, this.size, CANVAS_WIDTH - this.size);
    this.y = p.constrain(this.y, this.size, CANVAS_HEIGHT - this.size);

    // Cooldowns
    if (this.shootCooldown > 0) this.shootCooldown--;
    if (this.hitCooldown > 0) this.hitCooldown--;

    return { shoot: false };
  }

  takeDamage(amount) {
    this.health -= amount;
    this.hitCooldown = 10;
    return this.health <= 0;
  }

  render(p) {
    p.push();
    
    // Shadow
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.ellipse(this.x + 2, this.y + 2, this.size * 1.2);

    // Body (dark clothing)
    if (this.hitCooldown > 0) {
      p.fill(255, 150, 150);
    } else {
      p.fill(40, 40, 50);
    }
    p.stroke(150);
    p.strokeWeight(2);
    p.ellipse(this.x, this.y, this.size);

    // Red eye glow (hostile)
    p.noStroke();
    p.fill(255, 50, 50, 150);
    p.ellipse(this.x - 3, this.y - 2, 4, 4);
    p.ellipse(this.x + 3, this.y - 2, 4, 4);

    // Weapon indicator
    p.stroke(100);
    p.strokeWeight(2);
    p.line(this.x, this.y, this.x + 8, this.y + 5);

    p.pop();
  }
}

export class Innocent {
  constructor(x, y, gender) {
    this.x = x;
    this.y = y;
    this.size = INNOCENT_SIZE;
    this.speed = INNOCENT_SPEED;
    this.type = 'innocent';
    this.gender = gender; // 'woman' or 'child'
    this.state = 'calm'; // calm, panic
    this.panicDirection = { x: 0, y: 0 };
    this.animOffset = Math.random() * 100;
  }

  update(p, player, bullets) {
    // Check if should panic
    let shouldPanic = false;
    const distToPlayer = p.dist(this.x, this.y, player.x, player.y);
    
    if (distToPlayer < INNOCENT_PANIC_RANGE) {
      shouldPanic = true;
    }

    // Check distance to any bullet
    for (let bullet of bullets) {
      if (p.dist(this.x, this.y, bullet.x, bullet.y) < INNOCENT_PANIC_RANGE * 0.7) {
        shouldPanic = true;
        break;
      }
    }

    if (shouldPanic) {
      this.state = 'panic';
      
      // Run away from player
      const angle = Math.atan2(this.y - player.y, this.x - player.x);
      this.panicDirection.x = Math.cos(angle);
      this.panicDirection.y = Math.sin(angle);
      
      this.x += this.panicDirection.x * INNOCENT_PANIC_SPEED;
      this.y += this.panicDirection.y * INNOCENT_PANIC_SPEED;
    } else {
      this.state = 'calm';
      // Wander slowly
      this.x += (Math.cos(p.frameCount * 0.01 + this.animOffset) * this.speed * 0.3);
      this.y += (Math.sin(p.frameCount * 0.015 + this.animOffset) * this.speed * 0.3);
    }

    // Boundary check
    this.x = p.constrain(this.x, this.size, CANVAS_WIDTH - this.size);
    this.y = p.constrain(this.y, this.size, CANVAS_HEIGHT - this.size);
  }

  render(p) {
    p.push();
    
    // Shadow
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.ellipse(this.x + 2, this.y + 2, this.size * 1.2);

    // Color based on gender
    const bodyColor = this.gender === 'woman' ? [180, 140, 200] : [100, 150, 220];
    
    // Body
    p.fill(...bodyColor);
    p.stroke(200);
    p.strokeWeight(1.5);
    p.ellipse(this.x, this.y, this.size);

    // Face
    p.fill(220, 190, 170);
    p.noStroke();
    p.ellipse(this.x, this.y - 2, this.size * 0.5);

    // Panic indicator
    if (this.state === 'panic') {
      p.fill(255, 200, 0);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(10);
      p.text('!', this.x, this.y - this.size);
    }

    p.pop();
  }
}

export class Bullet {
  constructor(x, y, angle, speed, damage, owner, color = [255, 255, 0]) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.damage = damage;
    this.owner = owner; // 'player' or 'enemy'
    this.type = 'bullet';
    this.lifetime = 120;
    this.color = color;
    this.size = 4;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.lifetime--;
    
    // Check if out of bounds
    if (this.x < 0 || this.x > CANVAS_WIDTH || this.y < 0 || this.y > CANVAS_HEIGHT) {
      return true; // Mark for deletion
    }
    
    return this.lifetime <= 0;
  }

  render(p) {
    p.push();
    p.noStroke();
    
    // Trail effect
    p.fill(...this.color, 100);
    p.ellipse(this.x - this.vx * 0.5, this.y - this.vy * 0.5, this.size * 1.5);
    
    // Main bullet
    p.fill(...this.color);
    p.ellipse(this.x, this.y, this.size);
    
    p.pop();
  }
}

export class Particle {
  constructor(x, y, vx, vy, color, size = 3) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.lifetime = PARTICLE_LIFETIME;
    this.maxLifetime = PARTICLE_LIFETIME;
    this.type = 'particle';
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.15; // Gravity
    this.vx *= 0.97; // Air resistance
    this.lifetime--;
    return this.lifetime <= 0;
  }

  render(p) {
    p.push();
    const alpha = (this.lifetime / this.maxLifetime) * 255;
    p.noStroke();
    p.fill(...this.color, alpha);
    p.ellipse(this.x, this.y, this.size);
    p.pop();
  }
}