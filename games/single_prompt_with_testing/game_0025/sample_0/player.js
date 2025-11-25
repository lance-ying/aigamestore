// player.js - Player entity class

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, ROD_UPGRADES } from './globals.js';

export class Player {
  constructor(x, y) {
    this.type = 'player';
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 30;
    this.velocityX = 0;
    this.velocityY = 0;
    this.speed = 2;
    this.sprintSpeed = 3.5;
    this.facing = 1; // 1 for right, -1 for left
    this.bobOffset = 0;
  }

  update(p) {
    // Update position
    this.x += this.velocityX;
    this.y += this.velocityY;

    // Constrain to canvas
    this.x = p.constrain(this.x, this.width / 2, CANVAS_WIDTH - this.width / 2);
    this.y = p.constrain(this.y, this.height / 2, CANVAS_HEIGHT - this.height / 2);

    // Bob animation
    this.bobOffset = p.sin(p.frameCount * 0.1) * 2;

    // Apply friction
    this.velocityX *= 0.85;
    this.velocityY *= 0.85;

    // Stop if very slow
    if (Math.abs(this.velocityX) < 0.1) this.velocityX = 0;
    if (Math.abs(this.velocityY) < 0.1) this.velocityY = 0;
  }

  move(direction, isSprinting) {
    const speed = isSprinting ? this.sprintSpeed : this.speed;
    
    switch(direction) {
      case 'LEFT':
        this.velocityX = -speed;
        this.facing = -1;
        break;
      case 'RIGHT':
        this.velocityX = speed;
        this.facing = 1;
        break;
      case 'UP':
        this.velocityY = -speed;
        break;
      case 'DOWN':
        this.velocityY = speed;
        break;
    }
  }

  draw(p) {
    p.push();
    p.translate(this.x, this.y + this.bobOffset);
    p.scale(this.facing, 1);

    // Body
    p.fill(80, 120, 180);
    p.stroke(60, 100, 160);
    p.strokeWeight(2);
    p.ellipse(0, 5, this.width, this.height);

    // Head
    p.fill(100, 140, 200);
    p.ellipse(0, -5, this.width * 0.8, this.width * 0.8);

    // Eye
    p.fill(255);
    p.noStroke();
    p.ellipse(4, -6, 6, 6);
    p.fill(0);
    p.ellipse(5, -6, 3, 3);

    // Rod
    if (!gameState.fishingLine || gameState.fishingLine.state === 'idle') {
      p.stroke(120, 80, 40);
      p.strokeWeight(2);
      const rodLength = 25;
      p.line(0, 0, rodLength * this.facing, -rodLength);
    }

    p.pop();
  }

  canFish() {
    // Check if player is near water
    for (let water of gameState.waterAreas) {
      const distance = Math.sqrt(
        Math.pow(this.x - water.x - water.width / 2, 2) +
        Math.pow(this.y - water.y - water.height / 2, 2)
      );
      const currentRod = ROD_UPGRADES[gameState.rodLevel];
      if (distance < currentRod.castRange) {
        return true;
      }
    }
    return false;
  }
}