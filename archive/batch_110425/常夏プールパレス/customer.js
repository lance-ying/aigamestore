// customer.js - Customer management

import { gameState, FACILITY_TYPES, GRID_SIZE } from './globals.js';

export class Customer {
  constructor(p) {
    this.x = p.random([0, 11]) * GRID_SIZE + GRID_SIZE / 2;
    this.y = p.random([0, 7]) * GRID_SIZE + GRID_SIZE / 2;
    this.targetFacility = null;
    this.currentFacility = null;
    this.state = "WANDERING";
    this.satisfactionContribution = 0;
    this.timeAtFacility = 0;
    this.speed = 1.5;
    this.color = [p.random(150, 255), p.random(150, 255), p.random(150, 255)];
    this.preferredType = this.choosePreferredType(p);
    this.moneySpent = 0;
    this.wanderTimer = 0;
    this.maxWanderTime = 300;
  }

  choosePreferredType(p) {
    const unlocked = gameState.unlockedFacilities;
    return p.random(unlocked);
  }

  findTarget() {
    const availableFacilities = gameState.facilities.filter(f => 
      f.type === this.preferredType && f.canAcceptCustomer()
    );

    if (availableFacilities.length === 0) {
      const anyFacilities = gameState.facilities.filter(f => f.canAcceptCustomer());
      if (anyFacilities.length > 0) {
        this.targetFacility = anyFacilities[Math.floor(Math.random() * anyFacilities.length)];
      }
    } else {
      this.targetFacility = availableFacilities[Math.floor(Math.random() * availableFacilities.length)];
    }

    if (this.targetFacility) {
      this.state = "MOVING";
    }
  }

  update(p) {
    switch (this.state) {
      case "WANDERING":
        this.wanderTimer++;
        if (this.wanderTimer > this.maxWanderTime) {
          this.state = "LEAVING";
        } else if (this.wanderTimer % 60 === 0) {
          this.findTarget();
        }
        break;

      case "MOVING":
        if (this.targetFacility) {
          const tx = this.targetFacility.x + GRID_SIZE / 2;
          const ty = this.targetFacility.y + GRID_SIZE / 2;
          const dx = tx - this.x;
          const dy = ty - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 5) {
            if (this.targetFacility.addCustomer(this)) {
              this.currentFacility = this.targetFacility;
              this.state = "USING";
              this.timeAtFacility = 0;
            } else {
              this.state = "WANDERING";
              this.targetFacility = null;
            }
          } else {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
          }
        }
        break;

      case "USING":
        if (this.currentFacility) {
          this.timeAtFacility++;
          
          if (this.timeAtFacility === 60) {
            const moneyEarned = Math.floor(this.currentFacility.getAppeal() * 0.5 + 5);
            gameState.money += moneyEarned;
            this.moneySpent = moneyEarned;
            
            const satisfactionGain = this.currentFacility.type === this.preferredType ? 2 : 1;
            this.satisfactionContribution = satisfactionGain;
          }

          if (this.timeAtFacility > 180) {
            this.currentFacility.removeCustomer(this);
            this.currentFacility = null;
            this.state = "LEAVING";
          }
        }
        break;

      case "LEAVING":
        this.x += (this.x < 300 ? -1 : 1) * this.speed;
        this.y += (this.y < 200 ? -1 : 1) * this.speed;
        
        if (this.x < -20 || this.x > 620 || this.y < -20 || this.y > 420) {
          return true;
        }
        break;
    }
    return false;
  }

  render(p) {
    p.push();
    p.fill(...this.color);
    p.stroke(0);
    p.strokeWeight(1);
    p.circle(this.x, this.y, 8);
    
    if (this.state === "USING" && this.satisfactionContribution > 0) {
      p.fill(100, 255, 100);
      p.noStroke();
      p.circle(this.x, this.y - 10, 4);
    }
    p.pop();
  }
}