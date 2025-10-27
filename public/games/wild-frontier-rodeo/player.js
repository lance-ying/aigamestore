// player.js - Player entity

import { gameState, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 30;
    this.velocityX = 0;
    this.velocityY = 0;
    this.gravity = 0.6;
    this.isAlive = true;
    this.landingCooldown = 0;
  }

  update() {
    if (gameState.isJumping) {
      // Apply gravity
      this.velocityY += this.gravity;
      this.y += this.velocityY;
      this.x += this.velocityX;

      // Decay horizontal velocity
      this.velocityX *= 0.98;

      // Check if fell off screen
      if (this.y > CANVAS_HEIGHT + 50) {
        this.isAlive = false;
      }
    } else if (gameState.currentAnimal) {
      // Riding an animal - follow its position
      this.x = gameState.currentAnimal.x;
      this.y = gameState.currentAnimal.y - gameState.currentAnimal.height / 2 - this.height / 2 - 5;
    }

    // Update landing cooldown
    if (this.landingCooldown > 0) {
      this.landingCooldown--;
    }
  }

  jump(animal) {
    if (!gameState.isJumping && animal) {
      gameState.isJumping = true;
      this.velocityY = -animal.jumpHeight;
      this.velocityX = animal.velocityX * 0.5; // Inherit some horizontal velocity
      gameState.lastLandedAnimal = animal;
    }
  }

  landOnAnimal(animal) {
    if (this.landingCooldown > 0) return false;
    
    gameState.isJumping = false;
    gameState.currentAnimal = animal;
    this.velocityY = 0;
    this.velocityX = 0;
    this.landingCooldown = 5; // Prevent immediate re-landing

    // Calculate landing bonus
    const centerX = animal.x;
    const landingError = Math.abs(this.x - centerX);
    const perfectThreshold = animal.width / 6;

    if (gameState.lastLandedAnimal !== animal) {
      if (landingError < perfectThreshold) {
        gameState.score += 75;
      } else {
        gameState.score += 50;
      }
      gameState.consecutiveJumps++;
    }

    // Reset riding timer
    gameState.ridingTimer = animal.ridingDuration;
    return true;
  }

  draw(p) {
    p.push();
    p.rectMode(p.CORNER);
    
    // Draw player (cowboy)
    if (gameState.isJumping) {
      // Jumping animation
      p.fill(210, 105, 30);
      p.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
      
      // Hat
      p.fill(101, 67, 33);
      p.rect(this.x - 12, this.y - this.height / 2 - 8, 24, 6);
      p.rect(this.x - 8, this.y - this.height / 2 - 14, 16, 6);
      
      // Arms extended
      p.stroke(210, 105, 30);
      p.strokeWeight(3);
      p.line(this.x - this.width / 2, this.y - 5, this.x - this.width / 2 - 10, this.y - 10);
      p.line(this.x + this.width / 2, this.y - 5, this.x + this.width / 2 + 10, this.y - 10);
      p.noStroke();
    } else {
      // Riding animation
      p.fill(210, 105, 30);
      p.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
      
      // Hat
      p.fill(101, 67, 33);
      p.rect(this.x - 12, this.y - this.height / 2 - 8, 24, 6);
      p.rect(this.x - 8, this.y - this.height / 2 - 14, 16, 6);
      
      // Arms on animal
      p.stroke(210, 105, 30);
      p.strokeWeight(3);
      p.line(this.x - this.width / 2, this.y, this.x - this.width / 2 - 5, this.y + 10);
      p.line(this.x + this.width / 2, this.y, this.x + this.width / 2 + 5, this.y + 10);
      p.noStroke();
    }
    
    p.pop();
  }
}