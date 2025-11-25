// entities.js - Game entity classes

import { ROOM_X, ROOM_Y, ROOM_WIDTH, ROOM_HEIGHT, gameState } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 24;
    this.height = 28;
    this.facingDirection = 'down'; // up, down, left, right
    this.animationFrame = 0;
    this.invulnerableFrames = 0;
    
    // Visual properties
    this.headSize = 18;
    this.bodySize = 12;
  }
  
  update(p) {
    if (this.invulnerableFrames > 0) {
      this.invulnerableFrames--;
    }
    
    // Animation
    if (p.frameCount % 10 === 0) {
      this.animationFrame = (this.animationFrame + 1) % 2;
    }
  }
  
  move(dx, dy) {
    const newX = this.x + dx;
    const newY = this.y + dy;
    
    // Check boundaries
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;
    
    if (newX - halfWidth >= ROOM_X && newX + halfWidth <= ROOM_X + ROOM_WIDTH) {
      this.x = newX;
    }
    if (newY - halfHeight >= ROOM_Y && newY + halfHeight <= ROOM_Y + ROOM_HEIGHT) {
      this.y = newY;
    }
    
    // Update facing direction
    if (dx > 0) this.facingDirection = 'right';
    else if (dx < 0) this.facingDirection = 'left';
    if (dy > 0) this.facingDirection = 'down';
    else if (dy < 0) this.facingDirection = 'up';
  }
  
  takeDamage(amount) {
    if (this.invulnerableFrames <= 0) {
      gameState.playerHealth -= amount;
      gameState.damageTaken += amount;
      this.invulnerableFrames = 60;
      return true;
    }
    return false;
  }
  
  render(p) {
    p.push();
    
    // Flash when invulnerable
    if (this.invulnerableFrames > 0 && p.frameCount % 6 < 3) {
      p.pop();
      return;
    }
    
    p.translate(this.x, this.y);
    
    // Body
    p.fill(230, 200, 180);
    p.noStroke();
    p.ellipse(0, 4, this.bodySize, this.bodySize + 4);
    
    // Head
    p.fill(255, 220, 200);
    p.ellipse(0, -4, this.headSize, this.headSize);
    
    // Eyes
    p.fill(255);
    const eyeOffset = 4;
    p.ellipse(-eyeOffset, -5, 6, 7);
    p.ellipse(eyeOffset, -5, 6, 7);
    
    // Pupils
    p.fill(50, 50, 100);
    let pupilX = 0;
    let pupilY = 0;
    if (this.facingDirection === 'left') pupilX = -1.5;
    if (this.facingDirection === 'right') pupilX = 1.5;
    if (this.facingDirection === 'up') pupilY = -1.5;
    if (this.facingDirection === 'down') pupilY = 1;
    
    p.ellipse(-eyeOffset + pupilX, -5 + pupilY, 3, 3);
    p.ellipse(eyeOffset + pupilX, -5 + pupilY, 3, 3);
    
    // Mouth (crying)
    p.stroke(100, 100, 150);
    p.strokeWeight(1);
    p.noFill();
    p.arc(0, 0, 6, 6, 0.3, p.PI - 0.3);
    
    // Tears streaming down
    p.noStroke();
    p.fill(150, 200, 255, 150);
    p.ellipse(-eyeOffset - 1, -3 + (this.animationFrame * 2), 2, 4);
    p.ellipse(eyeOffset + 1, -3 + (this.animationFrame * 2), 2, 4);
    
    p.pop();
  }
}

export class Tear {
  constructor(x, y, vx, vy, damage = 1) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = 5;
    this.damage = damage;
    this.lifetime = 120;
    this.age = 0;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.age++;
    
    // Check if out of room bounds or too old
    if (this.x < ROOM_X || this.x > ROOM_X + ROOM_WIDTH ||
        this.y < ROOM_Y || this.y > ROOM_Y + ROOM_HEIGHT ||
        this.age > this.lifetime) {
      return false;
    }
    return true;
  }
  
  render(p) {
    p.push();
    p.noStroke();
    p.fill(150, 200, 255, 200);
    p.ellipse(this.x, this.y, this.radius * 2, this.radius * 2);
    
    // Highlight
    p.fill(200, 230, 255, 150);
    p.ellipse(this.x - 1, this.y - 1, this.radius, this.radius);
    p.pop();
  }
}

export class Enemy {
  constructor(x, y, type = 'fly') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.health = 3;
    this.maxHealth = 3;
    this.speed = 1;
    this.size = 20;
    this.animationFrame = 0;
    this.hitFlash = 0;
    this.moveTimer = 0;
    this.targetX = x;
    this.targetY = y;
    
    // Type-specific properties
    if (type === 'charger') {
      this.health = 5;
      this.maxHealth = 5;
      this.speed = 2.5;
      this.size = 24;
    } else if (type === 'shooter') {
      this.health = 4;
      this.maxHealth = 4;
      this.speed = 0.8;
      this.size = 22;
      this.shootTimer = 0;
      this.shootCooldown = 90;
    }
  }
  
  update(p, player) {
    this.animationFrame++;
    
    if (this.hitFlash > 0) {
      this.hitFlash--;
    }
    
    if (this.type === 'fly') {
      this.updateFly(p, player);
    } else if (this.type === 'charger') {
      this.updateCharger(p, player);
    } else if (this.type === 'shooter') {
      this.updateShooter(p, player);
    }
    
    // Keep in bounds
    const margin = this.size / 2;
    this.x = p.constrain(this.x, ROOM_X + margin, ROOM_X + ROOM_WIDTH - margin);
    this.y = p.constrain(this.y, ROOM_Y + margin, ROOM_Y + ROOM_HEIGHT - margin);
  }
  
  updateFly(p, player) {
    // Move towards player slowly with some randomness
    this.moveTimer++;
    if (this.moveTimer > 30) {
      this.targetX = player.x + p.random(-50, 50);
      this.targetY = player.y + p.random(-50, 50);
      this.moveTimer = 0;
    }
    
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 2) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }
  
  updateCharger(p, player) {
    // Charge at player periodically
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 5) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }
  
  updateShooter(p, player) {
    // Stay at distance and shoot
    this.shootTimer++;
    
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Keep optimal distance
    const optimalDist = 150;
    if (dist < optimalDist - 20) {
      this.x -= (dx / dist) * this.speed;
      this.y -= (dy / dist) * this.speed;
    } else if (dist > optimalDist + 20) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
    
    // Shoot at player
    if (this.shootTimer >= this.shootCooldown) {
      this.shoot(p, player);
      this.shootTimer = 0;
    }
  }
  
  shoot(p, player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      const speed = 3;
      const proj = new EnemyProjectile(
        this.x, this.y,
        (dx / dist) * speed,
        (dy / dist) * speed
      );
      gameState.projectiles.push(proj);
    }
  }
  
  takeDamage(amount) {
    this.health -= amount;
    this.hitFlash = 10;
    return this.health <= 0;
  }
  
  render(p) {
    p.push();
    
    // Flash when hit
    const isFlashing = this.hitFlash > 0 && p.frameCount % 4 < 2;
    
    if (this.type === 'fly') {
      this.renderFly(p, isFlashing);
    } else if (this.type === 'charger') {
      this.renderCharger(p, isFlashing);
    } else if (this.type === 'shooter') {
      this.renderShooter(p, isFlashing);
    }
    
    // Health bar
    if (this.health < this.maxHealth) {
      const barWidth = this.size;
      const barHeight = 3;
      const healthPercent = this.health / this.maxHealth;
      
      p.fill(60, 20, 20);
      p.noStroke();
      p.rect(this.x - barWidth / 2, this.y - this.size / 2 - 8, barWidth, barHeight);
      
      p.fill(220, 60, 60);
      p.rect(this.x - barWidth / 2, this.y - this.size / 2 - 8, barWidth * healthPercent, barHeight);
    }
    
    p.pop();
  }
  
  renderFly(p, isFlashing) {
    p.translate(this.x, this.y);
    
    // Body
    p.fill(...(isFlashing ? [255, 200, 200] : [80, 60, 100]));
    p.noStroke();
    p.ellipse(0, 0, this.size, this.size * 0.8);
    
    // Wings
    const wingFlap = Math.sin(this.animationFrame * 0.3) * 3;
    p.fill(...(isFlashing ? [255, 220, 220, 200] : [120, 100, 140, 200]));
    p.ellipse(-this.size / 2 - 2, wingFlap, 8, 12);
    p.ellipse(this.size / 2 + 2, wingFlap, 8, 12);
    
    // Eyes
    p.fill(200, 50, 50);
    p.ellipse(-4, -2, 4, 5);
    p.ellipse(4, -2, 4, 5);
  }
  
  renderCharger(p, isFlashing) {
    p.translate(this.x, this.y);
    
    // Body
    p.fill(...(isFlashing ? [255, 200, 200] : [140, 60, 60]));
    p.noStroke();
    p.ellipse(0, 0, this.size, this.size);
    
    // Horn
    p.fill(...(isFlashing ? [255, 220, 220] : [160, 80, 80]));
    p.triangle(-3, -this.size / 2, 3, -this.size / 2, 0, -this.size / 2 - 8);
    
    // Eyes (angry)
    p.fill(255, 100, 100);
    p.ellipse(-5, -3, 6, 6);
    p.ellipse(5, -3, 6, 6);
    
    // Pupils
    p.fill(50);
    p.ellipse(-5, -2, 3, 3);
    p.ellipse(5, -2, 3, 3);
  }
  
  renderShooter(p, isFlashing) {
    p.translate(this.x, this.y);
    
    // Body
    p.fill(...(isFlashing ? [255, 200, 200] : [100, 140, 100]));
    p.noStroke();
    p.ellipse(0, 0, this.size, this.size);
    
    // Mouth (opening for shooting)
    const mouthOpen = this.shootTimer > this.shootCooldown - 20 ? 5 : 2;
    p.fill(...(isFlashing ? [255, 150, 150] : [80, 100, 80]));
    p.ellipse(0, 4, 8, mouthOpen);
    
    // Eyes
    p.fill(200, 200, 100);
    p.ellipse(-5, -3, 5, 6);
    p.ellipse(5, -3, 5, 6);
    
    p.fill(50);
    p.ellipse(-5, -2, 2, 3);
    p.ellipse(5, -2, 2, 3);
  }
}

export class EnemyProjectile {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = 6;
    this.damage = 1;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    
    // Check if out of bounds
    if (this.x < ROOM_X || this.x > ROOM_X + ROOM_WIDTH ||
        this.y < ROOM_Y || this.y > ROOM_Y + ROOM_HEIGHT) {
      return false;
    }
    return true;
  }
  
  render(p) {
    p.push();
    p.noStroke();
    p.fill(200, 100, 100);
    p.ellipse(this.x, this.y, this.radius * 2, this.radius * 2);
    
    p.fill(240, 150, 150);
    p.ellipse(this.x - 1, this.y - 1, this.radius, this.radius);
    p.pop();
  }
}

export class Item {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.size = 24;
    this.collected = false;
    this.floatOffset = 0;
  }
  
  update(p) {
    this.floatOffset = Math.sin(p.frameCount * 0.1) * 3;
  }
  
  render(p) {
    if (this.collected) return;
    
    p.push();
    p.translate(this.x, this.y + this.floatOffset);
    
    // Pedestal
    p.fill(100, 80, 60);
    p.noStroke();
    p.rect(-12, 10, 24, 4);
    
    // Item display based on type
    if (this.type === 'damage') {
      // Knife
      p.fill(180, 180, 200);
      p.rect(-2, -8, 4, 16);
      p.fill(200, 200, 220);
      p.triangle(-4, -8, 4, -8, 0, -14);
    } else if (this.type === 'speed') {
      // Speed boots
      p.fill(80, 120, 180);
      p.rect(-8, -2, 6, 10);
      p.rect(2, -2, 6, 10);
      p.fill(100, 140, 200);
      p.rect(-8, -2, 6, 4);
      p.rect(2, -2, 6, 4);
    } else if (this.type === 'firerate') {
      // Rapid fire symbol
      p.stroke(255, 200, 100);
      p.strokeWeight(2);
      p.line(-8, -4, -2, -4);
      p.line(2, 0, 8, 0);
      p.line(-8, 4, -2, 4);
    } else if (this.type === 'health') {
      // Health up
      p.fill(220, 60, 100);
      p.noStroke();
      p.ellipse(-4, -2, 8, 10);
      p.ellipse(4, -2, 8, 10);
      p.triangle(-8, 0, 8, 0, 0, 10);
    }
    
    // Glow
    p.fill(255, 255, 200, 50);
    p.ellipse(0, 0, this.size * 1.5, this.size * 1.5);
    
    p.pop();
  }
}

export class Heart {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 16;
    this.collected = false;
    this.floatOffset = 0;
  }
  
  update(p) {
    this.floatOffset = Math.sin(p.frameCount * 0.15) * 2;
  }
  
  render(p) {
    if (this.collected) return;
    
    p.push();
    p.translate(this.x, this.y + this.floatOffset);
    
    p.fill(220, 60, 80);
    p.noStroke();
    
    // Heart shape
    p.ellipse(-4, -2, 8, 8);
    p.ellipse(4, -2, 8, 8);
    p.triangle(-6, 0, 6, 0, 0, 10);
    
    // Highlight
    p.fill(255, 150, 170, 150);
    p.ellipse(-3, -3, 4, 4);
    
    p.pop();
  }
}

export class Bomb {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 20;
    this.timer = 90; // 1.5 seconds at 60 FPS
    this.exploded = false;
    this.explosionRadius = 80;
  }
  
  update() {
    this.timer--;
    return this.timer > 0;
  }
  
  explode(p) {
    this.exploded = true;
    
    // Damage enemies in range
    gameState.enemies.forEach(enemy => {
      const dist = p.dist(this.x, this.y, enemy.x, enemy.y);
      if (dist < this.explosionRadius) {
        if (enemy.takeDamage(3)) {
          // Enemy died
        }
      }
    });
  }
  
  render(p) {
    if (this.exploded) {
      // Explosion animation (brief)
      return;
    }
    
    p.push();
    
    // Flash faster as timer decreases
    const flashSpeed = p.map(this.timer, 90, 0, 20, 3);
    const isFlashing = p.frameCount % flashSpeed < flashSpeed / 2;
    
    p.fill(...(isFlashing ? [50, 50, 50] : [80, 80, 80]));
    p.noStroke();
    p.ellipse(this.x, this.y, this.size, this.size);
    
    // Fuse
    p.stroke(...(isFlashing ? [255, 200, 100] : [255, 150, 50]));
    p.strokeWeight(2);
    p.line(this.x, this.y - this.size / 2, this.x, this.y - this.size / 2 - 6);
    
    // Spark at fuse tip
    if (isFlashing) {
      p.fill(255, 200, 100);
      p.noStroke();
      p.ellipse(this.x, this.y - this.size / 2 - 6, 4, 4);
    }
    
    p.pop();
  }
}

export class ExitPortal {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 50;
    this.active = false;
    this.animationFrame = 0;
  }
  
  activate() {
    this.active = true;
  }
  
  update(p) {
    this.animationFrame++;
  }
  
  render(p) {
    if (!this.active) return;
    
    p.push();
    p.translate(this.x, this.y);
    
    // Portal swirl
    const numCircles = 5;
    for (let i = 0; i < numCircles; i++) {
      const radius = this.size * (1 - i / numCircles);
      const alpha = 150 - i * 25;
      const angle = (this.animationFrame + i * 20) * 0.05;
      
      p.push();
      p.rotate(angle);
      p.fill(150, 100, 255, alpha);
      p.noStroke();
      p.ellipse(0, 0, radius, radius);
      p.pop();
    }
    
    // Center glow
    p.fill(200, 150, 255, 200);
    p.ellipse(0, 0, this.size * 0.3, this.size * 0.3);
    
    p.pop();
  }
}