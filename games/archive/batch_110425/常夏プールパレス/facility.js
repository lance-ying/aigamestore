// facility.js - Facility management

import { FACILITY_TYPES, GRID_SIZE } from './globals.js';

export class Facility {
  constructor(type, gridX, gridY) {
    this.type = type;
    this.gridX = gridX;
    this.gridY = gridY;
    this.x = gridX * GRID_SIZE;
    this.y = gridY * GRID_SIZE;
    this.level = 1;
    this.occupants = [];
    this.config = FACILITY_TYPES[type];
    this.usageTimer = 0;
    this.animationPhase = 0;
  }

  getCapacity() {
    return this.config.capacity * this.level;
  }

  getAppeal() {
    return this.config.appeal * this.level;
  }

  canAcceptCustomer() {
    return this.occupants.length < this.getCapacity();
  }

  addCustomer(customer) {
    if (this.canAcceptCustomer()) {
      this.occupants.push(customer);
      return true;
    }
    return false;
  }

  removeCustomer(customer) {
    const index = this.occupants.indexOf(customer);
    if (index > -1) {
      this.occupants.splice(index, 1);
    }
  }

  update() {
    this.animationPhase += 0.05;
    this.usageTimer++;
  }

  render(p) {
    const config = this.config;
    const size = GRID_SIZE - 4;
    
    p.push();
    p.translate(this.x, this.y);
    
    // Base
    p.fill(...config.color);
    p.stroke(255);
    p.strokeWeight(2);
    p.rect(2, 2, size, size, 5);
    
    // Level indicator
    if (this.level > 1) {
      p.fill(255, 220, 0);
      p.noStroke();
      for (let i = 0; i < this.level; i++) {
        p.circle(8 + i * 6, 8, 4);
      }
    }
    
    // Animation
    if (this.occupants.length > 0) {
      p.noStroke();
      p.fill(255, 255, 255, 100 + Math.sin(this.animationPhase) * 50);
      p.rect(4, 4, size - 4, size - 4, 3);
    }
    
    // Occupant count
    if (this.occupants.length > 0) {
      p.fill(0);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(12);
      p.text(this.occupants.length, size / 2, size / 2);
    }
    
    p.pop();
  }

  getUpgradeCost() {
    return Math.floor(this.config.cost * this.level * 1.5);
  }

  upgrade() {
    this.level++;
  }
}