// player.js - Player entity and controls

import { PHYSICS, PLAYER_STATES, gameState } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = 20;
    this.baseRadius = 20;
    this.state = PLAYER_STATES.NORMAL;
    this.inflationLevel = 0; // 0 = normal, 1 = fully inflated, -1 = fully deflated
    this.grounded = false;
    this.alive = true;
    this.facingRight = true;
  }

  update(p) {
    if (!this.alive) return;

    // Handle inflation/deflation
    if (p.keyIsDown(38)) { // UP arrow - inflate
      this.inflationLevel = Math.min(1, this.inflationLevel + PHYSICS.INFLATION_RATE);
    } else if (p.keyIsDown(40)) { // DOWN arrow - deflate
      this.inflationLevel = Math.max(-1, this.inflationLevel + PHYSICS.DEFLATION_RATE);
    } else {
      // Return to normal
      if (this.inflationLevel > 0) {
        this.inflationLevel = Math.max(0, this.inflationLevel - PHYSICS.INFLATION_RATE * 0.5);
      } else if (this.inflationLevel < 0) {
        this.inflationLevel = Math.min(0, this.inflationLevel + PHYSICS.DEFLATION_RATE * 0.5);
      }
    }

    // Update state based on inflation level
    if (this.inflationLevel > 0.3) {
      this.state = PLAYER_STATES.INFLATED;
    } else if (this.inflationLevel < -0.3) {
      this.state = PLAYER_STATES.DEFLATED;
    } else {
      this.state = PLAYER_STATES.NORMAL;
    }

    // Update radius based on inflation
    this.radius = this.baseRadius + this.inflationLevel * 10;

    // Apply gravity based on state
    let gravity = PHYSICS.GRAVITY;
    if (this.state === PLAYER_STATES.INFLATED) {
      gravity = PHYSICS.INFLATED_GRAVITY;
    } else if (this.state === PLAYER_STATES.DEFLATED) {
      gravity = PHYSICS.DEFLATED_GRAVITY;
    }

    this.vy += gravity;
    this.vy = Math.min(this.vy, PHYSICS.TERMINAL_VELOCITY);

    // Horizontal movement
    let moveSpeed = PHYSICS.MOVE_SPEED;
    if (this.state === PLAYER_STATES.INFLATED) {
      moveSpeed = PHYSICS.INFLATED_MOVE_SPEED;
    } else if (this.state === PLAYER_STATES.DEFLATED) {
      moveSpeed = PHYSICS.DEFLATED_MOVE_SPEED;
    }

    if (p.keyIsDown(37)) { // LEFT
      this.vx = -moveSpeed;
      this.facingRight = false;
    } else if (p.keyIsDown(39)) { // RIGHT
      this.vx = moveSpeed;
      this.facingRight = true;
    } else {
      this.vx *= this.grounded ? PHYSICS.FRICTION : PHYSICS.AIR_RESISTANCE;
      if (Math.abs(this.vx) < 0.1) this.vx = 0;
    }

    // Jump
    if (p.keyIsDown(32) && this.grounded) { // SPACE
      this.vy = PHYSICS.JUMP_FORCE;
      this.grounded = false;
    }

    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;
  }

  draw(p, cameraX, cameraY) {
    p.push();
    p.translate(-cameraX, -cameraY);

    // Draw shadow
    p.noStroke();
    p.fill(0, 0, 0, 50);
    p.ellipse(this.x, this.y + this.radius + 5, this.radius * 1.5, this.radius * 0.3);

    // Main body color based on state
    let bodyColor;
    if (this.state === PLAYER_STATES.INFLATED) {
      bodyColor = [100, 200, 255]; // Light blue
    } else if (this.state === PLAYER_STATES.DEFLATED) {
      bodyColor = [255, 150, 100]; // Orange
    } else {
      bodyColor = [255, 220, 100]; // Yellow
    }

    // Body gradient
    for (let i = 0; i < 10; i++) {
      let lerpAmt = i / 10;
      let r = p.lerp(bodyColor[0], bodyColor[0] * 0.7, lerpAmt);
      let g = p.lerp(bodyColor[1], bodyColor[1] * 0.7, lerpAmt);
      let b = p.lerp(bodyColor[2], bodyColor[2] * 0.7, lerpAmt);
      p.fill(r, g, b);
      p.noStroke();
      p.ellipse(this.x, this.y, this.radius * 2 * (1 - lerpAmt * 0.3));
    }

    // Fur texture
    p.stroke(bodyColor[0] * 0.8, bodyColor[1] * 0.8, bodyColor[2] * 0.8);
    p.strokeWeight(2);
    for (let i = 0; i < 8; i++) {
      let angle = (i / 8) * p.TWO_PI;
      let startR = this.radius * 0.7;
      let endR = this.radius * 1.1;
      let x1 = this.x + p.cos(angle) * startR;
      let y1 = this.y + p.sin(angle) * startR;
      let x2 = this.x + p.cos(angle) * endR;
      let y2 = this.y + p.sin(angle) * endR;
      p.line(x1, y1, x2, y2);
    }

    // Eyes
    let eyeOffset = this.facingRight ? 8 : -8;
    p.fill(0);
    p.noStroke();
    p.ellipse(this.x + eyeOffset, this.y - 5, 6, 8);
    p.fill(255);
    p.ellipse(this.x + eyeOffset + 1, this.y - 6, 3, 3);

    // Mouth
    p.noFill();
    p.stroke(0);
    p.strokeWeight(2);
    p.arc(this.x + (this.facingRight ? 5 : -5), this.y + 5, 8, 8, 0, p.PI);

    p.pop();
  }

  die() {
    this.alive = false;
    gameState.deaths++;
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.alive = true;
    this.grounded = false;
    this.inflationLevel = 0;
    this.state = PLAYER_STATES.NORMAL;
  }
}