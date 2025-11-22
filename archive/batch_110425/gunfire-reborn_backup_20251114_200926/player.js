// player.js - Player entity
import { gameState, ROOM_WIDTH, ROOM_HEIGHT } from './globals.js';
import { Weapon, createRandomWeapon } from './weapons.js';
import { distance, angleBetween } from './utils.js';
import { WEAPON_PISTOL } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = 12;
    
    // Stats
    this.maxHealth = 100 + gameState.permanentUpgrades.maxHealthBonus;
    this.health = this.maxHealth;
    this.speed = 3 + gameState.permanentUpgrades.speedBonus * 0.1;
    this.damageMultiplier = 1 + gameState.permanentUpgrades.damageBonus * 0.1;
    
    // Weapons
    this.weapons = [new Weapon(WEAPON_PISTOL)];
    this.currentWeaponIndex = 0;
    this.lastWeaponSwap = -1000; // Track last weapon swap time
    this.weaponSwapCooldown = 15; // Minimum frames between weapon swaps
    
    // Abilities
    this.skillCooldown = 180; // 3 seconds at 60fps
    this.lastSkillUse = -1000;
    this.skillDuration = 120; // 2 seconds
    this.skillActive = false;
    this.skillStartTime = 0;
    
    // Buffs from scrolls
    this.scrollBuffs = [];
    
    // Level and experience
    this.level = 1;
    this.exp = 0;
    this.expToNextLevel = 100;
    
    // Visual
    this.color = [100, 200, 255];
    this.aimAngle = 0;
    
    // Invulnerability frames
    this.invulnerable = false;
    this.invulnerableTime = 0;
    this.invulnerableDuration = 30;
  }
  
  getCurrentWeapon() {
    return this.weapons[this.currentWeaponIndex];
  }
  
  swapWeapon() {
    const currentFrame = gameState.frameCount;
    
    // Check cooldown
    if (currentFrame - this.lastWeaponSwap < this.weaponSwapCooldown) {
      return false;
    }
    
    if (this.weapons.length > 1) {
      this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.weapons.length;
      this.lastWeaponSwap = currentFrame;
      return true;
    }
    return false;
  }
  
  addWeapon(weapon) {
    if (this.weapons.length < 2) {
      this.weapons.push(weapon);
    } else {
      // Replace current weapon
      this.weapons[this.currentWeaponIndex] = weapon;
    }
  }
  
  useSkill(currentFrame) {
    if (currentFrame - this.lastSkillUse >= this.skillCooldown) {
      this.lastSkillUse = currentFrame;
      this.skillActive = true;
      this.skillStartTime = currentFrame;
      
      // Skill effect: damage boost and speed boost
      return true;
    }
    return false;
  }
  
  updateSkill(currentFrame) {
    if (this.skillActive && currentFrame - this.skillStartTime >= this.skillDuration) {
      this.skillActive = false;
    }
  }
  
  takeDamage(amount) {
    if (this.invulnerable) return false;
    
    this.health = Math.max(0, this.health - amount);
    this.invulnerable = true;
    this.invulnerableTime = gameState.frameCount;
    
    return this.health <= 0;
  }
  
  addExp(amount) {
    this.exp += amount;
    
    // Use while loop to handle multiple level-ups at once
    while (this.exp >= this.expToNextLevel) {
      this.levelUp();
    }
  }
  
  levelUp() {
    this.level++;
    this.exp -= this.expToNextLevel;
    this.expToNextLevel = Math.floor(this.expToNextLevel * 1.5);
    
    // Heal on level up
    this.health = Math.min(this.health + 20, this.maxHealth);
  }
  
  heal(amount) {
    this.health = Math.min(this.health + amount, this.maxHealth);
  }
  
  move(dx, dy) {
    this.vx = dx * this.speed * (this.skillActive ? 1.5 : 1);
    this.vy = dy * this.speed * (this.skillActive ? 1.5 : 1);
  }
  
  update() {
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Boundary check
    this.x = Math.max(this.radius, Math.min(ROOM_WIDTH - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(ROOM_HEIGHT - this.radius, this.y));
    
    // Apply friction
    this.vx *= 0.85;
    this.vy *= 0.85;
    
    // Update weapon
    const weapon = this.getCurrentWeapon();
    weapon.update(gameState.frameCount);
    
    // Update skill
    this.updateSkill(gameState.frameCount);
    
    // Update invulnerability
    if (this.invulnerable && gameState.frameCount - this.invulnerableTime >= this.invulnerableDuration) {
      this.invulnerable = false;
    }
    
    // Find nearest enemy for aiming
    let nearestEnemy = null;
    let nearestDist = Infinity;
    
    for (const enemy of gameState.enemies) {
      if (!enemy.alive) continue;
      const dist = distance(this.x, this.y, enemy.x, enemy.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestEnemy = enemy;
      }
    }
    
    if (nearestEnemy) {
      this.aimAngle = angleBetween(this.x, this.y, nearestEnemy.x, nearestEnemy.y);
    }
  }
  
  draw(p) {
    const screenPos = this.getScreenPosition();
    
    p.push();
    
    // Invulnerability flash
    if (this.invulnerable && Math.floor(gameState.frameCount / 5) % 2 === 0) {
      p.fill(255, 255, 255, 150);
    } else {
      p.fill(...this.color);
    }
    
    // Skill active glow
    if (this.skillActive) {
      p.fill(255, 255, 100);
      p.noStroke();
      p.circle(screenPos.x, screenPos.y, this.radius * 3);
    }
    
    // Draw player
    p.fill(...this.color);
    p.stroke(255);
    p.strokeWeight(2);
    p.circle(screenPos.x, screenPos.y, this.radius * 2);
    
    // Draw aim direction
    p.stroke(255, 100, 100);
    p.strokeWeight(3);
    const aimLen = 20;
    p.line(
      screenPos.x,
      screenPos.y,
      screenPos.x + Math.cos(this.aimAngle) * aimLen,
      screenPos.y + Math.sin(this.aimAngle) * aimLen
    );
    
    p.pop();
  }
  
  getScreenPosition() {
    return {
      x: this.x - gameState.cameraX + 300,
      y: this.y - gameState.cameraY + 200
    };
  }
}