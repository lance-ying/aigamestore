// entities.js - Game entity classes
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Staff {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.radius = 15;
    this.glowSize = 0;
  }

  update(keys) {
    const speed = keys.shift ? 4 : 2;
    
    if (keys.left) this.targetX -= speed;
    if (keys.right) this.targetX += speed;
    if (keys.up) this.targetY -= speed;
    if (keys.down) this.targetY += speed;

    // Constrain to canvas
    this.targetX = this.p.constrain(this.targetX, 30, CANVAS_WIDTH - 30);
    this.targetY = this.p.constrain(this.targetY, 30, CANVAS_HEIGHT - 80);

    // Smooth movement
    this.x += (this.targetX - this.x) * 0.15;
    this.y += (this.targetY - this.y) * 0.15;

    this.glowSize = (this.glowSize + 0.1) % (this.p.TWO_PI);
  }

  render() {
    const p = this.p;
    
    // Outer glow
    for (let i = 3; i > 0; i--) {
      p.noStroke();
      p.fill(100, 200, 255, 30);
      p.circle(this.x, this.y, this.radius * 2 + i * 10 + p.sin(this.glowSize) * 5);
    }
    
    // Staff core
    p.fill(150, 220, 255);
    p.stroke(200, 240, 255);
    p.strokeWeight(2);
    p.circle(this.x, this.y, this.radius * 2);
    
    // Inner light
    p.noStroke();
    p.fill(220, 250, 255, 200);
    p.circle(this.x, this.y, this.radius);
  }
}

export class Citizen {
  constructor(p, x, y, id) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.id = id;
    this.vx = 0;
    this.vy = 0;
    this.radius = 6;
    this.state = "following"; // following, selected, tower, bridge, reached
    this.glowPhase = p.random(p.TWO_PI);
    this.targetStaff = null;
    this.grounded = false;
    this.towerIndex = -1;
    this.bridgeAngle = 0;
    this.bridgeT = 0;
  }

  update(staff, platforms, gameState) {
    if (this.state === "reached") {
      return;
    }

    if (this.state === "following") {
      // Follow the staff
      const dx = staff.x - this.x;
      const dy = staff.y - this.y;
      const dist = this.p.sqrt(dx * dx + dy * dy);
      
      if (dist > 25) {
        const speed = 1.5;
        this.vx = (dx / dist) * speed;
        this.vy = (dy / dist) * speed;
      } else {
        this.vx *= 0.8;
        this.vy *= 0.8;
      }

      // Apply gravity
      this.vy += 0.3;
      
      // Apply velocity
      this.x += this.vx;
      this.y += this.vy;

      // Platform collision
      this.grounded = false;
      for (let platform of platforms) {
        if (this.x > platform.x - this.radius && 
            this.x < platform.x + platform.width + this.radius &&
            this.y + this.radius > platform.y &&
            this.y + this.radius < platform.y + platform.height + 5 &&
            this.vy > 0) {
          this.y = platform.y - this.radius;
          this.vy = 0;
          this.grounded = true;
          break;
        }
      }

      // Check bridges
      for (let bridge of gameState.bridges) {
        if (bridge.checkCollision(this)) {
          this.grounded = true;
        }
      }

      // Check if reached exit
      if (gameState.exitPortal) {
        const exitDist = this.p.dist(this.x, this.y, 
                                      gameState.exitPortal.x, 
                                      gameState.exitPortal.y);
        if (exitDist < 25) {
          this.state = "reached";
          gameState.citizensReachedExit++;
        }
      }

      // Check if fallen off
      if (this.y > CANVAS_HEIGHT) {
        this.state = "dead";
      }
    } else if (this.state === "tower") {
      // Citizens in tower don't move
      if (gameState.tower) {
        const tower = gameState.tower;
        this.x = tower.x;
        this.y = tower.baseY - (this.towerIndex * this.radius * 2.5);
      }
    } else if (this.state === "bridge") {
      // Citizens in bridge stay in place (handled by Bridge class)
    }

    this.glowPhase += 0.1;
  }

  render() {
    const p = this.p;
    
    if (this.state === "dead") return;
    
    p.push();
    p.translate(this.x, this.y);

    // Glow
    const glowSize = 3 + p.sin(this.glowPhase) * 2;
    p.noStroke();
    
    if (this.state === "selected") {
      p.fill(255, 200, 100, 100);
    } else if (this.state === "reached") {
      p.fill(100, 255, 100, 100);
    } else {
      p.fill(255, 220, 150, 80);
    }
    p.circle(0, 0, this.radius * 2 + glowSize);

    // Body
    if (this.state === "selected") {
      p.fill(255, 220, 100);
      p.stroke(255, 240, 150);
    } else if (this.state === "reached") {
      p.fill(150, 255, 150);
      p.stroke(200, 255, 200);
    } else {
      p.fill(255, 230, 180);
      p.stroke(255, 245, 220);
    }
    p.strokeWeight(1);
    p.circle(0, 0, this.radius * 2);

    // Inner core
    p.noStroke();
    if (this.state === "selected") {
      p.fill(255, 240, 150);
    } else if (this.state === "reached") {
      p.fill(220, 255, 220);
    } else {
      p.fill(255, 245, 200);
    }
    p.circle(0, 0, this.radius);

    p.pop();
  }
}

export class Tower {
  constructor(p, x, baseY, citizens) {
    this.p = p;
    this.x = x;
    this.baseY = baseY;
    this.citizens = citizens;
    this.state = "building"; // building, standing, toppling, toppled
    this.toppleAngle = 0;
    this.toppleDirection = 0; // 1 for right, -1 for left, 0 for none
    this.toppleSpeed = 0;
  }

  startTopple(direction) {
    if (this.state === "standing") {
      this.state = "toppling";
      this.toppleDirection = direction;
      this.toppleSpeed = 0.05;
    }
  }

  update() {
    if (this.state === "building") {
      this.state = "standing";
    } else if (this.state === "toppling") {
      this.toppleAngle += this.toppleSpeed * this.toppleDirection;
      this.toppleSpeed += 0.003;

      if (this.p.abs(this.toppleAngle) > this.p.PI / 2) {
        this.state = "toppled";
        return this.createBridge();
      }
    }
    return null;
  }

  createBridge() {
    // Create a bridge from toppled tower
    const height = this.citizens.length * 12;
    const bridge = new Bridge(
      this.p,
      this.x,
      this.baseY,
      height,
      this.toppleDirection,
      this.citizens
    );
    return bridge;
  }

  render() {
    const p = this.p;
    
    p.push();
    p.translate(this.x, this.baseY);
    
    if (this.state === "toppling") {
      p.rotate(this.toppleAngle);
    }

    // Draw tower base indicator
    p.noStroke();
    p.fill(100, 150, 200, 100);
    p.circle(0, 0, 20);

    p.pop();
  }
}

export class Bridge {
  constructor(p, x, y, length, direction, citizens) {
    this.p = p;
    this.startX = x;
    this.startY = y;
    this.length = length;
    this.direction = direction;
    this.endX = x + direction * length;
    this.endY = y;
    this.citizens = citizens;
    this.thickness = 12;
    
    // Position citizens along bridge
    for (let i = 0; i < this.citizens.length; i++) {
      const t = i / Math.max(1, this.citizens.length - 1);
      this.citizens[i].x = this.p.lerp(this.startX, this.endX, t);
      this.citizens[i].y = this.p.lerp(this.startY, this.endY, t);
      this.citizens[i].state = "bridge";
      this.citizens[i].bridgeT = t;
    }
  }

  checkCollision(citizen) {
    // Check if citizen is on bridge
    const dx = this.endX - this.startX;
    const dy = this.endY - this.startY;
    const length = this.p.sqrt(dx * dx + dy * dy);
    
    if (length === 0) return false;

    // Project point onto line
    const t = ((citizen.x - this.startX) * dx + (citizen.y - this.startY) * dy) / (length * length);
    
    if (t < 0 || t > 1) return false;

    const projX = this.startX + t * dx;
    const projY = this.startY + t * dy;
    
    const dist = this.p.dist(citizen.x, citizen.y, projX, projY);
    
    if (dist < this.thickness && citizen.vy > 0) {
      citizen.y = projY - citizen.radius;
      citizen.vy = 0;
      return true;
    }
    
    return false;
  }

  render() {
    const p = this.p;
    
    // Draw bridge line
    p.stroke(200, 180, 150, 150);
    p.strokeWeight(this.thickness);
    p.line(this.startX, this.startY, this.endX, this.endY);
    
    // Draw support glow
    p.strokeWeight(this.thickness + 4);
    p.stroke(255, 220, 180, 50);
    p.line(this.startX, this.startY, this.endX, this.endY);
  }
}

export class Platform {
  constructor(p, x, y, width, height) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  render() {
    const p = this.p;
    
    // Platform shadow
    p.noStroke();
    p.fill(30, 30, 40, 100);
    p.rect(this.x + 3, this.y + 3, this.width, this.height);
    
    // Platform main
    p.fill(60, 80, 100);
    p.stroke(80, 100, 120);
    p.strokeWeight(2);
    p.rect(this.x, this.y, this.width, this.height);
    
    // Platform highlight
    p.noStroke();
    p.fill(90, 110, 130, 100);
    p.rect(this.x, this.y, this.width, 3);
  }
}

export class ExitPortal {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.radius = 25;
    this.glowPhase = 0;
  }

  update() {
    this.glowPhase += 0.08;
  }

  render() {
    const p = this.p;
    
    p.push();
    p.translate(this.x, this.y);

    // Outer glow rings
    for (let i = 4; i > 0; i--) {
      const alpha = 40 - i * 8;
      const size = this.radius * 2.5 + i * 8 + p.sin(this.glowPhase + i) * 5;
      p.noStroke();
      p.fill(150, 255, 150, alpha);
      p.circle(0, 0, size);
    }

    // Portal ring
    p.noFill();
    p.stroke(100, 255, 100);
    p.strokeWeight(4);
    p.circle(0, 0, this.radius * 2);

    // Inner swirl
    p.noStroke();
    for (let i = 0; i < 8; i++) {
      const angle = this.glowPhase + i * p.TWO_PI / 8;
      const r = this.radius * 0.7;
      const px = p.cos(angle) * r;
      const py = p.sin(angle) * r;
      p.fill(200, 255, 200, 150);
      p.circle(px, py, 5);
    }

    // Center
    p.fill(180, 255, 180, 200);
    p.circle(0, 0, this.radius);

    p.pop();
  }
}