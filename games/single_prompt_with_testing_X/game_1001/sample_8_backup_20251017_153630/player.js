import { gameState, WEAPON_TYPES, WEAPON_DATA, CANVAS_HEIGHT } from './globals.js';
import { Projectile, ExpTriangle } from './entities.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 20;
    this.height = 30;
    this.grounded = false;
    this.jumpPower = -12;
    this.maxSpeed = 4;
    this.acceleration = 0.8;
    this.friction = 0.85;
    this.gravity = 0.6;
    
    this.maxHP = 16;
    this.hp = this.maxHP;
    this.invulnerable = false;
    this.invulnerableTime = 0;
    
    this.weapons = [];
    this.initializeWeapons();
    this.currentWeapon = 0;
    this.shootCooldown = 0;
    
    this.hasBooster = false;
    this.boosterFuel = 100;
    this.maxBoosterFuel = 100;
    this.boosterActive = false;
    
    this.inWater = false;
    this.waterLevel = null;
    
    this.lookDirection = 1;
    this.jumpHeld = false;
    this.variableJumpTime = 0;
    this.maxVariableJumpTime = 15;
  }
  
  initializeWeapons() {
    for (let i = 0; i < 5; i++) {
      this.weapons.push({
        type: i,
        level: 1,
        exp: 0,
        ammo: WEAPON_DATA[i].maxAmmo === -1 ? -1 : WEAPON_DATA[i].maxAmmo,
        maxAmmo: WEAPON_DATA[i].maxAmmo
      });
    }
  }
  
  update() {
    this.handleInput();
    this.applyPhysics();
    this.checkCollisions();
    this.updateTimers();
    this.constrainToBounds();
    
    if (this.boosterFuel < this.maxBoosterFuel && !this.boosterActive) {
      this.boosterFuel += 0.2;
    }
  }
  
  handleInput() {
    const p = this.p;
    
    if (gameState.controlMode === "HUMAN") {
      // Movement
      if (p.keyIsDown(37)) { // Left
        this.vx -= this.acceleration;
        this.lookDirection = -1;
      }
      if (p.keyIsDown(39)) { // Right
        this.vx += this.acceleration;
        this.lookDirection = 1;
      }
      
      // Variable jump
      if (p.keyIsDown(32) && this.grounded) { // Space
        this.vy = this.jumpPower;
        this.grounded = false;
        this.jumpHeld = true;
        this.variableJumpTime = 0;
      }
      
      if (p.keyIsDown(32) && this.jumpHeld && this.variableJumpTime < this.maxVariableJumpTime && this.vy < 0) {
        this.vy += -0.4;
        this.variableJumpTime++;
      }
      
      // Booster
      if (this.hasBooster && p.keyIsDown(38) && this.boosterFuel > 0) { // Up
        this.boosterActive = true;
        this.vy -= 0.5;
        this.boosterFuel -= 1;
      } else {
        this.boosterActive = false;
      }
    }
  }
  
  applyPhysics() {
    // Apply friction/drag
    this.vx *= this.inWater ? 0.9 : this.friction;
    
    // Limit horizontal speed
    if (Math.abs(this.vx) > this.maxSpeed) {
      this.vx = this.maxSpeed * Math.sign(this.vx);
    }
    
    // Apply gravity
    if (this.inWater) {
      this.vy += this.gravity * 0.3;
      if (this.vy > 2) this.vy = 2;
    } else {
      this.vy += this.gravity;
      if (this.vy > 15) this.vy = 15;
    }
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Check water
    this.inWater = false;
    if (this.waterLevel !== null && this.y > this.waterLevel) {
      this.inWater = true;
    }
  }
  
  checkCollisions() {
    const p = this.p;
    this.grounded = false;
    
    // Platform collisions
    for (let platform of gameState.platforms) {
      if (p.collideRectRect(this.x - this.width/2, this.y - this.height/2, 
                            this.width, this.height,
                            platform.x, platform.y, platform.width, platform.height)) {
        
        // Determine collision side
        const overlapLeft = (this.x + this.width/2) - platform.x;
        const overlapRight = (platform.x + platform.width) - (this.x - this.width/2);
        const overlapTop = (this.y + this.height/2) - platform.y;
        const overlapBottom = (platform.y + platform.height) - (this.y - this.height/2);
        
        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
        
        if (minOverlap === overlapTop && this.vy > 0) {
          this.y = platform.y - this.height/2;
          this.vy = 0;
          this.grounded = true;
          this.jumpHeld = false;
        } else if (minOverlap === overlapBottom && this.vy < 0) {
          this.y = platform.y + platform.height + this.height/2;
          this.vy = 0;
        } else if (minOverlap === overlapLeft) {
          this.x = platform.x - this.width/2;
          this.vx = 0;
        } else if (minOverlap === overlapRight) {
          this.x = platform.x + platform.width + this.width/2;
          this.vx = 0;
        }
      }
    }
    
    // Hazard collisions
    for (let hazard of gameState.hazards) {
      if (hazard.checkCollision(this)) {
        this.takeDamage(hazard.damage);
      }
    }
    
    // Collectible collisions
    for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
      const collectible = gameState.collectibles[i];
      if (collectible.checkCollision(this)) {
        collectible.collect(this);
        gameState.collectibles.splice(i, 1);
      }
    }
    
    // Save station collisions
    for (let station of gameState.saveStations) {
      if (station.checkCollision(this)) {
        station.activate(this);
      }
    }
  }
  
  updateTimers() {
    if (this.shootCooldown > 0) this.shootCooldown--;
    if (this.invulnerable) {
      this.invulnerableTime--;
      if (this.invulnerableTime <= 0) {
        this.invulnerable = false;
      }
    }
  }
  
  constrainToBounds() {
    if (this.x < this.width/2) {
      this.x = this.width/2;
      this.vx = 0;
    }
    if (this.x > gameState.levelWidth - this.width/2) {
      this.x = gameState.levelWidth - this.width/2;
      this.vx = 0;
    }
    if (this.y > gameState.levelHeight + 100) {
      this.takeDamage(999);
    }
  }
  
  shoot() {
    if (this.shootCooldown > 0) return;
    
    const weapon = this.weapons[this.currentWeapon];
    if (weapon.ammo === 0) return;
    
    const projectile = this.createProjectile(weapon);
    if (projectile) {
      gameState.projectiles.push(projectile);
      if (weapon.ammo > 0) weapon.ammo--;
      
      // Set cooldown based on weapon and level
      this.shootCooldown = this.getWeaponCooldown(weapon);
      
      // Apply recoil
      this.applyRecoil(weapon);
    }
  }
  
  createProjectile(weapon) {
    return new Projectile(this.p, this.x, this.y, this.lookDirection, weapon);
  }
  
  getWeaponCooldown(weapon) {
    const base = [15, 4, 20, 12, 30];
    const levelMod = [1, 0.8, 0.6];
    return Math.floor(base[weapon.type] * levelMod[weapon.level - 1]);
  }
  
  applyRecoil(weapon) {
    if (weapon.type === WEAPON_TYPES.MACHINE_GUN && weapon.level >= 2) {
      // Machine gun can propel upward when firing down
      if (this.p.keyIsDown(40)) { // Down arrow
        this.vy -= 3;
      } else {
        this.vx -= this.lookDirection * 1.5;
      }
    } else if (weapon.type === WEAPON_TYPES.MISSILE) {
      this.vx -= this.lookDirection * 2;
    }
  }
  
  cycleWeapon() {
    this.currentWeapon = (this.currentWeapon + 1) % this.weapons.length;
  }
  
  takeDamage(amount) {
    if (this.invulnerable) return;
    
    this.hp -= amount;
    this.invulnerable = true;
    this.invulnerableTime = 90;
    
    // Spill EXP
    this.spillEXP(amount * 2);
    
    if (this.hp <= 0) {
      this.hp = 0;
      gameState.gamePhase = "GAME_OVER_LOSE";
    }
  }
  
  spillEXP(count) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 3 + Math.random() * 2;
      const exp = new ExpTriangle(this.p, this.x, this.y);
      exp.vx = Math.cos(angle) * speed;
      exp.vy = Math.sin(angle) * speed - 2;
      gameState.collectibles.push(exp);
    }
    
    // De-level current weapon
    const weapon = this.weapons[this.currentWeapon];
    weapon.exp = Math.max(0, weapon.exp - count);
    this.updateWeaponLevel(weapon);
  }
  
  addEXP(amount) {
    const weapon = this.weapons[this.currentWeapon];
    weapon.exp += amount;
    this.updateWeaponLevel(weapon);
  }
  
  updateWeaponLevel(weapon) {
    const expForLevel = [0, 10, 30];
    
    if (weapon.exp >= expForLevel[2]) {
      weapon.level = 3;
    } else if (weapon.exp >= expForLevel[1]) {
      weapon.level = 2;
    } else {
      weapon.level = 1;
    }
  }
  
  heal(amount) {
    this.hp = Math.min(this.hp + amount, this.maxHP);
  }
  
  increaseMaxHP(amount) {
    this.maxHP += amount;
    this.hp += amount;
  }
  
  refillAmmo() {
    for (let weapon of this.weapons) {
      if (weapon.maxAmmo > 0) {
        weapon.ammo = weapon.maxAmmo;
      }
    }
  }
  
  draw() {
    const p = this.p;
    const screenX = this.x - gameState.camera.x;
    const screenY = this.y - gameState.camera.y;
    
    p.push();
    
    // Flash when invulnerable
    if (this.invulnerable && Math.floor(p.frameCount / 5) % 2 === 0) {
      p.tint(255, 100);
    }
    
    // Draw player body
    p.fill(100, 200, 255);
    p.stroke(50, 100, 150);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(screenX, screenY, this.width, this.height, 3);
    
    // Draw face direction
    p.fill(255);
    p.noStroke();
    p.circle(screenX + this.lookDirection * 4, screenY - 5, 4);
    
    // Draw weapon indicator
    const weaponColor = WEAPON_DATA[this.currentWeapon].color;
    p.fill(...weaponColor);
    p.rect(screenX + this.lookDirection * 10, screenY + 5, 8, 4);
    
    // Draw booster jets if active
    if (this.boosterActive && this.hasBooster) {
      for (let i = 0; i < 3; i++) {
        p.fill(255, 150 - i * 30, 0, 200 - i * 60);
        p.noStroke();
        p.circle(screenX + (Math.random() - 0.5) * 10, 
                screenY + this.height/2 + i * 3, 
                6 - i * 2);
      }
    }
    
    p.pop();
  }
}