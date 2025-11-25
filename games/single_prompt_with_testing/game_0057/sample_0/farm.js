// farm.js - Farm tile and crop management

import { gameState, TILE_SIZE, FARM_WIDTH, FARM_HEIGHT, CROP_DATA } from './globals.js';
import { CROP_STAGE_SEED, CROP_STAGE_SPROUT, CROP_STAGE_GROWING, CROP_STAGE_MATURE } from './globals.js';

export class FarmTile {
  constructor(gridX, gridY) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.x = gridX * TILE_SIZE;
    this.y = gridY * TILE_SIZE;
    
    // State
    this.tilled = false;
    this.watered = false;
    this.crop = null;
    
    // Visual
    this.grassHeight = Math.random() * 5;
  }
  
  till() {
    if (!this.tilled && !this.crop) {
      this.tilled = true;
      return true;
    }
    return false;
  }
  
  water() {
    if (this.tilled && !this.watered) {
      this.watered = true;
      return true;
    }
    return false;
  }
  
  plantCrop(cropType) {
    if (this.tilled && !this.crop) {
      this.crop = new Crop(this.gridX, this.gridY, cropType);
      return true;
    }
    return false;
  }
  
  harvest() {
    if (this.crop && this.crop.stage === CROP_STAGE_MATURE) {
      const value = this.crop.harvest();
      this.crop = null;
      this.tilled = false;
      this.watered = false;
      return value;
    }
    return null;
  }
  
  newDay() {
    // Water evaporates each day
    this.watered = false;
    
    // Update crop
    if (this.crop) {
      this.crop.newDay(this.watered);
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    if (this.tilled) {
      // Tilled soil
      if (this.watered) {
        p.fill(80, 60, 40);
      } else {
        p.fill(120, 90, 60);
      }
      p.noStroke();
      p.rect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
      
      // Soil texture
      p.stroke(100, 70, 50);
      p.strokeWeight(1);
      for (let i = 0; i < 3; i++) {
        p.line(5, 10 + i * 10, TILE_SIZE - 5, 10 + i * 10);
      }
    } else {
      // Grass
      p.fill(60, 120, 40);
      p.noStroke();
      p.rect(0, 0, TILE_SIZE, TILE_SIZE);
      
      // Grass blades
      p.stroke(70, 140, 50);
      p.strokeWeight(2);
      for (let i = 0; i < 5; i++) {
        const gx = 5 + i * 7;
        const gy = TILE_SIZE / 2 + Math.sin(this.grassHeight + i) * 3;
        p.line(gx, gy, gx, gy - 5);
      }
    }
    
    // Water sparkle effect
    if (this.watered) {
      p.noStroke();
      p.fill(150, 200, 255, 100);
      p.circle(TILE_SIZE / 2, TILE_SIZE / 2, 10);
    }
    
    // Render crop if exists
    if (this.crop) {
      this.crop.render(p);
    }
    
    p.pop();
  }
}

export class Crop {
  constructor(gridX, gridY, type) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.type = type;
    this.data = CROP_DATA[type];
    
    // Growth
    this.stage = CROP_STAGE_SEED;
    this.daysGrown = 0;
    this.daysWatered = 0;
    
    // Visual
    this.swayOffset = Math.random() * Math.PI * 2;
    
    gameState.crops.push(this);
  }
  
  newDay(wasWatered) {
    if (wasWatered) {
      this.daysWatered++;
      this.daysGrown++;
    }
    
    // Update growth stage
    const progress = this.daysGrown / this.data.growthTime;
    
    if (progress >= 1) {
      this.stage = CROP_STAGE_MATURE;
    } else if (progress >= 0.66) {
      this.stage = CROP_STAGE_GROWING;
    } else if (progress >= 0.33) {
      this.stage = CROP_STAGE_SPROUT;
    }
  }
  
  harvest() {
    // Remove from crops array
    const index = gameState.crops.indexOf(this);
    if (index > -1) {
      gameState.crops.splice(index, 1);
    }
    
    // Award money and experience
    gameState.money += this.data.sellPrice;
    gameState.score += this.data.sellPrice;
    
    // Add experience
    addFarmingExp(this.data.expGain);
    
    return this.data.sellPrice;
  }
  
  render(p) {
    const centerX = TILE_SIZE / 2;
    const centerY = TILE_SIZE / 2;
    const sway = Math.sin(gameState.frameCount * 0.05 + this.swayOffset) * 2;
    
    p.push();
    p.translate(centerX + sway, centerY);
    
    if (this.stage === CROP_STAGE_SEED) {
      // Small seed
      p.fill(139, 90, 43);
      p.noStroke();
      p.circle(0, 5, 4);
    } else if (this.stage === CROP_STAGE_SPROUT) {
      // Small sprout
      p.stroke(50, 150, 50);
      p.strokeWeight(2);
      p.noFill();
      p.line(0, 5, -3, 0);
      p.line(0, 5, 3, 0);
      
      p.fill(80, 180, 80);
      p.noStroke();
      p.circle(-3, 0, 4);
      p.circle(3, 0, 4);
    } else if (this.stage === CROP_STAGE_GROWING) {
      // Growing plant
      p.stroke(40, 140, 40);
      p.strokeWeight(3);
      p.line(0, 10, 0, -5);
      
      // Leaves
      p.fill(60, 170, 60);
      p.noStroke();
      p.ellipse(-5, 0, 8, 6);
      p.ellipse(5, 0, 8, 6);
      p.ellipse(0, -3, 6, 6);
    } else if (this.stage === CROP_STAGE_MATURE) {
      // Mature crop with vegetable
      p.stroke(40, 140, 40);
      p.strokeWeight(3);
      p.line(0, 10, 0, -8);
      
      // Leaves
      p.fill(60, 170, 60);
      p.noStroke();
      p.ellipse(-6, -2, 10, 8);
      p.ellipse(6, -2, 10, 8);
      
      // Crop-specific visual
      p.fill(...getCropColor(this.type));
      p.stroke(50);
      p.strokeWeight(1);
      
      if (this.type === 'turnip') {
        p.circle(0, 3, 12);
      } else if (this.type === 'potato') {
        p.ellipse(0, 3, 14, 10);
      } else if (this.type === 'corn') {
        p.rect(-4, 0, 8, 12, 2);
      } else if (this.type === 'tomato') {
        p.circle(0, 0, 10);
      } else if (this.type === 'melon') {
        p.circle(0, 3, 16);
        p.stroke(40, 100, 40);
        p.line(-5, 3, 5, 3);
      }
    }
    
    p.pop();
  }
}

function getCropColor(type) {
  const colors = {
    turnip: [200, 150, 255],
    potato: [210, 180, 140],
    corn: [255, 220, 100],
    tomato: [255, 80, 80],
    melon: [100, 200, 100]
  };
  return colors[type] || [255, 255, 255];
}

export function addFarmingExp(amount) {
  gameState.farmingExp += amount;
  
  // Check for level up
  while (gameState.farmingLevel < 9 && 
         gameState.farmingExp >= gameState.expThresholds[gameState.farmingLevel + 1]) {
    gameState.farmingLevel++;
    
    // Win condition - reach level 10 (index 9)
    if (gameState.farmingLevel >= 10) {
      gameState.gamePhase = "GAME_OVER_WIN";
    }
  }
}

// Initialize farm tiles
export function initializeFarm() {
  gameState.farmTiles = [];
  
  for (let y = 0; y < FARM_HEIGHT; y++) {
    for (let x = 0; x < FARM_WIDTH; x++) {
      gameState.farmTiles.push(new FarmTile(x, y));
    }
  }
}

// Get tile at grid position
export function getTileAt(gridX, gridY) {
  if (gridX < 0 || gridX >= FARM_WIDTH || gridY < 0 || gridY >= FARM_HEIGHT) {
    return null;
  }
  return gameState.farmTiles[gridY * FARM_WIDTH + gridX];
}

// Get tile at world position
export function getTileAtPosition(x, y) {
  const gridX = Math.floor(x / TILE_SIZE);
  const gridY = Math.floor(y / TILE_SIZE);
  return getTileAt(gridX, gridY);
}

// Advance to next day
export function advanceDay() {
  gameState.currentDay++;
  
  // New season every 28 days
  if (gameState.currentDay > DAYS_PER_SEASON) {
    gameState.currentDay = 1;
    gameState.currentSeason = (gameState.currentSeason + 1) % 4;
  }
  
  // Update all tiles
  gameState.farmTiles.forEach(tile => tile.newDay());
  
  // Restore energy
  gameState.energy = gameState.maxEnergy;
  
  // Reset time
  gameState.timeOfDay = 6;
}