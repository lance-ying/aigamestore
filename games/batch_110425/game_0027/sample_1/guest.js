// guest.js - Guest entity and behavior

import { gameState, GRID_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, GRID_COLS, GRID_ROWS } from './globals.js';

export class Guest {
  constructor(p) {
    this.p = p;
    // Start from entrance (bottom center)
    this.gridX = Math.floor(GRID_COLS / 2);
    this.gridY = GRID_ROWS - 1;
    this.screenX = GRID_OFFSET_X + this.gridX * GRID_SIZE + GRID_SIZE / 2;
    this.screenY = GRID_OFFSET_Y + this.gridY * GRID_SIZE + GRID_SIZE / 2;
    
    this.targetBuilding = null;
    this.targetX = this.screenX;
    this.targetY = this.screenY;
    this.speed = 1;
    
    this.satisfaction = 50;
    this.money = 50 + Math.floor(this.p.random(50));
    this.visitedBuildings = [];
    this.state = 'EXPLORING'; // EXPLORING, MOVING, USING, LEAVING
    this.stateTimer = 0;
    this.waitTime = 0;
    this.hasGift = false;
    this.color = [
      100 + Math.floor(this.p.random(155)),
      100 + Math.floor(this.p.random(155)),
      100 + Math.floor(this.p.random(155))
    ];
  }
  
  update(currentTime) {
    this.stateTimer++;
    
    switch (this.state) {
      case 'EXPLORING':
        this.explore();
        break;
      case 'MOVING':
        this.moveToTarget();
        break;
      case 'USING':
        this.useBuilding(currentTime);
        break;
      case 'LEAVING':
        this.leave();
        break;
    }
    
    // Update satisfaction over time
    if (this.stateTimer % 60 === 0 && this.state !== 'LEAVING') {
      this.satisfaction -= 0.5; // Slight decrease if not entertained
    }
    
    // Leave if too dissatisfied
    if (this.satisfaction <= 0 && this.state !== 'LEAVING') {
      this.state = 'LEAVING';
      this.targetX = GRID_OFFSET_X + GRID_COLS / 2 * GRID_SIZE;
      this.targetY = GRID_OFFSET_Y + GRID_ROWS * GRID_SIZE + 20;
    }
  }
  
  explore() {
    // Find an unvisited building
    const availableBuildings = gameState.buildings.filter(b => !this.visitedBuildings.includes(b));
    
    if (availableBuildings.length > 0 && this.stateTimer > 30) {
      // Choose a random building
      const building = availableBuildings[Math.floor(this.p.random(availableBuildings.length))];
      this.targetBuilding = building;
      this.targetX = building.screenX + building.width * GRID_SIZE / 2;
      this.targetY = building.screenY + building.height * GRID_SIZE / 2;
      this.state = 'MOVING';
      this.stateTimer = 0;
    } else if (availableBuildings.length === 0 && this.visitedBuildings.length > 0) {
      // Visited everything, time to leave
      this.state = 'LEAVING';
      this.targetX = GRID_OFFSET_X + GRID_COLS / 2 * GRID_SIZE;
      this.targetY = GRID_OFFSET_Y + GRID_ROWS * GRID_SIZE + 20;
    }
  }
  
  moveToTarget() {
    const dx = this.targetX - this.screenX;
    const dy = this.targetY - this.screenY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < this.speed) {
      this.screenX = this.targetX;
      this.screenY = this.targetY;
      
      if (this.targetBuilding) {
        this.state = 'USING';
        this.stateTimer = 0;
        this.waitTime = 60 + Math.floor(this.p.random(60));
        this.targetBuilding.queue.push(this);
      }
    } else {
      this.screenX += (dx / dist) * this.speed;
      this.screenY += (dy / dist) * this.speed;
    }
  }
  
  useBuilding(currentTime) {
    if (this.stateTimer > this.waitTime) {
      // Done using building
      if (this.targetBuilding) {
        this.satisfaction += this.targetBuilding.data.satisfaction;
        this.satisfaction = Math.min(100, this.satisfaction);
        this.visitedBuildings.push(this.targetBuilding);
        
        // Remove from queue
        const queueIndex = this.targetBuilding.queue.indexOf(this);
        if (queueIndex > -1) {
          this.targetBuilding.queue.splice(queueIndex, 1);
        }
        
        this.targetBuilding = null;
      }
      
      this.state = 'EXPLORING';
      this.stateTimer = 0;
    }
  }
  
  leave() {
    const dx = this.targetX - this.screenX;
    const dy = this.targetY - this.screenY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < this.speed) {
      this.markForRemoval = true;
      
      // Calculate SNS followers based on satisfaction
      if (this.satisfaction >= 80) {
        gameState.snsFollowers += 3;
      } else if (this.satisfaction >= 60) {
        gameState.snsFollowers += 1;
      } else if (this.satisfaction < 30) {
        gameState.snsFollowers = Math.max(0, gameState.snsFollowers - 1);
      }
      
      gameState.totalGuestsServed++;
    } else {
      this.screenX += (dx / dist) * this.speed;
      this.screenY += (dy / dist) * this.speed;
    }
  }
  
  giveGift(giftData) {
    if (!this.hasGift) {
      this.satisfaction += giftData.satisfaction;
      this.satisfaction = Math.min(100, this.satisfaction);
      this.hasGift = true;
      return true;
    }
    return false;
  }
  
  render(p) {
    p.push();
    
    // Guest body
    p.fill(...this.color);
    p.stroke(0);
    p.strokeWeight(1);
    p.ellipse(this.screenX, this.screenY, 8, 8);
    
    // Hat if satisfied
    if (this.satisfaction > 70) {
      p.fill(255, 200, 0);
      p.noStroke();
      p.arc(this.screenX, this.screenY - 4, 8, 6, p.PI, 0);
    }
    
    // Gift indicator
    if (this.hasGift) {
      p.fill(255, 100, 200);
      p.noStroke();
      p.ellipse(this.screenX + 4, this.screenY - 4, 4, 4);
    }
    
    // Satisfaction bar
    if (this.state !== 'LEAVING') {
      const barWidth = 10;
      const barHeight = 2;
      p.fill(200, 0, 0);
      p.noStroke();
      p.rect(this.screenX - barWidth / 2, this.screenY - 10, barWidth, barHeight);
      p.fill(0, 200, 0);
      p.rect(this.screenX - barWidth / 2, this.screenY - 10, barWidth * (this.satisfaction / 100), barHeight);
    }
    
    p.pop();
  }
}

export function spawnGuest(p) {
  const guest = new Guest(p);
  gameState.guests.push(guest);
  gameState.entities.push(guest);
  return guest;
}

export function updateGuests(currentTime) {
  // Update all guests
  gameState.guests.forEach(guest => guest.update(currentTime));
  
  // Remove guests marked for removal
  gameState.guests = gameState.guests.filter(guest => !guest.markForRemoval);
  gameState.entities = gameState.entities.filter(entity => !entity.markForRemoval);
  
  // Spawn new guests based on park rating and time
  const spawnRate = 3000 - Math.min(2000, gameState.snsFollowers * 2);
  if (currentTime - gameState.lastGuestSpawn > spawnRate && gameState.guests.length < 20) {
    spawnGuest(gameState.guests[0]?.p || window.gameInstance);
    gameState.lastGuestSpawn = currentTime;
  }
}

export function calculateAverageSatisfaction() {
  if (gameState.guests.length === 0) return 50;
  
  const total = gameState.guests.reduce((sum, guest) => sum + guest.satisfaction, 0);
  return total / gameState.guests.length;
}