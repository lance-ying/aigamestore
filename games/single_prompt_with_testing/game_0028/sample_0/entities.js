// entities.js - Player and opponent entities

import { gameState, GRAVITY, MAX_FALL_SPEED, JUMP_POWER, MOVE_SPEED, AIR_MOVE_SPEED, 
         GROUND_FRICTION, AIR_FRICTION, KNOCKBACK_DECAY, CHARACTERS, BASE_KNOCKBACK, 
         KNOCKBACK_SCALING, HITSTUN_FRAMES, ATTACK_COOLDOWN, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Fighter {
  constructor(x, y, isPlayer = true, characterIndex = 0) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 30;
    this.height = 40;
    this.isPlayer = isPlayer;
    this.characterIndex = characterIndex;
    this.character = CHARACTERS[characterIndex];
    
    // Combat stats
    this.damage = 0;
    this.lives = 3;
    this.isAlive = true;
    this.hitstun = 0;
    this.facingRight = isPlayer ? true : false;
    
    // State
    this.grounded = false;
    this.jumpsUsed = 0;
    this.maxJumps = characterIndex === 2 ? 4 : 2; // Wrastor has 4 jumps
    this.attackCooldown = 0;
    this.specialCooldown = 0;
    
    // Animation
    this.animFrame = 0;
    this.animTimer = 0;
    
    // Special abilities state
    this.specialResource = 0; // Used differently per character
    this.activeSpecialObjects = []; // Puddles, wind currents, rocks, etc.
    
    // Input buffer
    this.inputBuffer = {
      left: false,
      right: false,
      up: false,
      down: false,
      space: false,
      shift: false,
      z: false
    };
  }
  
  update(p) {
    this.animTimer++;
    if (this.animTimer > 5) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }
    
    // Update hitstun
    if (this.hitstun > 0) {
      this.hitstun--;
    }
    
    // Update cooldowns
    if (this.attackCooldown > 0) this.attackCooldown--;
    if (this.specialCooldown > 0) this.specialCooldown--;
    
    // Apply gravity
    if (!this.grounded) {
      this.vy += GRAVITY;
      if (this.vy > MAX_FALL_SPEED) {
        this.vy = MAX_FALL_SPEED;
      }
    }
    
    // Apply knockback decay
    if (this.hitstun > 0) {
      this.vx *= KNOCKBACK_DECAY;
      this.vy *= KNOCKBACK_DECAY;
    } else {
      // Apply friction
      if (this.grounded) {
        this.vx *= GROUND_FRICTION;
      } else {
        this.vx *= AIR_FRICTION;
      }
    }
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Check if out of bounds (KO)
    if (this.y > CANVAS_HEIGHT + 100 || this.x < -100 || this.x > CANVAS_WIDTH + 100) {
      this.isAlive = false;
    }
    
    // Reset grounded state
    this.grounded = false;
  }
  
  handleInput(inputs) {
    if (this.hitstun > 0) return; // Can't act during hitstun
    
    this.inputBuffer = inputs;
    
    // Horizontal movement
    const moveSpeed = this.grounded ? MOVE_SPEED : AIR_MOVE_SPEED;
    if (inputs.left && !inputs.right) {
      this.vx = -moveSpeed;
      this.facingRight = false;
    } else if (inputs.right && !inputs.left) {
      this.vx = moveSpeed;
      this.facingRight = true;
    }
    
    // Jump
    if (inputs.up && this.jumpsUsed < this.maxJumps) {
      this.vy = JUMP_POWER;
      this.jumpsUsed++;
      this.grounded = false;
    }
    
    // Fast fall
    if (inputs.down && !this.grounded) {
      this.vy += 2;
    }
    
    // Attacks
    if (inputs.space && this.attackCooldown === 0) {
      this.performLightAttack();
    }
    
    if (inputs.z && this.attackCooldown === 0) {
      this.performStrongAttack();
    }
    
    if (inputs.shift && this.specialCooldown === 0) {
      this.performSpecialAttack(inputs);
    }
  }
  
  performLightAttack() {
    this.attackCooldown = ATTACK_COOLDOWN;
    const hitbox = this.getAttackHitbox(15, 30);
    return {
      type: 'light',
      hitbox: hitbox,
      damage: 5,
      knockback: 2,
      owner: this
    };
  }
  
  performStrongAttack() {
    this.attackCooldown = ATTACK_COOLDOWN * 2;
    const hitbox = this.getAttackHitbox(20, 40);
    return {
      type: 'strong',
      hitbox: hitbox,
      damage: 12,
      knockback: 4,
      owner: this
    };
  }
  
  performSpecialAttack(inputs) {
    this.specialCooldown = ATTACK_COOLDOWN * 2;
    
    // Direction-based specials
    let direction = 'neutral';
    if (inputs.up) direction = 'up';
    else if (inputs.down) direction = 'down';
    else if (inputs.left || inputs.right) direction = 'side';
    
    return {
      type: 'special',
      direction: direction,
      character: this.characterIndex,
      owner: this,
      x: this.x,
      y: this.y
    };
  }
  
  getAttackHitbox(width, height) {
    const offsetX = this.facingRight ? this.width : -width;
    return {
      x: this.x + offsetX,
      y: this.y,
      width: width,
      height: height
    };
  }
  
  takeDamage(damage, knockbackX, knockbackY) {
    this.damage += damage;
    
    // Apply knockback scaled by damage
    const scale = 1 + (this.damage * KNOCKBACK_SCALING);
    this.vx = knockbackX * scale;
    this.vy = knockbackY * scale;
    
    this.hitstun = HITSTUN_FRAMES;
  }
  
  land() {
    this.grounded = true;
    this.jumpsUsed = 0;
    this.vy = 0;
  }
  
  render(p) {
    p.push();
    
    // Character body
    const col = this.character.color;
    const accent = this.character.accentColor;
    
    // Apply hitstun flash
    if (this.hitstun > 0 && this.hitstun % 4 < 2) {
      p.fill(255, 255, 255, 200);
    } else {
      p.fill(...col);
    }
    
    p.noStroke();
    
    // Body
    p.rect(this.x, this.y, this.width, this.height, 5);
    
    // Face direction indicator
    p.fill(...accent);
    const eyeX = this.x + (this.facingRight ? this.width - 8 : 8);
    p.ellipse(eyeX, this.y + 12, 6, 6);
    
    // Element indicator
    this.renderElementEffect(p);
    
    // Damage percentage
    p.fill(255);
    p.textSize(12);
    p.textAlign(p.CENTER);
    p.text(`${Math.floor(this.damage)}%`, this.x + this.width/2, this.y - 10);
    
    p.pop();
  }
  
  renderElementEffect(p) {
    const t = this.animFrame;
    p.push();
    p.noStroke();
    
    switch(this.characterIndex) {
      case 0: // Fire
        p.fill(255, 150, 0, 150);
        p.ellipse(this.x + this.width/2, this.y + this.height - 5, 15 + t*2, 8);
        break;
      case 1: // Water
        p.fill(100, 200, 255, 150);
        p.ellipse(this.x + this.width/2 - 5 + t*2, this.y + this.height/2, 6, 6);
        p.ellipse(this.x + this.width/2 + 5 - t*2, this.y + this.height/2 + 10, 6, 6);
        break;
      case 2: // Air
        p.stroke(200, 200, 255, 100);
        p.noFill();
        p.strokeWeight(2);
        for(let i = 0; i < 3; i++) {
          p.arc(this.x + this.width/2, this.y + this.height/2, 20 + i*8 + t*2, 20 + i*8 + t*2, 0, p.PI);
        }
        break;
      case 3: // Earth
        p.fill(100, 80, 50, 150);
        for(let i = 0; i < 3; i++) {
          p.rect(this.x + 5 + i*8, this.y + this.height - 3, 6, 3, 1);
        }
        break;
    }
    p.pop();
  }
}

export class Projectile {
  constructor(x, y, vx, vy, owner, damage, lifetime) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.owner = owner;
    this.damage = damage;
    this.lifetime = lifetime;
    this.radius = 8;
    this.active = true;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.3; // Gravity
    this.lifetime--;
    
    if (this.lifetime <= 0) {
      this.active = false;
    }
    
    // Out of bounds
    if (this.y > CANVAS_HEIGHT + 50) {
      this.active = false;
    }
  }
  
  render(p) {
    p.push();
    p.fill(255, 200, 100);
    p.noStroke();
    p.ellipse(this.x, this.y, this.radius * 2, this.radius * 2);
    p.fill(255, 255, 150, 150);
    p.ellipse(this.x, this.y, this.radius, this.radius);
    p.pop();
  }
}

export class SpecialObject {
  constructor(x, y, type, owner) {
    this.x = x;
    this.y = y;
    this.type = type; // 'puddle', 'rock', 'wind', etc.
    this.owner = owner;
    this.lifetime = 300; // 5 seconds
    this.active = true;
    this.width = 50;
    this.height = 20;
  }
  
  update() {
    this.lifetime--;
    if (this.lifetime <= 0) {
      this.active = false;
    }
  }
  
  render(p) {
    p.push();
    switch(this.type) {
      case 'puddle':
        p.fill(100, 200, 255, 150);
        p.noStroke();
        p.ellipse(this.x, this.y, this.width, this.height);
        break;
      case 'rock':
        p.fill(139, 90, 60);
        p.stroke(100, 70, 50);
        p.strokeWeight(2);
        p.rect(this.x - 15, this.y - 15, 30, 30, 3);
        break;
      case 'wind':
        p.noFill();
        p.stroke(200, 200, 255, 100);
        p.strokeWeight(2);
        for(let i = 0; i < 3; i++) {
          p.line(this.x - 30 + i*10, this.y - 20, this.x - 20 + i*10, this.y);
          p.line(this.x - 20 + i*10, this.y, this.x - 10 + i*10, this.y + 20);
        }
        break;
      case 'flame':
        p.fill(255, 150, 0, 150);
        p.noStroke();
        p.triangle(this.x - 10, this.y, this.x + 10, this.y, this.x, this.y - 20);
        break;
    }
    p.pop();
  }
}

export class Effect {
  constructor(x, y, type, color) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.color = color;
    this.lifetime = 30;
    this.alpha = 255;
    this.size = 10;
    this.active = true;
  }
  
  update() {
    this.lifetime--;
    this.alpha = (this.lifetime / 30) * 255;
    this.size += 0.5;
    
    if (this.lifetime <= 0) {
      this.active = false;
    }
  }
  
  render(p) {
    p.push();
    p.noStroke();
    p.fill(...this.color, this.alpha);
    
    switch(this.type) {
      case 'hit':
        p.ellipse(this.x, this.y, this.size, this.size);
        break;
      case 'star':
        for(let i = 0; i < 5; i++) {
          const angle = (i * p.TWO_PI / 5) - p.HALF_PI;
          const x = this.x + p.cos(angle) * this.size;
          const y = this.y + p.sin(angle) * this.size;
          p.triangle(this.x, this.y, x, y, 
                    this.x + p.cos(angle + 0.5) * this.size * 0.5,
                    this.y + p.sin(angle + 0.5) * this.size * 0.5);
        }
        break;
    }
    p.pop();
  }
}