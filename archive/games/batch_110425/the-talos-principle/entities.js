// entities.js - Game entities (Turret, Gate, Sigil, etc.)
import { gameState } from './globals.js';

export class Turret {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.type = 'TURRET';
    this.jammed = false;
    this.radius = 15;
    this.scanAngle = 0;
    this.scanSpeed = 0.05;
    this.scanRange = 100;
    this.fireRate = 90;
    this.fireTimer = 0;
    this.canSeePlayer = false;
  }

  update(p) {
    // Check if jammed by any jammer
    this.jammed = false;
    for (let tool of gameState.tools) {
      if (tool.type === 'JAMMER' && tool.placed && tool.active) {
        const dist = Math.sqrt((this.x - tool.x) ** 2 + (this.y - tool.y) ** 2);
        if (dist < tool.jamRadius) {
          this.jammed = true;
          break;
        }
      }
    }

    if (this.jammed) return;

    // Scan for player
    this.scanAngle += this.scanSpeed;
    this.canSeePlayer = false;

    if (gameState.player) {
      const dx = gameState.player.x - this.x;
      const dy = gameState.player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.scanRange) {
        const angleToPlayer = Math.atan2(dy, dx);
        const angleDiff = Math.abs(angleToPlayer - this.scanAngle);
        
        if (angleDiff < 0.3 || angleDiff > Math.PI * 2 - 0.3) {
          this.canSeePlayer = true;
          this.fireTimer++;

          if (this.fireTimer >= this.fireRate) {
            this.fire();
            this.fireTimer = 0;
          }
        }
      }
    }
  }

  fire() {
    if (gameState.player) {
      gameState.player.takeDamage();
    }
  }

  draw(p) {
    p.push();
    p.translate(this.x, this.y);

    // Base
    p.fill(...(this.jammed ? [100, 100, 100] : [200, 50, 50]));
    p.stroke(150, 30, 30);
    p.strokeWeight(2);
    p.rect(-12, -12, 24, 24);

    if (!this.jammed) {
      // Rotating turret head
      p.rotate(this.scanAngle);
      p.fill(150, 30, 30);
      p.triangle(12, 0, -6, -6, -6, 6);

      // Scan beam
      if (this.canSeePlayer) {
        p.stroke(255, 100, 100, 150);
        p.strokeWeight(2);
        p.line(0, 0, this.scanRange, 0);
      } else {
        p.stroke(255, 200, 100, 100);
        p.strokeWeight(1);
        p.line(0, 0, this.scanRange, 0);
      }
    } else {
      // Jammed indicator
      p.fill(100);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(10);
      p.text('X', 0, 0);
    }

    p.pop();
  }
}

export class Gate {
  constructor(x, y, linkedReceiver = null) {
    this.x = x;
    this.y = y;
    this.type = 'GATE';
    this.open = false;
    this.width = 30;
    this.height = 50;
    this.linkedReceiver = linkedReceiver;
    this.openHeight = 0;
    this.targetOpenHeight = 0;
  }

  update(p) {
    // Check if linked receiver is activated
    if (this.linkedReceiver && this.linkedReceiver.powered) {
      this.targetOpenHeight = this.height;
      this.open = true;
    } else {
      this.targetOpenHeight = 0;
      this.open = false;
    }

    // Smooth animation
    this.openHeight += (this.targetOpenHeight - this.openHeight) * 0.1;
  }

  draw(p) {
    p.push();
    p.translate(this.x, this.y);

    // Gate frame
    p.fill(80, 80, 80);
    p.stroke(50, 50, 50);
    p.strokeWeight(3);
    p.rect(-this.width / 2 - 3, -this.height / 2 - 3, this.width + 6, this.height + 6);

    // Gate door
    const doorHeight = this.height - this.openHeight;
    if (doorHeight > 0) {
      p.fill(150, 50, 50);
      p.stroke(100, 30, 30);
      p.strokeWeight(2);
      p.rect(-this.width / 2, this.height / 2 - doorHeight, this.width, doorHeight);

      // Door details
      p.stroke(100, 30, 30);
      p.strokeWeight(1);
      for (let i = 0; i < 3; i++) {
        const y = this.height / 2 - doorHeight + (doorHeight / 4) * (i + 1);
        p.line(-this.width / 2, y, this.width / 2, y);
      }
    }

    p.pop();
  }
}

export class Receiver {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.type = 'RECEIVER';
    this.powered = false;
    this.radius = 12;
  }

  activate() {
    this.powered = true;
  }

  update(p) {
    // Check if any connector is pointing at this receiver
    this.powered = false;
    for (let tool of gameState.tools) {
      if (tool.type === 'CONNECTOR' && tool.placed && tool.active) {
        if (tool.targetConnector === this) {
          this.powered = true;
          break;
        }
      }
    }
  }

  draw(p) {
    p.push();
    p.translate(this.x, this.y);

    // Receiver base
    p.fill(...(this.powered ? [100, 255, 100] : [100, 100, 100]));
    p.stroke(50);
    p.strokeWeight(2);
    p.ellipse(0, 0, this.radius * 2, this.radius * 2);

    // Power indicator
    if (this.powered) {
      p.fill(200, 255, 200);
      p.noStroke();
      p.ellipse(0, 0, this.radius, this.radius);
    }

    p.pop();
  }
}

export class Sigil {
  constructor(x, y, shape) {
    this.x = x;
    this.y = y;
    this.type = 'SIGIL';
    this.collected = false;
    this.shape = shape; // Array of tetromino blocks
    this.rotation = 0;
    this.floatOffset = 0;
  }

  collect() {
    if (!this.collected) {
      this.collected = true;
      gameState.sigilsCollected++;
      gameState.score += 100;
      gameState.messages.push({ text: 'Sigil collected!', frames: 90 });

      if (gameState.sigilsCollected >= gameState.totalSigils) {
        gameState.gamePhase = "GAME_OVER_WIN";
      }
    }
  }

  update(p) {
    this.rotation += 0.02;
    this.floatOffset = Math.sin(p.frameCount * 0.05) * 3;
  }

  draw(p) {
    if (this.collected) return;

    p.push();
    p.translate(this.x, this.y + this.floatOffset);
    p.rotate(this.rotation);

    // Draw tetromino shape
    p.fill(255, 215, 0);
    p.stroke(200, 170, 0);
    p.strokeWeight(2);

    for (let block of this.shape) {
      p.rect(block[0] * 8 - 4, block[1] * 8 - 4, 8, 8);
    }

    // Glow effect
    p.noStroke();
    p.fill(255, 215, 0, 50);
    for (let block of this.shape) {
      p.ellipse(block[0] * 8, block[1] * 8, 16, 16);
    }

    p.pop();
  }
}

export class Switch {
  constructor(x, y, linkedGate = null) {
    this.x = x;
    this.y = y;
    this.type = 'SWITCH';
    this.active = false;
    this.linkedGate = linkedGate;
    this.radius = 10;
  }

  toggle() {
    this.active = !this.active;
    gameState.messages.push({ text: this.active ? 'Switch ON' : 'Switch OFF', frames: 40 });
  }

  draw(p) {
    p.push();
    p.translate(this.x, this.y);

    // Switch base
    p.fill(120, 120, 120);
    p.stroke(80, 80, 80);
    p.strokeWeight(2);
    p.rect(-15, -10, 30, 20);

    // Switch lever
    p.fill(...(this.active ? [100, 255, 100] : [200, 100, 100]));
    p.stroke(50);
    p.strokeWeight(2);
    const leverX = this.active ? 8 : -8;
    p.ellipse(leverX, 0, 12, 12);
    p.line(0, 0, leverX, 0);

    p.pop();
  }
}