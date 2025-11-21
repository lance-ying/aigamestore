// buddy.js - Buddy ragdoll character

import { gameState, OUTFITS } from './globals.js';

export class BuddyPart {
  constructor(x, y, w, h, type = 'body') {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.type = type;
    this.vx = 0;
    this.vy = 0;
    this.rotation = 0;
    this.angularVelocity = 0;
    this.health = 100;
    this.maxHealth = 100;
    this.damage = 0;
  }

  applyForce(fx, fy) {
    this.vx += fx;
    this.vy += fy;
  }

  applyImpulse(ix, iy) {
    this.vx += ix * 5;
    this.vy += iy * 5;
  }

  takeDamage(amount) {
    this.damage += amount;
    this.health = Math.max(0, this.health - amount);
    return amount;
  }

  update(gravity) {
    this.vy += gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.angularVelocity;
    
    // Apply friction
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.angularVelocity *= 0.95;
    
    // Floor collision
    if (this.y + this.h / 2 > 380) {
      this.y = 380 - this.h / 2;
      this.vy *= -0.5;
      this.vx *= 0.9;
    }
    
    // Wall collisions
    if (this.x - this.w / 2 < 20) {
      this.x = 20 + this.w / 2;
      this.vx *= -0.5;
    }
    if (this.x + this.w / 2 > 580) {
      this.x = 580 - this.w / 2;
      this.vx *= -0.5;
    }
    
    // Ceiling collision
    if (this.y - this.h / 2 < 20) {
      this.y = 20 + this.h / 2;
      this.vy *= -0.5;
    }
  }

  isOnGround() {
    return Math.abs(this.y + this.h / 2 - 380) < 5;
  }
}

export class Buddy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.parts = [];
    this.constraints = [];
    this.isDragging = false;
    this.dragPart = null;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.dragStartX = 0;
    this.dragStartY = 0;
    
    this.createRagdoll(x, y);
  }

  createRagdoll(x, y) {
    // Head
    const head = new BuddyPart(x, y - 40, 30, 30, 'head');
    // Torso
    const torso = new BuddyPart(x, y, 40, 60, 'torso');
    // Left arm
    const leftArm = new BuddyPart(x - 35, y - 10, 15, 40, 'arm');
    // Right arm
    const rightArm = new BuddyPart(x + 35, y - 10, 15, 40, 'arm');
    // Left leg
    const leftLeg = new BuddyPart(x - 15, y + 50, 15, 45, 'leg');
    // Right leg
    const rightLeg = new BuddyPart(x + 15, y + 50, 15, 45, 'leg');
    
    this.parts = [head, torso, leftArm, rightArm, leftLeg, rightLeg];
    
    // Create constraints between parts
    this.constraints = [
      { partA: head, partB: torso, length: 35 },
      { partA: torso, partB: leftArm, length: 30 },
      { partA: torso, partB: rightArm, length: 30 },
      { partA: torso, partB: leftLeg, length: 35 },
      { partA: torso, partB: rightLeg, length: 35 }
    ];
  }

  update(gravity) {
    // Update all parts
    this.parts.forEach(part => part.update(gravity));
    
    // Apply constraints
    for (let i = 0; i < 3; i++) {
      this.constraints.forEach(constraint => {
        const { partA, partB, length } = constraint;
        const dx = partB.x - partA.x;
        const dy = partB.y - partA.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
          const diff = (dist - length) / dist;
          const offsetX = dx * diff * 0.5;
          const offsetY = dy * diff * 0.5;
          
          partA.x += offsetX;
          partA.y += offsetY;
          partB.x -= offsetX;
          partB.y -= offsetY;
        }
      });
    }
    
    // Handle dragging
    if (this.isDragging && this.dragPart) {
      const p = window.gameInstance;
      this.dragPart.x = p.mouseX - this.dragOffsetX;
      this.dragPart.y = p.mouseY - this.dragOffsetY;
      this.dragPart.vx = 0;
      this.dragPart.vy = 0;
    }
    
    // Update center position
    this.x = this.parts[1].x;
    this.y = this.parts[1].y;
  }

  startDrag(mouseX, mouseY) {
    // Find closest part to mouse
    let closestPart = null;
    let minDist = Infinity;
    
    this.parts.forEach(part => {
      const dist = Math.sqrt((part.x - mouseX) ** 2 + (part.y - mouseY) ** 2);
      if (dist < minDist && dist < 50) {
        minDist = dist;
        closestPart = part;
      }
    });
    
    if (closestPart) {
      this.isDragging = true;
      this.dragPart = closestPart;
      this.dragOffsetX = mouseX - closestPart.x;
      this.dragOffsetY = mouseY - closestPart.y;
      this.dragStartX = mouseX;
      this.dragStartY = mouseY;
    }
  }

  endDrag(mouseX, mouseY) {
    if (this.isDragging && this.dragPart) {
      const dx = mouseX - this.dragStartX;
      const dy = mouseY - this.dragStartY;
      const speed = Math.sqrt(dx * dx + dy * dy);
      
      if (speed > 10) {
        this.dragPart.vx = dx * 0.3;
        this.dragPart.vy = dy * 0.3;
      }
      
      this.isDragging = false;
      this.dragPart = null;
    }
  }

  applyForceToAll(fx, fy) {
    this.parts.forEach(part => part.applyForce(fx, fy));
  }

  applyImpulseToClosest(x, y, ix, iy) {
    let closestPart = this.parts[0];
    let minDist = Infinity;
    
    this.parts.forEach(part => {
      const dist = Math.sqrt((part.x - x) ** 2 + (part.y - y) ** 2);
      if (dist < minDist) {
        minDist = dist;
        closestPart = part;
      }
    });
    
    closestPart.applyImpulse(ix, iy);
    return closestPart;
  }

  takeDamage(x, y, amount) {
    let closestPart = this.parts[0];
    let minDist = Infinity;
    
    this.parts.forEach(part => {
      const dist = Math.sqrt((part.x - x) ** 2 + (part.y - y) ** 2);
      if (dist < minDist) {
        minDist = dist;
        closestPart = part;
      }
    });
    
    return closestPart.takeDamage(amount);
  }

  reset(x, y) {
    this.parts = [];
    this.constraints = [];
    this.createRagdoll(x, y);
    this.isDragging = false;
    this.dragPart = null;
  }

  isOnGround() {
    return this.parts.some(part => part.isOnGround());
  }

  render(p) {
    const outfit = OUTFITS[gameState.currentOutfitIndex];
    
    p.push();
    
    // Draw constraints as lines
    p.stroke(100, 100, 100);
    p.strokeWeight(3);
    this.constraints.forEach(constraint => {
      p.line(constraint.partA.x, constraint.partA.y, 
             constraint.partB.x, constraint.partB.y);
    });
    
    // Draw parts
    this.parts.forEach(part => {
      p.push();
      p.translate(part.x, part.y);
      p.rotate(part.rotation);
      
      // Color based on damage
      const damageRatio = part.damage / part.maxHealth;
      const r = outfit.color[0] + damageRatio * 100;
      const g = outfit.color[1] * (1 - damageRatio);
      const b = outfit.color[2] * (1 - damageRatio);
      
      p.fill(r, g, b);
      p.stroke(0);
      p.strokeWeight(2);
      
      if (part.type === 'head') {
        p.ellipse(0, 0, part.w, part.h);
        // Face
        p.fill(0);
        p.noStroke();
        p.ellipse(-7, -5, 4, 4);
        p.ellipse(7, -5, 4, 4);
        p.arc(0, 5, 15, 10, 0, p.PI);
      } else {
        p.rectMode(p.CENTER);
        p.rect(0, 0, part.w, part.h, 5);
      }
      
      p.pop();
    });
    
    p.pop();
  }
}