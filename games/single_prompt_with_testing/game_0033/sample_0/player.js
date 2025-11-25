// player.js - Player entity

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 30;
    this.speed = 2.5;
    this.sprintMultiplier = 1.8;
    this.vx = 0;
    this.vy = 0;
    this.direction = 0; // 0: down, 1: right, 2: up, 3: left
    this.animFrame = 0;
    this.animTimer = 0;
    this.isMoving = false;
  }

  update(keys, p) {
    this.isMoving = false;
    this.vx = 0;
    this.vy = 0;

    const isSprinting = keys[16]; // Shift
    const currentSpeed = this.speed * (isSprinting ? this.sprintMultiplier : 1);

    // Movement
    if (keys[37]) { // Left
      this.vx = -currentSpeed;
      this.direction = 3;
      this.isMoving = true;
    }
    if (keys[39]) { // Right
      this.vx = currentSpeed;
      this.direction = 1;
      this.isMoving = true;
    }
    if (keys[38]) { // Up
      this.vy = -currentSpeed;
      this.direction = 2;
      this.isMoving = true;
    }
    if (keys[40]) { // Down
      this.vy = currentSpeed;
      this.direction = 0;
      this.isMoving = true;
    }

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Floor boundaries
    const currentFloor = gameState.floors[gameState.currentFloor];
    if (currentFloor) {
      this.x = p.constrain(this.x, 20, CANVAS_WIDTH - 20);
      this.y = p.constrain(this.y, currentFloor.y + 20, currentFloor.y + currentFloor.height - 20);
    }

    // Animation
    if (this.isMoving) {
      this.animTimer++;
      if (this.animTimer > 8) {
        this.animFrame = (this.animFrame + 1) % 4;
        this.animTimer = 0;
      }
    } else {
      this.animFrame = 0;
      this.animTimer = 0;
    }

    // Check floor transitions
    this.checkFloorTransition();
  }

  checkFloorTransition() {
    const currentFloor = gameState.floors[gameState.currentFloor];
    if (!currentFloor) return;

    // Check if player moved to next floor
    if (this.y < currentFloor.y + 30 && gameState.currentFloor < gameState.floors.length - 1) {
      // Check if floor is unlocked
      if (this.canAccessFloor(gameState.currentFloor + 1)) {
        gameState.currentFloor++;
        this.y = gameState.floors[gameState.currentFloor].y + gameState.floors[gameState.currentFloor].height - 50;
      } else {
        this.y = currentFloor.y + 30;
        gameState.interactionPrompt = "Unlock this floor by completing translations below!";
      }
    }

    // Check if player moved to previous floor
    if (this.y > currentFloor.y + currentFloor.height - 30 && gameState.currentFloor > 0) {
      gameState.currentFloor--;
      this.y = gameState.floors[gameState.currentFloor].y + 40;
    }
  }

  canAccessFloor(floorIndex) {
    if (floorIndex === 0) return true;
    // Floor unlocked if previous floor's language is complete
    const prevLanguage = gameState.floors[floorIndex - 1].language;
    const glyphsInLanguage = prevLanguage.glyphs.length;
    const translatedInLanguage = gameState.translatedGlyphs.filter(g => 
      prevLanguage.glyphs.some(lg => lg.symbol === g.symbol)
    ).length;
    return translatedInLanguage === glyphsInLanguage;
  }

  draw(p) {
    p.push();
    
    // Draw shadow
    p.fill(0, 0, 0, 60);
    p.noStroke();
    p.ellipse(this.x, this.y + this.height / 2 + 3, this.width * 1.2, 8);

    // Draw body (traveler cloak)
    p.fill(80, 60, 120);
    p.stroke(60, 40, 100);
    p.strokeWeight(2);
    
    // Cloak body
    p.beginShape();
    p.vertex(this.x - this.width / 2, this.y - this.height / 2 + 8);
    p.vertex(this.x - this.width / 2 - 3, this.y + this.height / 2);
    p.vertex(this.x + this.width / 2 + 3, this.y + this.height / 2);
    p.vertex(this.x + this.width / 2, this.y - this.height / 2 + 8);
    p.endShape(p.CLOSE);

    // Head (hood)
    p.fill(100, 80, 140);
    p.ellipse(this.x, this.y - this.height / 2 + 5, this.width * 0.8, this.height * 0.4);

    // Face (shadowed)
    p.fill(220, 200, 180);
    p.noStroke();
    p.ellipse(this.x, this.y - this.height / 2 + 8, this.width * 0.5, this.height * 0.25);

    // Eyes
    p.fill(40, 30, 20);
    const eyeOffset = 3;
    p.ellipse(this.x - eyeOffset, this.y - this.height / 2 + 7, 3, 4);
    p.ellipse(this.x + eyeOffset, this.y - this.height / 2 + 7, 3, 4);

    // Walking animation - legs
    if (this.isMoving) {
      p.stroke(60, 40, 100);
      p.strokeWeight(3);
      const legOffset = p.sin(this.animFrame * p.PI / 2) * 5;
      p.line(this.x - 4, this.y + this.height / 2, this.x - 4, this.y + this.height / 2 + 6 + legOffset);
      p.line(this.x + 4, this.y + this.height / 2, this.x + 4, this.y + this.height / 2 + 6 - legOffset);
    }

    // Staff/notebook indicator
    p.stroke(139, 90, 43);
    p.strokeWeight(3);
    p.line(this.x + this.width / 2 + 2, this.y - 5, this.x + this.width / 2 + 2, this.y + this.height / 2 + 5);
    p.fill(180, 140, 100);
    p.noStroke();
    p.rect(this.x + this.width / 2, this.y - 8, 6, 8);

    p.pop();
  }

  getScreenPosition() {
    return { x: this.x, y: this.y - gameState.cameraOffsetY };
  }

  getGamePosition() {
    return { x: this.x, y: this.y };
  }
}