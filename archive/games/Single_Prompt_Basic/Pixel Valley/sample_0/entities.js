import { TILE_SIZE, TILE_TYPES, CROP_STAGES, gameState } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 3;
    this.width = TILE_SIZE * 0.8;
    this.height = TILE_SIZE * 0.8;
    this.color = [50, 200, 50];
  }

  move(dx, dy) {
    // Check for energy and handle exhaustion
    if (gameState.energy <= 0) {
      if (!gameState.isExhausted) {
        gameState.isExhausted = true;
        gameState.autoSleepTimer = gameState.autoSleepDelay;
      }
      return;
    }
    
    const newX = this.x + dx * this.speed;
    const newY = this.y + dy * this.speed;
    
    // Boundary check
    if (newX >= 0 && newX <= TILE_SIZE * 15 - this.width) {
      this.x = newX;
    }
    
    if (newY >= 0 && newY <= TILE_SIZE * 10 - this.height) {
      this.y = newY;
    }
    
    // Update hovered tile for highlighting
    this.updateHoveredTile();
  }
  
  updateHoveredTile() {
    const currentTile = this.getCurrentTile();
    gameState.hoveredTile = currentTile;
  }

  getCurrentTile() {
    const tileX = Math.floor((this.x + this.width / 2) / TILE_SIZE);
    const tileY = Math.floor((this.y + this.height / 2) / TILE_SIZE);
    return { x: tileX, y: tileY };
  }
}

export class Tile {
  constructor(x, y, type = TILE_TYPES.GRASS) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.crop = null;
    this.screenX = x * TILE_SIZE;
    this.screenY = y * TILE_SIZE;
    this.width = TILE_SIZE;
    this.height = TILE_SIZE;
  }

  till() {
    if (this.type === TILE_TYPES.GRASS && gameState.energy >= 5) {
      this.type = TILE_TYPES.TILLED;
      gameState.energy -= 5;
      return true;
    }
    return false;
  }

  plant() {
    if (this.type === TILE_TYPES.TILLED && !this.crop && gameState.gold >= gameState.seedPrice && gameState.energy >= 3) {
      this.type = TILE_TYPES.PLANTED;
      this.crop = new Crop(this.x, this.y);
      gameState.gold -= gameState.seedPrice;
      gameState.energy -= 3;
      gameState.crops.push(this.crop);
      return true;
    }
    return false;
  }

  water() {
    if ((this.type === TILE_TYPES.TILLED || this.type === TILE_TYPES.PLANTED) && gameState.energy >= 2) {
      this.type = TILE_TYPES.WATERED;
      gameState.energy -= 2;
      return true;
    }
    return false;
  }

  harvest() {
    if (this.crop && this.crop.stage === CROP_STAGES.READY && gameState.energy >= 4) {
      gameState.gold += gameState.cropValue;
      gameState.energy -= 4;
      
      // Remove crop from gameState.crops
      const cropIndex = gameState.crops.findIndex(c => c.x === this.crop.x && c.y === this.crop.y);
      if (cropIndex !== -1) {
        gameState.crops.splice(cropIndex, 1);
      }
      
      this.crop = null;
      this.type = TILE_TYPES.TILLED;
      return true;
    }
    return false;
  }
}

export class Crop {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.stage = CROP_STAGES.SEED;
    this.daysGrowing = 0;
    this.watered = false;
    this.screenX = x * TILE_SIZE;
    this.screenY = y * TILE_SIZE;
  }

  grow() {
    if (this.watered) {
      this.daysGrowing++;
      if (this.daysGrowing >= gameState.growthDays && this.stage < CROP_STAGES.READY) {
        this.stage++;
        this.daysGrowing = 0;
      }
    }
    this.watered = false; // Reset watered state for the new day
  }
}

export class Bed {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = TILE_SIZE * 2;
    this.height = TILE_SIZE;
    this.screenX = x * TILE_SIZE;
    this.screenY = y * TILE_SIZE;
  }
}