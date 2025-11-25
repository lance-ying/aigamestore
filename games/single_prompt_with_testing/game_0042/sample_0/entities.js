// entities.js - Game entity classes

import { gameState, TILE_SIZE, GRAVITY, MAX_FALL_SPEED, PLAYER_SPEED, PLAYER_JUMP_FORCE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 16;
    this.height = 18;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.facing = 1; // 1 = right, -1 = left
    this.health = 3;
    this.maxHealth = 3;
    this.aimAngle = 0;
    this.shootCooldown = 0;
    this.specialCooldown = 0;
    this.invulnerable = 0;
    this.broType = 'RAMBO'; // RAMBO, COMMANDO, TERMINATOR
  }

  update(p) {
    // Apply gravity
    this.vy += GRAVITY;
    this.vy = Math.min(this.vy, MAX_FALL_SPEED);
    
    // Update position
    this.y += this.vy;
    this.x += this.vx;
    
    // Cooldowns
    if (this.shootCooldown > 0) this.shootCooldown--;
    if (this.specialCooldown > 0) this.specialCooldown--;
    if (this.invulnerable > 0) this.invulnerable--;
    
    // Collision with terrain
    this.checkTerrainCollision();
    
    // Keep in bounds
    this.x = Math.max(8, Math.min(this.x, 10000));
    if (this.y > CANVAS_HEIGHT + 100) {
      this.takeDamage(this.health);
    }
  }

  checkTerrainCollision() {
    const p = window.gameInstance;
    this.onGround = false;
    
    for (let terrain of gameState.terrain) {
      if (!terrain.solid) continue;
      
      if (p.collideRectRect(
        this.x - this.width/2, this.y - this.height/2, this.width, this.height,
        terrain.x, terrain.y, terrain.width, terrain.height
      )) {
        // Bottom collision (standing on ground)
        if (this.vy > 0 && this.y - this.height/2 < terrain.y + 5) {
          this.y = terrain.y - this.height/2;
          this.vy = 0;
          this.onGround = true;
        }
        // Top collision
        else if (this.vy < 0 && this.y + this.height/2 > terrain.y + terrain.height - 5) {
          this.y = terrain.y + terrain.height + this.height/2;
          this.vy = 0;
        }
        // Side collision
        else if (this.vx > 0) {
          this.x = terrain.x - this.width/2;
          this.vx = 0;
        } else if (this.vx < 0) {
          this.x = terrain.x + terrain.width + this.width/2;
          this.vx = 0;
        }
      }
    }
  }

  move(direction) {
    this.vx = direction * PLAYER_SPEED;
    if (direction !== 0) {
      this.facing = direction;
    }
  }

  jump() {
    if (this.onGround) {
      this.vy = PLAYER_JUMP_FORCE;
      this.onGround = false;
    }
  }

  shoot() {
    if (this.shootCooldown > 0) return;
    
    const offsetX = Math.cos(this.aimAngle) * 15;
    const offsetY = Math.sin(this.aimAngle) * 15;
    
    if (this.broType === 'RAMBO') {
      gameState.projectiles.push(new Projectile(
        this.x + offsetX, this.y + offsetY,
        Math.cos(this.aimAngle) * 8,
        Math.sin(this.aimAngle) * 8,
        'bullet', this
      ));
      this.shootCooldown = 10;
    } else if (this.broType === 'COMMANDO') {
      // Spread shot
      for (let i = -1; i <= 1; i++) {
        const angle = this.aimAngle + i * 0.2;
        gameState.projectiles.push(new Projectile(
          this.x + offsetX, this.y + offsetY,
          Math.cos(angle) * 7,
          Math.sin(angle) * 7,
          'bullet', this
        ));
      }
      this.shootCooldown = 20;
    } else if (this.broType === 'TERMINATOR') {
      // Shotgun blast
      for (let i = 0; i < 5; i++) {
        const angle = this.aimAngle + (Math.random() - 0.5) * 0.5;
        gameState.projectiles.push(new Projectile(
          this.x + offsetX, this.y + offsetY,
          Math.cos(angle) * 9,
          Math.sin(angle) * 9,
          'bullet', this
        ));
      }
      this.shootCooldown = 30;
    }
  }

  useSpecial() {
    if (this.specialCooldown > 0) return;
    
    if (this.broType === 'RAMBO') {
      // Grenade
      const vx = Math.cos(this.aimAngle) * 6;
      const vy = Math.sin(this.aimAngle) * 6 - 3;
      gameState.projectiles.push(new Projectile(
        this.x + this.facing * 10, this.y - 5,
        vx, vy, 'grenade', this
      ));
      this.specialCooldown = 60;
    } else if (this.broType === 'COMMANDO') {
      // Rocket
      gameState.projectiles.push(new Projectile(
        this.x + Math.cos(this.aimAngle) * 15,
        this.y + Math.sin(this.aimAngle) * 15,
        Math.cos(this.aimAngle) * 10,
        Math.sin(this.aimAngle) * 10,
        'rocket', this
      ));
      this.specialCooldown = 90;
    } else if (this.broType === 'TERMINATOR') {
      // Flamethrower burst
      for (let i = 0; i < 8; i++) {
        const angle = this.aimAngle + (Math.random() - 0.5) * 0.4;
        const speed = 5 + Math.random() * 3;
        gameState.projectiles.push(new Projectile(
          this.x + Math.cos(this.aimAngle) * 15,
          this.y + Math.sin(this.aimAngle) * 15,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          'flame', this
        ));
      }
      this.specialCooldown = 40;
    }
  }

  takeDamage(amount) {
    if (this.invulnerable > 0) return;
    
    this.health -= amount;
    this.invulnerable = 60;
    
    if (this.health <= 0) {
      gameState.gamePhase = "GAME_OVER_LOSE";
    }
  }

  switchBro(newType) {
    this.broType = newType;
    this.health = this.maxHealth;
  }

  render(p, cameraX) {
    const screenX = this.x - cameraX;
    const screenY = this.y;
    
    p.push();
    p.translate(screenX, screenY);
    
    // Invulnerability flash
    if (this.invulnerable > 0 && Math.floor(this.invulnerable / 5) % 2 === 0) {
      p.pop();
      return;
    }
    
    // Body color based on Bro type
    const bodyColor = this.broType === 'RAMBO' ? [220, 80, 60] :
                     this.broType === 'COMMANDO' ? [60, 150, 220] :
                     [100, 100, 100];
    
    // Body
    p.fill(...bodyColor);
    p.rect(-this.width/2, -this.height/2, this.width, this.height);
    
    // Head
    p.fill(240, 200, 160);
    p.ellipse(0, -this.height/2 - 4, 10, 10);
    
    // Weapon
    p.push();
    p.rotate(this.aimAngle);
    p.fill(40, 40, 40);
    p.rect(0, 0, 12, 3);
    p.pop();
    
    // Headband
    p.fill(200, 0, 0);
    p.rect(-5, -this.height/2 - 7, 10, 3);
    
    p.pop();
  }
}

export class Enemy {
  constructor(x, y, type = 'soldier') {
    this.x = x;
    this.y = y;
    this.width = 14;
    this.height = 16;
    this.vx = 0;
    this.vy = 0;
    this.type = type; // soldier, turret
    this.health = type === 'turret' ? 5 : 2;
    this.facing = -1;
    this.onGround = false;
    this.shootCooldown = 0;
    this.patrolLeft = x - 60;
    this.patrolRight = x + 60;
    this.active = true;
  }

  update(p) {
    if (!this.active) return;
    
    if (this.type === 'soldier') {
      // Apply gravity
      this.vy += GRAVITY;
      this.vy = Math.min(this.vy, MAX_FALL_SPEED);
      
      this.y += this.vy;
      this.x += this.vx;
      
      // Simple patrol AI
      if (this.onGround) {
        if (this.x <= this.patrolLeft) {
          this.vx = 1;
          this.facing = 1;
        } else if (this.x >= this.patrolRight) {
          this.vx = -1;
          this.facing = -1;
        }
      }
      
      this.checkTerrainCollision();
      
      // Shoot at player
      if (gameState.player && this.shootCooldown === 0) {
        const dx = gameState.player.x - this.x;
        const dy = gameState.player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < 200) {
          const angle = Math.atan2(dy, dx);
          gameState.projectiles.push(new Projectile(
            this.x, this.y,
            Math.cos(angle) * 5,
            Math.sin(angle) * 5,
            'enemy_bullet', this
          ));
          this.shootCooldown = 60;
        }
      }
      
      if (this.shootCooldown > 0) this.shootCooldown--;
    } else if (this.type === 'turret') {
      // Stationary turret
      if (gameState.player && this.shootCooldown === 0) {
        const dx = gameState.player.x - this.x;
        const dy = gameState.player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < 250) {
          const angle = Math.atan2(dy, dx);
          gameState.projectiles.push(new Projectile(
            this.x, this.y,
            Math.cos(angle) * 6,
            Math.sin(angle) * 6,
            'enemy_bullet', this
          ));
          this.shootCooldown = 40;
        }
      }
      
      if (this.shootCooldown > 0) this.shootCooldown--;
    }
  }

  checkTerrainCollision() {
    const p = window.gameInstance;
    this.onGround = false;
    
    for (let terrain of gameState.terrain) {
      if (!terrain.solid) continue;
      
      if (p.collideRectRect(
        this.x - this.width/2, this.y - this.height/2, this.width, this.height,
        terrain.x, terrain.y, terrain.width, terrain.height
      )) {
        if (this.vy > 0) {
          this.y = terrain.y - this.height/2;
          this.vy = 0;
          this.onGround = true;
        } else if (this.vy < 0) {
          this.y = terrain.y + terrain.height + this.height/2;
          this.vy = 0;
        } else if (this.vx > 0) {
          this.x = terrain.x - this.width/2;
          this.vx = -1;
          this.facing = -1;
        } else if (this.vx < 0) {
          this.x = terrain.x + terrain.width + this.width/2;
          this.vx = 1;
          this.facing = 1;
        }
      }
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.active = false;
      gameState.score += this.type === 'turret' ? 50 : 20;
      createExplosion(this.x, this.y, 30);
    }
  }

  render(p, cameraX) {
    if (!this.active) return;
    
    const screenX = this.x - cameraX;
    const screenY = this.y;
    
    p.push();
    p.translate(screenX, screenY);
    
    if (this.type === 'soldier') {
      // Enemy soldier (red)
      p.fill(180, 50, 50);
      p.rect(-this.width/2, -this.height/2, this.width, this.height);
      
      // Head
      p.fill(200, 150, 120);
      p.ellipse(0, -this.height/2 - 4, 8, 8);
      
      // Weapon
      p.fill(40, 40, 40);
      p.rect(this.facing * 3, 0, 8, 2);
    } else if (this.type === 'turret') {
      // Turret base
      p.fill(80, 80, 80);
      p.rect(-12, -8, 24, 16);
      
      // Barrel
      if (gameState.player) {
        const angle = Math.atan2(gameState.player.y - this.y, gameState.player.x - this.x);
        p.push();
        p.rotate(angle);
        p.fill(60, 60, 60);
        p.rect(0, -2, 15, 4);
        p.pop();
      }
    }
    
    p.pop();
  }
}

export class Prisoner {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 12;
    this.height = 16;
    this.rescued = false;
    this.cageDestroyed = false;
  }

  update(p) {
    if (this.rescued || !this.cageDestroyed) return;
    
    // Check if player is near
    if (gameState.player) {
      const dist = Math.sqrt(
        Math.pow(gameState.player.x - this.x, 2) +
        Math.pow(gameState.player.y - this.y, 2)
      );
      
      if (dist < 30) {
        this.rescued = true;
        gameState.rescuedCount++;
        gameState.score += 100;
        
        // Switch to next Bro type
        const nextIndex = (gameState.currentBroIndex + 1) % gameState.broTypes.length;
        gameState.currentBroIndex = nextIndex;
        gameState.player.switchBro(gameState.broTypes[nextIndex]);
        
        createParticles(this.x, this.y, [255, 215, 0], 15);
      }
    }
  }

  render(p, cameraX) {
    if (this.rescued) return;
    
    const screenX = this.x - cameraX;
    const screenY = this.y;
    
    p.push();
    p.translate(screenX, screenY);
    
    // Cage
    if (!this.cageDestroyed) {
      p.stroke(100, 100, 100);
      p.strokeWeight(2);
      p.noFill();
      p.rect(-14, -14, 28, 28);
      
      // Cage bars
      for (let i = -10; i <= 10; i += 5) {
        p.line(i, -14, i, 14);
      }
      p.noStroke();
    }
    
    // Prisoner
    p.fill(100, 150, 200);
    p.rect(-this.width/2, -this.height/2, this.width, this.height);
    
    // Head
    p.fill(220, 180, 140);
    p.ellipse(0, -this.height/2 - 4, 8, 8);
    
    // Arms up if rescued
    if (this.cageDestroyed) {
      p.stroke(220, 180, 140);
      p.strokeWeight(2);
      p.line(-4, -4, -8, -12);
      p.line(4, -4, 8, -12);
      p.noStroke();
    }
    
    p.pop();
  }
}

export class Projectile {
  constructor(x, y, vx, vy, type, owner) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.type = type; // bullet, grenade, rocket, flame, enemy_bullet
    this.owner = owner;
    this.active = true;
    this.lifetime = type === 'flame' ? 20 : 120;
    this.radius = type === 'grenade' ? 4 : type === 'rocket' ? 6 : 3;
  }

  update(p) {
    if (!this.active) return;
    
    this.x += this.vx;
    this.y += this.vy;
    
    // Apply gravity to grenades
    if (this.type === 'grenade') {
      this.vy += GRAVITY * 0.5;
    }
    
    this.lifetime--;
    if (this.lifetime <= 0) {
      if (this.type === 'grenade' || this.type === 'rocket') {
        createExplosion(this.x, this.y, this.type === 'rocket' ? 60 : 40);
      }
      this.active = false;
      return;
    }
    
    // Check terrain collision
    for (let terrain of gameState.terrain) {
      if (p.collideCircleRect(this.x, this.y, this.radius * 2, terrain.x, terrain.y, terrain.width, terrain.height)) {
        if (this.type === 'grenade' || this.type === 'rocket') {
          createExplosion(this.x, this.y, this.type === 'rocket' ? 60 : 40);
        }
        this.active = false;
        return;
      }
    }
    
    // Check enemy collision (player projectiles)
    if (this.owner instanceof Player) {
      for (let enemy of gameState.enemies) {
        if (!enemy.active) continue;
        
        if (p.collideCircleRect(
          this.x, this.y, this.radius * 2,
          enemy.x - enemy.width/2, enemy.y - enemy.height/2,
          enemy.width, enemy.height
        )) {
          enemy.takeDamage(1);
          if (this.type !== 'flame') {
            this.active = false;
          }
          return;
        }
      }
      
      // Check prisoner cage collision
      for (let prisoner of gameState.prisoners) {
        if (prisoner.rescued || prisoner.cageDestroyed) continue;
        
        if (p.collideCircleRect(
          this.x, this.y, this.radius * 2,
          prisoner.x - 14, prisoner.y - 14, 28, 28
        )) {
          prisoner.cageDestroyed = true;
          createParticles(prisoner.x, prisoner.y, [150, 150, 150], 10);
          this.active = false;
          return;
        }
      }
    }
    
    // Check player collision (enemy projectiles)
    if (this.owner instanceof Enemy && gameState.player) {
      if (p.collideCircleRect(
        this.x, this.y, this.radius * 2,
        gameState.player.x - gameState.player.width/2,
        gameState.player.y - gameState.player.height/2,
        gameState.player.width, gameState.player.height
      )) {
        gameState.player.takeDamage(1);
        this.active = false;
      }
    }
  }

  render(p, cameraX) {
    if (!this.active) return;
    
    const screenX = this.x - cameraX;
    const screenY = this.y;
    
    p.push();
    
    if (this.type === 'bullet') {
      p.fill(255, 255, 0);
      p.ellipse(screenX, screenY, 4, 4);
    } else if (this.type === 'enemy_bullet') {
      p.fill(255, 100, 100);
      p.ellipse(screenX, screenY, 4, 4);
    } else if (this.type === 'grenade') {
      p.fill(60, 80, 60);
      p.ellipse(screenX, screenY, 8, 8);
    } else if (this.type === 'rocket') {
      p.fill(150, 150, 150);
      p.rect(screenX - 4, screenY - 3, 12, 6);
      p.fill(255, 150, 0);
      p.ellipse(screenX - 6, screenY, 6, 6);
    } else if (this.type === 'flame') {
      const alpha = (this.lifetime / 20) * 255;
      p.fill(255, 150, 0, alpha);
      p.ellipse(screenX, screenY, 6, 6);
    }
    
    p.pop();
  }
}

export class Terrain {
  constructor(x, y, width, height, type = 'dirt') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type; // dirt, stone, metal, barrel
    this.solid = true;
    this.destructible = type !== 'metal';
    this.health = type === 'barrel' ? 1 : type === 'stone' ? 3 : 2;
    this.isBarrel = type === 'barrel';
  }

  takeDamage(amount, x, y) {
    if (!this.destructible) return false;
    
    this.health -= amount;
    if (this.health <= 0) {
      if (this.isBarrel) {
        createExplosion(this.x + this.width/2, this.y + this.height/2, 50);
      } else {
        createParticles(x, y, this.getColor(), 8);
      }
      return true;
    }
    return false;
  }

  getColor() {
    if (this.type === 'dirt') return [139, 90, 60];
    if (this.type === 'stone') return [120, 120, 130];
    if (this.type === 'metal') return [80, 80, 90];
    if (this.type === 'barrel') return [200, 50, 50];
    return [100, 100, 100];
  }

  render(p, cameraX) {
    const screenX = this.x - cameraX;
    
    p.push();
    p.fill(...this.getColor());
    p.rect(screenX, this.y, this.width, this.height);
    
    if (this.isBarrel) {
      // Draw explosive barrel details
      p.fill(255, 255, 0);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(12);
      p.text('!', screenX + this.width/2, this.y + this.height/2);
    }
    
    p.pop();
  }
}

export class Helicopter {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 60;
    this.height = 30;
    this.rotorAngle = 0;
  }

  update() {
    this.rotorAngle += 0.3;
    
    // Check if player reached helicopter
    if (gameState.player) {
      const dist = Math.sqrt(
        Math.pow(gameState.player.x - this.x, 2) +
        Math.pow(gameState.player.y - this.y, 2)
      );
      
      if (dist < 50) {
        gameState.levelComplete = true;
        gameState.gamePhase = "GAME_OVER_WIN";
      }
    }
  }

  render(p, cameraX) {
    const screenX = this.x - cameraX;
    
    p.push();
    p.translate(screenX, this.y);
    
    // Rotor
    p.push();
    p.rotate(this.rotorAngle);
    p.fill(100, 100, 100);
    p.rect(-30, -2, 60, 4);
    p.rect(-2, -30, 4, 60);
    p.pop();
    
    // Body
    p.fill(80, 120, 80);
    p.rect(-20, 0, 40, 20);
    
    // Cockpit
    p.fill(150, 200, 220);
    p.rect(-15, 5, 20, 10);
    
    // Tail
    p.fill(80, 120, 80);
    p.rect(20, 8, 15, 4);
    
    p.pop();
  }
}

export class Explosion {
  constructor(x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.maxRadius = radius;
    this.lifetime = 20;
    this.damageRadius = radius * 1.2;
  }

  update() {
    this.lifetime--;
    this.radius = this.maxRadius * (this.lifetime / 20);
    
    // Damage entities in radius
    if (this.lifetime === 19) {
      const p = window.gameInstance;
      
      // Damage enemies
      for (let enemy of gameState.enemies) {
        if (!enemy.active) continue;
        const dist = Math.sqrt(Math.pow(enemy.x - this.x, 2) + Math.pow(enemy.y - this.y, 2));
        if (dist < this.damageRadius) {
          enemy.takeDamage(3);
        }
      }
      
      // Damage player
      if (gameState.player) {
        const dist = Math.sqrt(
          Math.pow(gameState.player.x - this.x, 2) +
          Math.pow(gameState.player.y - this.y, 2)
        );
        if (dist < this.damageRadius) {
          gameState.player.takeDamage(1);
        }
      }
      
      // Destroy terrain
      for (let i = gameState.terrain.length - 1; i >= 0; i--) {
        const terrain = gameState.terrain[i];
        if (!terrain.destructible) continue;
        
        if (p.collideCircleRect(
          this.x, this.y, this.damageRadius * 2,
          terrain.x, terrain.y, terrain.width, terrain.height
        )) {
          if (terrain.takeDamage(10, this.x, this.y)) {
            gameState.terrain.splice(i, 1);
          }
        }
      }
    }
  }

  render(p, cameraX) {
    const screenX = this.x - cameraX;
    
    p.push();
    const alpha = (this.lifetime / 20) * 255;
    
    // Outer ring
    p.fill(255, 100, 0, alpha * 0.5);
    p.ellipse(screenX, this.y, this.radius * 2.5, this.radius * 2.5);
    
    // Middle ring
    p.fill(255, 200, 0, alpha * 0.8);
    p.ellipse(screenX, this.y, this.radius * 1.5, this.radius * 1.5);
    
    // Core
    p.fill(255, 255, 200, alpha);
    p.ellipse(screenX, this.y, this.radius, this.radius);
    
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
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.3;
    this.lifetime--;
  }

  render(p, cameraX) {
    const screenX = this.x - cameraX;
    const alpha = (this.lifetime / this.maxLifetime) * 255;
    
    p.push();
    p.fill(...this.color, alpha);
    p.ellipse(screenX, this.y, 4, 4);
    p.pop();
  }
}

function createExplosion(x, y, radius) {
  gameState.explosions.push(new Explosion(x, y, radius));
}

function createParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 3;
    gameState.particles.push(new Particle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      color
    ));
  }
}