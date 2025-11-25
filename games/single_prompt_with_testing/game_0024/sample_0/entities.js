// entities.js - Game entities

import { TILE_SIZE, gameState } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 30;
    this.speed = 2.5;
    this.sprintSpeed = 4.5;
    this.stamina = 100;
    this.maxStamina = 100;
    this.staminaDrain = 0.5;
    this.staminaRegen = 0.3;
    this.isSprinting = false;
    
    this.vx = 0;
    this.vy = 0;
    
    // Animation
    this.walkCycle = 0;
    this.facing = 'down'; // up, down, left, right
  }
  
  update(p) {
    // Update walk cycle
    if (this.vx !== 0 || this.vy !== 0) {
      this.walkCycle = (this.walkCycle + 0.15) % 4;
    }
    
    // Update facing direction
    if (this.vx > 0) this.facing = 'right';
    else if (this.vx < 0) this.facing = 'left';
    else if (this.vy > 0) this.facing = 'down';
    else if (this.vy < 0) this.facing = 'up';
    
    // Handle stamina
    if (this.isSprinting && (this.vx !== 0 || this.vy !== 0)) {
      this.stamina = Math.max(0, this.stamina - this.staminaDrain);
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegen);
    }
  }
  
  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Draw shadow
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.ellipse(0, 15, this.width * 0.8, 8);
    
    // Body (yellow/tan color for Niko)
    p.fill(255, 230, 180);
    p.stroke(100, 80, 60);
    p.strokeWeight(2);
    p.ellipse(0, 0, this.width, this.height);
    
    // Hair (brown)
    p.fill(120, 80, 50);
    p.noStroke();
    const bobOffset = Math.sin(this.walkCycle) * 2;
    p.ellipse(-8, -10 + bobOffset, 16, 16);
    p.ellipse(8, -10 + bobOffset, 16, 16);
    p.ellipse(0, -12 + bobOffset, 18, 18);
    
    // Eyes
    p.fill(50, 40, 30);
    const eyeOffset = this.facing === 'up' ? -2 : this.facing === 'down' ? 2 : 0;
    p.ellipse(-6, eyeOffset, 4, 6);
    p.ellipse(6, eyeOffset, 4, 6);
    
    // Draw lightbulb if carrying
    if (gameState.hasLightbulb) {
      p.push();
      p.translate(0, -25);
      
      // Glow
      p.fill(255, 255, 150, 100);
      p.noStroke();
      p.ellipse(0, 0, 30, 30);
      
      // Bulb
      p.fill(255, 255, 200);
      p.stroke(200, 200, 100);
      p.strokeWeight(2);
      p.ellipse(0, 0, 18, 18);
      
      // Base
      p.fill(180, 180, 180);
      p.rect(-4, 8, 8, 6);
      
      // Light rays
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + p.frameCount * 0.05;
        const x = Math.cos(angle) * 15;
        const y = Math.sin(angle) * 15;
        p.stroke(255, 255, 150, 150);
        p.strokeWeight(1);
        p.line(0, 0, x, y);
      }
      
      p.pop();
    }
    
    p.pop();
  }
}

export class Switch {
  constructor(x, y, id) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 30;
    this.id = id;
    this.activated = false;
    this.requiredForDoors = [];
  }
  
  canInteract(player) {
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    return dist < 50;
  }
  
  toggle() {
    this.activated = !this.activated;
    if (this.activated) {
      gameState.switchesActivated++;
      gameState.score += 100;
    } else {
      gameState.switchesActivated--;
      gameState.score -= 100;
    }
  }
  
  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Base
    p.fill(60, 60, 70);
    p.stroke(40, 40, 50);
    p.strokeWeight(2);
    p.rect(-this.width / 2, -this.height / 2, this.width, this.height, 4);
    
    // Button
    const buttonColor = this.activated ? [100, 255, 100] : [255, 100, 100];
    p.fill(...buttonColor);
    p.stroke(0);
    p.strokeWeight(2);
    const buttonY = this.activated ? 2 : -2;
    p.circle(0, buttonY, 16);
    
    // Indicator light
    if (this.activated) {
      p.fill(150, 255, 150, 200);
      p.noStroke();
      p.circle(0, -8, 8);
    }
    
    p.pop();
  }
}

export class Door {
  constructor(x, y, orientation, requiredSwitches) {
    this.x = x;
    this.y = y;
    this.orientation = orientation; // 'horizontal' or 'vertical'
    this.requiredSwitches = requiredSwitches;
    this.width = orientation === 'horizontal' ? 80 : 20;
    this.height = orientation === 'horizontal' ? 20 : 80;
    this.isOpen = false;
    this.openAmount = 0; // 0 = closed, 1 = fully open
  }
  
  update() {
    // Check if all required switches are activated
    const shouldBeOpen = this.requiredSwitches.every(id => {
      const sw = gameState.switches.find(s => s.id === id);
      return sw && sw.activated;
    });
    
    if (shouldBeOpen && !this.isOpen) {
      this.isOpen = true;
    }
    
    // Animate door opening
    if (this.isOpen && this.openAmount < 1) {
      this.openAmount = Math.min(1, this.openAmount + 0.05);
    }
  }
  
  blocksPlayer(player) {
    if (this.openAmount > 0.8) return false; // Mostly open
    
    return this.collidesWith(player.x, player.y, player.width, player.height);
  }
  
  collidesWith(x, y, w, h) {
    const p = window.gameInstance;
    return p.collideRectRect(
      this.x - this.width / 2, this.y - this.height / 2, this.width, this.height,
      x - w / 2, y - h / 2, w, h
    );
  }
  
  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    
    if (this.orientation === 'horizontal') {
      // Horizontal door splits up and down
      const offset = this.openAmount * 30;
      
      // Top part
      p.fill(80, 60, 40);
      p.stroke(60, 40, 20);
      p.strokeWeight(2);
      p.rect(-this.width / 2, -this.height / 2 - offset, this.width, this.height / 2);
      
      // Bottom part
      p.rect(-this.width / 2, offset, this.width, this.height / 2);
      
      // Lock indicator
      if (!this.isOpen) {
        p.fill(200, 50, 50);
        p.noStroke();
        p.circle(0, 0, 12);
        p.fill(255);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(10);
        p.text('🔒', 0, 0);
      }
    } else {
      // Vertical door splits left and right
      const offset = this.openAmount * 30;
      
      // Left part
      p.fill(80, 60, 40);
      p.stroke(60, 40, 20);
      p.strokeWeight(2);
      p.rect(-this.width / 2 - offset, -this.height / 2, this.width / 2, this.height);
      
      // Right part
      p.rect(offset, -this.height / 2, this.width / 2, this.height);
      
      // Lock indicator
      if (!this.isOpen) {
        p.fill(200, 50, 50);
        p.noStroke();
        p.circle(0, 0, 12);
        p.fill(255);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(10);
        p.text('🔒', 0, 0);
      }
    }
    
    p.pop();
  }
}

export class Lightbulb {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 40;
    this.pickedUp = false;
    this.glowPhase = 0;
  }
  
  canPickup(player) {
    if (this.pickedUp) return false;
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    return dist < 50;
  }
  
  update() {
    this.glowPhase = (this.glowPhase + 0.05) % (Math.PI * 2);
  }
  
  draw(p) {
    if (this.pickedUp) return;
    
    p.push();
    p.translate(this.x, this.y);
    
    // Glow effect
    const glowSize = 60 + Math.sin(this.glowPhase) * 10;
    p.fill(255, 255, 150, 80);
    p.noStroke();
    p.ellipse(0, 0, glowSize, glowSize);
    
    // Bulb
    p.fill(255, 255, 200);
    p.stroke(200, 200, 100);
    p.strokeWeight(2);
    p.ellipse(0, 0, 25, 30);
    
    // Base
    p.fill(180, 180, 180);
    p.rect(-6, 12, 12, 10);
    
    // Light rays
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + this.glowPhase;
      const length = 25 + Math.sin(this.glowPhase + i) * 5;
      const x = Math.cos(angle) * length;
      const y = Math.sin(angle) * length;
      p.stroke(255, 255, 150, 200);
      p.strokeWeight(2);
      p.line(0, 0, x, y);
    }
    
    // Floating animation
    p.translate(0, Math.sin(this.glowPhase * 2) * 3);
    
    p.pop();
    
    // Draw "Z" prompt
    if (!this.pickedUp) {
      const player = gameState.player;
      if (player && this.canPickup(player)) {
        p.push();
        p.fill(255, 255, 255);
        p.stroke(0);
        p.strokeWeight(2);
        p.textAlign(p.CENTER);
        p.textSize(16);
        p.text('[Z] Pick up', this.x, this.y - 40);
        p.pop();
      }
    }
  }
}

export class SunChamber {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 80;
    this.height = 80;
    this.activated = false;
    this.activationProgress = 0;
  }
  
  canActivate(player) {
    if (!gameState.hasLightbulb) return false;
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    return dist < 60;
  }
  
  activate() {
    this.activated = true;
    gameState.score += 1000;
  }
  
  update() {
    if (this.activated && this.activationProgress < 1) {
      this.activationProgress = Math.min(1, this.activationProgress + 0.02);
    }
  }
  
  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Base pedestal
    p.fill(100, 100, 120);
    p.stroke(80, 80, 100);
    p.strokeWeight(3);
    p.rect(-30, 20, 60, 30);
    
    // Column
    p.fill(120, 120, 140);
    p.rect(-25, -10, 50, 30);
    
    // Top platform
    p.fill(140, 140, 160);
    p.rect(-35, -20, 70, 10);
    
    // Center socket
    p.fill(60, 60, 80);
    p.stroke(40, 40, 60);
    p.strokeWeight(2);
    p.circle(0, -15, 30);
    
    if (this.activated) {
      // Sun restoration animation
      const sunSize = this.activationProgress * 50;
      const rays = 16;
      
      // Sun glow
      p.fill(255, 255, 100, 150);
      p.noStroke();
      p.circle(0, -15, sunSize * 1.5);
      
      // Sun core
      p.fill(255, 255, 150);
      p.circle(0, -15, sunSize);
      
      // Rays
      for (let i = 0; i < rays; i++) {
        const angle = (i / rays) * Math.PI * 2 + p.frameCount * 0.05;
        const rayLength = sunSize * 0.8 * this.activationProgress;
        const x1 = Math.cos(angle) * (sunSize / 2);
        const y1 = Math.sin(angle) * (sunSize / 2) - 15;
        const x2 = Math.cos(angle) * (sunSize / 2 + rayLength);
        const y2 = Math.sin(angle) * (sunSize / 2 + rayLength) - 15;
        p.stroke(255, 255, 150, 200);
        p.strokeWeight(3);
        p.line(x1, y1, x2, y2);
      }
    } else {
      // Draw prompt if player has lightbulb
      const player = gameState.player;
      if (player && this.canActivate(player)) {
        p.fill(255, 255, 255);
        p.stroke(0);
        p.strokeWeight(2);
        p.textAlign(p.CENTER);
        p.textSize(16);
        p.text('[Z] Place lightbulb', 0, -60);
      }
    }
    
    p.pop();
  }
}

export class Wall {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
  
  collidesWith(x, y, w, h) {
    const p = window.gameInstance;
    return p.collideRectRect(
      this.x, this.y, this.width, this.height,
      x - w / 2, y - h / 2, w, h
    );
  }
  
  draw(p) {
    p.fill(80, 80, 100);
    p.stroke(60, 60, 80);
    p.strokeWeight(2);
    p.rect(this.x, this.y, this.width, this.height);
    
    // Texture
    p.stroke(90, 90, 110);
    p.strokeWeight(1);
    for (let i = 0; i < this.width; i += 20) {
      p.line(this.x + i, this.y, this.x + i, this.y + this.height);
    }
    for (let i = 0; i < this.height; i += 20) {
      p.line(this.x, this.y + i, this.x + this.width, this.y + i);
    }
  }
}