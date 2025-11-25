// player.js
import { CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, GROUND_Y, gameState } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 24;
    this.height = 32;
    this.vx = 0;
    this.vy = 0;
    this.health = 100;
    this.maxHealth = 100;
    this.speed = 4;
    this.jumpPower = -12;
    this.grounded = false;
    this.facing = 1; // 1 right, -1 left
    this.attackCooldown = 0;
    this.attackDuration = 0;
    this.dashCooldown = 0;
    this.dashDuration = 0;
    this.invulnerable = 0;
    
    // Skull system
    this.equippedSkulls = ['basic'];
    this.currentSkullIndex = 0;
    this.skullSwitchCooldown = 0;
    
    // Animation
    this.animFrame = 0;
    this.animTimer = 0;
  }
  
  getCurrentSkull() {
    return this.equippedSkulls[this.currentSkullIndex];
  }
  
  switchSkull() {
    if (this.skullSwitchCooldown <= 0 && this.equippedSkulls.length > 1) {
      this.currentSkullIndex = (this.currentSkullIndex + 1) % this.equippedSkulls.length;
      this.skullSwitchCooldown = 20;
      return true;
    }
    return false;
  }
  
  addSkull(skullType) {
    if (!this.equippedSkulls.includes(skullType) && this.equippedSkulls.length < 2) {
      this.equippedSkulls.push(skullType);
      return true;
    }
    return false;
  }
  
  update(keys) {
    // Cooldowns
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.attackDuration > 0) this.attackDuration--;
    if (this.dashCooldown > 0) this.dashCooldown--;
    if (this.dashDuration > 0) this.dashDuration--;
    if (this.invulnerable > 0) this.invulnerable--;
    if (this.skullSwitchCooldown > 0) this.skullSwitchCooldown--;
    
    // Movement
    if (this.dashDuration > 0) {
      this.vx = this.facing * 10;
    } else {
      if (keys.left) {
        this.vx = -this.speed;
        this.facing = -1;
      } else if (keys.right) {
        this.vx = this.speed;
        this.facing = 1;
      } else {
        this.vx *= 0.8;
      }
    }
    
    // Jump
    if (keys.up && this.grounded && this.dashDuration <= 0) {
      this.vy = this.jumpPower;
      this.grounded = false;
    }
    
    // Gravity
    if (!this.grounded) {
      this.vy += GRAVITY;
    }
    
    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;
    
    // Ground collision
    if (this.y + this.height >= GROUND_Y) {
      this.y = GROUND_Y - this.height;
      this.vy = 0;
      this.grounded = true;
    } else {
      this.grounded = false;
    }
    
    // Keep player in bounds
    this.x = this.p.constrain(this.x, 0, gameState.worldWidth - this.width);
    
    // Animation
    this.animTimer++;
    if (this.animTimer > 8) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }
  }
  
  attack() {
    if (this.attackCooldown <= 0) {
      this.attackCooldown = 30;
      this.attackDuration = 10;
      
      const skull = this.getCurrentSkull();
      const attackData = {
        x: this.x + (this.facing > 0 ? this.width : -20),
        y: this.y + this.height / 2,
        width: skull === 'warrior' ? 35 : 25,
        height: 20,
        damage: skull === 'warrior' ? 25 : 15,
        facing: this.facing,
        owner: 'player'
      };
      
      return attackData;
    }
    return null;
  }
  
  dash() {
    if (this.dashCooldown <= 0) {
      this.dashCooldown = 60;
      this.dashDuration = 12;
      this.invulnerable = 12;
      return true;
    }
    return false;
  }
  
  takeDamage(amount) {
    if (this.invulnerable <= 0) {
      this.health -= amount;
      this.invulnerable = 30;
      return true;
    }
    return false;
  }
  
  draw(p, cameraX) {
    p.push();
    
    // Invulnerability flash
    if (this.invulnerable > 0 && this.invulnerable % 4 < 2) {
      p.pop();
      return;
    }
    
    const screenX = this.x - cameraX;
    const skull = this.getCurrentSkull();
    
    // Body (skeleton)
    p.fill(240, 240, 230);
    p.noStroke();
    
    // Torso
    p.rect(screenX + 8, this.y + 12, 8, 12);
    
    // Legs
    const legOffset = this.grounded ? this.p.sin(this.animFrame) * 2 : 0;
    p.rect(screenX + 8, this.y + 24, 3, 8 + legOffset);
    p.rect(screenX + 13, this.y + 24, 3, 8 - legOffset);
    
    // Arms
    if (this.attackDuration > 0) {
      p.rect(screenX + (this.facing > 0 ? 16 : 0), this.y + 14, 6, 3);
    } else {
      p.rect(screenX + 6, this.y + 14, 3, 8);
      p.rect(screenX + 15, this.y + 14, 3, 8);
    }
    
    // Head/Skull variations
    p.push();
    p.translate(screenX + 12, this.y + 8);
    
    if (skull === 'warrior') {
      // Warrior skull - larger, red eyes
      p.fill(220, 200, 180);
      p.ellipse(0, 0, 18, 20);
      p.fill(255, 50, 50);
      p.circle(-3 * this.facing, -2, 4);
      p.circle(3 * this.facing, -2, 4);
      // Helmet
      p.fill(100, 100, 120);
      p.arc(0, -2, 20, 16, this.p.PI, this.p.TWO_PI);
    } else if (skull === 'mage') {
      // Mage skull - blue glow
      p.fill(200, 200, 240);
      p.ellipse(0, 0, 16, 18);
      p.fill(100, 150, 255);
      p.circle(-3 * this.facing, -2, 5);
      p.circle(3 * this.facing, -2, 5);
      // Hat
      p.fill(50, 30, 80);
      p.triangle(-8, 0, 8, 0, 0, -12);
    } else {
      // Basic skull
      p.fill(240, 240, 230);
      p.ellipse(0, 0, 16, 18);
      p.fill(50, 50, 50);
      p.circle(-3 * this.facing, -2, 4);
      p.circle(3 * this.facing, -2, 4);
    }
    
    p.pop();
    
    // Dash effect
    if (this.dashDuration > 0) {
      p.fill(150, 150, 255, 100);
      p.rect(screenX - 5, this.y, this.width + 10, this.height);
    }
    
    p.pop();
  }
}