// entities.js - Player and Enemy classes

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.radius = 15;
    this.speed = 3;
    this.maxHealth = 100;
    this.health = 100;
    this.facingAngle = 0;
    this.weapon = {
      damage: 15,
      fireRate: 15,
      cooldown: 0
    };
    this.ability = {
      type: 'DASH',
      cooldown: 0,
      maxCooldown: 180,
      dashSpeed: 12,
      dashDuration: 15,
      dashFrames: 0
    };
    this.damageFlash = 0;
  }

  update(inputs) {
    // Movement
    let dx = 0;
    let dy = 0;

    if (this.ability.dashFrames > 0) {
      // Dash movement
      dx = this.p.cos(this.facingAngle) * this.ability.dashSpeed;
      dy = this.p.sin(this.facingAngle) * this.ability.dashSpeed;
      this.ability.dashFrames--;
    } else {
      // Normal movement
      if (inputs.up) dy -= this.speed;
      if (inputs.down) dy += this.speed;
      if (inputs.left) dx -= this.speed;
      if (inputs.right) dx += this.speed;

      // Normalize diagonal movement
      if (dx !== 0 && dy !== 0) {
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        dx = (dx / magnitude) * this.speed;
        dy = (dy / magnitude) * this.speed;
      }

      // Update facing angle based on movement
      if (dx !== 0 || dy !== 0) {
        this.facingAngle = Math.atan2(dy, dx);
      }
    }

    // Apply movement with bounds checking
    const newX = this.x + dx;
    const newY = this.y + dy;

    if (newX - this.radius >= 0 && newX + this.radius <= CANVAS_WIDTH) {
      this.x = newX;
    }
    if (newY - this.radius >= 0 && newY + this.radius <= CANVAS_HEIGHT) {
      this.y = newY;
    }

    // Obstacle collision
    for (const obstacle of gameState.obstacles) {
      if (this.p.collideCircleCircle(this.x, this.y, this.radius * 2, obstacle.x, obstacle.y, obstacle.radius * 2)) {
        this.x -= dx;
        this.y -= dy;
        break;
      }
    }

    // Weapon cooldown
    if (this.weapon.cooldown > 0) {
      this.weapon.cooldown--;
    }

    // Ability cooldown
    if (this.ability.cooldown > 0) {
      this.ability.cooldown--;
    }

    // Damage flash
    if (this.damageFlash > 0) {
      this.damageFlash--;
    }
  }

  fire() {
    if (this.weapon.cooldown === 0) {
      this.weapon.cooldown = this.weapon.fireRate;
      return {
        x: this.x + this.p.cos(this.facingAngle) * this.radius,
        y: this.y + this.p.sin(this.facingAngle) * this.radius,
        vx: this.p.cos(this.facingAngle) * 8,
        vy: this.p.sin(this.facingAngle) * 8,
        damage: this.weapon.damage,
        owner: 'PLAYER'
      };
    }
    return null;
  }

  useAbility() {
    if (this.ability.cooldown === 0 && this.ability.dashFrames === 0) {
      this.ability.cooldown = this.ability.maxCooldown;
      this.ability.dashFrames = this.ability.dashDuration;
      return true;
    }
    return false;
  }

  takeDamage(amount) {
    this.health -= amount;
    this.damageFlash = 10;
    if (this.health < 0) this.health = 0;
  }

  heal(amount) {
    this.health += amount;
    if (this.health > this.maxHealth) this.health = this.maxHealth;
  }

  render() {
    this.p.push();
    
    // Damage flash effect
    if (this.damageFlash > 0) {
      this.p.fill(255, 100, 100);
    } else if (this.ability.dashFrames > 0) {
      this.p.fill(100, 255, 255);
    } else {
      this.p.fill(50, 200, 50);
    }
    
    this.p.noStroke();
    this.p.circle(this.x, this.y, this.radius * 2);
    
    // Direction indicator
    this.p.stroke(255);
    this.p.strokeWeight(3);
    this.p.line(
      this.x,
      this.y,
      this.x + this.p.cos(this.facingAngle) * this.radius,
      this.y + this.p.sin(this.facingAngle) * this.radius
    );
    
    this.p.pop();
  }
}

export class Enemy {
  constructor(p, x, y, type) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = 12;
    this.active = true;
    this.damageFlash = 0;
    this.attackCooldown = 0;
    this.defeatAnimation = 0;

    // Type-specific stats
    switch (type) {
      case 'GRUNT':
        this.speed = 1.2;
        this.maxHealth = 30;
        this.health = 30;
        this.damage = 10;
        this.range = 30;
        this.attackRate = 60;
        this.color = [200, 50, 50];
        break;
      case 'RANGER':
        this.speed = 1.0;
        this.maxHealth = 25;
        this.health = 25;
        this.damage = 12;
        this.range = 180;
        this.attackRate = 90;
        this.color = [220, 100, 50];
        break;
      case 'BRUISER':
        this.speed = 1.5;
        this.maxHealth = 60;
        this.health = 60;
        this.damage = 20;
        this.range = 35;
        this.attackRate = 50;
        this.radius = 16;
        this.color = [180, 30, 30];
        break;
      case 'SCOUT':
        this.speed = 2.5;
        this.maxHealth = 15;
        this.health = 15;
        this.damage = 8;
        this.range = 25;
        this.attackRate = 40;
        this.radius = 10;
        this.color = [230, 150, 50];
        break;
      case 'BOSS':
        this.speed = 1.3;
        this.maxHealth = 150;
        this.health = 150;
        this.damage = 25;
        this.range = 200;
        this.attackRate = 75;
        this.radius = 25;
        this.color = [150, 20, 20];
        break;
    }
  }

  update(player) {
    if (!this.active) return;

    if (this.defeatAnimation > 0) {
      this.defeatAnimation--;
      return;
    }

    // Move towards player
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > this.range) {
      const moveX = (dx / dist) * this.speed;
      const moveY = (dy / dist) * this.speed;
      
      this.x += moveX;
      this.y += moveY;

      // Obstacle collision
      for (const obstacle of gameState.obstacles) {
        if (this.p.collideCircleCircle(this.x, this.y, this.radius * 2, obstacle.x, obstacle.y, obstacle.radius * 2)) {
          this.x -= moveX;
          this.y -= moveY;
          break;
        }
      }
    }

    // Attack
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }

    if (this.damageFlash > 0) {
      this.damageFlash--;
    }
  }

  attack(player) {
    if (this.attackCooldown === 0) {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= this.range) {
        this.attackCooldown = this.attackRate;

        if (this.type === 'GRUNT' || this.type === 'BRUISER' || this.type === 'SCOUT') {
          // Melee attack
          if (dist <= this.range) {
            return { type: 'MELEE', damage: this.damage };
          }
        } else {
          // Ranged attack
          return {
            type: 'RANGED',
            x: this.x,
            y: this.y,
            vx: (dx / dist) * 5,
            vy: (dy / dist) * 5,
            damage: this.damage,
            owner: 'ENEMY'
          };
        }
      }
    }
    return null;
  }

  takeDamage(amount) {
    this.health -= amount;
    this.damageFlash = 8;
    if (this.health <= 0) {
      this.health = 0;
      this.defeatAnimation = 20;
      gameState.score += 50;
      gameState.enemiesDefeated++;
    }
  }

  render() {
    if (!this.active) return;

    this.p.push();

    if (this.defeatAnimation > 0) {
      const alpha = (this.defeatAnimation / 20) * 255;
      this.p.fill(255, 255, 255, alpha);
      this.p.noStroke();
      this.p.circle(this.x, this.y, this.radius * 2 * (1 + (20 - this.defeatAnimation) / 10));
    } else {
      // Enemy body
      if (this.damageFlash > 0) {
        this.p.fill(255, 200, 200);
      } else {
        this.p.fill(...this.color);
      }
      this.p.noStroke();
      this.p.circle(this.x, this.y, this.radius * 2);

      // Health bar
      const barWidth = this.radius * 2;
      const barHeight = 4;
      const healthPercent = this.health / this.maxHealth;
      
      this.p.fill(60, 60, 60);
      this.p.rect(this.x - barWidth / 2, this.y - this.radius - 8, barWidth, barHeight);
      
      this.p.fill(healthPercent > 0.5 ? 100 : healthPercent > 0.25 ? 200 : 255, healthPercent > 0.5 ? 200 : healthPercent > 0.25 ? 200 : 100, 50);
      this.p.rect(this.x - barWidth / 2, this.y - this.radius - 8, barWidth * healthPercent, barHeight);
    }

    this.p.pop();
  }
}

export class Projectile {
  constructor(p, data) {
    this.p = p;
    this.x = data.x;
    this.y = data.y;
    this.vx = data.vx;
    this.vy = data.vy;
    this.damage = data.damage;
    this.owner = data.owner;
    this.radius = 4;
    this.active = true;
    this.hitEffect = 0;
  }

  update() {
    if (this.hitEffect > 0) {
      this.hitEffect--;
      if (this.hitEffect === 0) {
        this.active = false;
      }
      return;
    }

    this.x += this.vx;
    this.y += this.vy;

    // Check bounds
    if (this.x < 0 || this.x > CANVAS_WIDTH || this.y < 0 || this.y > CANVAS_HEIGHT) {
      this.active = false;
    }

    // Check obstacle collision
    for (const obstacle of gameState.obstacles) {
      if (this.p.collideCircleCircle(this.x, this.y, this.radius * 2, obstacle.x, obstacle.y, obstacle.radius * 2)) {
        this.active = false;
        break;
      }
    }
  }

  hit() {
    this.hitEffect = 5;
  }

  render() {
    this.p.push();
    this.p.noStroke();
    
    if (this.hitEffect > 0) {
      const alpha = (this.hitEffect / 5) * 255;
      this.p.fill(255, 100, 100, alpha);
      this.p.circle(this.x, this.y, this.radius * 4);
    } else {
      this.p.fill(...(this.owner === 'PLAYER' ? [255, 220, 100] : [255, 130, 50]));
      this.p.circle(this.x, this.y, this.radius * 2);
    }
    
    this.p.pop();
  }
}

export class Loot {
  constructor(p, x, y, type) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.type = type;
    this.size = 15;
    this.active = true;
    this.pickupAnimation = 0;
  }

  pickup() {
    this.pickupAnimation = 10;
    gameState.score += 10;
  }

  render() {
    if (this.pickupAnimation > 0) {
      this.pickupAnimation--;
      const alpha = (this.pickupAnimation / 10) * 255;
      const scale = 1 + (10 - this.pickupAnimation) / 5;
      
      this.p.push();
      this.p.noStroke();
      this.p.fill(255, 255, 255, alpha);
      this.p.rectMode(this.p.CENTER);
      this.p.rect(this.x, this.y, this.size * scale, this.size * scale);
      this.p.pop();
      
      if (this.pickupAnimation === 0) {
        this.active = false;
      }
      return;
    }

    this.p.push();
    this.p.rectMode(this.p.CENTER);
    
    switch (this.type) {
      case 'HEALTH':
        this.p.fill(200, 50, 50);
        this.p.rect(this.x, this.y, this.size, this.size);
        this.p.fill(255);
        this.p.rect(this.x, this.y, this.size * 0.6, this.size * 0.2);
        this.p.rect(this.x, this.y, this.size * 0.2, this.size * 0.6);
        break;
      case 'WEAPON':
        this.p.fill(150, 150, 150);
        this.p.rect(this.x, this.y, this.size, this.size);
        this.p.fill(255, 220, 100);
        this.p.triangle(
          this.x, this.y - this.size * 0.3,
          this.x - this.size * 0.25, this.y + this.size * 0.2,
          this.x + this.size * 0.25, this.y + this.size * 0.2
        );
        break;
      case 'ABILITY':
        this.p.fill(120, 80, 180);
        this.p.rect(this.x, this.y, this.size, this.size);
        this.p.fill(100, 200, 255);
        this.p.star(this.x, this.y, this.size * 0.2, this.size * 0.4, 5);
        break;
    }
    
    this.p.pop();
  }
}

// Helper function for star drawing
if (typeof window !== 'undefined' && window.p5) {
  window.p5.prototype.star = function(x, y, radius1, radius2, npoints) {
    let angle = this.TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    this.beginShape();
    for (let a = -this.HALF_PI; a < this.TWO_PI - this.HALF_PI; a += angle) {
      let sx = x + this.cos(a) * radius2;
      let sy = y + this.sin(a) * radius2;
      this.vertex(sx, sy);
      sx = x + this.cos(a + halfAngle) * radius1;
      sy = y + this.sin(a + halfAngle) * radius1;
      this.vertex(sx, sy);
    }
    this.endShape(this.CLOSE);
  };
}

export class Obstacle {
  constructor(p, x, y, radius) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.radius = radius;
  }

  render() {
    this.p.push();
    this.p.fill(100, 80, 60);
    this.p.noStroke();
    this.p.circle(this.x, this.y, this.radius * 2);
    
    // Add some detail
    this.p.fill(80, 60, 40);
    this.p.circle(this.x - this.radius * 0.3, this.y - this.radius * 0.2, this.radius * 0.6);
    this.p.circle(this.x + this.radius * 0.2, this.y + this.radius * 0.3, this.radius * 0.5);
    this.p.pop();
  }
}