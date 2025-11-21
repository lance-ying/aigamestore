// entities.js
import { gameState, FACILITY_TYPES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Facility {
  constructor(gridX, gridY, type, p) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.type = type;
    this.data = FACILITY_TYPES[type.toUpperCase()];
    this.p = p;
    this.occupied = false;
    this.animationOffset = p.random(1000);
  }

  draw(cameraX, cameraY, gridSize) {
    const screenX = this.gridX * gridSize - cameraX;
    const screenY = this.gridY * gridSize - cameraY;
    
    this.p.push();
    this.p.translate(screenX, screenY);
    
    // Draw facility background
    this.p.fill(...(this.occupied ? [100, 150, 100] : [80, 120, 80]));
    this.p.stroke(60, 90, 60);
    this.p.strokeWeight(2);
    this.p.rect(2, 2, gridSize - 4, gridSize - 4, 4);
    
    // Draw icon representation
    this.p.noStroke();
    const time = this.p.frameCount * 0.05 + this.animationOffset;
    
    switch(this.type) {
      case 'tent':
        this.p.fill(200, 100, 50);
        this.p.triangle(gridSize * 0.2, gridSize * 0.7, gridSize * 0.5, gridSize * 0.3, gridSize * 0.8, gridSize * 0.7);
        break;
      case 'fishing':
        this.p.fill(50, 150, 200);
        this.p.ellipse(gridSize * 0.5, gridSize * 0.5, gridSize * 0.6);
        this.p.stroke(139, 69, 19);
        this.p.strokeWeight(2);
        this.p.line(gridSize * 0.3, gridSize * 0.6, gridSize * 0.6, gridSize * 0.3);
        break;
      case 'campfire':
        this.p.fill(255, 150, 0, 200 + Math.sin(time) * 50);
        this.p.ellipse(gridSize * 0.5, gridSize * 0.5, gridSize * 0.4);
        this.p.fill(255, 50, 0, 150 + Math.sin(time * 1.5) * 50);
        this.p.ellipse(gridSize * 0.5, gridSize * 0.4, gridSize * 0.3);
        break;
      case 'bug':
        this.p.fill(100, 200, 100);
        this.p.rect(gridSize * 0.3, gridSize * 0.3, gridSize * 0.4, gridSize * 0.4, 4);
        this.p.fill(255, 200, 0);
        this.p.ellipse(gridSize * 0.5, gridSize * 0.5, gridSize * 0.2);
        break;
      case 'picnic':
        this.p.fill(200, 50, 50);
        this.p.rect(gridSize * 0.2, gridSize * 0.4, gridSize * 0.6, gridSize * 0.3, 2);
        this.p.fill(150, 100, 50);
        this.p.rect(gridSize * 0.3, gridSize * 0.5, gridSize * 0.15, gridSize * 0.15);
        break;
      case 'playground':
        this.p.fill(255, 100, 150);
        this.p.rect(gridSize * 0.25, gridSize * 0.4, gridSize * 0.5, gridSize * 0.2, 4);
        this.p.fill(100, 100, 255);
        this.p.rect(gridSize * 0.3, gridSize * 0.6, gridSize * 0.1, gridSize * 0.15);
        this.p.rect(gridSize * 0.6, gridSize * 0.6, gridSize * 0.1, gridSize * 0.15);
        break;
    }
    
    this.p.pop();
  }

  isOccupied() {
    return this.occupied;
  }

  setOccupied(occupied) {
    this.occupied = occupied;
  }
}

export class Camper {
  constructor(x, y, p) {
    this.x = x;
    this.y = y;
    this.p = p;
    this.targetX = x;
    this.targetY = y;
    this.speed = 0.5 + p.random(0.3);
    this.satisfaction = 0;
    this.maxSatisfaction = 10;
    this.currentWish = null;
    this.wishTimer = 0;
    this.wishDuration = 300;
    this.atFacility = null;
    this.activityTimer = 0;
    this.activityDuration = 120;
    this.color = [p.random(150, 255), p.random(150, 255), p.random(150, 255)];
    this.idle = false;
    this.idleTimer = 0;
  }

  update(facilities, gridSize) {
    // Update wish timer
    if (this.currentWish && !this.atFacility) {
      this.wishTimer++;
      if (this.wishTimer > this.wishDuration) {
        this.currentWish = null;
        this.wishTimer = 0;
      }
    }

    // Activity at facility
    if (this.atFacility) {
      this.activityTimer++;
      if (this.activityTimer > this.activityDuration) {
        this.satisfaction = Math.min(this.maxSatisfaction, this.satisfaction + this.atFacility.data.satisfaction);
        this.atFacility.setOccupied(false);
        this.atFacility = null;
        this.activityTimer = 0;
        this.currentWish = null;
        this.wishTimer = 0;
        gameState.wishFulfillmentCount++;
        this.idle = true;
        this.idleTimer = 0;
      }
      return;
    }

    // Idle behavior
    if (this.idle) {
      this.idleTimer++;
      if (this.idleTimer > 60) {
        this.idle = false;
        this.idleTimer = 0;
      }
      return;
    }

    // Generate wish if none
    if (!this.currentWish && this.p.random() < 0.01) {
      const availableTypes = Object.keys(FACILITY_TYPES).map(k => k.toLowerCase());
      this.currentWish = this.p.random(availableTypes);
      this.wishTimer = 0;
    }

    // Find and move to facility if wish exists
    if (this.currentWish) {
      const availableFacilities = facilities.filter(f => 
        f.type === this.currentWish && !f.isOccupied()
      );
      
      if (availableFacilities.length > 0) {
        const targetFacility = availableFacilities[0];
        this.targetX = targetFacility.gridX * gridSize + gridSize / 2;
        this.targetY = targetFacility.gridY * gridSize + gridSize / 2;
        
        // Check if reached facility
        const dist = this.p.dist(this.x, this.y, this.targetX, this.targetY);
        if (dist < 5) {
          this.atFacility = targetFacility;
          targetFacility.setOccupied(true);
          this.activityTimer = 0;
        }
      }
    }

    // Move towards target
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 1) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }

    // Wander if no target
    if (!this.currentWish && this.p.random() < 0.01) {
      this.targetX = this.p.random(50, gameState.campsiteWidth * gridSize - 50);
      this.targetY = this.p.random(50, gameState.campsiteHeight * gridSize - 50);
    }
  }

  draw(cameraX, cameraY) {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    this.p.push();
    
    // Draw camper body
    this.p.fill(...this.color);
    this.p.stroke(0);
    this.p.strokeWeight(1);
    this.p.ellipse(screenX, screenY, 12, 12);
    
    // Draw eyes
    this.p.fill(0);
    this.p.noStroke();
    this.p.ellipse(screenX - 2, screenY - 1, 2, 2);
    this.p.ellipse(screenX + 2, screenY - 1, 2, 2);
    
    // Draw wish bubble
    if (this.currentWish && !this.atFacility) {
      this.p.fill(255, 255, 255, 200);
      this.p.stroke(100);
      this.p.strokeWeight(1);
      this.p.ellipse(screenX + 10, screenY - 15, 20, 20);
      
      this.p.fill(0);
      this.p.noStroke();
      this.p.textAlign(this.p.CENTER, this.p.CENTER);
      this.p.textSize(10);
      const icon = FACILITY_TYPES[this.currentWish.toUpperCase()].icon;
      this.p.text(icon, screenX + 10, screenY - 15);
    }
    
    // Draw satisfaction bar
    const barWidth = 20;
    const barHeight = 3;
    this.p.fill(50);
    this.p.noStroke();
    this.p.rect(screenX - barWidth / 2, screenY + 10, barWidth, barHeight);
    this.p.fill(100, 200, 100);
    this.p.rect(screenX - barWidth / 2, screenY + 10, (this.satisfaction / this.maxSatisfaction) * barWidth, barHeight);
    
    this.p.pop();
  }

  getSatisfaction() {
    return this.satisfaction;
  }
}