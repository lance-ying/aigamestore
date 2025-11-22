// entities.js - Game entities

import { TILE_SIZE, CROP_TYPES, ANIMAL_TYPES, BUILDING_TYPES, gameState } from './globals.js';

export class FarmPlot {
  constructor(x, y, gridX, gridY) {
    this.x = x;
    this.y = y;
    this.gridX = gridX;
    this.gridY = gridY;
    this.state = "empty"; // empty, tilled, planted, growing, ready
    this.cropType = null;
    this.plantTime = 0;
    this.growthStage = 0;
  }

  till() {
    if (this.state === "empty") {
      this.state = "tilled";
      return true;
    }
    return false;
  }

  plant(cropType, currentTime) {
    if (this.state === "tilled") {
      this.state = "planted";
      this.cropType = cropType;
      this.plantTime = currentTime;
      this.growthStage = 0;
      return true;
    }
    return false;
  }

  update(currentTime) {
    if (this.state === "planted" || this.state === "growing") {
      const crop = CROP_TYPES[this.cropType];
      const elapsed = currentTime - this.plantTime;
      const progress = elapsed / crop.growTime;
      
      if (progress >= 1) {
        this.state = "ready";
        this.growthStage = crop.stages;
      } else {
        this.state = "growing";
        this.growthStage = Math.floor(progress * crop.stages);
      }
    }
  }

  harvest() {
    if (this.state === "ready") {
      const crop = CROP_TYPES[this.cropType];
      this.state = "empty";
      this.cropType = null;
      this.plantTime = 0;
      this.growthStage = 0;
      return crop;
    }
    return null;
  }
}

export class Animal {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.lastProductionTime = 0;
    this.ready = false;
    this.animOffset = Math.random() * Math.PI * 2;
  }

  update(currentTime) {
    const animalData = ANIMAL_TYPES[this.type];
    const elapsed = currentTime - this.lastProductionTime;
    
    if (elapsed >= animalData.productionTime) {
      this.ready = true;
    }
  }

  collect(currentTime) {
    if (this.ready) {
      this.ready = false;
      this.lastProductionTime = currentTime;
      return ANIMAL_TYPES[this.type];
    }
    return null;
  }
}

export class Building {
  constructor(type, gridX, gridY) {
    this.type = type;
    this.gridX = gridX;
    this.gridY = gridY;
    const buildingData = BUILDING_TYPES[type];
    this.width = buildingData.width;
    this.height = buildingData.height;
    this.constructionProgress = 0;
    this.constructionStartTime = 0;
    this.isComplete = false;
    this.x = gridX * TILE_SIZE;
    this.y = gridY * TILE_SIZE;
  }

  update(currentTime) {
    if (!this.isComplete) {
      const buildingData = BUILDING_TYPES[this.type];
      const elapsed = currentTime - this.constructionStartTime;
      this.constructionProgress = Math.min(1, elapsed / buildingData.buildTime);
      
      if (this.constructionProgress >= 1) {
        this.isComplete = true;
      }
    }
  }

  startConstruction(currentTime) {
    this.constructionStartTime = currentTime;
  }
}

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  update() {
    // Player position tracking for logs
  }
}