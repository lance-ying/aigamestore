// entities.js - Entity classes for robot parts and characters

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, PART_TYPES, POWERUP_TYPES } from './globals.js';
import { Particle } from './particles.js';
import { PowerUp } from './powerups.js';

// Base body part class
export class BodyPart {
  constructor(x, y, width, height, partType, color) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.partType = partType;
    this.color = color;
    
    // Physics
    this.vx = 0;
    this.vy = 0;
    this.rotation = 0;
    this.rotationSpeed = 0;
    
    // State
    this.health = 100;
    this.maxHealth = 100;
    this.attached = true;
    this.parent = null;
    
    // Visual
    this.flashTimer = 0;
  }
  
  takeDamage(amount) {
    this.health -= amount;
    this.flashTimer = 10;
    
    if (this.health <= 0 && this.attached) {
      this.detach();
    }
  }
  
  detach() {
    this.attached = false;
    // Give it some velocity when detached
    this.vx = (Math.random() - 0.5) * 8;
    this.vy = Math.random() * -6 - 3;
    this.rotationSpeed = (Math.random() - 0.5) * 0.3;
    
    gameState.bodyParts.push(this);
  }
  
  update(p) {
    if (!this.attached) {
      // Physics for detached parts
      this.vy += gameState.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.rotationSpeed;
      
      // Ground collision
      if (this.y + this.height / 2 >= gameState.arenaBottom) {
        this.y = gameState.arenaBottom - this.height / 2;
        this.vy *= -0.3;
        this.vx *= 0.7;
        this.rotationSpeed *= 0.7;
      }
      
      // Friction
      this.vx *= 0.95;
    }
    
    if (this.flashTimer > 0) {
      this.flashTimer--;
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotation);
    
    // Flash white when damaged
    if (this.flashTimer > 0) {
      p.fill(255);
    } else {
      p.fill(...this.color);
    }
    
    p.stroke(0);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.width, this.height);
    
    // Draw some detail lines for robotic look
    p.stroke(0, 0, 0, 100);
    p.strokeWeight(1);
    p.line(-this.width / 4, -this.height / 4, this.width / 4, this.height / 4);
    p.line(this.width / 4, -this.height / 4, -this.width / 4, this.height / 4);
    
    p.pop();
  }
}

// Player robot class
export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    
    // Body parts
    this.parts = {
      core: new BodyPart(x, y, 20, 20, PART_TYPES.CORE, COLORS.playerCore),
      head: new BodyPart(x, y - 20, 15, 15, PART_TYPES.HEAD, COLORS.player),
      torso: new BodyPart(x, y, 18, 25, PART_TYPES.TORSO, COLORS.player),
      leftArm: new BodyPart(x - 15, y, 8, 20, PART_TYPES.LEFT_ARM, COLORS.player),
      rightArm: new BodyPart(x + 15, y, 8, 20, PART_TYPES.RIGHT_ARM, COLORS.player),
      leftLeg: new BodyPart(x - 8, y + 20, 8, 18, PART_TYPES.LEFT_LEG, COLORS.player),
      rightLeg: new BodyPart(x + 8, y + 20, 8, 18, PART_TYPES.RIGHT_LEG, COLORS.player)
    };
    
    // Set parent references
    Object.values(this.parts).forEach(part => {
      part.parent = this;
    });
    
    // Physics
    this.vx = 0;
    this.vy = 0;
    this.speed = 3;
    this.onGround = false;
    
    // Combat
    this.sword = {
      attacking: false,
      angle: 0,
      targetAngle: 0,
      attackTimer: 0,
      attackDuration: 15,
      cooldown: 0,
      damage: 25,
      range: 40
    };
    
    // Abilities
    this.dash = {
      active: false,
      timer: 0,
      duration: 10,
      cooldown: 0,
      speed: 12
    };
    
    this.block = {
      active: false,
      effectiveness: 0.5
    };
    
    // Stats
    this.facing = 1; // 1 = right, -1 = left
    this.moveSpeed = 1;
    this.damageMultiplier = 1;
    
    // State tracking
    this.lastPosition = { x, y };
    
    gameState.player = this;
    gameState.entities.push(this);
  }
  
  getAttachedParts() {
    return Object.values(this.parts).filter(part => part.attached);
  }
  
  getHealth() {
    const attachedParts = this.getAttachedParts();
    const totalHealth = attachedParts.reduce((sum, part) => sum + part.health, 0);
    const maxHealth = attachedParts.reduce((sum, part) => sum + part.maxHealth, 0);
    return { current: totalHealth, max: maxHealth };
  }
  
  takeDamage(amount, p) {
    if (this.block.active) {
      amount *= this.block.effectiveness;
    }
    
    gameState.totalDamageTaken += amount;
    
    // Damage random attached part
    const attachedParts = this.getAttachedParts().filter(part => part.partType !== PART_TYPES.CORE);
    
    if (attachedParts.length > 0) {
      const targetPart = attachedParts[Math.floor(Math.random() * attachedParts.length)];
      targetPart.takeDamage(amount);
      
      if (!targetPart.attached) {
        gameState.partsLost++;
        this.onPartLost(targetPart);
      }
    } else {
      // Only core left, damage it
      this.parts.core.takeDamage(amount);
    }
    
    // Camera shake
    gameState.cameraShake = 10;
    
    // Check if dead
    if (this.parts.core.health <= 0) {
      this.die(p);
    }
    
    // Create damage particles
    this.createDamageParticles(p);
  }
  
  onPartLost(part) {
    // Adjust stats based on lost part
    if (part.partType === PART_TYPES.LEFT_LEG || part.partType === PART_TYPES.RIGHT_LEG) {
      this.moveSpeed *= 0.7;
    }
    
    if (part.partType === PART_TYPES.LEFT_ARM || part.partType === PART_TYPES.RIGHT_ARM) {
      this.sword.damage *= 0.85;
    }
  }
  
  createDamageParticles(p) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 2;
      gameState.particles.push(new Particle(
        this.x,
        this.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        [...COLORS.player]
      ));
    }
  }
  
  die(p) {
    gameState.gamePhase = "GAME_OVER_LOSE";
    
    // Explode all parts
    Object.values(this.parts).forEach(part => {
      if (part.attached) {
        part.detach();
      }
    });
    
    // Create explosion particles
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 3;
      gameState.particles.push(new Particle(
        this.x,
        this.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        [...COLORS.player]
      ));
    }
    
    p.logs.game_info.push({
      data: { 
        event: 'player_death',
        gamePhase: "GAME_OVER_LOSE",
        score: gameState.score,
        wave: gameState.wave
      },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
  
  update(p) {
    // Update cooldowns
    if (this.sword.cooldown > 0) this.sword.cooldown--;
    if (this.dash.cooldown > 0) this.dash.cooldown--;
    
    // Update dash
    if (this.dash.active) {
      this.dash.timer--;
      if (this.dash.timer <= 0) {
        this.dash.active = false;
      }
    }
    
    // Update sword attack
    if (this.sword.attacking) {
      this.sword.attackTimer--;
      
      // Swing animation
      const progress = 1 - (this.sword.attackTimer / this.sword.attackDuration);
      this.sword.angle = p.lerp(-Math.PI / 3, Math.PI / 3, progress) * this.facing;
      
      // Check for hits at mid-swing
      if (this.sword.attackTimer === Math.floor(this.sword.attackDuration / 2)) {
        this.checkSwordHits(p);
      }
      
      if (this.sword.attackTimer <= 0) {
        this.sword.attacking = false;
        this.sword.angle = 0;
      }
    }
    
    // Apply physics
    this.x += this.vx;
    this.y += this.vy;
    
    // Apply friction
    this.vx *= gameState.friction;
    this.vy *= gameState.friction;
    
    // Arena bounds
    if (this.x < gameState.arenaLeft + 15) {
      this.x = gameState.arenaLeft + 15;
      this.vx = 0;
    }
    if (this.x > gameState.arenaRight - 15) {
      this.x = gameState.arenaRight - 15;
      this.vx = 0;
    }
    if (this.y < gameState.arenaTop + 20) {
      this.y = gameState.arenaTop + 20;
      this.vy = 0;
    }
    if (this.y > gameState.arenaBottom - 20) {
      this.y = gameState.arenaBottom - 20;
      this.vy = 0;
    }
    
    // Update body parts positions
    this.updateBodyParts();
    
    // Log position
    if (Math.abs(this.x - this.lastPosition.x) > 2 || 
        Math.abs(this.y - this.lastPosition.y) > 2) {
      p.logs.player_info.push({
        screen_x: this.x,
        screen_y: this.y,
        game_x: this.x,
        game_y: this.y,
        health: this.getHealth().current,
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
      this.lastPosition = { x: this.x, y: this.y };
    }
  }
  
  updateBodyParts() {
    // Update positions of attached parts
    if (this.parts.core.attached) {
      this.parts.core.x = this.x;
      this.parts.core.y = this.y;
    }
    
    if (this.parts.head.attached) {
      this.parts.head.x = this.x;
      this.parts.head.y = this.y - 18;
    }
    
    if (this.parts.torso.attached) {
      this.parts.torso.x = this.x;
      this.parts.torso.y = this.y + 5;
    }
    
    if (this.parts.leftArm.attached) {
      this.parts.leftArm.x = this.x - 12;
      this.parts.leftArm.y = this.y + 2;
    }
    
    if (this.parts.rightArm.attached) {
      this.parts.rightArm.x = this.x + 12;
      this.parts.rightArm.y = this.y + 2;
    }
    
    if (this.parts.leftLeg.attached) {
      this.parts.leftLeg.x = this.x - 6;
      this.parts.leftLeg.y = this.y + 20;
    }
    
    if (this.parts.rightLeg.attached) {
      this.parts.rightLeg.x = this.x + 6;
      this.parts.rightLeg.y = this.y + 20;
    }
    
    // Update detached parts
    Object.values(this.parts).forEach(part => {
      if (!part.attached) {
        part.update();
      }
    });
  }
  
  moveLeft() {
    const speed = this.dash.active ? this.dash.speed : this.speed * this.moveSpeed;
    this.vx = -speed;
    this.facing = -1;
  }
  
  moveRight() {
    const speed = this.dash.active ? this.dash.speed : this.speed * this.moveSpeed;
    this.vx = speed;
    this.facing = 1;
  }
  
  moveUp() {
    const speed = this.dash.active ? this.dash.speed : this.speed * this.moveSpeed;
    this.vy = -speed;
  }
  
  moveDown() {
    const speed = this.dash.active ? this.dash.speed : this.speed * this.moveSpeed;
    this.vy = speed;
  }
  
  attack() {
    if (!this.sword.attacking && this.sword.cooldown <= 0) {
      this.sword.attacking = true;
      this.sword.attackTimer = this.sword.attackDuration;
      this.sword.cooldown = 20;
    }
  }
  
  startDash() {
    if (!this.dash.active && this.dash.cooldown <= 0) {
      this.dash.active = true;
      this.dash.timer = this.dash.duration;
      this.dash.cooldown = 60;
    }
  }
  
  startBlock() {
    this.block.active = true;
  }
  
  stopBlock() {
    this.block.active = false;
  }
  
  checkSwordHits(p) {
    const swordX = this.x + Math.cos(this.sword.angle) * this.sword.range * this.facing;
    const swordY = this.y + Math.sin(this.sword.angle) * this.sword.range;
    
    // Check all enemies
    gameState.enemies.forEach(enemy => {
      const dx = enemy.x - swordX;
      const dy = enemy.y - swordY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < this.sword.range) {
        enemy.takeDamage(this.sword.damage * this.damageMultiplier, p);
        gameState.totalDamageDealt += this.sword.damage * this.damageMultiplier;
      }
    });
  }
  
  render(p) {
    // Render all body parts
    Object.values(this.parts).forEach(part => {
      if (part.attached) {
        part.render(p);
      }
    });
    
    // Render sword
    if (this.parts.rightArm.attached || this.parts.leftArm.attached) {
      this.renderSword(p);
    }
    
    // Render block indicator
    if (this.block.active) {
      p.push();
      p.translate(this.x, this.y);
      p.noFill();
      p.stroke(100, 200, 255, 150);
      p.strokeWeight(3);
      p.circle(0, 0, 50);
      p.pop();
    }
  }
  
  renderSword(p) {
    p.push();
    p.translate(this.x, this.y);
    
    const armX = this.facing > 0 ? 12 : -12;
    const swordLength = this.sword.range;
    const swordAngle = this.sword.angle;
    
    // Sword glow
    if (this.sword.attacking) {
      p.stroke(...COLORS.swordGlow, 100);
      p.strokeWeight(8);
      p.line(
        armX,
        2,
        armX + Math.cos(swordAngle) * swordLength * this.facing,
        2 + Math.sin(swordAngle) * swordLength
      );
    }
    
    // Sword blade
    p.stroke(...COLORS.sword);
    p.strokeWeight(3);
    p.line(
      armX,
      2,
      armX + Math.cos(swordAngle) * swordLength * this.facing,
      2 + Math.sin(swordAngle) * swordLength
    );
    
    // Sword tip glow
    const tipX = armX + Math.cos(swordAngle) * swordLength * this.facing;
    const tipY = 2 + Math.sin(swordAngle) * swordLength;
    p.fill(...COLORS.swordGlow);
    p.noStroke();
    p.circle(tipX, tipY, 6);
    
    p.pop();
  }
}

// Enemy robot class
export class Enemy {
  constructor(x, y, type = 'basic') {
    this.x = x;
    this.y = y;
    this.type = type;
    
    // Body parts
    this.parts = {
      core: new BodyPart(x, y, 18, 18, PART_TYPES.CORE, COLORS.enemyCore),
      head: new BodyPart(x, y - 16, 12, 12, PART_TYPES.HEAD, COLORS.enemy),
      torso: new BodyPart(x, y, 16, 22, PART_TYPES.TORSO, COLORS.enemy),
      leftArm: new BodyPart(x - 12, y, 7, 18, PART_TYPES.LEFT_ARM, COLORS.enemy),
      rightArm: new BodyPart(x + 12, y, 7, 18, PART_TYPES.RIGHT_ARM, COLORS.enemy),
      leftLeg: new BodyPart(x - 6, y + 18, 7, 16, PART_TYPES.LEFT_LEG, COLORS.enemy),
      rightLeg: new BodyPart(x + 6, y + 18, 7, 16, PART_TYPES.RIGHT_LEG, COLORS.enemy)
    };
    
    Object.values(this.parts).forEach(part => {
      part.parent = this;
    });
    
    // Physics
    this.vx = 0;
    this.vy = 0;
    this.speed = 1.5;
    
    // Combat
    this.sword = {
      attacking: false,
      angle: 0,
      attackTimer: 0,
      attackDuration: 15,
      cooldown: 0,
      damage: 15,
      range: 35
    };
    
    // AI
    this.facing = 1;
    this.aiState = 'seek'; // seek, attack, retreat
    this.aiTimer = 0;
    this.targetDistance = 50;
    
    // Stats
    this.moveSpeed = 1;
    this.aggressiveness = 0.7 + Math.random() * 0.3;
    
    gameState.enemies.push(this);
    gameState.entities.push(this);
  }
  
  getAttachedParts() {
    return Object.values(this.parts).filter(part => part.attached);
  }
  
  getHealth() {
    const attachedParts = this.getAttachedParts();
    const totalHealth = attachedParts.reduce((sum, part) => sum + part.health, 0);
    return totalHealth;
  }
  
  takeDamage(amount, p) {
    // Damage random attached part
    const attachedParts = this.getAttachedParts().filter(part => part.partType !== PART_TYPES.CORE);
    
    if (attachedParts.length > 0) {
      const targetPart = attachedParts[Math.floor(Math.random() * attachedParts.length)];
      targetPart.takeDamage(amount);
      
      if (!targetPart.attached) {
        this.onPartLost(targetPart);
      }
    } else {
      this.parts.core.takeDamage(amount);
    }
    
    // Check if dead
    if (this.parts.core.health <= 0) {
      this.die(p);
    }
    
    // Create damage particles
    this.createDamageParticles(p);
  }
  
  onPartLost(part) {
    if (part.partType === PART_TYPES.LEFT_LEG || part.partType === PART_TYPES.RIGHT_LEG) {
      this.moveSpeed *= 0.7;
    }
    
    if (part.partType === PART_TYPES.LEFT_ARM || part.partType === PART_TYPES.RIGHT_ARM) {
      this.sword.damage *= 0.85;
    }
  }
  
  createDamageParticles(p) {
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 2;
      gameState.particles.push(new Particle(
        this.x,
        this.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        [...COLORS.enemy]
      ));
    }
  }
  
  die(p) {
    // Remove from arrays
    const enemyIndex = gameState.enemies.indexOf(this);
    if (enemyIndex > -1) {
      gameState.enemies.splice(enemyIndex, 1);
    }
    
    const entityIndex = gameState.entities.indexOf(this);
    if (entityIndex > -1) {
      gameState.entities.splice(entityIndex, 1);
    }
    
    gameState.enemiesDefeated++;
    gameState.score += 100;
    
    // Explode all parts
    Object.values(this.parts).forEach(part => {
      if (part.attached) {
        part.detach();
      }
    });
    
    // Create explosion particles
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      gameState.particles.push(new Particle(
        this.x,
        this.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        [...COLORS.enemy]
      ));
    }
    
    // Chance to spawn power-up
    if (Math.random() < 0.4) {
      const types = Object.values(POWERUP_TYPES);
      const randomType = types[Math.floor(Math.random() * types.length)];
      new PowerUp(this.x, this.y, randomType);
    }
  }
  
  update(p) {
    if (!gameState.player) return;
    
    // Update cooldowns
    if (this.sword.cooldown > 0) this.sword.cooldown--;
    
    // Update sword attack
    if (this.sword.attacking) {
      this.sword.attackTimer--;
      
      const progress = 1 - (this.sword.attackTimer / this.sword.attackDuration);
      this.sword.angle = p.lerp(-Math.PI / 3, Math.PI / 3, progress) * this.facing;
      
      if (this.sword.attackTimer === Math.floor(this.sword.attackDuration / 2)) {
        this.checkSwordHits(p);
      }
      
      if (this.sword.attackTimer <= 0) {
        this.sword.attacking = false;
        this.sword.angle = 0;
      }
    }
    
    // AI behavior
    this.updateAI(p);
    
    // Apply physics
    this.x += this.vx;
    this.y += this.vy;
    
    // Apply friction
    this.vx *= gameState.friction;
    this.vy *= gameState.friction;
    
    // Arena bounds
    if (this.x < gameState.arenaLeft + 15) {
      this.x = gameState.arenaLeft + 15;
      this.vx = 0;
    }
    if (this.x > gameState.arenaRight - 15) {
      this.x = gameState.arenaRight - 15;
      this.vx = 0;
    }
    if (this.y < gameState.arenaTop + 20) {
      this.y = gameState.arenaTop + 20;
      this.vy = 0;
    }
    if (this.y > gameState.arenaBottom - 20) {
      this.y = gameState.arenaBottom - 20;
      this.vy = 0;
    }
    
    // Update body parts
    this.updateBodyParts();
  }
  
  updateAI(p) {
    const dx = gameState.player.x - this.x;
    const dy = gameState.player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Update facing direction
    this.facing = dx > 0 ? 1 : -1;
    
    // State machine
    if (distance > 200) {
      this.aiState = 'seek';
    } else if (distance < 60 && this.aggressiveness > 0.5) {
      this.aiState = 'attack';
    } else if (distance < 40) {
      this.aiState = 'retreat';
    }
    
    // Execute behavior
    switch (this.aiState) {
      case 'seek':
        // Move toward player
        const seekAngle = Math.atan2(dy, dx);
        this.vx = Math.cos(seekAngle) * this.speed * this.moveSpeed;
        this.vy = Math.sin(seekAngle) * this.speed * this.moveSpeed;
        break;
        
      case 'attack':
        // Circle and attack
        const circleAngle = Math.atan2(dy, dx) + Math.PI / 4;
        this.vx = Math.cos(circleAngle) * this.speed * this.moveSpeed * 0.5;
        this.vy = Math.sin(circleAngle) * this.speed * this.moveSpeed * 0.5;
        
        if (distance < this.sword.range + 20 && !this.sword.attacking && this.sword.cooldown <= 0) {
          this.attack();
        }
        break;
        
      case 'retreat':
        // Move away
        const retreatAngle = Math.atan2(dy, dx) + Math.PI;
        this.vx = Math.cos(retreatAngle) * this.speed * this.moveSpeed;
        this.vy = Math.sin(retreatAngle) * this.speed * this.moveSpeed;
        break;
    }
  }
  
  updateBodyParts() {
    if (this.parts.core.attached) {
      this.parts.core.x = this.x;
      this.parts.core.y = this.y;
    }
    
    if (this.parts.head.attached) {
      this.parts.head.x = this.x;
      this.parts.head.y = this.y - 16;
    }
    
    if (this.parts.torso.attached) {
      this.parts.torso.x = this.x;
      this.parts.torso.y = this.y + 4;
    }
    
    if (this.parts.leftArm.attached) {
      this.parts.leftArm.x = this.x - 10;
      this.parts.leftArm.y = this.y + 2;
    }
    
    if (this.parts.rightArm.attached) {
      this.parts.rightArm.x = this.x + 10;
      this.parts.rightArm.y = this.y + 2;
    }
    
    if (this.parts.leftLeg.attached) {
      this.parts.leftLeg.x = this.x - 5;
      this.parts.leftLeg.y = this.y + 18;
    }
    
    if (this.parts.rightLeg.attached) {
      this.parts.rightLeg.x = this.x + 5;
      this.parts.rightLeg.y = this.y + 18;
    }
    
    Object.values(this.parts).forEach(part => {
      if (!part.attached) {
        part.update();
      }
    });
  }
  
  attack() {
    if (!this.sword.attacking && this.sword.cooldown <= 0) {
      this.sword.attacking = true;
      this.sword.attackTimer = this.sword.attackDuration;
      this.sword.cooldown = 40;
    }
  }
  
  checkSwordHits(p) {
    if (!gameState.player) return;
    
    const swordX = this.x + Math.cos(this.sword.angle) * this.sword.range * this.facing;
    const swordY = this.y + Math.sin(this.sword.angle) * this.sword.range;
    
    const dx = gameState.player.x - swordX;
    const dy = gameState.player.y - swordY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < this.sword.range) {
      gameState.player.takeDamage(this.sword.damage, p);
    }
  }
  
  render(p) {
    Object.values(this.parts).forEach(part => {
      if (part.attached) {
        part.render(p);
      }
    });
    
    if (this.parts.rightArm.attached || this.parts.leftArm.attached) {
      this.renderSword(p);
    }
  }
  
  renderSword(p) {
    p.push();
    p.translate(this.x, this.y);
    
    const armX = this.facing > 0 ? 10 : -10;
    const swordLength = this.sword.range;
    const swordAngle = this.sword.angle;
    
    if (this.sword.attacking) {
      p.stroke(255, 100, 100, 100);
      p.strokeWeight(6);
      p.line(
        armX,
        2,
        armX + Math.cos(swordAngle) * swordLength * this.facing,
        2 + Math.sin(swordAngle) * swordLength
      );
    }
    
    p.stroke(255, 50, 50);
    p.strokeWeight(2);
    p.line(
      armX,
      2,
      armX + Math.cos(swordAngle) * swordLength * this.facing,
      2 + Math.sin(swordAngle) * swordLength
    );
    
    const tipX = armX + Math.cos(swordAngle) * swordLength * this.facing;
    const tipY = 2 + Math.sin(swordAngle) * swordLength;
    p.fill(255, 100, 100);
    p.noStroke();
    p.circle(tipX, tipY, 5);
    
    p.pop();
  }
}