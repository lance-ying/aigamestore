// entities.js - Entity classes

import { 
  gameState, 
  PLAYER_SPEED, 
  PLAYER_TURN_SPEED, 
  PLAYER_RADIUS,
  TATTLETAIL_NEED_DECAY,
  MAMA_SPEED,
  MAMA_CATCH_DISTANCE,
  MOVEMENT_NOISE
} from './globals.js';
import { 
  distance, 
  angleBetween, 
  checkWallCollision, 
  normalizeAngle,
  angleDifference,
  clamp
} from './utils.js';

// Player class - first person controller
export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.angle = 0; // Direction player is facing
    this.radius = PLAYER_RADIUS;
    this.alive = true;
    
    // Movement
    this.vx = 0;
    this.vy = 0;
    
    gameState.player = this;
    gameState.entities.push(this);
  }
  
  update(p) {
    if (!this.alive) return;
    
    // Store old position for collision resolution
    const oldX = this.x;
    const oldY = this.y;
    
    // Calculate movement based on facing direction
    const moveX = Math.cos(this.angle) * this.vx;
    const moveY = Math.sin(this.angle) * this.vy;
    
    // Try to move
    const newX = this.x + moveX;
    const newY = this.y + moveY;
    
    // Check collision before moving
    if (!checkWallCollision(newX, this.y, this.radius)) {
      this.x = newX;
    }
    
    if (!checkWallCollision(this.x, newY, this.radius)) {
      this.y = newY;
    }
    
    // Add noise if moving
    if (Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1) {
      gameState.noiseLevel += MOVEMENT_NOISE;
    }
    
    // Decay velocity
    this.vx *= 0.8;
    this.vy *= 0.8;
    
    // Log position periodically
    if (gameState.frameCount % 30 === 0) {
      this.logPosition(p);
    }
  }
  
  moveForward() {
    this.vx = PLAYER_SPEED;
  }
  
  moveBackward() {
    this.vx = -PLAYER_SPEED * 0.5;
  }
  
  turnLeft() {
    this.angle -= PLAYER_TURN_SPEED;
    this.angle = normalizeAngle(this.angle);
  }
  
  turnRight() {
    this.angle += PLAYER_TURN_SPEED;
    this.angle = normalizeAngle(this.angle);
  }
  
  die() {
    this.alive = false;
    gameState.gamePhase = "GAME_OVER_LOSE";
  }
  
  logPosition(p) {
    if (p.logs && p.logs.player_info) {
      p.logs.player_info.push({
        screen_x: this.x,
        screen_y: this.y,
        game_x: this.x,
        game_y: this.y,
        angle: this.angle,
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  render(p) {
    // Player is rendered from first-person view
    // We draw the environment relative to player position
  }
}

// Tattletail - the annoying toy
export class Tattletail {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 20;
    this.color = [255, 100, 200];
    
    // Needs
    this.hunger = 100;
    this.cleanliness = 100;
    this.battery = 100;
    
    // State
    this.currentNeed = "none";
    this.noiseTimer = 0;
    this.animationOffset = 0;
    
    gameState.tattletail = this;
    gameState.entities.push(this);
  }
  
  update(p) {
    // Decay needs
    this.hunger -= TATTLETAIL_NEED_DECAY * 0.3;
    this.cleanliness -= TATTLETAIL_NEED_DECAY * 0.2;
    this.battery -= TATTLETAIL_NEED_DECAY * 0.25;
    
    // Clamp needs
    this.hunger = clamp(this.hunger, 0, 100);
    this.cleanliness = clamp(this.cleanliness, 0, 100);
    this.battery = clamp(this.battery, 0, 100);
    
    // Update game state
    gameState.tattletailHunger = this.hunger;
    gameState.tattletailCleanliness = this.cleanliness;
    gameState.tattletailBattery = this.battery;
    
    // Determine current need
    if (this.hunger < 30) {
      this.currentNeed = "food";
    } else if (this.cleanliness < 30) {
      this.currentNeed = "brush";
    } else if (this.battery < 30) {
      this.currentNeed = "charge";
    } else {
      this.currentNeed = "none";
    }
    
    gameState.tattletailNeedType = this.currentNeed;
    
    // Generate noise if needs are low
    if (this.currentNeed !== "none") {
      this.noiseTimer++;
      if (this.noiseTimer > 120) { // Every 2 seconds
        gameState.noiseLevel += 2.0;
        this.noiseTimer = 0;
      }
    }
    
    // Animation
    this.animationOffset = Math.sin(gameState.frameCount * 0.1) * 3;
  }
  
  feed() {
    this.hunger = 100;
    gameState.score += 10;
  }
  
  brush() {
    this.cleanliness = 100;
    gameState.score += 10;
  }
  
  charge() {
    this.battery = 100;
    gameState.score += 10;
  }
  
  render(p) {
    // Rendered in 3D view
  }
}

// Mama Tattletail - the hunter
export class Mama {
  constructor() {
    // Spawn off-screen
    this.x = -100;
    this.y = -100;
    this.radius = 25;
    this.speed = MAMA_SPEED;
    this.active = false;
    this.spawnDelay = 60; // Frames before she starts hunting
    
    // Wandering behavior
    this.targetX = this.x;
    this.targetY = this.y;
    this.wanderTimer = 0;
    
    gameState.mama = this;
    gameState.entities.push(this);
  }
  
  spawn(x, y) {
    this.x = x;
    this.y = y;
    this.active = true;
    gameState.mamaSpawned = true;
    gameState.mamaActive = true;
    this.spawnDelay = 60;
  }
  
  update(p) {
    if (!this.active) return;
    
    // Spawn delay
    if (this.spawnDelay > 0) {
      this.spawnDelay--;
      return;
    }
    
    if (!gameState.player) return;
    
    // Hunt player if noise is high
    if (gameState.noiseLevel > 40) {
      const angle = angleBetween(this.x, this.y, gameState.player.x, gameState.player.y);
      this.x += Math.cos(angle) * this.speed;
      this.y += Math.sin(angle) * this.speed;
    } else {
      // Wander randomly
      this.wanderTimer--;
      if (this.wanderTimer <= 0) {
        this.targetX = this.x + (Math.random() - 0.5) * 200;
        this.targetY = this.y + (Math.random() - 0.5) * 200;
        this.wanderTimer = 120;
      }
      
      const angle = angleBetween(this.x, this.y, this.targetX, this.targetY);
      this.x += Math.cos(angle) * this.speed * 0.5;
      this.y += Math.sin(angle) * this.speed * 0.5;
    }
    
    // Avoid walls
    if (checkWallCollision(this.x, this.y, this.radius)) {
      this.x -= Math.cos(angleBetween(this.x, this.y, gameState.player.x, gameState.player.y)) * 5;
      this.y -= Math.sin(angleBetween(this.x, this.y, gameState.player.x, gameState.player.y)) * 5;
    }
    
    // Check if caught player
    const dist = distance(this.x, this.y, gameState.player.x, gameState.player.y);
    if (dist < MAMA_CATCH_DISTANCE) {
      gameState.player.die();
    }
  }
  
  render(p) {
    // Rendered in 3D view
  }
}