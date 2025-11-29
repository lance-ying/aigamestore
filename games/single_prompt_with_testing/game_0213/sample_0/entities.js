// entities.js - Entity classes for game objects

import { gameState, PHYSICS, CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { checkCircleCollision, resolveCollision } from './physics.js';

// Base class for physical entities
export class PhysicsEntity {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.mass = 1;
    this.radius = 15;
  }
  
  applyForce(fx, fy) {
    this.vx += fx / this.mass;
    this.vy += fy / this.mass;
  }
  
  update() {
    // Apply gravity
    this.vy += gameState.gravity;
    
    // Apply friction
    this.vx *= gameState.friction;
    this.vy *= gameState.airResistance;
    
    // Clamp velocity
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > PHYSICS.MAX_VELOCITY) {
      this.vx = (this.vx / speed) * PHYSICS.MAX_VELOCITY;
      this.vy = (this.vy / speed) * PHYSICS.MAX_VELOCITY;
    }
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
  }
}

// Body part that can be grabbed
export class BodyPart extends PhysicsEntity {
  constructor(x, y, type, parent) {
    super(x, y);
    this.type = type; // 'head', 'torso', 'arm', 'leg'
    this.parent = parent;
    this.radius = CONFIG.LIMB_RADIUS;
    this.offsetX = 0;
    this.offsetY = 0;
    this.angle = 0;
    this.grabbed = false;
    this.mass = 0.5;
  }
  
  updatePosition(parentX, parentY, parentAngle) {
    // Calculate rotated offset
    const cos = Math.cos(parentAngle);
    const sin = Math.sin(parentAngle);
    this.x = parentX + (this.offsetX * cos - this.offsetY * sin);
    this.y = parentY + (this.offsetX * sin + this.offsetY * cos);
    this.angle = parentAngle;
  }
  
  render(p) {
    p.push();
    
    // Color based on type and grab state
    if (this.grabbed) {
      p.fill(255, 255, 0);
      p.stroke(255, 200, 0);
    } else {
      switch(this.type) {
        case 'head':
          p.fill(255, 220, 180);
          p.stroke(220, 190, 150);
          break;
        case 'torso':
          p.fill(100, 150, 255);
          p.stroke(70, 120, 220);
          break;
        case 'arm':
        case 'leg':
          p.fill(255, 220, 180);
          p.stroke(220, 190, 150);
          break;
      }
    }
    
    p.strokeWeight(2);
    p.circle(this.x, this.y, this.radius * 2);
    
    p.pop();
  }
}

// Climber in the tower
export class Climber extends PhysicsEntity {
  constructor(x, y, color, isPlayer = false) {
    super(x, y);
    this.width = CONFIG.CLIMBER_WIDTH;
    this.height = CONFIG.CLIMBER_HEIGHT;
    this.color = color;
    this.isPlayer = isPlayer;
    this.angle = 0;
    this.angularVelocity = 0;
    this.mass = 5;
    this.onGround = false;
    this.bottomSupport = null; // Climber below this one
    
    // Create body parts
    this.bodyParts = [];
    this.createBodyParts();
    
    // State
    this.stable = false;
    this.stableFrames = 0;
  }
  
  createBodyParts() {
    // Head
    const head = new BodyPart(this.x, this.y - 20, 'head', this);
    head.offsetX = 0;
    head.offsetY = -20;
    this.bodyParts.push(head);
    
    // Torso center
    const torso = new BodyPart(this.x, this.y, 'torso', this);
    torso.offsetX = 0;
    torso.offsetY = 0;
    this.bodyParts.push(torso);
    
    // Left arm
    const leftArm = new BodyPart(this.x - 15, this.y - 10, 'arm', this);
    leftArm.offsetX = -15;
    leftArm.offsetY = -10;
    this.bodyParts.push(leftArm);
    
    // Right arm
    const rightArm = new BodyPart(this.x + 15, this.y - 10, 'arm', this);
    rightArm.offsetX = 15;
    rightArm.offsetY = -10;
    this.bodyParts.push(rightArm);
    
    // Left leg
    const leftLeg = new BodyPart(this.x - 10, this.y + 20, 'leg', this);
    leftLeg.offsetX = -10;
    leftLeg.offsetY = 20;
    this.bodyParts.push(leftLeg);
    
    // Right leg
    const rightLeg = new BodyPart(this.x + 10, this.y + 20, 'leg', this);
    rightLeg.offsetX = 10;
    rightLeg.offsetY = 20;
    this.bodyParts.push(rightLeg);
  }
  
  update() {
    // Check if on ground
    if (this.y + this.height / 2 >= PHYSICS.GROUND_Y - 5) {
      this.y = PHYSICS.GROUND_Y - this.height / 2;
      this.vy = 0;
      this.onGround = true;
      this.stable = true;
    } else if (this.bottomSupport) {
      // Resting on another climber
      const supportTop = this.bottomSupport.y - this.bottomSupport.height / 2;
      const myBottom = this.y + this.height / 2;
      
      if (Math.abs(myBottom - supportTop) < 10) {
        this.y = supportTop - this.height / 2;
        this.vy = Math.min(this.vy, 0);
        this.onGround = true;
        
        // Apply tower sway
        this.x += gameState.towerSway;
        
        // Check stability
        if (Math.abs(this.vx) < 0.5 && Math.abs(this.vy) < 0.5) {
          this.stableFrames++;
          if (this.stableFrames > 30) {
            this.stable = true;
          }
        } else {
          this.stableFrames = 0;
          this.stable = false;
        }
      } else {
        this.onGround = false;
        this.stable = false;
      }
    } else {
      this.onGround = false;
      this.stable = false;
    }
    
    // Update physics if not stable
    if (!this.stable || this.isPlayer) {
      super.update();
    }
    
    // Apply angular physics
    this.angle += this.angularVelocity;
    this.angularVelocity *= 0.95;
    
    // Keep angle reasonable
    this.angle = Math.max(-0.3, Math.min(0.3, this.angle));
    
    // Update body parts
    this.bodyParts.forEach(part => {
      part.updatePosition(this.x, this.y, this.angle);
    });
    
    // Bounds checking
    if (this.x < this.width / 2) {
      this.x = this.width / 2;
      this.vx = Math.abs(this.vx) * 0.5;
    }
    if (this.x > CANVAS_WIDTH - this.width / 2) {
      this.x = CANVAS_WIDTH - this.width / 2;
      this.vx = -Math.abs(this.vx) * 0.5;
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle);
    
    // Body
    p.fill(this.color[0], this.color[1], this.color[2]);
    p.stroke(this.color[0] * 0.8, this.color[1] * 0.8, this.color[2] * 0.8);
    p.strokeWeight(3);
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.width, this.height, 5);
    
    // Face
    p.fill(255, 220, 180);
    p.ellipse(0, -15, 25, 30);
    
    // Eyes
    p.fill(0);
    p.circle(-6, -18, 4);
    p.circle(6, -18, 4);
    
    // Mouth
    p.noFill();
    p.stroke(0);
    p.strokeWeight(2);
    p.arc(0, -10, 12, 8, 0, p.PI);
    
    p.pop();
    
    // Render body parts
    this.bodyParts.forEach(part => part.render(p));
  }
  
  getTopY() {
    return this.y - this.height / 2;
  }
  
  getBottomY() {
    return this.y + this.height / 2;
  }
}

// The goat base
export class Goat {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 50;
    this.height = 40;
    this.color = [200, 200, 200];
    this.angle = 0;
    
    // Create body parts
    this.bodyParts = [];
    this.createBodyParts();
  }
  
  createBodyParts() {
    // Head
    const head = new BodyPart(this.x, this.y - 15, 'head', this);
    head.offsetX = 0;
    head.offsetY = -15;
    this.bodyParts.push(head);
    
    // Body center
    const body = new BodyPart(this.x, this.y, 'torso', this);
    body.offsetX = 0;
    body.offsetY = 0;
    this.bodyParts.push(body);
    
    // Back
    const back = new BodyPart(this.x, this.y + 10, 'torso', this);
    back.offsetX = 0;
    back.offsetY = 10;
    this.bodyParts.push(back);
  }
  
  update() {
    // Goat stays on ground
    this.y = PHYSICS.GROUND_Y - this.height / 2;
    
    // Slight animation
    this.angle = Math.sin(gameState.frameCount * 0.05) * 0.05;
    
    // Update body parts
    this.bodyParts.forEach(part => {
      part.updatePosition(this.x, this.y, this.angle);
    });
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle);
    
    // Body
    p.fill(200, 200, 200);
    p.stroke(150, 150, 150);
    p.strokeWeight(3);
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.width, this.height, 5);
    
    // Head
    p.fill(220, 220, 220);
    p.ellipse(-20, -10, 20, 25);
    
    // Horns
    p.stroke(100, 80, 60);
    p.strokeWeight(3);
    p.noFill();
    p.arc(-25, -18, 8, 12, -p.PI, 0);
    p.arc(-15, -18, 8, 12, -p.PI, 0);
    
    // Eyes
    p.fill(0);
    p.circle(-23, -12, 3);
    p.circle(-17, -12, 3);
    
    // Legs
    p.stroke(150, 150, 150);
    p.strokeWeight(4);
    p.line(-15, 15, -15, 30);
    p.line(-5, 15, -5, 30);
    p.line(5, 15, 5, 30);
    p.line(15, 15, 15, 30);
    
    p.pop();
    
    // Render body parts
    this.bodyParts.forEach(part => part.render(p));
  }
  
  getTopY() {
    return this.y - this.height / 2;
  }
}

// Active player climber
export class Player extends Climber {
  constructor(x, y, color) {
    super(x, y, color, true);
    this.speed = PHYSICS.CLIMB_SPEED;
    this.jumpPower = PHYSICS.JUMP_POWER;
    this.isSprinting = false;
    this.grabCooldown = 0;
    this.pullStrength = 0;
    this.flingChargeFrames = 0;
    this.maxFlingCharge = 30;
  }
  
  update() {
    super.update();
    
    // Decrease cooldowns
    if (this.grabCooldown > 0) this.grabCooldown--;
    
    // Handle grabbing mechanics
    if (gameState.isGrabbing && gameState.grabbedLimb) {
      this.handleGrabPhysics();
    }
    
    // Log player position changes
    if (gameState.frameCount % 10 === 0) {
      this.logPosition();
    }
  }
  
  handleGrabPhysics() {
    const limb = gameState.grabbedLimb;
    
    // Pull towards grabbed limb
    const dx = limb.x - this.x;
    const dy = limb.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 5) {
      const pullForce = PHYSICS.PULL_FORCE * this.pullStrength;
      this.vx += (dx / dist) * pullForce;
      this.vy += (dy / dist) * pullForce;
    }
    
    // Counter gravity when pulling
    if (this.pullStrength > 0) {
      this.vy -= gameState.gravity * 1.5;
    }
  }
  
  moveLeft() {
    const speed = this.isSprinting ? this.speed * PHYSICS.SPRINT_MULTIPLIER : this.speed;
    if (gameState.isGrabbing) {
      // Swing left while grabbing
      this.vx -= speed * 0.3;
    } else {
      this.vx -= speed;
    }
  }
  
  moveRight() {
    const speed = this.isSprinting ? this.speed * PHYSICS.SPRINT_MULTIPLIER : this.speed;
    if (gameState.isGrabbing) {
      // Swing right while grabbing
      this.vx += speed * 0.3;
    } else {
      this.vx += speed;
    }
  }
  
  jump() {
    if (this.onGround && !gameState.isGrabbing) {
      this.vy = this.jumpPower;
      this.onGround = false;
    }
  }
  
  startGrab(direction) {
    if (this.grabCooldown > 0) return;
    
    // Find nearest grabbable limb
    let nearest = null;
    let minDist = PHYSICS.GRAB_DISTANCE;
    
    // Search through all climbers and goat
    const targets = [...gameState.climbers, gameState.goat].filter(c => c && c !== this);
    
    for (const climber of targets) {
      for (const limb of climber.bodyParts) {
        const dx = limb.x - this.x;
        const dy = limb.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Check direction preference
        if (direction === 'left' && dx > 0) continue;
        if (direction === 'right' && dx < 0) continue;
        
        if (dist < minDist) {
          minDist = dist;
          nearest = limb;
        }
      }
    }
    
    if (nearest) {
      gameState.grabbedLimb = nearest;
      gameState.isGrabbing = true;
      nearest.grabbed = true;
      this.pullStrength = 0;
      this.flingChargeFrames = 0;
    }
  }
  
  quickGrab() {
    if (this.grabCooldown > 0) return;
    
    // Find absolutely nearest limb regardless of direction
    let nearest = null;
    let minDist = PHYSICS.GRAB_DISTANCE;
    
    const targets = [...gameState.climbers, gameState.goat].filter(c => c && c !== this);
    
    for (const climber of targets) {
      for (const limb of climber.bodyParts) {
        const dx = limb.x - this.x;
        const dy = limb.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < minDist) {
          minDist = dist;
          nearest = limb;
        }
      }
    }
    
    if (nearest) {
      gameState.grabbedLimb = nearest;
      gameState.isGrabbing = true;
      nearest.grabbed = true;
      this.pullStrength = 0;
      this.flingChargeFrames = 0;
    }
  }
  
  pull() {
    if (gameState.isGrabbing) {
      this.pullStrength = 1;
      this.flingChargeFrames = Math.min(this.flingChargeFrames + 1, this.maxFlingCharge);
    }
  }
  
  releaseGrab() {
    if (gameState.isGrabbing && gameState.grabbedLimb) {
      // Fling if charged
      if (this.flingChargeFrames > 10) {
        const flingMultiplier = 1 + (this.flingChargeFrames / this.maxFlingCharge) * PHYSICS.FLING_MULTIPLIER;
        this.vy *= flingMultiplier;
        this.vx *= flingMultiplier * 0.5;
      }
      
      gameState.grabbedLimb.grabbed = false;
      gameState.grabbedLimb = null;
      gameState.isGrabbing = false;
      this.pullStrength = 0;
      this.flingChargeFrames = 0;
      this.grabCooldown = 10;
    }
  }
  
  logPosition() {
    if (window.gameInstance && window.gameInstance.logs) {
      window.gameInstance.logs.player_info.push({
        screen_x: this.x,
        screen_y: this.y,
        game_x: this.x,
        game_y: this.y,
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  render(p) {
    // Highlight player with glow
    if (gameState.gamePhase === "PLAYING") {
      p.push();
      p.noFill();
      p.stroke(255, 255, 0, 100);
      p.strokeWeight(8);
      p.circle(this.x, this.y, this.height + 10);
      p.pop();
    }
    
    super.render(p);
    
    // Show grab line if grabbing
    if (gameState.isGrabbing && gameState.grabbedLimb) {
      p.push();
      p.stroke(255, 255, 0, 150);
      p.strokeWeight(3);
      p.line(this.x, this.y, gameState.grabbedLimb.x, gameState.grabbedLimb.y);
      
      // Show fling charge
      if (this.flingChargeFrames > 0) {
        const chargePercent = this.flingChargeFrames / this.maxFlingCharge;
        p.stroke(255, 255 * (1 - chargePercent), 0, 200);
        p.strokeWeight(5 + chargePercent * 5);
        p.line(this.x, this.y, gameState.grabbedLimb.x, gameState.grabbedLimb.y);
      }
      
      p.pop();
    }
  }
}

// Particle for visual effects
export class Particle {
  constructor(x, y, vx, vy, color, lifetime) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.lifetime = lifetime;
    this.age = 0;
    this.size = Math.random() * 4 + 2;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // Gravity
    this.age++;
  }
  
  isDead() {
    return this.age >= this.lifetime;
  }
  
  render(p) {
    const alpha = (1 - this.age / this.lifetime) * 255;
    p.push();
    p.noStroke();
    p.fill(this.color[0], this.color[1], this.color[2], alpha);
    p.circle(this.x, this.y, this.size);
    p.pop();
  }
}

// Helper to create particle burst
export function createParticleBurst(x, y, color, count = 10) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    const particle = new Particle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      color,
      30 + Math.random() * 30
    );
    gameState.particles.push(particle);
  }
}