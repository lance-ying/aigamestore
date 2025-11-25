// player.js - Player entity
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 40;
    this.speed = 3;
    this.vx = 0;
    this.vy = 0;
    this.onGround = true;
    this.gravity = 0.6;
    this.jumpPower = -12;
    this.maxFallSpeed = 10;
    this.eyeOpenTimer = 0;
    this.blinkState = 1; // 1 = open, 0 = closed
  }

  update() {
    // Apply gravity
    if (!this.onGround) {
      this.vy += this.gravity;
      if (this.vy > this.maxFallSpeed) {
        this.vy = this.maxFallSpeed;
      }
    }

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Ground collision
    const groundY = CANVAS_HEIGHT - 60;
    if (this.y + this.height >= groundY) {
      this.y = groundY - this.height;
      this.vy = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    // Keep player in bounds
    this.x = this.p.constrain(this.x, 0, CANVAS_WIDTH - this.width);

    // Update eye blink animation
    this.eyeOpenTimer++;
    if (this.eyeOpenTimer > 180) { // Natural blink every 3 seconds
      this.blinkState = 0;
      if (this.eyeOpenTimer > 186) {
        this.blinkState = 1;
        this.eyeOpenTimer = 0;
      }
    }

    // Reset horizontal velocity
    this.vx = 0;
  }

  moveLeft() {
    this.vx = -this.speed;
  }

  moveRight() {
    this.vx = this.speed;
  }

  jump() {
    if (this.onGround) {
      this.vy = this.jumpPower;
      this.onGround = false;
    }
  }

  blink() {
    this.blinkState = 0;
    setTimeout(() => {
      this.blinkState = 1;
    }, 100);
  }

  draw() {
    this.p.push();
    
    // Draw soul aura
    this.p.noStroke();
    this.p.fill(200, 220, 255, 30);
    this.p.ellipse(this.x + this.width/2, this.y + this.height/2, 60, 60);
    this.p.fill(180, 210, 255, 50);
    this.p.ellipse(this.x + this.width/2, this.y + this.height/2, 40, 40);

    // Body (ghostly/ethereal appearance)
    this.p.fill(220, 230, 255, 200);
    this.p.stroke(180, 200, 255);
    this.p.strokeWeight(1);
    this.p.rect(this.x + 4, this.y + 15, this.width - 8, this.height - 15, 5);

    // Head
    this.p.fill(230, 240, 255, 220);
    this.p.ellipse(this.x + this.width/2, this.y + 10, 18, 18);

    // Eyes
    if (this.blinkState === 1) {
      this.p.fill(100, 120, 160);
      this.p.ellipse(this.x + this.width/2 - 4, this.y + 9, 3, 3);
      this.p.ellipse(this.x + this.width/2 + 4, this.y + 9, 3, 3);
    } else {
      this.p.stroke(100, 120, 160);
      this.p.strokeWeight(1.5);
      this.p.line(this.x + this.width/2 - 5, this.y + 9, this.x + this.width/2 - 3, this.y + 9);
      this.p.line(this.x + this.width/2 + 3, this.y + 9, this.x + this.width/2 + 5, this.y + 9);
    }

    // Flowing energy trails
    const time = this.p.frameCount * 0.05;
    for (let i = 0; i < 3; i++) {
      const offset = i * 10;
      const alpha = 30 - i * 10;
      this.p.noStroke();
      this.p.fill(200, 220, 255, alpha);
      const trailY = this.y + this.height + this.p.sin(time + offset) * 3;
      this.p.ellipse(this.x + this.width/2, trailY, 8 - i * 2, 8 - i * 2);
    }

    this.p.pop();
  }

  getPosition() {
    return { x: this.x, y: this.y };
  }
}