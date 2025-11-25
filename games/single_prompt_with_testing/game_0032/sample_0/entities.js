// entities.js - Game entities

import { ROOM_WIDTH, ROOM_HEIGHT, ROOM_OFFSET_X, ROOM_OFFSET_Y } from './globals.js';
import { distance, normalize, clamp } from './utils.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 12;
    this.speed = 3;
    this.maxHealth = 6;
    this.health = 6;
    this.damage = 1;
    this.tearSpeed = 5;
    this.tearRate = 15;
    this.tearCooldown = 0;
    this.stamina = 100;
    this.maxStamina = 100;
    this.sprintSpeed = 5;
    this.facing = { x: 0, y: -1 };
    this.items = [];
    this.specialCooldown = 0;
    this.invincible = 0;
    this.animFrame = 0;
  }

  update(p, gameState) {
    this.animFrame++;
    
    if (this.invincible > 0) {
      this.invincible--;
    }
    
    if (this.tearCooldown > 0) {
      this.tearCooldown--;
    }
    
    if (this.specialCooldown > 0) {
      this.specialCooldown--;
    }

    // Stamina regeneration
    if (this.stamina < this.maxStamina && !gameState.keysPressed.has(16)) {
      this.stamina = Math.min(this.maxStamina, this.stamina + 0.5);
    }
  }

  move(dx, dy, p, gameState) {
    const speed = (gameState.keysPressed.has(16) && this.stamina > 0) ? this.sprintSpeed : this.speed;
    
    if (gameState.keysPressed.has(16) && this.stamina > 0) {
      this.stamina = Math.max(0, this.stamina - 1);
    }

    const newX = this.x + dx * speed;
    const newY = this.y + dy * speed;

    // Wall collision
    const margin = this.radius + 5;
    if (newX >= ROOM_OFFSET_X + margin && 
        newX <= ROOM_OFFSET_X + ROOM_WIDTH - margin) {
      this.x = newX;
    }
    if (newY >= ROOM_OFFSET_Y + margin && 
        newY <= ROOM_OFFSET_Y + ROOM_HEIGHT - margin) {
      this.y = newY;
    }

    if (dx !== 0 || dy !== 0) {
      this.facing = normalize(dx, dy);
    }
  }

  shoot(p, gameState) {
    if (this.tearCooldown <= 0) {
      const tear = new Tear(
        this.x + this.facing.x * this.radius,
        this.y + this.facing.y * this.radius,
        this.facing.x * this.tearSpeed,
        this.facing.y * this.tearSpeed,
        this.damage
      );
      gameState.tears.push(tear);
      this.tearCooldown = this.tearRate;
    }
  }

  takeDamage(amount, p, gameState) {
    if (this.invincible <= 0) {
      this.health -= amount;
      this.invincible = 60;
      
      // Create damage particles
      for (let i = 0; i < 8; i++) {
        const angle = p.random(p.TWO_PI);
        gameState.particles.push({
          x: this.x,
          y: this.y,
          vx: Math.cos(angle) * 3,
          vy: Math.sin(angle) * 3,
          life: 30,
          color: [255, 0, 0]
        });
      }
    }
  }

  useSpecial(p, gameState) {
    if (this.specialCooldown <= 0 && this.items.length > 0) {
      // Simple bomb-like special
      this.specialCooldown = 180;
      
      // Damage all enemies in radius
      for (const enemy of gameState.enemies) {
        if (distance(this.x, this.y, enemy.x, enemy.y) < 100) {
          enemy.takeDamage(5, p, gameState);
        }
      }
      
      // Visual effect
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * p.TWO_PI;
        gameState.particles.push({
          x: this.x,
          y: this.y,
          vx: Math.cos(angle) * 5,
          vy: Math.sin(angle) * 5,
          life: 40,
          color: [255, 200, 0]
        });
      }
    }
  }

  draw(p) {
    p.push();
    
    // Invincibility flash
    if (this.invincible > 0 && Math.floor(this.invincible / 5) % 2 === 0) {
      p.tint(255, 100);
    }

    // Body
    p.fill(240, 210, 180);
    p.stroke(100, 70, 60);
    p.strokeWeight(2);
    p.circle(this.x, this.y, this.radius * 2);

    // Head (slightly offset for animation)
    const headBob = Math.sin(this.animFrame * 0.1) * 1;
    p.fill(240, 210, 180);
    p.circle(this.x, this.y - this.radius + 5 + headBob, this.radius * 1.5);

    // Eyes
    p.fill(50);
    p.noStroke();
    p.circle(this.x - 3, this.y - this.radius + 3 + headBob, 3);
    p.circle(this.x + 3, this.y - this.radius + 3 + headBob, 3);

    // Mouth (crying)
    p.stroke(50);
    p.strokeWeight(1);
    p.noFill();
    p.arc(this.x, this.y - this.radius + 8 + headBob, 6, 4, 0, p.PI);

    p.pop();

    // Health bar
    p.fill(200, 0, 0);
    p.noStroke();
    for (let i = 0; i < this.maxHealth; i++) {
      const heartX = 10 + i * 20;
      const heartY = 10;
      if (i < this.health) {
        p.fill(220, 20, 60);
      } else {
        p.fill(80, 20, 30);
      }
      this.drawHeart(p, heartX, heartY, 10);
    }

    // Stamina bar (if sprinting or depleted)
    if (this.stamina < this.maxStamina) {
      p.fill(100);
      p.rect(10, 35, 100, 8);
      p.fill(100, 200, 255);
      p.rect(10, 35, this.stamina, 8);
    }
  }

  drawHeart(p, x, y, size) {
    p.beginShape();
    p.vertex(x, y + size * 0.3);
    p.bezierVertex(x, y, x - size * 0.5, y, x - size * 0.5, y + size * 0.3);
    p.bezierVertex(x - size * 0.5, y + size * 0.7, x, y + size, x, y + size);
    p.bezierVertex(x, y + size, x + size * 0.5, y + size * 0.7, x + size * 0.5, y + size * 0.3);
    p.bezierVertex(x + size * 0.5, y, x, y, x, y + size * 0.3);
    p.endShape(p.CLOSE);
  }
}

export class Tear {
  constructor(x, y, vx, vy, damage) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.radius = 5;
    this.active = true;
  }

  update(p, gameState) {
    this.x += this.vx;
    this.y += this.vy;

    // Check boundaries
    if (this.x < ROOM_OFFSET_X || this.x > ROOM_OFFSET_X + ROOM_WIDTH ||
        this.y < ROOM_OFFSET_Y || this.y > ROOM_OFFSET_Y + ROOM_HEIGHT) {
      this.active = false;
    }

    // Check enemy collision
    for (const enemy of gameState.enemies) {
      if (enemy.active && distance(this.x, this.y, enemy.x, enemy.y) < this.radius + enemy.radius) {
        enemy.takeDamage(this.damage, p, gameState);
        this.active = false;
        break;
      }
    }
  }

  draw(p) {
    p.fill(100, 150, 255);
    p.noStroke();
    p.circle(this.x, this.y, this.radius * 2);
    p.fill(150, 200, 255, 150);
    p.circle(this.x - 1, this.y - 1, this.radius);
  }
}

export class Enemy {
  constructor(x, y, type, floor) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = 10;
    this.speed = 1 + floor * 0.2;
    this.health = 2 + floor;
    this.maxHealth = this.health;
    this.damage = 1;
    this.active = true;
    this.animFrame = 0;
    this.shootCooldown = 0;
    this.moveTimer = 0;
    this.moveDir = { x: 0, y: 0 };
    
    // Type specific attributes
    if (type === 'fly') {
      this.speed *= 1.5;
      this.radius = 8;
      this.health *= 0.7;
      this.maxHealth = this.health;
    } else if (type === 'shooter') {
      this.speed *= 0.5;
      this.shootCooldown = 60;
    } else if (type === 'charger') {
      this.speed *= 0.7;
      this.health *= 1.5;
      this.maxHealth = this.health;
      this.damage = 2;
    }
  }

  update(p, gameState) {
    this.animFrame++;
    
    if (this.shootCooldown > 0) {
      this.shootCooldown--;
    }
    
    const player = gameState.player;
    const dist = distance(this.x, this.y, player.x, player.y);

    if (this.type === 'fly') {
      // Erratic movement
      if (this.moveTimer <= 0) {
        const angle = p.random(p.TWO_PI);
        this.moveDir = { x: Math.cos(angle), y: Math.sin(angle) };
        this.moveTimer = 30 + p.random(30);
      }
      this.moveTimer--;
      
      this.x += this.moveDir.x * this.speed;
      this.y += this.moveDir.y * this.speed;
      
      // Bounce off walls
      const margin = this.radius + 10;
      if (this.x < ROOM_OFFSET_X + margin || this.x > ROOM_OFFSET_X + ROOM_WIDTH - margin) {
        this.moveDir.x *= -1;
      }
      if (this.y < ROOM_OFFSET_Y + margin || this.y > ROOM_OFFSET_Y + ROOM_HEIGHT - margin) {
        this.moveDir.y *= -1;
      }
    } else if (this.type === 'shooter') {
      // Stay at distance and shoot
      if (dist > 150) {
        const dir = normalize(player.x - this.x, player.y - this.y);
        this.x += dir.x * this.speed;
        this.y += dir.y * this.speed;
      } else if (dist < 100) {
        const dir = normalize(this.x - player.x, this.y - player.y);
        this.x += dir.x * this.speed;
        this.y += dir.y * this.speed;
      }
      
      if (this.shootCooldown <= 0 && dist < 200) {
        const dir = normalize(player.x - this.x, player.y - this.y);
        gameState.tears.push(new EnemyTear(this.x, this.y, dir.x * 3, dir.y * 3, this.damage));
        this.shootCooldown = 90;
      }
    } else if (this.type === 'charger') {
      // Charge towards player periodically
      if (this.moveTimer <= 0) {
        const dir = normalize(player.x - this.x, player.y - this.y);
        this.moveDir = { x: dir.x, y: dir.y };
        this.moveTimer = 90;
      }
      this.moveTimer--;
      
      const chargeSpeed = this.moveTimer > 60 ? this.speed : this.speed * 3;
      this.x += this.moveDir.x * chargeSpeed;
      this.y += this.moveDir.y * chargeSpeed;
    } else {
      // Basic chase
      if (dist > this.radius + player.radius) {
        const dir = normalize(player.x - this.x, player.y - this.y);
        this.x += dir.x * this.speed;
        this.y += dir.y * this.speed;
      }
    }

    // Keep in bounds
    const margin = this.radius + 5;
    this.x = clamp(this.x, ROOM_OFFSET_X + margin, ROOM_OFFSET_X + ROOM_WIDTH - margin);
    this.y = clamp(this.y, ROOM_OFFSET_Y + margin, ROOM_OFFSET_Y + ROOM_HEIGHT - margin);

    // Check collision with player
    if (distance(this.x, this.y, player.x, player.y) < this.radius + player.radius) {
      player.takeDamage(this.damage, p, gameState);
    }
  }

  takeDamage(amount, p, gameState) {
    this.health -= amount;
    if (this.health <= 0) {
      this.active = false;
      gameState.score += 10;
      
      // Spawn pickup
      if (p.random() < 0.3) {
        gameState.pickups.push(new Pickup(this.x, this.y, 'heart'));
      } else if (p.random() < 0.1) {
        gameState.pickups.push(new Pickup(this.x, this.y, 'coin'));
      }
      
      // Death particles
      for (let i = 0; i < 10; i++) {
        const angle = p.random(p.TWO_PI);
        gameState.particles.push({
          x: this.x,
          y: this.y,
          vx: Math.cos(angle) * 2,
          vy: Math.sin(angle) * 2,
          life: 30,
          color: this.getColor()
        });
      }
    }
  }

  getColor() {
    if (this.type === 'fly') return [100, 200, 100];
    if (this.type === 'shooter') return [200, 100, 100];
    if (this.type === 'charger') return [200, 150, 50];
    return [150, 100, 150];
  }

  draw(p) {
    const col = this.getColor();
    
    // Body
    p.fill(...col);
    p.stroke(col[0] * 0.5, col[1] * 0.5, col[2] * 0.5);
    p.strokeWeight(2);
    p.circle(this.x, this.y, this.radius * 2);

    // Type-specific features
    if (this.type === 'fly') {
      // Wings
      const wingFlap = Math.sin(this.animFrame * 0.3) * 3;
      p.line(this.x - this.radius, this.y - wingFlap, this.x - this.radius - 5, this.y - wingFlap - 5);
      p.line(this.x + this.radius, this.y - wingFlap, this.x + this.radius + 5, this.y - wingFlap - 5);
    } else if (this.type === 'shooter') {
      // Gun indicator
      p.fill(50);
      p.noStroke();
      p.circle(this.x, this.y, this.radius * 0.8);
    } else if (this.type === 'charger') {
      // Horns
      p.stroke(col[0] * 0.5, col[1] * 0.5, col[2] * 0.5);
      p.strokeWeight(3);
      p.line(this.x - this.radius * 0.5, this.y - this.radius, this.x - this.radius * 0.7, this.y - this.radius * 1.5);
      p.line(this.x + this.radius * 0.5, this.y - this.radius, this.x + this.radius * 0.7, this.y - this.radius * 1.5);
    }

    // Eyes
    p.fill(255, 0, 0);
    p.noStroke();
    p.circle(this.x - this.radius * 0.3, this.y - this.radius * 0.2, 4);
    p.circle(this.x + this.radius * 0.3, this.y - this.radius * 0.2, 4);

    // Health bar
    if (this.health < this.maxHealth) {
      p.fill(200, 0, 0);
      p.noStroke();
      p.rect(this.x - this.radius, this.y - this.radius - 8, this.radius * 2, 3);
      p.fill(0, 200, 0);
      p.rect(this.x - this.radius, this.y - this.radius - 8, (this.health / this.maxHealth) * this.radius * 2, 3);
    }
  }
}

export class EnemyTear {
  constructor(x, y, vx, vy, damage) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.radius = 5;
    this.active = true;
  }

  update(p, gameState) {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < ROOM_OFFSET_X || this.x > ROOM_OFFSET_X + ROOM_WIDTH ||
        this.y < ROOM_OFFSET_Y || this.y > ROOM_OFFSET_Y + ROOM_HEIGHT) {
      this.active = false;
    }

    const player = gameState.player;
    if (distance(this.x, this.y, player.x, player.y) < this.radius + player.radius) {
      player.takeDamage(this.damage, p, gameState);
      this.active = false;
    }
  }

  draw(p) {
    p.fill(255, 100, 100);
    p.noStroke();
    p.circle(this.x, this.y, this.radius * 2);
  }
}

export class Boss {
  constructor(x, y, floor) {
    this.x = x;
    this.y = y;
    this.radius = 30;
    this.speed = 1.5;
    this.health = 20 + floor * 10;
    this.maxHealth = this.health;
    this.damage = 2;
    this.active = true;
    this.animFrame = 0;
    this.phase = 0;
    this.attackTimer = 0;
    this.movePattern = 0;
    this.targetX = x;
    this.targetY = y;
  }

  update(p, gameState) {
    this.animFrame++;
    this.attackTimer++;

    const player = gameState.player;

    // Phase changes
    if (this.health < this.maxHealth * 0.5 && this.phase === 0) {
      this.phase = 1;
      this.speed *= 1.5;
    }

    // Movement patterns
    if (this.attackTimer % 120 === 0) {
      this.movePattern = Math.floor(p.random(3));
      if (this.movePattern === 0) {
        // Charge at player
        this.targetX = player.x;
        this.targetY = player.y;
      } else if (this.movePattern === 1) {
        // Move to random position
        this.targetX = ROOM_OFFSET_X + p.random(100, ROOM_WIDTH - 100);
        this.targetY = ROOM_OFFSET_Y + p.random(100, ROOM_HEIGHT - 100);
      }
    }

    // Move towards target
    const dist = distance(this.x, this.y, this.targetX, this.targetY);
    if (dist > 5) {
      const dir = normalize(this.targetX - this.x, this.targetY - this.y);
      this.x += dir.x * this.speed;
      this.y += dir.y * this.speed;
    }

    // Keep in bounds
    const margin = this.radius + 10;
    this.x = clamp(this.x, ROOM_OFFSET_X + margin, ROOM_OFFSET_X + ROOM_WIDTH - margin);
    this.y = clamp(this.y, ROOM_OFFSET_Y + margin, ROOM_OFFSET_Y + ROOM_HEIGHT - margin);

    // Attacks
    if (this.attackTimer % 60 === 0) {
      // Spread shot
      for (let i = 0; i < (this.phase === 0 ? 8 : 12); i++) {
        const angle = (i / (this.phase === 0 ? 8 : 12)) * p.TWO_PI;
        gameState.tears.push(new EnemyTear(
          this.x,
          this.y,
          Math.cos(angle) * 2,
          Math.sin(angle) * 2,
          this.damage
        ));
      }
    }

    if (this.phase === 1 && this.attackTimer % 90 === 0) {
      // Targeted shots
      const dir = normalize(player.x - this.x, player.y - this.y);
      for (let i = -1; i <= 1; i++) {
        const angle = Math.atan2(dir.y, dir.x) + i * 0.3;
        gameState.tears.push(new EnemyTear(
          this.x,
          this.y,
          Math.cos(angle) * 3,
          Math.sin(angle) * 3,
          this.damage
        ));
      }
    }

    // Collision with player
    if (distance(this.x, this.y, player.x, player.y) < this.radius + player.radius) {
      player.takeDamage(this.damage, p, gameState);
    }
  }

  takeDamage(amount, p, gameState) {
    this.health -= amount;
    if (this.health <= 0) {
      this.active = false;
      gameState.score += 500;
      gameState.bossDefeated = true;
      
      // Spawn rewards
      gameState.pickups.push(new Pickup(this.x, this.y, 'heart'));
      gameState.pickups.push(new Pickup(this.x + 30, this.y, 'heart'));
      
      // Death explosion
      for (let i = 0; i < 30; i++) {
        const angle = p.random(p.TWO_PI);
        const speed = p.random(2, 6);
        gameState.particles.push({
          x: this.x,
          y: this.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 60,
          color: [200, 50, 50]
        });
      }
    }
  }

  draw(p) {
    // Body pulsing
    const pulse = 1 + Math.sin(this.animFrame * 0.1) * 0.1;
    const size = this.radius * 2 * pulse;

    // Main body
    p.fill(150, 50, 50);
    p.stroke(100, 30, 30);
    p.strokeWeight(3);
    p.circle(this.x, this.y, size);

    // Head
    p.fill(140, 40, 40);
    p.circle(this.x, this.y - this.radius * 0.5, this.radius * 1.2);

    // Eyes
    p.fill(255, 0, 0);
    p.noStroke();
    p.circle(this.x - this.radius * 0.3, this.y - this.radius * 0.6, 8);
    p.circle(this.x + this.radius * 0.3, this.y - this.radius * 0.6, 8);

    // Horns
    p.fill(80, 20, 20);
    p.triangle(
      this.x - this.radius * 0.5, this.y - this.radius,
      this.x - this.radius * 0.7, this.y - this.radius * 1.5,
      this.x - this.radius * 0.3, this.y - this.radius
    );
    p.triangle(
      this.x + this.radius * 0.5, this.y - this.radius,
      this.x + this.radius * 0.7, this.y - this.radius * 1.5,
      this.x + this.radius * 0.3, this.y - this.radius
    );

    // Health bar
    p.fill(100, 0, 0);
    p.noStroke();
    p.rect(this.x - this.radius, this.y + this.radius + 10, this.radius * 2, 8);
    p.fill(200, 0, 0);
    p.rect(this.x - this.radius, this.y + this.radius + 10, (this.health / this.maxHealth) * this.radius * 2, 8);
  }
}

export class Item {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = 15;
    this.animFrame = 0;
    this.collected = false;
  }

  update(p, gameState) {
    this.animFrame++;
    
    const player = gameState.player;
    if (distance(this.x, this.y, player.x, player.y) < this.radius + player.radius) {
      this.applyEffect(player, gameState);
      this.collected = true;
    }
  }

  applyEffect(player, gameState) {
    gameState.score += 50;
    player.items.push(this.type);
    
    if (this.type === 'damage') {
      player.damage += 1;
    } else if (this.type === 'speed') {
      player.speed += 0.5;
    } else if (this.type === 'health') {
      player.maxHealth += 2;
      player.health = player.maxHealth;
    } else if (this.type === 'tears') {
      player.tearRate = Math.max(5, player.tearRate - 3);
    } else if (this.type === 'range') {
      player.tearSpeed += 1;
    }
  }

  draw(p) {
    const float = Math.sin(this.animFrame * 0.05) * 5;
    
    // Pedestal
    p.fill(100, 80, 60);
    p.noStroke();
    p.rect(this.x - 20, this.y + 10, 40, 10);
    p.rect(this.x - 15, this.y, 30, 10);

    // Item icon
    p.push();
    p.translate(this.x, this.y - 15 + float);
    
    if (this.type === 'damage') {
      p.fill(255, 100, 100);
      p.stroke(200, 50, 50);
      p.strokeWeight(2);
      p.circle(0, 0, 20);
      p.line(-5, 0, 5, 0);
      p.line(0, -5, 0, 5);
    } else if (this.type === 'speed') {
      p.fill(100, 255, 100);
      p.stroke(50, 200, 50);
      p.strokeWeight(2);
      p.triangle(-10, 5, 10, 0, -10, -5);
    } else if (this.type === 'health') {
      p.fill(255, 100, 150);
      p.noStroke();
      // Heart shape
      p.beginShape();
      p.vertex(0, 5);
      p.bezierVertex(-10, -5, -5, -10, 0, -5);
      p.bezierVertex(5, -10, 10, -5, 0, 5);
      p.endShape();
    } else if (this.type === 'tears') {
      p.fill(100, 150, 255);
      p.noStroke();
      p.circle(0, 0, 18);
      p.fill(150, 200, 255);
      p.circle(-3, -3, 8);
    } else if (this.type === 'range') {
      p.fill(255, 200, 100);
      p.stroke(200, 150, 50);
      p.strokeWeight(2);
      for (let i = 0; i < 3; i++) {
        p.line(0, 0, (i - 1) * 7, -10);
      }
    }
    
    p.pop();
  }
}

export class Pickup {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = 8;
    this.active = true;
    this.animFrame = 0;
  }

  update(p, gameState) {
    this.animFrame++;
    
    const player = gameState.player;
    if (distance(this.x, this.y, player.x, player.y) < this.radius + player.radius) {
      if (this.type === 'heart' && player.health < player.maxHealth) {
        player.health = Math.min(player.maxHealth, player.health + 1);
        this.active = false;
        gameState.score += 5;
      } else if (this.type === 'coin') {
        this.active = false;
        gameState.score += 20;
      }
    }
  }

  draw(p) {
    const float = Math.sin(this.animFrame * 0.1) * 2;
    
    if (this.type === 'heart') {
      p.fill(255, 50, 100);
      p.noStroke();
      const x = this.x;
      const y = this.y + float;
      const size = 6;
      p.beginShape();
      p.vertex(x, y + size * 0.3);
      p.bezierVertex(x, y, x - size * 0.5, y, x - size * 0.5, y + size * 0.3);
      p.bezierVertex(x - size * 0.5, y + size * 0.7, x, y + size, x, y + size);
      p.bezierVertex(x, y + size, x + size * 0.5, y + size * 0.7, x + size * 0.5, y + size * 0.3);
      p.bezierVertex(x + size * 0.5, y, x, y, x, y + size * 0.3);
      p.endShape();
    } else if (this.type === 'coin') {
      p.fill(255, 215, 0);
      p.stroke(200, 150, 0);
      p.strokeWeight(2);
      p.circle(this.x, this.y + float, this.radius * 2);
      p.fill(255, 235, 100);
      p.noStroke();
      p.circle(this.x - 2, this.y + float - 2, this.radius * 0.8);
    }
  }
}