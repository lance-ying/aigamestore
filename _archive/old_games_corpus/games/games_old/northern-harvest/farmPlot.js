// farmPlot.js - Farm plot management

import { gameState, CROP_TYPES } from './globals.js';

export class FarmPlot {
  constructor(gridX, gridY) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.state = "EMPTY"; // EMPTY, TILLED, PLANTED, GROWING, READY
    this.cropType = null;
    this.plantTime = 0;
    this.growthProgress = 0;
  }
  
  till() {
    if (this.state === "EMPTY") {
      this.state = "TILLED";
      return true;
    }
    return false;
  }
  
  plant(cropType) {
    if (this.state === "TILLED" && CROP_TYPES[cropType]) {
      this.state = "PLANTED";
      this.cropType = cropType;
      this.plantTime = gameState.gameTime;
      this.growthProgress = 0;
      return true;
    }
    return false;
  }
  
  update() {
    if (this.state === "PLANTED" || this.state === "GROWING") {
      const crop = CROP_TYPES[this.cropType];
      const elapsed = gameState.gameTime - this.plantTime;
      this.growthProgress = elapsed / crop.growTime;
      
      if (this.growthProgress >= 1) {
        this.state = "READY";
        this.growthProgress = 1;
      } else {
        this.state = "GROWING";
      }
    }
  }
  
  harvest() {
    if (this.state === "READY") {
      const crop = CROP_TYPES[this.cropType];
      const harvestedCrop = this.cropType;
      
      // Reset plot
      this.state = "EMPTY";
      this.cropType = null;
      this.plantTime = 0;
      this.growthProgress = 0;
      
      return { type: harvestedCrop, crop: crop };
    }
    return null;
  }
  
  isReady() {
    return this.state === "READY";
  }
}

export function createFarmGrid(width, height) {
  const grid = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      row.push(new FarmPlot(x, y));
    }
    grid.push(row);
  }
  return grid;
}

export function getFarmPlotAt(x, y) {
  if (y >= 0 && y < gameState.farmPlots.length) {
    if (x >= 0 && x < gameState.farmPlots[y].length) {
      return gameState.farmPlots[y][x];
    }
  }
  return null;
}