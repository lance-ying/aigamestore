// enemy.js - Enemy classes and behavior
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY } from './globals.js';
import { SoulPickup } from './pickup.js';

export class Enemy {
  constructor(p, x, y, type = 'crawler') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.width = 20;
    this.height = 20;
    this.vx = 0;
    this.vy = 0;
    this.health = 50;
    this.maxHealth = 50;
    this.alive = true;
    this.grounded = false;
    this.facing = 1;
    this.patrolLeft = x - 50;
    this.patrolRight = x + 50;
    this.attackCooldown = 0;
    this.stunned = false;
    this.stunTimer = 0;
    this.p = p;
    
    if (type === 'flyer') {
      this.width = 18;
      this.height = 16;
      this.health = 30;
      this.maxHealth = 30;
      this.hoverOffset = 0;
    } else if (type === 'heavy') {
      this.width = 30;
      this.height = 35;
      this.health = 100;
      this.maxHealth = 100;
    }
  }

  update(p) {
    if (!this.alive) return;

    if (this.stunned) {
      this.stunTimer--;
      if (this.stunTimer <= 0) {
        this.stunned = false;
      }
      this.vy += GRAVITY;
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.9;
      return;
    }

    if (this.type === 'crawler') {
      this.updateCrawler();
    } else if (this.type === 'flyer') {
      this.updateFlyer();
    } else if (this.type === 'heavy') {
      this.updateHeavy();
    }

    // Platform collision
    this.grounded = false;
    for (let platform of gameState.platforms) {
      if (this.collidesWith(platform)) {
        if (this.vy > 0 && this.y + this.height / 2 <= platform.y + 5) {
          this.y = platform.y - this.height / 2;
          this.vy = 0;
          this.grounded = true;
        }
      }
    }

    // Check collision with player
    if (gameState.player && !gameState.player.invincible) {
      let dist = Math.sqrt((this.x - gameState.player.x) ** 2 + (this.y - gameState.player.y) ** 2);
      if (dist < (this.width + gameState.player.width) / 2) {
        gameState.player.takeDamage(10);
        // Knockback
        let knockbackDir = gameState.player.x > this.x ? 1 : -1;
        gameState.player.vx = knockbackDir * 8;
        gameState.player.vy = -6;
      }
    }

    if (this.attackCooldown > 0) this.attackCooldown--;
  }

  updateCrawler() {
    if (!this.grounded) {
      this.vy += GRAVITY;
    } else {
      this.vy = 0;
      
      // Patrol behavior
      if (this.x <= this.patrolLeft) {
        this.facing = 1;
      } else if (this.x >= this.patrolRight) {
        this.facing = -1;
      }
      
      this.vx = this.facing * 1.5;
      this.x += this.vx;
    }
    
    this.y += this.vy;
  }

  updateFlyer() {
    this.hoverOffset += 0.05;
    let baseY = this.y;
    
    // Hover
    this.y = baseY + Math.sin(this.hoverOffset) * 3;
    
    // Move toward player if in range
    if (gameState.player) {
      let dx = gameState.player.x - this.x;
      let dy = gameState.player.y - baseY;
      let dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 150 && dist > 40) {
        this.x += (dx / dist) * 1.2;
        baseY += (dy / dist) * 1.2;
        this.y = baseY + Math.sin(this.hoverOffset) * 3;
        this.facing = dx > 0 ? 1 : -1;
      } else {
        // Patrol
        if (this.x <= this.patrolLeft) {
          this.facing = 1;
        } else if (this.x >= this.patrolRight) {
          this.facing = -1;
        }
        this.x += this.facing * 0.8;
      }
    }
  }

  updateHeavy() {
    if (!this.grounded) {
      this.vy += GRAVITY;
    } else {
      this.vy = 0;
      
      // Move slowly toward player
      if (gameState.player) {
        let dx = gameState.player.x - this.x;
        let dist = Math.abs(dx);
        
        if (dist < 200) {
          this.facing = dx > 0 ? 1 : -1;
          this.vx = this.facing * 0.8;
          this.x += this.vx;
        }
      }
    }
    
    this.y += this.vy;
  }

  collidesWith(obj) {
    return (
      this.x + this.width / 2 > obj.x - obj.width / 2 &&
      this.x - this.width / 2 < obj.x + obj.width / 2 &&
      this.y + this.height / 2 > obj.y &&
      this.y - this.height / 2 < obj.y + obj.height
    );
  }

  takeDamage(amount, knockbackDir) {
    this.health -= amount;
    this.stunned = true;
    this.stunTimer = 10;
    this.vx = knockbackDir * 5;
    this.vy = -4;
    
    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.alive = false;
    gameState.score += 10;
    
    // Drop soul essence
    gameState.pickups.push(new SoulPickup(this.p, this.x, this.y, 5));
    
    // Create death particles
    for (let i = 0; i < 8; i++) {
      gameState.particles.push(new DeathParticle(this.p, this.x, this.y));
    }
  }

  draw(p, cameraY) {
    if (!this.alive) return;
    
    let screenY = this.y - cameraY;
    
    p.push();
    p.translate(this.x, screenY);
    p.scale(this.facing, 1);
    
    if (this.type === 'crawler') {
      // Bug-like crawler
      p.fill(80, 60, 100);
      p.noStroke();
      p.ellipse(0, 0, this.width, this.height);
      
      // Legs
      p.stroke(60, 40, 80);
      p.strokeWeight(2);
      let legOffset = Math.sin(p.frameCount * 0.2) * 3;
      p.line(-8, 5, -12, 10 + legOffset);
      p.line(-3, 5, -6, 12 - legOffset);
      p.line(3, 5, 6, 12 + legOffset);
      p.line(8, 5, 12, 10 - legOffset);
      
      // Eyes
      p.noStroke();
      p.fill(120, 100, 140);
      p.ellipse(-4, -2, 4, 4);
      p.ellipse(4, -2, 4, 4);
      
    } else if (this.type === 'flyer') {
      // Flying insect
      p.fill(100, 80, 120);
      p.noStroke();
      p.ellipse(0, 0, this.width, this.height);
      
      // Wings
      let wingFlap = Math.sin(p.frameCount * 0.3) * 10;
      p.fill(150, 130, 170, 150);
      p.ellipse(-8, -3 + wingFlap, 12, 8);
      p.ellipse(8, -3 - wingFlap, 12, 8);
      
      // Eyes
      p.fill(140, 120, 160);
      p.ellipse(-3, 0, 3, 3);
      p.ellipse(3, 0, 3, 3);
      
    } else if (this.type === 'heavy') {
      // Heavy armored enemy
      p.fill(60, 50, 80);
      p.noStroke();
      p.rect(-this.width / 2, -this.height / 2, this.width, this.height);
      
      // Armor plates
      p.fill(80, 70, 100);
      p.rect(-10, -15, 20, 8);
      p.rect(-10, -5, 20, 8);
      p.rect(-10, 5, 20, 8);
      
      // Helmet
      p.fill(70, 60, 90);
      p.rect(-8, -20, 16, 6);
      
      // Eyes
      p.fill(150, 50, 50);
      p.ellipse(-4, -17, 3, 3);
      p.ellipse(4, -17, 3, 3);
    }
    
    // Health bar
    if (this.health < this.maxHealth) {
      p.noStroke();
      p.fill(50, 50, 50);
      p.rect(-this.width / 2, -this.height / 2 - 8, this.width, 3);
      p.fill(200, 50, 50);
      p.rect(-this.width / 2, -this.height / 2 - 8, this.width * (this.health / this.maxHealth), 3);
    }
    
    p.pop();
  }
}

export class DeathParticle {
  constructor(p, x, y) {
    this.x = x;
    this.y = y;
    this.vx = p.random(-4, 4);
    this.vy = p.random(-5, -2);
    this.life = 30;
    this.maxLife = 30;
    this.size = p.random(3, 6);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.3;
    this.life--;
  }

  draw(p, cameraY) {
    let alpha = (this.life / this.maxLife) * 200;
    p.fill(100, 80, 150, alpha);
    p.noStroke();
    p.circle(this.x, this.y - cameraY, this.size);
  }

  isDead() {
    return this.life <= 0;
  }
}