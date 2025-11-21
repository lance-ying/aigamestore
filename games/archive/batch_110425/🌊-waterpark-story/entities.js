// entities.js - Game entity classes

import { gameState, GRID_SIZE, GRID_COLS, GRID_ROWS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Facility {
  constructor(type, gridX, gridY) {
    this.type = type;
    this.gridX = gridX;
    this.gridY = gridY;
    this.x = gridX * GRID_SIZE + GRID_SIZE / 2;
    this.y = gridY * GRID_SIZE + GRID_SIZE / 2;
    this.active = true;
    this.lastUsed = 0;
  }

  update(frameCount) {
    // Facilities are static but track usage
  }

  render(p) {
    const facilityData = this.type;
    p.push();
    p.fill(...facilityData.color);
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(this.gridX * GRID_SIZE, this.gridY * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    
    p.fill(0);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    p.text(facilityData.symbol, this.x, this.y);
    p.pop();
  }
}

export class Guest {
  constructor(p) {
    this.x = p.random(CANVAS_WIDTH);
    this.y = -20;
    this.targetFacility = null;
    this.state = 'entering'; // entering, moving, using, leaving, happy
    this.satisfaction = 0;
    this.satisfaction_target = p.random(10, 30);
    this.speed = 1;
    this.color = [p.random(150, 255), p.random(150, 255), p.random(150, 255)];
    this.timer = 0;
    this.hasPaid = false;
    this.isFriend = false;
    this.usedFacilities = [];
  }

  update(p, facilities) {
    this.timer++;

    switch (this.state) {
      case 'entering':
        this.y += this.speed;
        if (this.y >= CANVAS_HEIGHT / 2) {
          this.state = 'moving';
          this.findTarget(facilities);
        }
        break;

      case 'moving':
        if (this.targetFacility) {
          const dx = this.targetFacility.x - this.x;
          const dy = this.targetFacility.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 5) {
            this.state = 'using';
            this.timer = 0;
            this.targetFacility.lastUsed = gameState.frameCount;
          } else {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
          }
        } else {
          this.findTarget(facilities);
        }
        break;

      case 'using':
        if (this.timer > 120) {
          if (!this.hasPaid) {
            gameState.money += this.targetFacility.type.income;
            gameState.score += this.targetFacility.type.income;
            this.satisfaction += this.targetFacility.type.satisfaction;
            this.hasPaid = true;
            this.usedFacilities.push(this.targetFacility.type.name);
          }

          if (this.satisfaction >= this.satisfaction_target || this.usedFacilities.length >= 3) {
            this.state = 'happy';
            this.timer = 0;
            
            if (p.random() < 0.4 && !this.isFriend) {
              gameState.snsFriends++;
              this.isFriend = true;
            }
          } else {
            this.state = 'moving';
            this.targetFacility = null;
            this.hasPaid = false;
          }
        }
        break;

      case 'happy':
        this.y -= this.speed;
        if (this.y < -20) {
          this.state = 'leaving';
        }
        break;
    }
  }

  findTarget(facilities) {
    const available = facilities.filter(f => 
      !this.usedFacilities.includes(f.type.name) && 
      f.active
    );
    
    if (available.length > 0) {
      const randomIndex = Math.floor(Math.random() * available.length);
      this.targetFacility = available[randomIndex];
    }
  }

  render(p) {
    p.push();
    p.fill(...this.color);
    p.stroke(0);
    p.strokeWeight(1);
    p.circle(this.x, this.y, 12);
    
    if (this.state === 'happy') {
      p.fill(255, 255, 0);
      p.noStroke();
      p.circle(this.x - 8, this.y - 8, 6);
      p.circle(this.x + 8, this.y - 8, 6);
    }
    p.pop();
  }
}

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.gridX = 0;
    this.gridY = 0;
  }

  update() {
    // Player is cursor-based, position updated by input
  }

  render(p) {
    // Player is represented by cursor selection
  }
}