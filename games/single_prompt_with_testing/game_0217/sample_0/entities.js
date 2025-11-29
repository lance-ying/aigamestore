// entities.js - All game entity classes

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

// Player class - the explorer character
export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 24;
    this.height = 32;
    this.radius = 16;
    
    // Physics
    this.vx = 0;
    this.vy = 0;
    this.speed = 4;
    this.jumpPower = -11;
    this.onGround = false;
    this.canJump = true;
    
    // State
    this.facing = 1; // 1 = right, -1 = left
    this.isMoving = false;
    this.animFrame = 0;
    this.animSpeed = 0.15;
    
    // Interaction
    this.interactionRadius = 40;
    this.nearbyFood = null;
    
    // Visual
    this.wobble = 0;
    this.squash = 1;
    
    // Tracking for logs
    this.lastPosition = { x: x, y: y };
    
    gameState.player = this;
    gameState.entities.push(this);
  }
  
  update(p) {
    // Apply gravity
    if (!this.onGround) {
      this.vy += gameState.gravity;
    }
    
    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;
    
    // Apply friction
    if (this.onGround) {
      this.vx *= gameState.friction;
    } else {
      this.vx *= gameState.airResistance;
    }
    
    // Update animation
    if (Math.abs(this.vx) > 0.5) {
      this.animFrame += this.animSpeed;
      this.isMoving = true;
    } else {
      this.isMoving = false;
      this.animFrame = 0;
    }
    
    // Update wobble
    this.wobble += 0.1;
    
    // Squash and stretch
    if (!this.onGround) {
      this.squash = 1 + Math.abs(this.vy) * 0.02;
    } else {
      this.squash = 1;
    }
    
    // Check collisions
    this.checkGroundCollision();
    this.checkPlatformCollisions();
    this.checkWallCollision();
    this.checkCreatureCollisions();
    this.checkFoodNearby();
    
    // Log position if moved significantly
    const dx = Math.abs(this.x - this.lastPosition.x);
    const dy = Math.abs(this.y - this.lastPosition.y);
    if (dx > 2 || dy > 2) {
      this.logPosition(p);
      this.lastPosition.x = this.x;
      this.lastPosition.y = this.y;
    }
  }
  
  checkGroundCollision() {
    const groundY = CANVAS_HEIGHT - 40;
    if (this.y + this.height / 2 >= groundY) {
      this.y = groundY - this.height / 2;
      this.vy = 0;
      this.onGround = true;
      this.canJump = true;
    }
  }
  
  checkPlatformCollisions() {
    let wasOnGround = this.onGround;
    this.onGround = false;
    
    for (const platform of gameState.platforms) {
      // Check if player is above platform and falling onto it
      if (this.vy >= 0 &&
          this.x + this.width / 2 > platform.x &&
          this.x - this.width / 2 < platform.x + platform.width &&
          this.y + this.height / 2 >= platform.y &&
          this.y + this.height / 2 <= platform.y + platform.height &&
          this.y < platform.y + platform.height / 2) {
        this.y = platform.y - this.height / 2;
        this.vy = 0;
        this.onGround = true;
        this.canJump = true;
      }
    }
    
    // If we were on ground last frame but not anymore, we're falling
    if (wasOnGround && !this.onGround && this.vy >= 0) {
      this.canJump = false;
    }
  }
  
  checkWallCollision() {
    if (this.x - this.width / 2 < 0) {
      this.x = this.width / 2;
      this.vx = 0;
    }
    if (this.x + this.width / 2 > CANVAS_WIDTH) {
      this.x = CANVAS_WIDTH - this.width / 2;
      this.vx = 0;
    }
  }
  
  checkCreatureCollisions() {
    for (const creature of gameState.creatures) {
      const dx = creature.x - this.x;
      const dy = creature.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < this.radius + creature.radius) {
        // Push player away slightly
        const pushX = (this.x - creature.x) / dist * 2;
        const pushY = (this.y - creature.y) / dist * 2;
        this.vx += pushX;
        this.vy += pushY * 0.5;
      }
    }
  }
  
  checkFoodNearby() {
    this.nearbyFood = null;
    let closestDist = this.interactionRadius;
    
    for (const food of gameState.foodOrbs) {
      if (!food.collected) {
        const dx = food.x - this.x;
        const dy = food.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < closestDist) {
          closestDist = dist;
          this.nearbyFood = food;
        }
      }
    }
  }
  
  moveLeft() {
    this.vx = -this.speed;
    this.facing = -1;
  }
  
  moveRight() {
    this.vx = this.speed;
    this.facing = 1;
  }
  
  jump() {
    if (this.canJump && this.onGround) {
      this.vy = this.jumpPower;
      this.onGround = false;
      this.canJump = false;
    }
  }
  
  interact() {
    if (this.nearbyFood && !this.nearbyFood.collected) {
      this.nearbyFood.collect();
    }
  }
  
  logPosition(p) {
    if (p.logs && p.logs.player_info) {
      p.logs.player_info.push({
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
    p.push();
    p.translate(this.x, this.y);
    
    if (this.facing < 0) {
      p.scale(-1, 1);
    }
    
    // Pulsing effect with world
    const pulse = Math.sin(gameState.worldPulse) * 0.05 + 1;
    p.scale(pulse, pulse / this.squash);
    
    // Body (organic blob shape)
    p.fill(...COLORS.pinkMedium);
    p.noStroke();
    p.beginShape();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const wobbleOffset = Math.sin(this.wobble + i) * 2;
      const r = this.radius + wobbleOffset;
      const x = Math.cos(angle) * r * 0.8;
      const y = Math.sin(angle) * r;
      p.vertex(x, y);
    }
    p.endShape(p.CLOSE);
    
    // Eye (single large eye)
    p.fill(255);
    p.circle(4, -4, 10);
    p.fill(...COLORS.creatureEye);
    p.circle(5, -3, 6);
    
    // Mouth (simple line)
    p.stroke(...COLORS.pinkDark);
    p.strokeWeight(2);
    p.noFill();
    const mouthY = 6 + Math.sin(this.wobble * 2) * 2;
    p.arc(0, mouthY, 8, 6, 0, Math.PI);
    
    // Limbs (tentacle-like)
    p.noStroke();
    p.fill(...COLORS.pinkDark);
    for (let i = 0; i < 2; i++) {
      const legX = (i - 0.5) * 10;
      const legWobble = Math.sin(this.wobble + i * Math.PI) * 3;
      p.ellipse(legX + legWobble, this.height / 2 - 5, 6, 12);
    }
    
    p.pop();
    
    // Draw interaction indicator if near food
    if (this.nearbyFood) {
      p.push();
      p.noFill();
      p.stroke(255, 255, 100, 150);
      p.strokeWeight(2);
      const pulseSize = Math.sin(gameState.frameCount * 0.2) * 3;
      p.circle(this.x, this.y, this.interactionRadius * 2 + pulseSize);
      p.pop();
    }
  }
}

// Friend NPC - receives the food
export class Friend {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 50;
    this.radius = 25;
    
    this.satisfaction = 0;
    this.wobble = 0;
    this.mouthOpen = 0;
    
    gameState.friend = this;
    gameState.entities.push(this);
  }
  
  update(p) {
    this.wobble += 0.08;
    this.satisfaction = gameState.foodCollected / gameState.foodRequired;
    
    // Animate mouth based on satisfaction
    this.mouthOpen = this.satisfaction * 0.5 + Math.sin(this.wobble * 2) * 0.1;
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    const pulse = Math.sin(gameState.worldPulse) * 0.08 + 1;
    p.scale(pulse, pulse);
    
    // Large blob body
    p.fill(...COLORS.pinkLight);
    p.noStroke();
    p.beginShape();
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const wobbleOffset = Math.sin(this.wobble + i * 0.5) * 4;
      const r = this.radius + wobbleOffset;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r * 1.2;
      p.vertex(x, y);
    }
    p.endShape(p.CLOSE);
    
    // Two eyes
    p.fill(255);
    p.circle(-10, -8, 12);
    p.circle(10, -8, 12);
    p.fill(...COLORS.creatureEye);
    p.circle(-10, -8, 7);
    p.circle(10, -8, 7);
    
    // Happy/hungry mouth
    p.fill(...COLORS.pinkDeep);
    p.ellipse(0, 5, 16 + this.mouthOpen * 10, 8 + this.mouthOpen * 15);
    
    // Show satisfaction level with color
    const satColor = p.lerpColor(
      p.color(...COLORS.pinkDark),
      p.color(100, 255, 100),
      this.satisfaction
    );
    p.fill(satColor);
    p.noStroke();
    p.circle(0, -20, 10);
    
    p.pop();
  }
}

// Wandering creature - ambient life in the world
export class Creature {
  constructor(x, y, type = 0) {
    this.x = x;
    this.y = y;
    this.type = type % 3; // 3 creature types
    this.radius = 12 + type * 3;
    this.width = this.radius * 2;
    this.height = this.radius * 2;
    
    // Movement
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = 0;
    this.speed = 1 + Math.random() * 0.5;
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.wanderSpeed = 0.05;
    
    // Animation
    this.wobble = Math.random() * Math.PI * 2;
    this.wobbleSpeed = 0.08 + Math.random() * 0.04;
    this.breathe = 0;
    
    // Behavior
    this.changeDirectionTimer = 60 + Math.random() * 120;
    
    gameState.creatures.push(this);
    gameState.entities.push(this);
  }
  
  update(p) {
    // Wander behavior
    this.wanderAngle += (Math.random() - 0.5) * this.wanderSpeed;
    this.vx += Math.cos(this.wanderAngle) * 0.1;
    this.vy += Math.sin(this.wanderAngle) * 0.1;
    
    // Apply velocity with damping
    this.vx *= 0.95;
    this.vy *= 0.95;
    
    this.x += this.vx;
    this.y += this.vy;
    
    // Bounce off walls
    if (this.x < this.radius || this.x > CANVAS_WIDTH - this.radius) {
      this.vx *= -1;
      this.x = Math.max(this.radius, Math.min(CANVAS_WIDTH - this.radius, this.x));
    }
    
    // Stay above ground
    const groundY = CANVAS_HEIGHT - 50;
    if (this.y > groundY - this.radius) {
      this.y = groundY - this.radius;
      this.vy *= -0.5;
    }
    
    // Stay below ceiling
    if (this.y < this.radius + 20) {
      this.y = this.radius + 20;
      this.vy *= -0.5;
    }
    
    // Animation
    this.wobble += this.wobbleSpeed;
    this.breathe = Math.sin(this.wobble) * 0.1 + 1;
    
    // Change direction periodically
    this.changeDirectionTimer--;
    if (this.changeDirectionTimer <= 0) {
      this.wanderAngle = Math.random() * Math.PI * 2;
      this.changeDirectionTimer = 60 + Math.random() * 120;
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    const pulse = Math.sin(gameState.worldPulse + this.wobble) * 0.06 + 1;
    p.scale(pulse * this.breathe, pulse / this.breathe);
    
    // Different creature types
    if (this.type === 0) {
      // Blob creature
      p.fill(...COLORS.creatureSkin);
      p.noStroke();
      p.beginShape();
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const wobbleOffset = Math.sin(this.wobble + i) * 3;
        const r = this.radius + wobbleOffset;
        p.vertex(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      p.endShape(p.CLOSE);
      
      // Single eye
      p.fill(255);
      p.circle(0, -3, 8);
      p.fill(0);
      p.circle(0, -3, 4);
      
    } else if (this.type === 1) {
      // Tentacle creature
      p.noFill();
      p.stroke(...COLORS.creatureSkin);
      p.strokeWeight(this.radius / 2);
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + this.wobble;
        const length = this.radius * 1.5;
        const endX = Math.cos(angle) * length;
        const endY = Math.sin(angle) * length;
        p.line(0, 0, endX, endY);
      }
      
      // Center body
      p.fill(...COLORS.pinkDark);
      p.noStroke();
      p.circle(0, 0, this.radius);
      
    } else {
      // Floating membrane creature
      p.fill(...COLORS.pinkLight, 200);
      p.noStroke();
      p.beginShape();
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const wobbleOffset = Math.sin(this.wobble * 2 + i * 0.5) * 5;
        const r = this.radius + wobbleOffset;
        p.vertex(Math.cos(angle) * r * 1.3, Math.sin(angle) * r * 0.8);
      }
      p.endShape(p.CLOSE);
      
      // Multiple small eyes
      p.fill(...COLORS.creatureEye);
      p.circle(-5, -2, 4);
      p.circle(5, -2, 4);
      p.circle(0, 3, 3);
    }
    
    p.pop();
  }
}

// Food orb - collectible item
export class FoodOrb {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.initialY = y;
    this.radius = 10;
    
    this.collected = false;
    this.bobOffset = 0;
    this.bobSpeed = 0.08;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = 0.05;
    this.glowPulse = 0;
    
    gameState.foodOrbs.push(this);
    gameState.entities.push(this);
  }
  
  update(p) {
    if (this.collected) return;
    
    // Bob up and down
    this.bobOffset = Math.sin(p.frameCount * this.bobSpeed + this.rotation) * 5;
    this.y = this.initialY + this.bobOffset;
    
    // Rotate
    this.rotation += this.rotationSpeed;
    
    // Pulse glow
    this.glowPulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  }
  
  collect() {
    if (this.collected) return;
    
    this.collected = true;
    gameState.foodCollected++;
    gameState.score += 10;
    
    // Create particles
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const speed = 2 + Math.random() * 2;
      gameState.particles.push(new Particle(
        this.x,
        this.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        COLORS.foodGlow
      ));
    }
    
    // Check win condition
    if (gameState.foodCollected >= gameState.foodRequired) {
      gameState.gamePhase = "GAME_OVER_WIN";
    }
  }
  
  render(p) {
    if (this.collected) return;
    
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotation);
    
    // Outer glow
    const glowSize = this.radius * 2.5 * this.glowPulse;
    p.fill(...COLORS.foodGlow, 50);
    p.noStroke();
    p.circle(0, 0, glowSize);
    
    // Main orb
    p.fill(...COLORS.foodGlow, 200);
    p.circle(0, 0, this.radius * 2);
    
    // Inner shine
    p.fill(255, 255, 255, 150);
    p.circle(-3, -3, this.radius);
    
    // Star points
    p.fill(...COLORS.foodGlow);
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const x = Math.cos(angle) * this.radius * 0.7;
      const y = Math.sin(angle) * this.radius * 0.7;
      p.circle(x, y, 4);
    }
    
    p.pop();
  }
}

// Platform - organic floating platforms
export class Platform {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.initialY = y;
    this.width = width;
    this.height = height;
    
    this.wobble = Math.random() * Math.PI * 2;
    this.wobbleSpeed = 0.05;
    this.floatAmount = 3;
    
    gameState.platforms.push(this);
  }
  
  update(p) {
    this.wobble += this.wobbleSpeed;
    this.y = this.initialY + Math.sin(this.wobble) * this.floatAmount;
  }
  
  render(p) {
    p.push();
    
    const pulse = Math.sin(gameState.worldPulse + this.wobble) * 0.04 + 1;
    
    // Draw organic platform shape
    p.fill(...COLORS.organic);
    p.noStroke();
    p.beginShape();
    
    const segments = 8;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = this.x + t * this.width;
      const wobbleOffset = Math.sin(this.wobble + t * Math.PI * 2) * 3;
      const y = this.y + wobbleOffset;
      
      if (i === 0) {
        p.vertex(x, y);
        p.vertex(x, y + this.height);
      } else if (i === segments) {
        p.vertex(x, y);
        p.vertex(x, y + this.height);
      } else {
        p.vertex(x, y * pulse);
      }
    }
    
    p.endShape(p.CLOSE);
    
    // Add texture
    p.fill(...COLORS.pinkDark, 50);
    for (let i = 0; i < 5; i++) {
      const px = this.x + (i / 5) * this.width + Math.sin(this.wobble + i) * 5;
      const py = this.y + Math.cos(this.wobble + i) * 3;
      p.circle(px, py, 4);
    }
    
    p.pop();
  }
}

// Particle for effects
export class Particle {
  constructor(x, y, vx, vy, color) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color || COLORS.pinkMedium;
    
    this.lifetime = 30 + Math.random() * 30;
    this.age = 0;
    this.size = 3 + Math.random() * 5;
    this.alpha = 1;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.3;
    
    gameState.particles.push(this);
  }
  
  update(p) {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.95;
    this.vy *= 0.95;
    this.vy += 0.1; // Slight gravity
    
    this.rotation += this.rotationSpeed;
    this.age++;
    this.alpha = 1 - (this.age / this.lifetime);
  }
  
  isDead() {
    return this.age >= this.lifetime;
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotation);
    
    p.fill(...this.color, this.alpha * 255);
    p.noStroke();
    p.circle(0, 0, this.size);
    
    p.pop();
  }
}