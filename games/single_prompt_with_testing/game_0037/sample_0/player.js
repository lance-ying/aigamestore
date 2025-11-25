// player.js - Player entity and controls

import { gameState, PLAYER_SIZE, PLAYER_SPEED, PLAYER_SPRINT_SPEED, 
         PLAYER_MAX_STAMINA, PLAYER_STAMINA_DRAIN, PLAYER_STAMINA_REGEN,
         PLAYER_MAX_BATTERY, PLAYER_BATTERY_DRAIN, PLAYER_BATTERY_REGEN,
         FLASHLIGHT_RANGE, FLASHLIGHT_ANGLE } from './globals.js';
import { checkWallCollision } from './physics.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = PLAYER_SIZE;
    this.speed = PLAYER_SPEED;
    this.vx = 0;
    this.vy = 0;
    this.stamina = PLAYER_MAX_STAMINA;
    this.battery = PLAYER_MAX_BATTERY;
    this.facingAngle = 0;
    this.isSprinting = false;
    this.flashlightOn = false;
  }

  update(p) {
    // Handle movement based on control mode
    if (gameState.controlMode === "HUMAN") {
      this.handleHumanInput(p);
    } else {
      this.handleTestInput(p);
    }

    // Calculate facing angle from velocity
    if (this.vx !== 0 || this.vy !== 0) {
      this.facingAngle = Math.atan2(this.vy, this.vx);
    }

    // Apply movement with collision detection
    const newX = this.x + this.vx;
    const newY = this.y + this.vy;

    if (!checkWallCollision(newX, this.y, this.size)) {
      this.x = newX;
    }
    if (!checkWallCollision(this.x, newY, this.size)) {
      this.y = newY;
    }

    // Clamp to world bounds
    this.x = Math.max(this.size / 2, Math.min(gameState.worldWidth - this.size / 2, this.x));
    this.y = Math.max(this.size / 2, Math.min(gameState.worldHeight - this.size / 2, this.y));

    // Update stamina
    if (this.isSprinting && (this.vx !== 0 || this.vy !== 0)) {
      this.stamina = Math.max(0, this.stamina - PLAYER_STAMINA_DRAIN);
      if (this.stamina === 0) {
        this.isSprinting = false;
      }
    } else if (!this.isSprinting) {
      this.stamina = Math.min(PLAYER_MAX_STAMINA, this.stamina + PLAYER_STAMINA_REGEN);
    }

    // Update battery
    if (this.flashlightOn) {
      this.battery = Math.max(0, this.battery - PLAYER_BATTERY_DRAIN);
      if (this.battery === 0) {
        this.flashlightOn = false;
      }
    } else {
      this.battery = Math.min(PLAYER_MAX_BATTERY, this.battery + PLAYER_BATTERY_REGEN);
    }

    // Reset velocity
    this.vx = 0;
    this.vy = 0;
  }

  handleHumanInput(p) {
    let moving = false;
    
    // Arrow key movement
    if (p.keyIsDown(37)) { // LEFT
      this.vx = -1;
      moving = true;
    }
    if (p.keyIsDown(39)) { // RIGHT
      this.vx = 1;
      moving = true;
    }
    if (p.keyIsDown(38)) { // UP
      this.vy = -1;
      moving = true;
    }
    if (p.keyIsDown(40)) { // DOWN
      this.vy = 1;
      moving = true;
    }

    // Normalize diagonal movement
    if (this.vx !== 0 && this.vy !== 0) {
      const len = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      this.vx /= len;
      this.vy /= len;
    }

    // Apply sprint
    this.isSprinting = p.keyIsDown(16) && this.stamina > 0 && moving; // SHIFT
    const currentSpeed = this.isSprinting ? PLAYER_SPRINT_SPEED : PLAYER_SPEED;
    this.vx *= currentSpeed;
    this.vy *= currentSpeed;

    // Flashlight toggle handled in keyPressed
  }

  handleTestInput(p) {
    // Get action from automated testing
    const action = window.get_automated_testing_action?.(gameState);
    if (!action) return;

    let moving = false;

    if (action.left) {
      this.vx = -1;
      moving = true;
    }
    if (action.right) {
      this.vx = 1;
      moving = true;
    }
    if (action.up) {
      this.vy = -1;
      moving = true;
    }
    if (action.down) {
      this.vy = 1;
      moving = true;
    }

    // Normalize diagonal movement
    if (this.vx !== 0 && this.vy !== 0) {
      const len = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      this.vx /= len;
      this.vy /= len;
    }

    this.isSprinting = action.sprint && this.stamina > 0 && moving;
    const currentSpeed = this.isSprinting ? PLAYER_SPRINT_SPEED : PLAYER_SPEED;
    this.vx *= currentSpeed;
    this.vy *= currentSpeed;

    this.flashlightOn = action.flashlight && this.battery > 0;
  }

  render(p, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    p.push();
    p.translate(screenX, screenY);
    p.rotate(this.facingAngle);

    // Player body (detective coat)
    p.fill(40, 50, 80);
    p.stroke(20, 25, 40);
    p.strokeWeight(1);
    p.ellipse(0, 0, this.size, this.size);

    // Badge/face
    p.fill(220, 200, 180);
    p.noStroke();
    p.ellipse(this.size * 0.2, 0, this.size * 0.4, this.size * 0.4);

    p.pop();

    // Flashlight beam
    if (this.flashlightOn) {
      this.renderFlashlight(p, camera);
    }
  }

  renderFlashlight(p, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    p.push();
    p.translate(screenX, screenY);
    
    // Draw flashlight beam
    p.fill(255, 255, 200, 40);
    p.noStroke();
    
    const startAngle = this.facingAngle - FLASHLIGHT_ANGLE / 2;
    const endAngle = this.facingAngle + FLASHLIGHT_ANGLE / 2;
    
    p.beginShape();
    p.vertex(0, 0);
    for (let a = startAngle; a <= endAngle; a += 0.1) {
      p.vertex(Math.cos(a) * FLASHLIGHT_RANGE, Math.sin(a) * FLASHLIGHT_RANGE);
    }
    p.endShape(p.CLOSE);

    // Outer glow
    p.fill(255, 255, 150, 20);
    p.beginShape();
    p.vertex(0, 0);
    for (let a = startAngle; a <= endAngle; a += 0.1) {
      p.vertex(Math.cos(a) * (FLASHLIGHT_RANGE * 1.2), Math.sin(a) * (FLASHLIGHT_RANGE * 1.2));
    }
    p.endShape(p.CLOSE);

    p.pop();
  }

  getFlashlightInfo() {
    return {
      x: this.x,
      y: this.y,
      angle: this.facingAngle,
      range: FLASHLIGHT_RANGE,
      arcAngle: FLASHLIGHT_ANGLE,
      active: this.flashlightOn
    };
  }
}