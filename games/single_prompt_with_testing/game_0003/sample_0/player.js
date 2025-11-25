// player.js - Player entity and logic
import { PLAYER_SIZE, PLAYER_SPEED, PLAYER_MAX_HEALTH, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.size = PLAYER_SIZE;
    this.health = PLAYER_MAX_HEALTH;
    this.maxHealth = PLAYER_MAX_HEALTH;
    this.speed = PLAYER_SPEED;
    this.level = 1;
    this.xp = 0;
    this.xpToNextLevel = 5;
    
    // Upgradeable stats
    this.damage = 1.0;
    this.attackSpeed = 1.0;
    this.projectileSpeed = 1.0;
    this.range = 1.0;
    this.armor = 0;
    this.maxHealthBonus = 0;
    this.moveSpeedBonus = 0;
    this.regeneration = 0;
    this.luck = 0;
    this.magnet = 1.0;
    
    // Weapon slots
    this.weapons = [];
    
    // Invulnerability frames
    this.iFrames = 0;
    this.iFrameMax = 30;
    
    // Animation
    this.animTimer = 0;
  }
  
  update(p, inputs) {
    // Movement
    this.vx = 0;
    this.vy = 0;
    
    if (inputs.left) this.vx -= 1;
    if (inputs.right) this.vx += 1;
    if (inputs.up) this.vy -= 1;
    if (inputs.down) this.vy += 1;
    
    // Normalize diagonal movement
    if (this.vx !== 0 && this.vy !== 0) {
      this.vx *= 0.707;
      this.vy *= 0.707;
    }
    
    const totalSpeed = this.speed + this.moveSpeedBonus;
    this.x += this.vx * totalSpeed;
    this.y += this.vy * totalSpeed;
    
    // Keep player on screen with some buffer for world feel
    const buffer = 2000;
    this.x = p.constrain(this.x, -buffer, buffer);
    this.y = p.constrain(this.y, -buffer, buffer);
    
    // Update invulnerability frames
    if (this.iFrames > 0) {
      this.iFrames--;
    }
    
    // Regeneration
    if (this.regeneration > 0 && p.frameCount % 60 === 0) {
      this.health = Math.min(this.health + this.regeneration, this.maxHealth + this.maxHealthBonus);
    }
    
    // Animation
    this.animTimer++;
  }
  
  takeDamage(amount) {
    if (this.iFrames > 0) return false;
    
    const actualDamage = Math.max(1, amount - this.armor);
    this.health -= actualDamage;
    this.iFrames = this.iFrameMax;
    return true;
  }
  
  gainXP(amount) {
    this.xp += amount;
    if (this.xp >= this.xpToNextLevel) {
      this.levelUp();
      return true;
    }
    return false;
  }
  
  levelUp() {
    this.level++;
    this.xp -= this.xpToNextLevel;
    this.xpToNextLevel = Math.floor(5 + this.level * 2);
    return true;
  }
  
  render(p, camera) {
    const screenX = this.x - camera.x + CANVAS_WIDTH / 2;
    const screenY = this.y - camera.y + CANVAS_HEIGHT / 2;
    
    p.push();
    
    // Invulnerability flashing
    if (this.iFrames > 0 && Math.floor(this.iFrames / 4) % 2 === 0) {
      p.tint(255, 100);
    }
    
    // Draw player as a character
    p.fill(100, 150, 255);
    p.stroke(50, 100, 200);
    p.strokeWeight(2);
    p.ellipse(screenX, screenY, this.size, this.size);
    
    // Cape effect
    p.fill(150, 50, 50);
    p.noStroke();
    const capeOffset = Math.sin(this.animTimer * 0.2) * 2;
    p.ellipse(screenX - this.size * 0.3, screenY + capeOffset, this.size * 0.6, this.size * 0.8);
    
    // Eyes
    p.fill(255, 255, 100);
    p.ellipse(screenX - 4, screenY - 2, 4, 4);
    p.ellipse(screenX + 4, screenY - 2, 4, 4);
    
    p.pop();
  }
}