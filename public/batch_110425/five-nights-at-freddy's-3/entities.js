// entities.js - Game entities

import { CAMERA_LOCATIONS, SPRINGTRAP_IDLE, SPRINGTRAP_MOVING, SPRINGTRAP_AT_VENT, SPRINGTRAP_AT_OFFICE } from './globals.js';

export class Player {
  constructor() {
    this.x = 300;
    this.y = 350;
    this.alive = true;
  }
  
  update() {
    // Player is stationary in office
  }
  
  render(p) {
    // Draw player silhouette in office
    p.push();
    p.fill(60, 60, 80);
    p.noStroke();
    p.ellipse(this.x, this.y, 40, 60);
    p.fill(50, 50, 70);
    p.ellipse(this.x, this.y - 20, 35, 35); // Head
    p.pop();
  }
}

export class Springtrap {
  constructor() {
    this.currentLocation = 0; // Start at CAM 01
    this.state = SPRINGTRAP_IDLE;
    this.moveTimer = 0;
    this.moveDelay = 180; // Frames between moves
    this.targetLocation = 0;
    this.atVent = null; // 'left' or 'right' when at vent
    this.ventTimer = 0;
    this.difficulty = 1; // Increases each night
  }
  
  setDifficulty(night) {
    this.difficulty = night;
    // Faster movement on higher nights
    this.moveDelay = Math.max(60, 180 - (night * 20));
  }
  
  update(p, gameState) {
    this.moveTimer++;
    
    if (this.state === SPRINGTRAP_IDLE || this.state === SPRINGTRAP_MOVING) {
      // Random movement logic
      if (this.moveTimer >= this.moveDelay) {
        this.moveTimer = 0;
        
        // Decide if moving toward office or wandering
        const towardOffice = p.random() < (0.3 + this.difficulty * 0.1);
        
        if (towardOffice) {
          // Move closer to office (higher camera numbers)
          if (this.currentLocation < CAMERA_LOCATIONS.length - 1) {
            this.currentLocation++;
            this.state = SPRINGTRAP_MOVING;
          } else {
            // Try to enter vent
            this.attemptVentEntry(gameState);
          }
        } else {
          // Random movement
          const possibleMoves = [];
          if (this.currentLocation > 0) possibleMoves.push(this.currentLocation - 1);
          if (this.currentLocation < CAMERA_LOCATIONS.length - 1) possibleMoves.push(this.currentLocation + 1);
          
          if (possibleMoves.length > 0) {
            this.currentLocation = possibleMoves[Math.floor(p.random() * possibleMoves.length)];
            this.state = SPRINGTRAP_MOVING;
          }
        }
      }
    } else if (this.state === SPRINGTRAP_AT_VENT) {
      this.ventTimer++;
      
      // Check if vent is sealed
      const vent = this.atVent === 'left' ? gameState.vents.left : gameState.vents.right;
      
      if (vent.sealed) {
        // Blocked, retreat
        this.state = SPRINGTRAP_IDLE;
        this.atVent = null;
        this.ventTimer = 0;
        if (this.currentLocation > 0) {
          this.currentLocation--;
        }
      } else if (this.ventTimer >= 120) {
        // Successfully entered office
        this.state = SPRINGTRAP_AT_OFFICE;
      }
    }
  }
  
  attemptVentEntry(gameState) {
    // Choose a vent
    this.atVent = p.random() < 0.5 ? 'left' : 'right';
    this.state = SPRINGTRAP_AT_VENT;
    this.ventTimer = 0;
  }
  
  lureAway(targetCamera) {
    // Audio lure moves Springtrap to target camera
    if (this.state !== SPRINGTRAP_AT_OFFICE) {
      this.currentLocation = targetCamera;
      this.state = SPRINGTRAP_IDLE;
      this.atVent = null;
      this.ventTimer = 0;
      this.moveTimer = 0;
    }
  }
  
  render(p, cameraId) {
    // Only render if at this camera location
    if (this.currentLocation === cameraId && this.state !== SPRINGTRAP_AT_OFFICE) {
      p.push();
      p.fill(100, 120, 80);
      p.noStroke();
      
      // Draw creepy animatronic silhouette
      const x = p.random(100, 500);
      const y = p.random(150, 300);
      
      // Body
      p.rect(x - 20, y, 40, 60);
      // Head
      p.fill(80, 100, 70);
      p.ellipse(x, y - 20, 45, 50);
      // Eyes (glowing)
      p.fill(255, 255, 0);
      p.ellipse(x - 10, y - 25, 8, 12);
      p.ellipse(x + 10, y - 25, 8, 12);
      // Arms
      p.fill(100, 120, 80);
      p.rect(x - 35, y + 10, 15, 40);
      p.rect(x + 20, y + 10, 15, 40);
      
      p.pop();
    }
  }
  
  renderInOffice(p) {
    if (this.state === SPRINGTRAP_AT_OFFICE) {
      // Jumpscare effect
      p.push();
      p.fill(80, 100, 70, 200);
      
      const centerX = 300;
      const centerY = 200;
      
      // Large menacing figure
      p.rect(centerX - 60, centerY, 120, 150);
      p.fill(60, 80, 50);
      p.ellipse(centerX, centerY - 50, 100, 110);
      
      // Glowing eyes
      p.fill(255, 0, 0);
      p.ellipse(centerX - 25, centerY - 60, 20, 30);
      p.ellipse(centerX + 25, centerY - 60, 20, 30);
      
      p.pop();
    }
  }
}

export class Phantom {
  constructor(type) {
    this.type = type; // 'AUDIO', 'CAMERA', or 'VENTILATION'
    this.active = true;
    this.x = 300;
    this.y = 200;
    this.opacity = 0;
    this.fadeSpeed = 5;
  }
  
  update() {
    if (this.active) {
      this.opacity = Math.min(255, this.opacity + this.fadeSpeed);
    }
  }
  
  render(p) {
    if (this.active && this.opacity > 0) {
      p.push();
      p.fill(150, 150, 200, this.opacity);
      p.noStroke();
      
      // Ghost-like apparition
      p.ellipse(this.x, this.y, 80, 120);
      p.fill(200, 200, 255, this.opacity);
      p.ellipse(this.x, this.y - 40, 60, 60);
      
      // Spooky eyes
      p.fill(0, 0, 0, this.opacity);
      p.ellipse(this.x - 15, this.y - 45, 10, 15);
      p.ellipse(this.x + 15, this.y - 45, 10, 15);
      
      p.pop();
    }
  }
  
  dismiss() {
    this.active = false;
  }
}