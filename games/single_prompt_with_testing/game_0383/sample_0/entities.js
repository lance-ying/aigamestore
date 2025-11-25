// entities.js
import { gameState, PLAYER_SIZE, PLAYER_SPEED, PLAYER_SPRINT_SPEED, GUARD_SIZE, GUARD_SPEED, GUARD_CHASE_SPEED, GUARD_DETECTION_RANGE, NPC_SIZE, ITEM_SIZE, GADGET_COOLDOWN, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = PLAYER_SIZE;
    this.speed = PLAYER_SPEED;
    this.sprintSpeed = PLAYER_SPRINT_SPEED;
    this.color = [255, 200, 50];
    this.hasGadget = false;
    this.gadgetType = null;
    this.angle = 0;
  }

  update(p) {
    // Movement handled by input system
    this.angle += 0.05;
  }

  move(dx, dy, isSprinting) {
    const speed = isSprinting ? this.sprintSpeed : this.speed;
    const newX = this.x + dx * speed;
    const newY = this.y + dy * speed;
    
    // Check collisions with walls
    let canMove = true;
    for (const wall of gameState.walls) {
      if (this.checkWallCollision(newX, newY, wall)) {
        canMove = false;
        break;
      }
    }
    
    if (canMove) {
      this.x = newX;
      this.y = newY;
      
      // Keep player in bounds
      this.x = Math.max(this.size / 2, Math.min(CANVAS_WIDTH - this.size / 2, this.x));
      this.y = Math.max(this.size / 2, Math.min(CANVAS_HEIGHT - this.size / 2, this.y));
    }
  }

  checkWallCollision(x, y, wall) {
    const p = window.gameInstance;
    return p.collideRectCircle(wall.x, wall.y, wall.w, wall.h, x, y, this.size);
  }

  render(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle);
    
    // Draw spy character with sunglasses and suit
    p.fill(...this.color);
    p.ellipse(0, 0, this.size, this.size);
    
    // Sunglasses
    p.fill(20, 20, 20);
    p.rect(-6, -3, 5, 3);
    p.rect(1, -3, 5, 3);
    
    // Tie
    p.fill(180, 0, 0);
    p.triangle(-2, 4, 2, 4, 0, 9);
    
    p.pop();
    
    // Gadget indicator
    if (this.hasGadget) {
      p.fill(100, 255, 100);
      p.noStroke();
      p.ellipse(this.x + 8, this.y - 8, 6, 6);
    }
  }
}

export class Guard {
  constructor(x, y, patrolPoints) {
    this.x = x;
    this.y = y;
    this.size = GUARD_SIZE;
    this.speed = GUARD_SPEED;
    this.chaseSpeed = GUARD_CHASE_SPEED;
    this.color = [200, 50, 50];
    this.detectionRange = GUARD_DETECTION_RANGE;
    this.patrolPoints = patrolPoints;
    this.currentPatrolIndex = 0;
    this.isChasing = false;
    this.alertness = 0;
    this.angle = 0;
  }

  update(p) {
    if (!gameState.player) return;
    
    const distToPlayer = p.dist(this.x, this.y, gameState.player.x, gameState.player.y);
    
    // Check if player is in range
    if (distToPlayer < this.detectionRange) {
      this.isChasing = true;
      this.alertness = Math.min(100, this.alertness + 2);
    } else {
      this.alertness = Math.max(0, this.alertness - 1);
      if (this.alertness === 0) {
        this.isChasing = false;
      }
    }
    
    if (this.isChasing) {
      // Chase player
      const dx = gameState.player.x - this.x;
      const dy = gameState.player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 0) {
        this.x += (dx / dist) * this.chaseSpeed;
        this.y += (dy / dist) * this.chaseSpeed;
      }
      
      // Check if caught player
      if (distToPlayer < (this.size + gameState.player.size) / 2) {
        this.catchPlayer();
      }
    } else {
      // Patrol
      const target = this.patrolPoints[this.currentPatrolIndex];
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 5) {
        this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
      } else {
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
      }
    }
    
    this.angle += 0.03;
  }

  catchPlayer() {
    gameState.lives--;
    if (gameState.lives <= 0) {
      gameState.gamePhase = "GAME_OVER_LOSE";
    } else {
      // Respawn player at start
      if (gameState.player) {
        gameState.player.x = 100;
        gameState.player.y = 200;
      }
    }
  }

  render(p) {
    p.push();
    
    // Detection range indicator (when chasing)
    if (this.isChasing) {
      p.noFill();
      p.stroke(255, 0, 0, 50 + this.alertness);
      p.strokeWeight(2);
      p.ellipse(this.x, this.y, this.detectionRange * 2, this.detectionRange * 2);
    }
    
    p.translate(this.x, this.y);
    p.rotate(this.angle);
    
    // Guard body
    p.fill(...(this.isChasing ? [255, 100, 100] : this.color));
    p.noStroke();
    p.ellipse(0, 0, this.size, this.size);
    
    // Security badge
    p.fill(255, 255, 0);
    p.rect(-3, -1, 6, 4);
    
    // Alert indicator
    if (this.isChasing) {
      p.fill(255, 0, 0);
      p.triangle(-4, -12, 4, -12, 0, -16);
      p.fill(255, 255, 255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(8);
      p.text("!", 0, -13);
    }
    
    p.pop();
  }
}

export class NPC {
  constructor(x, y, name, dialog) {
    this.x = x;
    this.y = y;
    this.size = NPC_SIZE;
    this.name = name;
    this.dialog = dialog;
    this.color = [100, 150, 255];
    this.bobOffset = 0;
    this.hasInteracted = false;
  }

  update(p) {
    this.bobOffset = Math.sin(p.frameCount * 0.05) * 2;
  }

  interact() {
    if (!this.hasInteracted) {
      gameState.currentDialog = {
        speaker: this.name,
        text: this.dialog
      };
      gameState.dialogTimer = 180; // 3 seconds at 60fps
      this.hasInteracted = true;
      gameState.score += 5;
    }
  }

  render(p) {
    p.push();
    p.translate(this.x, this.y + this.bobOffset);
    
    // NPC body
    p.fill(...this.color);
    p.noStroke();
    p.ellipse(0, 0, this.size, this.size);
    
    // Hat (makes them look quirky)
    p.fill(80, 80, 80);
    p.rect(-8, -10, 16, 3);
    p.ellipse(0, -11, 10, 8);
    
    // Interaction indicator
    if (!this.hasInteracted && gameState.player) {
      const dist = p.dist(this.x, this.y, gameState.player.x, gameState.player.y);
      if (dist < 40) {
        p.fill(255, 255, 100);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(10);
        p.text("[SPACE]", 0, -25);
      }
    }
    
    p.pop();
  }
}

export class IntelligenceItem {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.size = ITEM_SIZE;
    this.type = type;
    this.collected = false;
    this.angle = 0;
    this.pulse = 0;
  }

  update(p) {
    this.angle += 0.08;
    this.pulse = Math.sin(p.frameCount * 0.1) * 2;
  }

  collect() {
    if (!this.collected) {
      this.collected = true;
      gameState.score += 10;
      gameState.itemsCollected++;
      
      // Sometimes give gadget
      if (Math.random() < 0.3 && gameState.player) {
        gameState.player.hasGadget = true;
        gameState.player.gadgetType = "DISTRACTION";
      }
    }
  }

  render(p) {
    if (this.collected) return;
    
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle);
    
    // Intelligence document
    p.fill(255, 220, 150);
    p.rect(-this.size / 2, -this.size / 2, this.size, this.size * 1.3);
    
    // Secret stamp
    p.fill(255, 0, 0, 150);
    p.ellipse(0, 0, 8 + this.pulse, 8 + this.pulse);
    
    p.pop();
    
    // Glow effect
    p.fill(255, 255, 0, 50);
    p.noStroke();
    p.ellipse(this.x, this.y, this.size * 2 + this.pulse, this.size * 2 + this.pulse);
  }
}

export class Wall {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  render(p) {
    p.fill(60, 60, 80);
    p.noStroke();
    p.rect(this.x, this.y, this.w, this.h);
    
    // Texture
    p.stroke(70, 70, 90);
    p.strokeWeight(1);
    for (let i = 0; i < this.w; i += 20) {
      p.line(this.x + i, this.y, this.x + i, this.y + this.h);
    }
  }
}

export class Door {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  render(p) {
    p.fill(100, 80, 60);
    p.noStroke();
    p.rect(this.x, this.y, this.w, this.h);
    
    // Door handle
    p.fill(200, 180, 100);
    p.ellipse(this.x + this.w - 10, this.y + this.h / 2, 4, 4);
  }
}

export class ExitZone {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.pulse = 0;
  }

  update(p) {
    this.pulse = Math.sin(p.frameCount * 0.1) * 10;
  }

  checkWin() {
    if (gameState.player && gameState.itemsCollected >= 5) {
      const p = window.gameInstance;
      if (p.collideRectCircle(this.x, this.y, this.w, this.h, 
          gameState.player.x, gameState.player.y, gameState.player.size)) {
        return true;
      }
    }
    return false;
  }

  render(p) {
    const alpha = gameState.itemsCollected >= 5 ? 150 : 50;
    p.fill(100, 255, 100, alpha);
    p.noStroke();
    p.rect(this.x, this.y, this.w, this.h);
    
    if (gameState.itemsCollected >= 5) {
      p.fill(50, 255, 50, 100 + this.pulse * 5);
      p.rect(this.x - 5, this.y - 5, this.w + 10, this.h + 10);
      
      p.fill(255, 255, 255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(12);
      p.text("EXIT", this.x + this.w / 2, this.y + this.h / 2);
    } else {
      p.fill(150, 150, 150);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(10);
      p.text("LOCKED", this.x + this.w / 2, this.y + this.h / 2);
    }
  }
}