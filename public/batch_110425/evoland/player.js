// player.js - Player entity and logic
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 24;
    this.height = 24;
    this.speed = 3;
    this.maxHP = 100;
    this.hp = 100;
    this.attackCooldown = 0;
    this.attackRange = 40;
    this.attackWidth = 30;
    this.attackDamage = 15;
    this.invulnerable = 0;
    this.dodgeCooldown = 0;
    this.isDodging = false;
    this.dodgeDuration = 0;
    this.dodgeSpeed = 8;
    this.direction = 'down'; // up, down, left, right
    this.animFrame = 0;
    this.animTimer = 0;
    this.isAttacking = false;
    this.attackAnimTimer = 0;
  }
  
  update() {
    this.animTimer++;
    if (this.animTimer > 10) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 2;
    }
    
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.invulnerable > 0) this.invulnerable--;
    if (this.dodgeCooldown > 0) this.dodgeCooldown--;
    
    // Update attack animation
    if (this.isAttacking) {
      this.attackAnimTimer++;
      if (this.attackAnimTimer > 10) {
        this.isAttacking = false;
        this.attackAnimTimer = 0;
      }
    }
    
    if (this.isDodging && this.dodgeDuration > 0) {
      this.dodgeDuration--;
      this.invulnerable = 2;
      
      // Move in dodge direction
      const oldX = this.x;
      const oldY = this.y;
      
      if (this.direction === 'up') this.y -= this.dodgeSpeed;
      else if (this.direction === 'down') this.y += this.dodgeSpeed;
      else if (this.direction === 'left') this.x -= this.dodgeSpeed;
      else if (this.direction === 'right') this.x += this.dodgeSpeed;
      
      // Check bounds
      if (!this.isValidPosition(this.x, this.y)) {
        this.x = oldX;
        this.y = oldY;
      }
      
      if (this.dodgeDuration <= 0) {
        this.isDodging = false;
      }
    }
  }
  
  move(dx, dy) {
    if (this.isDodging) return;
    
    const oldX = this.x;
    const oldY = this.y;
    
    this.x += dx * this.speed;
    this.y += dy * this.speed;
    
    // Update direction
    if (dx < 0) this.direction = 'left';
    else if (dx > 0) this.direction = 'right';
    else if (dy < 0) this.direction = 'up';
    else if (dy > 0) this.direction = 'down';
    
    // Check bounds and collisions
    if (!this.isValidPosition(this.x, this.y)) {
      this.x = oldX;
      this.y = oldY;
    }
    
    // Update camera with smooth interpolation if scrolling is unlocked
    if (gameState.hasScrolling) {
      const targetCameraX = this.p.constrain(this.x - CANVAS_WIDTH / 2, 0, gameState.worldWidth - CANVAS_WIDTH);
      const targetCameraY = this.p.constrain(this.y - CANVAS_HEIGHT / 2, 0, gameState.worldHeight - CANVAS_HEIGHT);
      
      // Smooth camera movement with lerp (0.1 = smooth, 1.0 = instant)
      gameState.cameraX = this.p.lerp(gameState.cameraX, targetCameraX, 0.1);
      gameState.cameraY = this.p.lerp(gameState.cameraY, targetCameraY, 0.1);
    }
  }
  
  isValidPosition(x, y) {
    // World bounds
    if (x < this.width / 2 || x > gameState.worldWidth - this.width / 2) return false;
    if (y < this.height / 2 || y > gameState.worldHeight - this.height / 2) return false;
    
    // Check collision with obstacles
    for (let chest of gameState.chests) {
      if (!chest.opened && this.p.collideRectRect(
        x - this.width / 2, y - this.height / 2, this.width, this.height,
        chest.x - chest.width / 2, chest.y - chest.height / 2, chest.width, chest.height
      )) {
        return false;
      }
    }
    
    return true;
  }
  
  getAttackHitbox() {
    // Calculate attack hitbox based on direction
    let hitboxX, hitboxY, hitboxW, hitboxH;
    
    switch(this.direction) {
      case 'up':
        hitboxX = this.x - this.attackWidth / 2;
        hitboxY = this.y - this.height / 2 - this.attackRange;
        hitboxW = this.attackWidth;
        hitboxH = this.attackRange;
        break;
      case 'down':
        hitboxX = this.x - this.attackWidth / 2;
        hitboxY = this.y + this.height / 2;
        hitboxW = this.attackWidth;
        hitboxH = this.attackRange;
        break;
      case 'left':
        hitboxX = this.x - this.width / 2 - this.attackRange;
        hitboxY = this.y - this.attackWidth / 2;
        hitboxW = this.attackRange;
        hitboxH = this.attackWidth;
        break;
      case 'right':
        hitboxX = this.x + this.width / 2;
        hitboxY = this.y - this.attackWidth / 2;
        hitboxW = this.attackRange;
        hitboxH = this.attackWidth;
        break;
    }
    
    return { x: hitboxX, y: hitboxY, w: hitboxW, h: hitboxH };
  }
  
  attack() {
    if (this.attackCooldown > 0) return;
    
    this.attackCooldown = 20;
    this.isAttacking = true;
    this.attackAnimTimer = 0;
    
    const hitbox = this.getAttackHitbox();
    
    // Check for enemies in directional hitbox
    for (let enemy of gameState.enemies) {
      if (!enemy.dead) {
        // Check if enemy overlaps with attack hitbox
        const enemyLeft = enemy.x - enemy.width / 2;
        const enemyRight = enemy.x + enemy.width / 2;
        const enemyTop = enemy.y - enemy.height / 2;
        const enemyBottom = enemy.y + enemy.height / 2;
        
        const hitboxRight = hitbox.x + hitbox.w;
        const hitboxBottom = hitbox.y + hitbox.h;
        
        const overlaps = !(enemyRight < hitbox.x || 
                          enemyLeft > hitboxRight ||
                          enemyBottom < hitbox.y ||
                          enemyTop > hitboxBottom);
        
        if (overlaps) {
          enemy.takeDamage(this.attackDamage);
        }
      }
    }
    
    // Check for chests
    for (let chest of gameState.chests) {
      if (!chest.opened) {
        const dist = this.p.dist(this.x, this.y, chest.x, chest.y);
        if (dist < this.attackRange + 20) {
          chest.open();
        }
      }
    }
  }
  
  dodge() {
    if (!gameState.hasAdvancedCombat || this.dodgeCooldown > 0 || this.isDodging) return;
    
    this.isDodging = true;
    this.dodgeDuration = 15;
    this.dodgeCooldown = 60;
    this.invulnerable = 15;
  }
  
  takeDamage(amount) {
    if (this.invulnerable > 0) return;
    
    this.hp -= amount;
    this.invulnerable = 30;
    
    if (this.hp <= 0) {
      this.hp = 0;
      gameState.gamePhase = "GAME_OVER_LOSE";
    }
    
    // Create damage particles
    for (let i = 0; i < 5; i++) {
      gameState.particles.push(new DamageParticle(this.p, this.x, this.y));
    }
  }
  
  heal(amount) {
    this.hp = Math.min(this.hp + amount, this.maxHP);
  }
  
  render() {
    this.p.push();
    
    // Translate for camera
    if (gameState.hasScrolling) {
      this.p.translate(-gameState.cameraX, -gameState.cameraY);
    }
    
    // Flicker when invulnerable
    if (this.invulnerable > 0 && this.p.frameCount % 4 < 2) {
      this.p.pop();
      return;
    }
    
    // Draw attack animation (sword slash)
    if (this.isAttacking) {
      const progress = this.attackAnimTimer / 10;
      const hitbox = this.getAttackHitbox();
      
      this.p.noFill();
      this.p.stroke(gameState.hasColor ? [255, 255, 150, 200 * (1 - progress)] : [255, 200 * (1 - progress)]);
      this.p.strokeWeight(3);
      
      // Draw attack arc/slash based on direction
      if (this.direction === 'up' || this.direction === 'down') {
        const centerX = hitbox.x + hitbox.w / 2;
        const centerY = this.direction === 'up' ? hitbox.y : hitbox.y + hitbox.h;
        const radius = this.attackRange;
        const startAngle = this.direction === 'up' ? this.p.PI : 0;
        const endAngle = this.direction === 'up' ? this.p.TWO_PI : this.p.PI;
        this.p.arc(centerX, centerY, radius * 2, radius * 2, startAngle, endAngle);
      } else {
        const centerX = this.direction === 'left' ? hitbox.x : hitbox.x + hitbox.w;
        const centerY = hitbox.y + hitbox.h / 2;
        const radius = this.attackRange;
        const startAngle = this.direction === 'left' ? this.p.HALF_PI : -this.p.HALF_PI;
        const endAngle = this.direction === 'left' ? this.p.PI + this.p.HALF_PI : this.p.HALF_PI;
        this.p.arc(centerX, centerY, radius * 2, radius * 2, startAngle, endAngle);
      }
      
      // Draw hitbox outline for debugging (optional, can be removed)
      // this.p.noFill();
      // this.p.stroke(255, 0, 0, 100);
      // this.p.rect(hitbox.x, hitbox.y, hitbox.w, hitbox.h);
    }
    
    // Draw player based on evolution stage
    if (gameState.hasColor) {
      this.p.fill(100, 200, 255);
      this.p.stroke(50, 100, 150);
    } else {
      this.p.fill(255);
      this.p.stroke(200);
    }
    
    this.p.strokeWeight(2);
    this.p.rectMode(this.p.CENTER);
    this.p.rect(this.x, this.y, this.width, this.height, 4);
    
    // Draw direction indicator
    this.p.fill(gameState.hasColor ? [255, 255, 100] : [200]);
    const offsetX = this.direction === 'right' ? 8 : this.direction === 'left' ? -8 : 0;
    const offsetY = this.direction === 'down' ? 8 : this.direction === 'up' ? -8 : 0;
    this.p.circle(this.x + offsetX, this.y + offsetY, 6);
    
    // Draw dodge effect
    if (this.isDodging) {
      this.p.noFill();
      this.p.stroke(gameState.hasColor ? [100, 200, 255, 100] : [255, 100]);
      this.p.strokeWeight(2);
      this.p.circle(this.x, this.y, this.width + 10);
    }
    
    this.p.pop();
  }
}

export class DamageParticle {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = p.random(-3, 3);
    this.vy = p.random(-5, -2);
    this.life = 30;
    this.maxLife = 30;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // gravity
    this.life--;
  }
  
  render() {
    this.p.push();
    
    if (gameState.hasScrolling) {
      this.p.translate(-gameState.cameraX, -gameState.cameraY);
    }
    
    const alpha = (this.life / this.maxLife) * 255;
    this.p.noStroke();
    if (gameState.hasColor) {
      this.p.fill(255, 100, 100, alpha);
    } else {
      this.p.fill(255, alpha);
    }
    this.p.circle(this.x, this.y, 4);
    
    this.p.pop();
  }
  
  isDead() {
    return this.life <= 0;
  }
}