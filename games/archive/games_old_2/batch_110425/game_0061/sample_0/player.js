// player.js - Player entity
import { gameState, CANVAS_HEIGHT, MODE_PARKOUR, MODE_PUZZLE } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 24;
    this.height = 32;
    this.vx = 0;
    this.vy = 0;
    this.grounded = false;
    this.jumping = false;
    this.sliding = false;
    this.sprinting = false;
    this.health = 100;
    this.maxHealth = 100;
    
    // Animation
    this.animFrame = 0;
    this.animTimer = 0;
    
    // Physics
    this.gravity = 0.6;
    this.jumpPower = -12;
    this.moveSpeed = 3;
    this.sprintSpeed = 5;
    this.maxVy = 15;
    
    // Slide
    this.slideTimer = 0;
    this.slideDuration = 30;
  }
  
  update(p) {
    if (gameState.currentMode === MODE_PARKOUR) {
      this.updateParkour(p);
    }
    
    // Animation
    this.animTimer++;
    if (this.animTimer > 8) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }
  }
  
  updateParkour(p) {
    // Horizontal movement
    let targetSpeed = 0;
    const speed = this.sprinting ? this.sprintSpeed : this.moveSpeed;
    
    if (gameState.keys[37]) { // Left
      targetSpeed = -speed;
    }
    if (gameState.keys[39]) { // Right
      targetSpeed = speed;
    }
    
    this.vx = targetSpeed;
    
    // Sliding
    if (this.sliding) {
      this.slideTimer++;
      this.vx = this.sprinting ? 6 : 4;
      if (this.slideTimer >= this.slideDuration) {
        this.sliding = false;
        this.slideTimer = 0;
      }
    }
    
    // Apply gravity
    if (!this.grounded) {
      this.vy += this.gravity;
      this.vy = Math.min(this.vy, this.maxVy);
    }
    
    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;
    
    // Check platform collisions
    this.grounded = false;
    for (let platform of gameState.platforms) {
      if (this.checkPlatformCollision(platform)) {
        this.grounded = true;
        this.vy = 0;
        this.jumping = false;
        break;
      }
    }
    
    // Check obstacle collisions
    for (let obstacle of gameState.obstacles) {
      if (this.checkObstacleCollision(obstacle)) {
        this.handleObstacleHit(obstacle);
      }
    }
    
    // Check data fragment collection
    for (let i = gameState.dataFragments.length - 1; i >= 0; i--) {
      const fragment = gameState.dataFragments[i];
      if (!fragment.collected && this.checkFragmentCollision(fragment)) {
        fragment.collected = true;
        gameState.collectedFragments++;
        gameState.score += 100;
      }
    }
    
    // Boundary check
    if (this.y > CANVAS_HEIGHT + 50) {
      this.respawn();
    }
    
    // Keep player from going too far left
    if (this.x < gameState.cameraX + 20) {
      this.x = gameState.cameraX + 20;
    }
  }
  
  checkPlatformCollision(platform) {
    const playerBottom = this.y + (this.sliding ? this.height / 2 : this.height);
    const playerRight = this.x + this.width;
    const playerLeft = this.x;
    
    if (this.vy >= 0 &&
        playerRight > platform.x &&
        playerLeft < platform.x + platform.width &&
        playerBottom >= platform.y &&
        playerBottom <= platform.y + 15 &&
        this.y < platform.y) {
      this.y = platform.y - (this.sliding ? this.height / 2 : this.height);
      return true;
    }
    return false;
  }
  
  checkObstacleCollision(obstacle) {
    const playerHeight = this.sliding ? this.height / 2 : this.height;
    const playerRight = this.x + this.width;
    const playerLeft = this.x;
    const playerTop = this.y;
    const playerBottom = this.y + playerHeight;
    
    return playerRight > obstacle.x &&
           playerLeft < obstacle.x + obstacle.width &&
           playerBottom > obstacle.y &&
           playerTop < obstacle.y + obstacle.height;
  }
  
  checkFragmentCollision(fragment) {
    const dx = (this.x + this.width / 2) - (fragment.x + fragment.size / 2);
    const dy = (this.y + this.height / 2) - (fragment.y + fragment.size / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (this.width / 2 + fragment.size / 2);
  }
  
  handleObstacleHit(obstacle) {
    if (obstacle.type === 'spike' || obstacle.type === 'laser') {
      this.health -= 25;
      if (this.health <= 0) {
        this.respawn();
      }
    }
  }
  
  jump() {
    if (this.grounded && !this.sliding) {
      this.vy = this.jumpPower;
      this.grounded = false;
      this.jumping = true;
    }
  }
  
  startSlide() {
    if (this.grounded && !this.sliding) {
      this.sliding = true;
      this.slideTimer = 0;
    }
  }
  
  respawn() {
    this.x = gameState.checkpointX + 50;
    this.y = 200;
    this.vx = 0;
    this.vy = 0;
    this.health = this.maxHealth;
    this.sliding = false;
    this.slideTimer = 0;
  }
  
  render(p) {
    p.push();
    
    if (gameState.currentMode === MODE_PARKOUR) {
      const renderX = this.x - gameState.cameraX;
      const renderHeight = this.sliding ? this.height / 2 : this.height;
      
      // Body
      p.fill(0, 200, 255);
      p.stroke(0, 150, 200);
      p.strokeWeight(2);
      p.rect(renderX, this.y, this.width, renderHeight, 3);
      
      // Visor
      p.fill(100, 255, 255, 200);
      p.noStroke();
      p.rect(renderX + 4, this.y + 6, this.width - 8, 8, 2);
      
      // Accent lines
      p.stroke(0, 255, 255);
      p.strokeWeight(1);
      for (let i = 0; i < 3; i++) {
        const lineY = this.y + renderHeight / 2 + i * 4 - 4;
        p.line(renderX + 2, lineY, renderX + this.width - 2, lineY);
      }
    } else if (gameState.currentMode === MODE_PUZZLE) {
      // Simple representation in puzzle mode
      p.fill(0, 200, 255);
      p.noStroke();
      p.ellipse(this.x, this.y, 40, 40);
      p.fill(100, 255, 255);
      p.ellipse(this.x, this.y - 5, 20, 10);
    }
    
    p.pop();
  }
  
  getScreenX() {
    return this.x - gameState.cameraX;
  }
  
  getScreenY() {
    return this.y;
  }
  
  getGameX() {
    return this.x;
  }
  
  getGameY() {
    return this.y;
  }
}