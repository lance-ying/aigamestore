// player.js - Player entity and controls
import { gameState, KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN, KEY_SHIFT, KEY_SPACE, KEY_Z } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.angle = 0;
    this.speed = 2;
    this.sprintSpeed = 3.5;
    this.turnSpeed = 0.08;
    this.radius = 12;
    this.heldTool = null;
    this.interactionRange = 40;
    this.health = 3;
    this.maxHealth = 3;
    this.invulnerableFrames = 0;
  }

  update(p) {
    if (this.invulnerableFrames > 0) {
      this.invulnerableFrames--;
    }

    const moveSpeed = p.keyIsDown(KEY_SHIFT) ? this.sprintSpeed : this.speed;

    if (p.keyIsDown(KEY_LEFT)) {
      this.angle -= this.turnSpeed;
    }
    if (p.keyIsDown(KEY_RIGHT)) {
      this.angle += this.turnSpeed;
    }

    let dx = 0;
    let dy = 0;

    if (p.keyIsDown(KEY_UP)) {
      dx = Math.cos(this.angle) * moveSpeed;
      dy = Math.sin(this.angle) * moveSpeed;
    }
    if (p.keyIsDown(KEY_DOWN)) {
      dx = -Math.cos(this.angle) * moveSpeed * 0.5;
      dy = -Math.sin(this.angle) * moveSpeed * 0.5;
    }

    // Check collisions before moving
    const newX = this.x + dx;
    const newY = this.y + dy;

    if (!this.checkWallCollision(newX, newY)) {
      this.x = newX;
      this.y = newY;
    }

    // Constrain to canvas
    this.x = Math.max(this.radius, Math.min(600 - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(400 - this.radius, this.y));

    gameState.cameraAngle = this.angle;
  }

  checkWallCollision(x, y) {
    // Check against puzzle walls
    for (let entity of gameState.entities) {
      if (entity.type === 'WALL') {
        const dist = Math.sqrt((x - entity.x) ** 2 + (y - entity.y) ** 2);
        if (dist < this.radius + entity.width / 2) {
          return true;
        }
      }
      if (entity.type === 'GATE' && !entity.open) {
        const dist = Math.sqrt((x - entity.x) ** 2 + (y - entity.y) ** 2);
        if (dist < this.radius + entity.width / 2) {
          return true;
        }
      }
    }
    return false;
  }

  interact(p) {
    // Check for nearby interactable objects
    for (let tool of gameState.tools) {
      if (!tool.placed && !tool.held) {
        const dist = Math.sqrt((this.x - tool.x) ** 2 + (this.y - tool.y) ** 2);
        if (dist < this.interactionRange) {
          if (!this.heldTool) {
            this.pickupTool(tool);
            return;
          }
        }
      }
    }

    // Place held tool
    if (this.heldTool) {
      this.placeTool(p);
      return;
    }

    // Interact with switches
    for (let entity of gameState.entities) {
      if (entity.type === 'SWITCH') {
        const dist = Math.sqrt((this.x - entity.x) ** 2 + (this.y - entity.y) ** 2);
        if (dist < this.interactionRange) {
          entity.toggle();
          return;
        }
      }
      if (entity.type === 'SIGIL' && !entity.collected) {
        const dist = Math.sqrt((this.x - entity.x) ** 2 + (this.y - entity.y) ** 2);
        if (dist < this.interactionRange) {
          entity.collect();
          return;
        }
      }
    }
  }

  pickupTool(tool) {
    tool.held = true;
    tool.placed = false;
    this.heldTool = tool;
    gameState.messages.push({ text: `Picked up ${tool.type}`, frames: 60 });
  }

  placeTool(p) {
    if (!this.heldTool) return;

    const placeX = this.x + Math.cos(this.angle) * 30;
    const placeY = this.y + Math.sin(this.angle) * 30;

    // Check if placement location is valid
    if (placeX > 20 && placeX < 580 && placeY > 20 && placeY < 380) {
      this.heldTool.place(placeX, placeY);
      this.heldTool = null;
      gameState.messages.push({ text: 'Tool placed', frames: 40 });
    }
  }

  dropTool() {
    if (this.heldTool) {
      this.heldTool.held = false;
      this.heldTool.placed = false;
      this.heldTool.x = this.x;
      this.heldTool.y = this.y;
      this.heldTool = null;
      gameState.messages.push({ text: 'Tool dropped', frames: 40 });
    }
  }

  takeDamage() {
    if (this.invulnerableFrames <= 0) {
      this.health--;
      this.invulnerableFrames = 120;
      gameState.messages.push({ text: 'Hit by turret!', frames: 60 });
      
      if (this.health <= 0) {
        gameState.gamePhase = "GAME_OVER_LOSE";
      }
    }
  }

  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle);

    // Player body
    const blinkFrame = this.invulnerableFrames > 0 && Math.floor(this.invulnerableFrames / 10) % 2 === 0;
    p.fill(...(blinkFrame ? [255, 100, 100] : [100, 150, 255]));
    p.stroke(50);
    p.strokeWeight(2);
    p.ellipse(0, 0, this.radius * 2, this.radius * 2);

    // Direction indicator
    p.fill(255);
    p.triangle(this.radius - 2, 0, -this.radius / 2, -this.radius / 2, -this.radius / 2, this.radius / 2);

    p.pop();

    // Draw held tool indicator
    if (this.heldTool) {
      p.push();
      p.translate(this.x + Math.cos(this.angle) * 20, this.y + Math.sin(this.angle) * 20);
      this.heldTool.drawIcon(p);
      p.pop();
    }
  }
}