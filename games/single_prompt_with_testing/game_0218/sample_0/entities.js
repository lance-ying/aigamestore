// entities.js - Character and entity classes

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

// Base Entity class
export class Entity {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
  }
  
  applyGravity() {
    this.vy += gameState.gravity;
  }
  
  applyFriction() {
    this.vx *= gameState.friction;
  }
  
  updatePosition() {
    this.x += this.vx;
    this.y += this.vy;
  }
  
  getBounds() {
    return {
      left: this.x - this.width / 2,
      right: this.x + this.width / 2,
      top: this.y - this.height / 2,
      bottom: this.y + this.height / 2
    };
  }
}

// Character class (Brother and Sister)
export class Character extends Entity {
  constructor(x, y, type) {
    super(x, y, 24, 36);
    this.type = type; // 'brother' or 'sister'
    this.speed = 3;
    this.jumpPower = -10;
    this.direction = 1; // 1 = right, -1 = left
    this.isActive = type === 'brother';
    this.lastPosition = { x: x, y: y };
    
    // Animation
    this.walkCycle = 0;
    this.walkSpeed = 0.2;
    this.idleBob = 0;
    this.bobSpeed = 0.05;
    
    // Colors based on type
    if (type === 'brother') {
      this.mainColor = COLORS.brotherMain;
      this.darkColor = COLORS.brotherDark;
    } else {
      this.mainColor = COLORS.sisterMain;
      this.darkColor = COLORS.sisterDark;
    }
  }
  
  update(p) {
    // Apply physics
    this.applyGravity();
    this.applyFriction();
    this.updatePosition();
    
    // Check ground collision
    this.checkGroundCollision();
    
    // Check platform collisions
    this.checkPlatformCollisions();
    
    // Check boundaries
    this.checkBoundaries();
    
    // Update animation
    if (Math.abs(this.vx) > 0.5) {
      this.walkCycle += this.walkSpeed * Math.abs(this.vx);
    }
    this.idleBob += this.bobSpeed;
    
    // Log position if changed significantly
    if (this.isActive && 
        (Math.abs(this.x - this.lastPosition.x) > 5 || 
         Math.abs(this.y - this.lastPosition.y) > 5)) {
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
    } else {
      this.onGround = false;
    }
  }
  
  checkPlatformCollisions() {
    for (const platform of gameState.platforms) {
      if (this.collidesWithPlatform(platform)) {
        this.resolveCollision(platform);
      }
    }
  }
  
  collidesWithPlatform(platform) {
    const bounds = this.getBounds();
    return (
      bounds.right > platform.x &&
      bounds.left < platform.x + platform.width &&
      bounds.bottom > platform.y &&
      bounds.top < platform.y + platform.height
    );
  }
  
  resolveCollision(platform) {
    const bounds = this.getBounds();
    const prevY = this.y - this.vy;
    
    // Vertical collision (landing on top or hitting bottom)
    if (prevY + this.height / 2 <= platform.y) {
      this.y = platform.y - this.height / 2;
      this.vy = 0;
      this.onGround = true;
    } else if (prevY - this.height / 2 >= platform.y + platform.height) {
      this.y = platform.y + platform.height + this.height / 2;
      this.vy = 0;
    }
    
    // Horizontal collision
    const prevX = this.x - this.vx;
    if (prevX + this.width / 2 <= platform.x) {
      this.x = platform.x - this.width / 2;
      this.vx = 0;
    } else if (prevX - this.width / 2 >= platform.x + platform.width) {
      this.x = platform.x + platform.width + this.width / 2;
      this.vx = 0;
    }
  }
  
  checkBoundaries() {
    // Left boundary
    if (this.x - this.width / 2 < 0) {
      this.x = this.width / 2;
      this.vx = 0;
    }
    // Right boundary
    if (this.x + this.width / 2 > gameState.worldWidth) {
      this.x = gameState.worldWidth - this.width / 2;
      this.vx = 0;
    }
  }
  
  moveLeft() {
    this.vx = -this.speed;
    this.direction = -1;
  }
  
  moveRight() {
    this.vx = this.speed;
    this.direction = 1;
  }
  
  jump() {
    if (this.onGround) {
      this.vy = this.jumpPower;
      this.onGround = false;
    }
  }
  
  logPosition(p) {
    if (p.logs && p.logs.player_info) {
      p.logs.player_info.push({
        screen_x: this.x - gameState.cameraX,
        screen_y: this.y,
        game_x: this.x,
        game_y: this.y,
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  render(p) {
    const screenX = this.x - gameState.cameraX;
    
    p.push();
    p.translate(screenX, this.y);
    
    // Flip sprite based on direction
    if (this.direction < 0) {
      p.scale(-1, 1);
    }
    
    // Bob animation when idle
    const bobOffset = Math.abs(this.vx) < 0.5 ? Math.sin(this.idleBob) * 2 : 0;
    p.translate(0, bobOffset);
    
    // Active indicator glow
    if (this.isActive) {
      p.fill(255, 255, 255, 100);
      p.noStroke();
      p.ellipse(0, 0, this.width + 10, this.height + 10);
    }
    
    // Body
    p.fill(this.mainColor[0], this.mainColor[1], this.mainColor[2]);
    p.stroke(this.darkColor[0], this.darkColor[1], this.darkColor[2]);
    p.strokeWeight(2);
    p.ellipse(0, 0, this.width, this.height);
    
    // Head
    p.fill(255, 220, 180);
    p.circle(0, -this.height / 3, this.width * 0.8);
    
    // Eyes
    p.fill(50, 30, 20);
    p.noStroke();
    const eyeX = 5;
    const eyeY = -this.height / 3;
    p.circle(-eyeX, eyeY, 4);
    p.circle(eyeX, eyeY, 4);
    
    // Smile
    p.noFill();
    p.stroke(50, 30, 20);
    p.strokeWeight(1.5);
    p.arc(0, eyeY + 5, 8, 6, 0, p.PI);
    
    // Walking animation - legs
    if (Math.abs(this.vx) > 0.5) {
      const legOffset = Math.sin(this.walkCycle) * 8;
      p.stroke(this.darkColor[0], this.darkColor[1], this.darkColor[2]);
      p.strokeWeight(3);
      p.line(-5, this.height / 2, -5 - legOffset, this.height / 2 + 8);
      p.line(5, this.height / 2, 5 + legOffset, this.height / 2 + 8);
    }
    
    p.pop();
  }
}

// Magical Artifact class
export class Artifact extends Entity {
  constructor(x, y, color) {
    super(x, y, 20, 20);
    this.color = color;
    this.rotation = 0;
    this.rotationSpeed = 0.05;
    this.bobOffset = 0;
    this.bobSpeed = 0.08;
    this.collected = false;
    this.glowIntensity = 0;
    this.glowDirection = 1;
    
    gameState.collectibles.push(this);
  }
  
  update(p) {
    if (this.collected) return;
    
    // Rotate and bob
    this.rotation += this.rotationSpeed;
    this.bobOffset = Math.sin(p.frameCount * this.bobSpeed) * 5;
    
    // Glow animation
    this.glowIntensity += 0.02 * this.glowDirection;
    if (this.glowIntensity >= 1 || this.glowIntensity <= 0) {
      this.glowDirection *= -1;
    }
    
    // Check collision with active character
    const char = gameState.player;
    if (char) {
      const dx = char.x - this.x;
      const dy = char.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 30) {
        this.collect(p);
      }
    }
  }
  
  collect(p) {
    this.collected = true;
    gameState.artifactsCollected++;
    gameState.score += 100;
    
    // Create collection particles
    for (let i = 0; i < 15; i++) {
      gameState.particles.push(new Particle(
        this.x,
        this.y,
        this.color,
        Math.random() * Math.PI * 2,
        Math.random() * 3 + 2
      ));
    }
    
    // Remove from collectibles
    const index = gameState.collectibles.indexOf(this);
    if (index > -1) {
      gameState.collectibles.splice(index, 1);
    }
    
    // Check win condition
    if (gameState.artifactsCollected >= gameState.totalArtifacts) {
      setTimeout(() => {
        gameState.gamePhase = "GAME_OVER_WIN";
      }, 500);
    }
  }
  
  render(p) {
    if (this.collected) return;
    
    const screenX = this.x - gameState.cameraX;
    
    p.push();
    p.translate(screenX, this.y + this.bobOffset);
    p.rotate(this.rotation);
    
    // Outer glow
    const glowSize = 40 + this.glowIntensity * 10;
    p.fill(this.color[0], this.color[1], this.color[2], 50);
    p.noStroke();
    p.circle(0, 0, glowSize);
    
    // Crystal shape
    p.fill(this.color[0], this.color[1], this.color[2]);
    p.stroke(this.color[0] * 0.7, this.color[1] * 0.7, this.color[2] * 0.7);
    p.strokeWeight(2);
    
    // Draw diamond shape
    p.beginShape();
    p.vertex(0, -this.height / 2);
    p.vertex(this.width / 2, 0);
    p.vertex(0, this.height / 2);
    p.vertex(-this.width / 2, 0);
    p.endShape(p.CLOSE);
    
    // Inner sparkle
    p.fill(255, 255, 255, 200);
    p.noStroke();
    p.circle(-3, -3, 4);
    
    p.pop();
  }
}

// Magical Creature class
export class Creature {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // 'owl', 'fox', 'butterfly'
    this.width = 30;
    this.height = 30;
    this.interacted = false;
    this.animation = 0;
    this.animSpeed = 0.05;
    this.hintText = this.getHint();
    this.showingHint = false;
    this.hintTimer = 0;
    
    gameState.creatures.push(this);
  }
  
  getHint() {
    const hints = [
      "Switch characters with SPACE!",
      "Both must work together!",
      "Look for glowing crystals!",
      "Press SHIFT to interact!",
      "Explore every corner!"
    ];
    return hints[Math.floor(Math.random() * hints.length)];
  }
  
  update(p) {
    this.animation += this.animSpeed;
    
    // Check if player is nearby
    const char = gameState.player;
    if (char) {
      const dx = char.x - this.x;
      const dy = char.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 50) {
        this.showingHint = true;
        this.hintTimer = 120; // Show for 2 seconds
      }
    }
    
    if (this.hintTimer > 0) {
      this.hintTimer--;
      if (this.hintTimer <= 0) {
        this.showingHint = false;
      }
    }
  }
  
  render(p) {
    const screenX = this.x - gameState.cameraX;
    
    p.push();
    p.translate(screenX, this.y);
    
    const bob = Math.sin(this.animation) * 3;
    p.translate(0, bob);
    
    // Draw creature based on type
    if (this.type === 'owl') {
      this.renderOwl(p);
    } else if (this.type === 'fox') {
      this.renderFox(p);
    } else {
      this.renderButterfly(p);
    }
    
    // Show hint bubble
    if (this.showingHint) {
      p.fill(255, 255, 255, 230);
      p.stroke(100, 100, 100);
      p.strokeWeight(2);
      p.rect(-60, -50, 120, 30, 10);
      
      p.fill(50, 50, 50);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(10);
      p.text(this.hintText, 0, -35);
    }
    
    p.pop();
  }
  
  renderOwl(p) {
    // Body
    p.fill(160, 120, 80);
    p.stroke(100, 70, 40);
    p.strokeWeight(2);
    p.ellipse(0, 0, this.width, this.height);
    
    // Eyes
    p.fill(255, 255, 200);
    p.circle(-8, -5, 12);
    p.circle(8, -5, 12);
    p.fill(50, 30, 20);
    p.circle(-8, -5, 6);
    p.circle(8, -5, 6);
    
    // Beak
    p.fill(200, 150, 50);
    p.triangle(0, 0, -4, 5, 4, 5);
  }
  
  renderFox(p) {
    // Body
    p.fill(255, 140, 60);
    p.stroke(200, 100, 40);
    p.strokeWeight(2);
    p.ellipse(0, 0, this.width, this.height);
    
    // Ears
    p.fill(255, 140, 60);
    p.triangle(-10, -15, -15, -25, -5, -20);
    p.triangle(10, -15, 15, -25, 5, -20);
    
    // Face
    p.fill(255, 255, 255);
    p.ellipse(0, 2, 20, 15);
    
    // Eyes
    p.fill(50, 30, 20);
    p.circle(-5, -2, 4);
    p.circle(5, -2, 4);
    
    // Nose
    p.fill(50, 30, 20);
    p.circle(0, 5, 3);
  }
  
  renderButterfly(p) {
    const wingFlap = Math.sin(this.animation * 3) * 15;
    
    // Left wing
    p.fill(200, 100, 255, 200);
    p.stroke(150, 50, 200);
    p.strokeWeight(1);
    p.push();
    p.rotate(-wingFlap * 0.01);
    p.ellipse(-10, 0, 15, 25);
    p.pop();
    
    // Right wing
    p.push();
    p.rotate(wingFlap * 0.01);
    p.ellipse(10, 0, 15, 25);
    p.pop();
    
    // Body
    p.fill(100, 50, 150);
    p.noStroke();
    p.ellipse(0, 0, 5, 15);
    
    // Antennae
    p.stroke(100, 50, 150);
    p.strokeWeight(1);
    p.line(0, -7, -3, -12);
    p.line(0, -7, 3, -12);
  }
}

// Puzzle Element - Pressure Plate
export class PressurePlate {
  constructor(x, y, doorId) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 10;
    this.doorId = doorId;
    this.isPressed = false;
    
    gameState.puzzleElements.push(this);
  }
  
  update(p) {
    this.isPressed = false;
    
    // Check if any character is standing on it
    const brother = gameState.brother;
    const sister = gameState.sister;
    
    if (this.isCharacterOn(brother) || this.isCharacterOn(sister)) {
      this.isPressed = true;
      gameState.doorsOpen[this.doorId] = true;
    } else {
      gameState.doorsOpen[this.doorId] = false;
    }
  }
  
  isCharacterOn(char) {
    if (!char) return false;
    return (
      char.x > this.x &&
      char.x < this.x + this.width &&
      char.y + char.height / 2 >= this.y - 5 &&
      char.y + char.height / 2 <= this.y + 5
    );
  }
  
  render(p) {
    const screenX = this.x - gameState.cameraX;
    
    p.push();
    p.translate(screenX, this.y);
    
    // Base
    p.fill(80, 80, 100);
    p.stroke(60, 60, 80);
    p.strokeWeight(2);
    p.rect(0, 0, this.width, this.height);
    
    // Top plate
    const plateOffset = this.isPressed ? 3 : 0;
    p.fill(this.isPressed ? 100 : 120, this.isPressed ? 200 : 140, this.isPressed ? 100 : 160);
    p.rect(0, plateOffset, this.width, 4);
    
    p.pop();
  }
}

// Door that opens with pressure plates
export class Door {
  constructor(x, y, doorId) {
    this.x = x;
    this.y = y;
    this.width = 50;
    this.height = 80;
    this.doorId = doorId;
    this.openAmount = 0;
    this.targetOpen = 0;
    
    gameState.puzzleElements.push(this);
  }
  
  update(p) {
    // Check if door should be open
    this.targetOpen = gameState.doorsOpen[this.doorId] ? 1 : 0;
    
    // Smooth animation
    this.openAmount += (this.targetOpen - this.openAmount) * 0.1;
  }
  
  blocksMovement() {
    return this.openAmount < 0.5;
  }
  
  render(p) {
    const screenX = this.x - gameState.cameraX;
    
    p.push();
    p.translate(screenX, this.y);
    
    // Door frame
    p.fill(80, 60, 40);
    p.stroke(50, 40, 30);
    p.strokeWeight(3);
    p.rect(0, 0, this.width, this.height);
    
    // Door panels (slide up when opening)
    const slideAmount = this.openAmount * this.height;
    
    p.fill(120, 90, 60);
    p.stroke(80, 60, 40);
    p.strokeWeight(2);
    
    // Left panel
    p.rect(0, -slideAmount, this.width / 2 - 2, this.height);
    // Right panel
    p.rect(this.width / 2 + 2, slideAmount, this.width / 2 - 2, this.height);
    
    // Decorative elements
    if (this.openAmount < 0.5) {
      p.fill(200, 180, 100);
      p.noStroke();
      p.circle(this.width / 2, this.height / 2, 8);
    }
    
    p.pop();
  }
}

// Platform class
export class Platform {
  constructor(x, y, width, height, color = null) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color || [100, 150, 80];
    
    gameState.platforms.push(this);
  }
  
  render(p) {
    const screenX = this.x - gameState.cameraX;
    
    p.fill(this.color[0], this.color[1], this.color[2]);
    p.stroke(this.color[0] * 0.7, this.color[1] * 0.7, this.color[2] * 0.7);
    p.strokeWeight(2);
    p.rect(screenX, this.y, this.width, this.height, 5);
    
    // Add texture
    p.noStroke();
    p.fill(this.color[0] * 1.1, this.color[1] * 1.1, this.color[2] * 1.1, 100);
    for (let i = 0; i < this.width; i += 10) {
      p.rect(screenX + i, this.y + 2, 5, 3);
    }
  }
}

// Particle effect
export class Particle {
  constructor(x, y, color, angle, speed) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.size = Math.random() * 4 + 2;
    this.life = 1.0;
    this.decay = 0.02;
    
    gameState.particles.push(this);
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // Gravity
    this.life -= this.decay;
  }
  
  isDead() {
    return this.life <= 0;
  }
  
  render(p) {
    const screenX = this.x - gameState.cameraX;
    
    p.noStroke();
    p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
    p.circle(screenX, this.y, this.size);
  }
}