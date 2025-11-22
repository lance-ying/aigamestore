import { TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, gameState, ITEMS, REALMS } from './globals.js';

export class Entity {
  constructor(p, x, y, w, h) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.vx = 0;
    this.vy = 0;
    this.active = true;
    this.health = 1;
  }

  update() {}
  
  render() {}

  getBounds() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.active = false;
    }
  }
}

export class Player extends Entity {
  constructor(p, x, y) {
    super(p, x, y, 16, 16);
    this.maxHealth = 6;
    this.health = this.maxHealth;
    this.direction = 0; // 0=down, 1=right, 2=up, 3=left
    this.attackCooldown = 0;
    this.attackDuration = 0;
    this.chargeTime = 0;
    this.isCharging = false;
    this.spinAttacking = false;
    this.spinDuration = 0;
    this.dashCooldown = 0;
    this.isDashing = false;
    this.dashDuration = 0;
    this.invulnerable = 0;
    this.speed = 2;
    this.swordReach = 18;
  }

  update() {
    if (this.invulnerable > 0) this.invulnerable--;
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.dashCooldown > 0) this.dashCooldown--;

    // Handle spin attack
    if (this.spinAttacking) {
      this.spinDuration--;
      if (this.spinDuration <= 0) {
        this.spinAttacking = false;
      }
    }

    // Handle normal attack
    if (this.attackDuration > 0) {
      this.attackDuration--;
    }

    // Handle dash
    if (this.isDashing) {
      this.dashDuration--;
      if (this.dashDuration <= 0) {
        this.isDashing = false;
        this.speed = 2;
      }
    }

    // Constrain to screen
    this.x = this.p.constrain(this.x, 0, CANVAS_WIDTH - this.w);
    this.y = this.p.constrain(this.y, 0, CANVAS_HEIGHT - this.h);
  }

  move(dx, dy) {
    if (this.isDashing) return;
    
    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
      
      this.x += dx * this.speed;
      this.y += dy * this.speed;

      // Update direction
      if (Math.abs(dx) > Math.abs(dy)) {
        this.direction = dx > 0 ? 1 : 3;
      } else if (dy !== 0) {
        this.direction = dy > 0 ? 0 : 2;
      }
    }
  }

  startCharge() {
    if (this.attackCooldown <= 0 && !this.spinAttacking) {
      this.isCharging = true;
      this.chargeTime = 0;
    }
  }

  updateCharge() {
    if (this.isCharging) {
      this.chargeTime++;
    }
  }

  releaseAttack() {
    if (this.isCharging) {
      if (this.chargeTime >= 40) {
        // Spin attack
        this.spinAttacking = true;
        this.spinDuration = 20;
        this.attackCooldown = 30;
      } else {
        // Normal attack
        this.attackDuration = 10;
        this.attackCooldown = 20;
      }
      this.isCharging = false;
      this.chargeTime = 0;
    }
  }

  dash() {
    if (gameState.inventory.includes(ITEMS.DASH_BOOTS) && this.dashCooldown <= 0 && !this.isDashing) {
      this.isDashing = true;
      this.dashDuration = 15;
      this.dashCooldown = 45;
      this.speed = 5;
      
      // Move in current direction
      const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
      const [dx, dy] = dirs[this.direction];
      this.vx = dx * 8;
      this.vy = dy * 8;
    }
  }

  getSwordHitbox() {
    if (this.attackDuration <= 0 && !this.spinAttacking) return null;
    
    const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    const [dx, dy] = dirs[this.direction];
    
    return {
      x: this.x + this.w / 2 + dx * this.swordReach,
      y: this.y + this.h / 2 + dy * this.swordReach,
      w: 12,
      h: 12
    };
  }

  takeDamage(amount) {
    if (this.invulnerable > 0) return;
    this.health -= amount;
    this.invulnerable = 60;
    if (this.health <= 0) {
      this.active = false;
    }
  }

  render() {
    this.p.push();
    
    // Invulnerability flicker
    if (this.invulnerable > 0 && this.p.frameCount % 6 < 3) {
      this.p.pop();
      return;
    }

    // Player body
    this.p.fill(80, 200, 120);
    this.p.rect(this.x, this.y, this.w, this.h);
    
    // Face direction indicator
    this.p.fill(60, 150, 100);
    const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    const [dx, dy] = dirs[this.direction];
    this.p.rect(this.x + this.w / 2 - 2 + dx * 4, this.y + this.h / 2 - 2 + dy * 4, 4, 4);

    // Sword
    if (this.attackDuration > 0 || this.spinAttacking) {
      this.p.fill(200, 200, 220);
      if (this.spinAttacking) {
        // Draw spinning sword
        const angle = (this.p.frameCount * 0.5) % (2 * this.p.PI);
        const sx = this.x + this.w / 2 + Math.cos(angle) * this.swordReach;
        const sy = this.y + this.h / 2 + Math.sin(angle) * this.swordReach;
        this.p.ellipse(sx, sy, 8, 16);
      } else {
        const sx = this.x + this.w / 2 + dx * this.swordReach;
        const sy = this.y + this.h / 2 + dy * this.swordReach;
        this.p.rect(sx - 4, sy - 4, 8, 8);
      }
    }

    // Charge indicator
    if (this.isCharging && this.chargeTime >= 40) {
      this.p.noFill();
      this.p.stroke(255, 255, 100);
      this.p.ellipse(this.x + this.w / 2, this.y + this.h / 2, 24 + (this.chargeTime % 10), 24 + (this.chargeTime % 10));
      this.p.noStroke();
    }

    this.p.pop();
  }
}

export class Enemy extends Entity {
  constructor(p, x, y, type) {
    super(p, x, y, 16, 16);
    this.type = type;
    this.aiTimer = 0;
    this.moveTimer = 0;
    this.attackTimer = 0;
    
    switch(type) {
      case 'SOLDIER':
        this.health = 3;
        this.speed = 1;
        this.damage = 1;
        this.color = [180, 80, 80];
        break;
      case 'ARCHER':
        this.health = 2;
        this.speed = 0.8;
        this.damage = 1;
        this.color = [100, 180, 100];
        this.shootCooldown = 0;
        break;
      case 'BEAMOS':
        this.health = 5;
        this.speed = 0;
        this.damage = 1;
        this.color = [200, 150, 50];
        this.rotationAngle = 0;
        break;
      case 'BEETLE':
        this.health = 2;
        this.speed = 1.5;
        this.damage = 1;
        this.color = [80, 80, 120];
        break;
      default:
        this.health = 2;
        this.speed = 1;
        this.damage = 1;
        this.color = [150, 150, 150];
    }
  }

  update() {
    if (!gameState.player || !gameState.player.active) return;

    this.aiTimer++;
    this.moveTimer--;
    this.attackTimer--;
    
    if (this.shootCooldown !== undefined) this.shootCooldown--;

    switch(this.type) {
      case 'SOLDIER':
        this.updateSoldier();
        break;
      case 'ARCHER':
        this.updateArcher();
        break;
      case 'BEAMOS':
        this.updateBeamos();
        break;
      case 'BEETLE':
        this.updateBeetle();
        break;
    }
  }

  updateSoldier() {
    if (this.moveTimer <= 0) {
      const dx = gameState.player.x - this.x;
      const dy = gameState.player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 5) {
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
      }
      this.moveTimer = 2;
    }
  }

  updateArcher() {
    // Keep distance and shoot
    const dx = gameState.player.x - this.x;
    const dy = gameState.player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 100) {
      // Move away
      if (this.moveTimer <= 0) {
        this.x -= (dx / dist) * this.speed;
        this.y -= (dy / dist) * this.speed;
        this.moveTimer = 2;
      }
    }
    
    // Shoot
    if (this.shootCooldown <= 0 && dist < 200) {
      this.shootProjectile(dx, dy, dist);
      this.shootCooldown = 90;
    }
  }

  updateBeamos() {
    // Rotate and shoot
    this.rotationAngle += 0.02;
    
    const dx = gameState.player.x - this.x;
    const dy = gameState.player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angleToPlayer = Math.atan2(dy, dx);
    
    // Check if player is in line of sight
    const angleDiff = Math.abs(angleToPlayer - this.rotationAngle) % (2 * Math.PI);
    if ((angleDiff < 0.2 || angleDiff > 2 * Math.PI - 0.2) && this.attackTimer <= 0) {
      this.shootProjectile(dx, dy, dist);
      this.attackTimer = 60;
    }
  }

  updateBeetle() {
    // Charge at player
    if (this.moveTimer <= 0) {
      const dx = gameState.player.x - this.x;
      const dy = gameState.player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 5) {
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
      }
      this.moveTimer = 1;
    }
  }

  shootProjectile(dx, dy, dist) {
    const proj = new Projectile(this.p, this.x + this.w / 2, this.y + this.h / 2, dx / dist, dy / dist, false);
    gameState.projectiles.push(proj);
  }

  takeDamage(amount) {
    super.takeDamage(amount);
    if (!this.active) {
      gameState.score += 10;
      // Chance to drop key
      if (this.p.random() < 0.3) {
        const item = new ItemPickup(this.p, this.x, this.y, ITEMS.SMALL_KEY);
        gameState.entities.push(item);
      }
    }
  }

  render() {
    this.p.push();
    this.p.fill(...this.color);
    this.p.rect(this.x, this.y, this.w, this.h);
    
    // Health indicator
    if (this.health < 5) {
      this.p.fill(255, 0, 0);
      this.p.rect(this.x, this.y - 4, this.w * (this.health / 5), 2);
    }
    
    // Type indicator
    if (this.type === 'BEAMOS') {
      this.p.stroke(255, 0, 0);
      const ex = this.x + this.w / 2 + Math.cos(this.rotationAngle) * 12;
      const ey = this.y + this.h / 2 + Math.sin(this.rotationAngle) * 12;
      this.p.line(this.x + this.w / 2, this.y + this.h / 2, ex, ey);
      this.p.noStroke();
    }
    
    this.p.pop();
  }
}

export class Boss extends Entity {
  constructor(p, x, y) {
    super(p, x, y, 40, 40);
    this.maxHealth = 20;
    this.health = this.maxHealth;
    this.speed = 0.8;
    this.damage = 2;
    this.phase = 1;
    this.attackPattern = 0;
    this.attackTimer = 0;
    this.moveTimer = 0;
  }

  update() {
    if (!gameState.player || !gameState.player.active) return;

    this.attackTimer--;
    this.moveTimer--;

    // Change phase based on health
    if (this.health < this.maxHealth * 0.5) {
      this.phase = 2;
      this.speed = 1.2;
    }

    // Movement
    if (this.moveTimer <= 0) {
      const dx = gameState.player.x - this.x;
      const dy = gameState.player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 80) {
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
      }
      this.moveTimer = 2;
    }

    // Attack patterns
    if (this.attackTimer <= 0) {
      this.executeAttack();
      this.attackTimer = this.phase === 1 ? 90 : 60;
    }
  }

  executeAttack() {
    const dx = gameState.player.x - this.x;
    const dy = gameState.player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (this.phase === 1) {
      // Single shot
      const proj = new Projectile(this.p, this.x + this.w / 2, this.y + this.h / 2, dx / dist, dy / dist, false);
      gameState.projectiles.push(proj);
    } else {
      // Triple shot
      for (let i = -1; i <= 1; i++) {
        const angle = Math.atan2(dy, dx) + i * 0.3;
        const proj = new Projectile(this.p, this.x + this.w / 2, this.y + this.h / 2, Math.cos(angle), Math.sin(angle), false);
        gameState.projectiles.push(proj);
      }
    }
  }

  takeDamage(amount) {
    super.takeDamage(amount);
    if (!this.active) {
      gameState.score += 100;
      gameState.bossesDefeated++;
      // Drop dungeon treasure
      const treasure = new ItemPickup(this.p, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, ITEMS.BIG_KEY);
      gameState.entities.push(treasure);
    }
  }

  render() {
    this.p.push();
    
    // Boss body - pulsing effect
    const pulse = Math.sin(this.p.frameCount * 0.1) * 5;
    this.p.fill(150, 50, 50);
    this.p.rect(this.x - pulse / 2, this.y - pulse / 2, this.w + pulse, this.h + pulse);
    
    // Eyes
    this.p.fill(255, 0, 0);
    this.p.ellipse(this.x + 12, this.y + 12, 6, 6);
    this.p.ellipse(this.x + 28, this.y + 12, 6, 6);
    
    // Health bar
    this.p.fill(0, 0, 0);
    this.p.rect(this.x - 5, this.y - 10, this.w + 10, 6);
    this.p.fill(255, 0, 0);
    this.p.rect(this.x - 4, this.y - 9, (this.w + 8) * (this.health / this.maxHealth), 4);
    
    this.p.pop();
  }
}

export class Projectile extends Entity {
  constructor(p, x, y, dx, dy, friendly = true) {
    super(p, x, y, 6, 6);
    this.vx = dx * 3;
    this.vy = dy * 3;
    this.friendly = friendly;
    this.lifetime = 180;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.lifetime--;
    
    if (this.lifetime <= 0 || this.x < 0 || this.x > CANVAS_WIDTH || this.y < 0 || this.y > CANVAS_HEIGHT) {
      this.active = false;
    }
  }

  render() {
    this.p.push();
    this.p.fill(this.friendly ? [100, 200, 255] : [255, 100, 100]);
    this.p.ellipse(this.x, this.y, this.w, this.h);
    this.p.pop();
  }
}

export class ItemPickup extends Entity {
  constructor(p, x, y, itemType) {
    super(p, x, y, 16, 16);
    this.itemType = itemType;
    this.bobTimer = 0;
  }

  update() {
    this.bobTimer += 0.1;
  }

  render() {
    this.p.push();
    const bob = Math.sin(this.bobTimer) * 3;
    
    switch(this.itemType) {
      case ITEMS.SMALL_KEY:
        this.p.fill(255, 215, 0);
        this.p.rect(this.x, this.y + bob, 6, 12);
        this.p.ellipse(this.x + 3, this.y + bob + 3, 6, 6);
        break;
      case ITEMS.BIG_KEY:
        this.p.fill(255, 100, 0);
        this.p.rect(this.x - 2, this.y + bob, 10, 16);
        this.p.ellipse(this.x + 3, this.y + bob + 4, 8, 8);
        break;
      case ITEMS.DASH_BOOTS:
        this.p.fill(100, 100, 200);
        this.p.rect(this.x, this.y + bob, 14, 10);
        break;
      case ITEMS.HOOKSHOT:
        this.p.fill(150, 150, 150);
        this.p.rect(this.x, this.y + bob, 16, 6);
        this.p.ellipse(this.x + 14, this.y + bob + 3, 8, 8);
        break;
      case ITEMS.BOW:
        this.p.fill(139, 90, 43);
        this.p.arc(this.x + 8, this.y + bob + 8, 16, 16, this.p.PI, 0);
        break;
      case ITEMS.HAMMER:
        this.p.fill(180, 180, 180);
        this.p.rect(this.x + 4, this.y + bob + 8, 4, 10);
        this.p.rect(this.x, this.y + bob, 12, 8);
        break;
      case ITEMS.REALM_MIRROR:
        this.p.fill(200, 200, 255);
        this.p.ellipse(this.x + 8, this.y + bob + 8, 14, 14);
        this.p.fill(100, 100, 200);
        this.p.ellipse(this.x + 8, this.y + bob + 8, 10, 10);
        break;
      default:
        this.p.fill(200, 200, 200);
        this.p.rect(this.x, this.y + bob, this.w, this.h);
    }
    
    this.p.pop();
  }
}

export class Obstacle extends Entity {
  constructor(p, x, y, type) {
    super(p, x, y, TILE_SIZE, TILE_SIZE);
    this.type = type; // WALL, PIT, WATER, LOCKED_DOOR, BLOCK, PEG, BREAKABLE
    this.broken = false;
  }

  render() {
    this.p.push();
    
    switch(this.type) {
      case 'WALL':
        this.p.fill(80, 80, 80);
        this.p.rect(this.x, this.y, this.w, this.h);
        break;
      case 'PIT':
        this.p.fill(20, 20, 20);
        this.p.rect(this.x, this.y, this.w, this.h);
        break;
      case 'WATER':
        this.p.fill(50, 100, 200);
        this.p.rect(this.x, this.y, this.w, this.h);
        break;
      case 'LOCKED_DOOR':
        this.p.fill(120, 80, 40);
        this.p.rect(this.x, this.y, this.w, this.h);
        this.p.fill(255, 215, 0);
        this.p.rect(this.x + 8, this.y + 8, 4, 4);
        break;
      case 'BLOCK':
        this.p.fill(150, 120, 80);
        this.p.rect(this.x, this.y, this.w, this.h);
        break;
      case 'BREAKABLE':
        if (!this.broken) {
          this.p.fill(160, 140, 100);
          this.p.rect(this.x, this.y, this.w, this.h);
          this.p.stroke(0);
          this.p.line(this.x + 5, this.y + 5, this.x + 15, this.y + 15);
          this.p.line(this.x + 15, this.y + 5, this.x + 5, this.y + 15);
          this.p.noStroke();
        }
        break;
    }
    
    this.p.pop();
  }
}

export class Particle {
  constructor(p, x, y, vx, vy, color, lifetime) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.active = true;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.lifetime--;
    if (this.lifetime <= 0) {
      this.active = false;
    }
  }

  render() {
    this.p.push();
    const alpha = (this.lifetime / this.maxLifetime) * 255;
    this.p.fill(...this.color, alpha);
    this.p.noStroke();
    this.p.ellipse(this.x, this.y, 4, 4);
    this.p.pop();
  }
}