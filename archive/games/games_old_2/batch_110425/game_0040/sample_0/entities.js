// entities.js - Game entity classes

import { CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, PLAYER_SPEED, PLAYER_JUMP_FORCE, FRICTION, gameState } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 30;
    this.velocityX = 0;
    this.velocityY = 0;
    this.grounded = false;
    this.grabbing = false;
    this.grabbedObject = null;
    this.alive = true;
    this.respawnX = x;
    this.respawnY = y;
  }

  update(p) {
    if (!this.alive) return;

    // Apply gravity
    this.velocityY += GRAVITY;

    // Apply horizontal friction
    this.velocityX *= FRICTION;

    // Update position
    this.x += this.velocityX;
    this.y += this.velocityY;

    // Check platform collisions
    this.grounded = false;
    for (let platform of gameState.platforms) {
      if (this.checkPlatformCollision(platform)) {
        this.grounded = true;
        break;
      }
    }

    // Check if grabbing an object
    if (this.grabbing && this.grabbedObject) {
      this.grabbedObject.beingGrabbed = true;
      // Keep object close to player
      if (this.grabbedObject.type === 'crate') {
        this.grabbedObject.x = this.x + (this.velocityX > 0 ? 25 : -45);
      }
    }

    // Keep player in bounds vertically
    if (this.y > CANVAS_HEIGHT + 100) {
      this.die();
    }
  }

  checkPlatformCollision(platform) {
    // Check if player is on top of platform
    if (this.x + this.width > platform.x && 
        this.x < platform.x + platform.width &&
        this.y + this.height >= platform.y &&
        this.y + this.height <= platform.y + platform.height + 10 &&
        this.velocityY >= 0) {
      this.y = platform.y - this.height;
      this.velocityY = 0;
      return true;
    }
    return false;
  }

  moveLeft() {
    if (this.alive) {
      this.velocityX = -PLAYER_SPEED;
    }
  }

  moveRight() {
    if (this.alive) {
      this.velocityX = PLAYER_SPEED;
    }
  }

  jump() {
    if (this.alive && this.grounded) {
      this.velocityY = PLAYER_JUMP_FORCE;
      this.grounded = false;
    }
  }

  grab() {
    if (!this.alive) return;
    
    this.grabbing = true;
    
    // Check for nearby interactable objects
    if (!this.grabbedObject) {
      for (let obj of gameState.interactables) {
        if (obj.type === 'crate') {
          const dist = Math.abs(this.x - obj.x);
          if (dist < 50 && Math.abs(this.y - obj.y) < 50) {
            this.grabbedObject = obj;
            obj.beingGrabbed = true;
            break;
          }
        } else if (obj.type === 'lever') {
          const dist = Math.abs(this.x - obj.x);
          if (dist < 40 && Math.abs(this.y - obj.y) < 60) {
            obj.activate();
            break;
          }
        }
      }
    }
  }

  releaseGrab() {
    this.grabbing = false;
    if (this.grabbedObject) {
      this.grabbedObject.beingGrabbed = false;
      this.grabbedObject = null;
    }
  }

  die() {
    this.alive = false;
    gameState.deathCount++;
    
    // Respawn after a short delay
    setTimeout(() => {
      this.respawn();
    }, 500);
  }

  respawn() {
    const checkpoint = gameState.checkpoints[gameState.currentCheckpoint];
    this.x = checkpoint.x + 20;
    this.y = checkpoint.y - 50;
    this.respawnX = this.x;
    this.respawnY = this.y;
    this.velocityX = 0;
    this.velocityY = 0;
    this.alive = true;
    this.releaseGrab();
    
    // Reset interactables in current checkpoint area
    for (let obj of gameState.interactables) {
      if (obj.checkpointIndex === gameState.currentCheckpoint) {
        obj.reset();
      }
    }
  }

  render(p, cameraX) {
    const screenX = this.x - cameraX;
    
    if (!this.alive) {
      // Death animation
      p.push();
      p.fill(100, 0, 0);
      p.noStroke();
      p.ellipse(screenX + this.width / 2, this.y + this.height / 2, this.width, this.height);
      p.pop();
      return;
    }

    // Body
    p.push();
    p.fill(200, 200, 210);
    p.noStroke();
    p.rect(screenX, this.y, this.width, this.height, 2);
    
    // Head
    p.fill(180, 180, 190);
    p.ellipse(screenX + this.width / 2, this.y - 5, 15, 15);
    
    // Eyes (glowing slightly)
    p.fill(255, 255, 200, 150);
    p.ellipse(screenX + this.width / 2 - 3, this.y - 5, 3, 3);
    p.ellipse(screenX + this.width / 2 + 3, this.y - 5, 3, 3);
    
    p.pop();
  }
}

export class Platform {
  constructor(x, y, width, height, type = 'normal') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
  }

  render(p, cameraX) {
    const screenX = this.x - cameraX;
    p.push();
    p.noStroke();
    
    if (this.type === 'normal') {
      p.fill(40, 40, 45);
      p.rect(screenX, this.y, this.width, this.height);
      // Add texture
      p.stroke(30, 30, 35);
      for (let i = 0; i < this.width; i += 20) {
        p.line(screenX + i, this.y, screenX + i, this.y + this.height);
      }
    } else if (this.type === 'moving') {
      p.fill(60, 60, 70);
      p.rect(screenX, this.y, this.width, this.height);
    }
    
    p.pop();
  }
}

export class Hazard {
  constructor(x, y, type, width = 30, height = 20) {
    this.x = x;
    this.y = y;
    this.type = type; // 'trap', 'spider', 'spike'
    this.width = width;
    this.height = height;
    this.active = true;
    this.animFrame = 0;
  }

  update(p) {
    this.animFrame++;
    
    if (this.type === 'spider') {
      // Spider movement
      this.y = this.y + Math.sin(this.animFrame * 0.05) * 0.5;
    }
  }

  checkCollision(player) {
    if (!this.active) return false;
    
    return player.x + player.width > this.x &&
           player.x < this.x + this.width &&
           player.y + player.height > this.y &&
           player.y < this.y + this.height;
  }

  render(p, cameraX) {
    const screenX = this.x - cameraX;
    p.push();
    p.noStroke();
    
    if (this.type === 'trap') {
      // Bear trap
      p.fill(60, 60, 65);
      p.rect(screenX, this.y, this.width, this.height);
      p.stroke(80, 80, 85);
      p.strokeWeight(2);
      p.line(screenX + 5, this.y + 5, screenX + this.width - 5, this.y + 5);
      p.line(screenX + 5, this.y + this.height - 5, screenX + this.width - 5, this.y + this.height - 5);
    } else if (this.type === 'spider') {
      // Giant spider
      p.fill(20, 20, 25);
      p.ellipse(screenX + this.width / 2, this.y + this.height / 2, this.width * 0.7, this.height * 0.7);
      // Legs
      p.stroke(20, 20, 25);
      p.strokeWeight(2);
      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI / 2) + Math.sin(this.animFrame * 0.1) * 0.3;
        const legLen = 15;
        p.line(
          screenX + this.width / 2, 
          this.y + this.height / 2,
          screenX + this.width / 2 + Math.cos(angle) * legLen,
          this.y + this.height / 2 + Math.sin(angle) * legLen
        );
      }
      // Eyes
      p.fill(150, 0, 0);
      p.noStroke();
      p.ellipse(screenX + this.width / 2 - 4, this.y + this.height / 2 - 2, 4, 4);
      p.ellipse(screenX + this.width / 2 + 4, this.y + this.height / 2 - 2, 4, 4);
    } else if (this.type === 'spike') {
      // Spikes
      p.fill(70, 70, 75);
      for (let i = 0; i < this.width; i += 15) {
        p.triangle(
          screenX + i, this.y + this.height,
          screenX + i + 7, this.y,
          screenX + i + 14, this.y + this.height
        );
      }
    }
    
    p.pop();
  }
}

export class Crate {
  constructor(x, y, checkpointIndex) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.width = 40;
    this.height = 40;
    this.type = 'crate';
    this.beingGrabbed = false;
    this.velocityY = 0;
    this.velocityX = 0;
    this.checkpointIndex = checkpointIndex;
  }

  update() {
    if (!this.beingGrabbed) {
      // Apply gravity
      this.velocityY += GRAVITY;
      this.y += this.velocityY;

      // Check platform collisions
      for (let platform of gameState.platforms) {
        if (this.x + this.width > platform.x && 
            this.x < platform.x + platform.width &&
            this.y + this.height >= platform.y &&
            this.y + this.height <= platform.y + platform.height + 10 &&
            this.velocityY >= 0) {
          this.y = platform.y - this.height;
          this.velocityY = 0;
        }
      }
    }
  }

  reset() {
    this.x = this.startX;
    this.y = this.startY;
    this.velocityX = 0;
    this.velocityY = 0;
    this.beingGrabbed = false;
  }

  render(p, cameraX) {
    const screenX = this.x - cameraX;
    p.push();
    p.fill(80, 70, 60);
    p.stroke(60, 50, 40);
    p.strokeWeight(2);
    p.rect(screenX, this.y, this.width, this.height);
    
    // Wood texture
    p.stroke(70, 60, 50);
    p.strokeWeight(1);
    for (let i = 0; i < 3; i++) {
      p.line(screenX, this.y + i * 13 + 5, screenX + this.width, this.y + i * 13 + 5);
    }
    
    p.pop();
  }
}

export class Lever {
  constructor(x, y, targetGateId, checkpointIndex) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 40;
    this.type = 'lever';
    this.activated = false;
    this.targetGateId = targetGateId;
    this.checkpointIndex = checkpointIndex;
    this.startActivated = false;
  }

  activate() {
    this.activated = !this.activated;
    
    // Find and toggle the gate
    for (let entity of gameState.entities) {
      if (entity.type === 'gate' && entity.id === this.targetGateId) {
        entity.open = this.activated;
      }
    }
  }

  reset() {
    this.activated = this.startActivated;
  }

  render(p, cameraX) {
    const screenX = this.x - cameraX;
    p.push();
    
    // Base
    p.fill(50, 50, 55);
    p.noStroke();
    p.rect(screenX - 5, this.y + 30, 30, 10);
    
    // Lever arm
    p.stroke(70, 70, 75);
    p.strokeWeight(4);
    const angle = this.activated ? -0.5 : 0.5;
    p.line(
      screenX + 10, this.y + 30,
      screenX + 10 + Math.cos(angle) * 25,
      this.y + 30 - Math.sin(angle) * 25
    );
    
    // Handle
    p.fill(this.activated ? 100 : 150, this.activated ? 150 : 100, 100);
    p.noStroke();
    p.ellipse(
      screenX + 10 + Math.cos(angle) * 25,
      this.y + 30 - Math.sin(angle) * 25,
      10, 10
    );
    
    p.pop();
  }
}

export class Gate {
  constructor(x, y, width, height, id) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = 'gate';
    this.id = id;
    this.open = false;
    this.targetY = y;
    this.closedY = y;
    this.openY = y - height - 10;
  }

  update() {
    // Smooth opening/closing
    this.targetY = this.open ? this.openY : this.closedY;
    this.y += (this.targetY - this.y) * 0.1;
  }

  blocksPlayer(player) {
    if (this.open) return false;
    
    return player.x + player.width > this.x &&
           player.x < this.x + this.width &&
           player.y + player.height > this.y &&
           player.y < this.y + this.height;
  }

  render(p, cameraX) {
    const screenX = this.x - cameraX;
    p.push();
    p.fill(80, 80, 90);
    p.stroke(60, 60, 70);
    p.strokeWeight(2);
    p.rect(screenX, this.y, this.width, this.height);
    
    // Grid pattern
    p.stroke(100, 100, 110);
    p.strokeWeight(1);
    for (let i = 0; i < this.width; i += 15) {
      p.line(screenX + i, this.y, screenX + i, this.y + this.height);
    }
    for (let i = 0; i < this.height; i += 15) {
      p.line(screenX, this.y + i, screenX + this.width, this.y + i);
    }
    
    p.pop();
  }
}

export class Checkpoint {
  constructor(x, y, index) {
    this.x = x;
    this.y = y;
    this.index = index;
    this.width = 40;
    this.height = 60;
    this.activated = false;
    this.isFinal = false;
  }

  checkActivation(player) {
    if (!this.activated) {
      const dist = Math.abs(player.x - this.x);
      if (dist < 50 && Math.abs(player.y - this.y) < 80) {
        this.activated = true;
        if (this.index > gameState.currentCheckpoint) {
          gameState.currentCheckpoint = this.index;
        }
        return true;
      }
    }
    return false;
  }

  render(p, cameraX) {
    const screenX = this.x - cameraX;
    p.push();
    
    if (this.activated) {
      p.fill(100, 200, 100, 150);
    } else {
      p.fill(50, 50, 60, 100);
    }
    p.noStroke();
    p.rect(screenX - 20, this.y, this.width, this.height);
    
    // Glow effect for active checkpoints
    if (this.activated) {
      p.fill(150, 255, 150, 80);
      p.ellipse(screenX, this.y + this.height / 2, 60, 60);
    }
    
    p.pop();
  }
}