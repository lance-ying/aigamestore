// building.js - Building class and management

import { gameState, GRID_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y } from './globals.js';

export class Building {
  constructor(type, typeData, gridX, gridY) {
    this.type = type;
    this.data = typeData;
    this.gridX = gridX;
    this.gridY = gridY;
    this.screenX = GRID_OFFSET_X + gridX * GRID_SIZE;
    this.screenY = GRID_OFFSET_Y + gridY * GRID_SIZE;
    this.width = typeData.width;
    this.height = typeData.height;
    this.lastIncomeTime = 0;
    this.guestsServed = 0;
    this.queue = [];
  }
  
  update(currentTime) {
    // Generate income periodically if guests are present
    if (this.queue.length > 0 && currentTime - this.lastIncomeTime > 2000) {
      gameState.money += this.data.income;
      gameState.totalIncome += this.data.income;
      this.lastIncomeTime = currentTime;
      this.guestsServed++;
    }
  }
  
  render(p) {
    p.push();
    // Building base
    p.fill(...this.data.color);
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(this.screenX, this.screenY, this.width * GRID_SIZE, this.height * GRID_SIZE, 5);
    
    // Building details
    if (this.type === 'SMALL_POOL' || this.type === 'LARGE_POOL' || this.type === 'OUTDOOR_POOL') {
      // Water ripple effect
      p.noStroke();
      p.fill(255, 255, 255, 80);
      const rippleOffset = (gameState.gameTime * 0.05) % 10;
      p.ellipse(this.screenX + this.width * GRID_SIZE / 2, this.screenY + this.height * GRID_SIZE / 2 - rippleOffset, 10, 5);
    } else if (this.type === 'WATER_SLIDE') {
      // Slide path
      p.stroke(255, 220, 150);
      p.strokeWeight(3);
      p.noFill();
      p.beginShape();
      p.vertex(this.screenX + 5, this.screenY + 5);
      p.vertex(this.screenX + this.width * GRID_SIZE / 2, this.screenY + this.height * GRID_SIZE / 3);
      p.vertex(this.screenX + this.width * GRID_SIZE - 5, this.screenY + this.height * GRID_SIZE - 5);
      p.endShape();
    } else if (this.type === 'RESTAURANT') {
      // Table icon
      p.fill(139, 69, 19);
      p.noStroke();
      p.rect(this.screenX + 10, this.screenY + 15, 20, 15, 2);
    } else if (this.type === 'LAZY_RIVER') {
      // Flowing water effect
      p.noStroke();
      p.fill(255, 255, 255, 60);
      const flow = (gameState.gameTime * 0.1) % (this.width * GRID_SIZE);
      for (let i = 0; i < 3; i++) {
        p.ellipse(this.screenX + flow + i * 20, this.screenY + this.height * GRID_SIZE / 2, 8, 4);
      }
    }
    
    // Queue indicator
    if (this.queue.length > 0) {
      p.fill(255, 200, 0);
      p.noStroke();
      p.textSize(10);
      p.textAlign(p.RIGHT, p.TOP);
      p.text(this.queue.length, this.screenX + this.width * GRID_SIZE - 2, this.screenY + 2);
    }
    
    p.pop();
  }
}

export function canPlaceBuilding(gridX, gridY, width, height) {
  if (gridX < 0 || gridY < 0 || gridX + width > gameState.grid[0].length || gridY + height > gameState.grid.length) {
    return false;
  }
  
  for (let y = gridY; y < gridY + height; y++) {
    for (let x = gridX; x < gridX + width; x++) {
      if (gameState.grid[y][x] !== null) {
        return false;
      }
    }
  }
  return true;
}

export function placeBuilding(type, typeData, gridX, gridY) {
  if (!canPlaceBuilding(gridX, gridY, typeData.width, typeData.height)) {
    return false;
  }
  
  if (gameState.money < typeData.cost) {
    return false;
  }
  
  const building = new Building(type, typeData, gridX, gridY);
  gameState.buildings.push(building);
  gameState.entities.push(building);
  gameState.money -= typeData.cost;
  
  // Mark grid cells as occupied
  for (let y = gridY; y < gridY + typeData.height; y++) {
    for (let x = gridX; x < gridX + typeData.width; x++) {
      gameState.grid[y][x] = building;
    }
  }
  
  return true;
}

export function deleteBuilding(gridX, gridY) {
  const building = gameState.grid[gridY][gridX];
  if (!building) return false;
  
  // Remove from grid
  for (let y = building.gridY; y < building.gridY + building.height; y++) {
    for (let x = building.gridX; x < building.gridX + building.width; x++) {
      gameState.grid[y][x] = null;
    }
  }
  
  // Refund half the cost
  gameState.money += Math.floor(building.data.cost * 0.5);
  
  // Remove from buildings array
  const index = gameState.buildings.indexOf(building);
  if (index > -1) {
    gameState.buildings.splice(index, 1);
  }
  
  // Remove from entities
  const entityIndex = gameState.entities.indexOf(building);
  if (entityIndex > -1) {
    gameState.entities.splice(entityIndex, 1);
  }
  
  return true;
}

export function getBuildingAt(gridX, gridY) {
  if (gridX < 0 || gridY < 0 || gridY >= gameState.grid.length || gridX >= gameState.grid[0].length) {
    return null;
  }
  return gameState.grid[gridY][gridX];
}