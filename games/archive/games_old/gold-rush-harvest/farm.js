// farm.js - Farm plot management

import { gameState, CROP_DATA } from './globals.js';

export class FarmPlot {
  constructor(x, y, gridX, gridY) {
    this.x = x;
    this.y = y;
    this.gridX = gridX;
    this.gridY = gridY;
    this.cropType = null;
    this.plantTime = 0;
    this.growthProgress = 0;
    this.isReady = false;
  }
  
  plant(cropType, currentTime) {
    if (this.cropType === null && CROP_DATA[cropType]) {
      this.cropType = cropType;
      this.plantTime = currentTime;
      this.growthProgress = 0;
      this.isReady = false;
      return true;
    }
    return false;
  }
  
  update(currentTime) {
    if (this.cropType && !this.isReady) {
      const cropData = CROP_DATA[this.cropType];
      const elapsed = currentTime - this.plantTime;
      this.growthProgress = Math.min(elapsed / cropData.growTime, 1);
      
      if (this.growthProgress >= 1) {
        this.isReady = true;
      }
    }
  }
  
  harvest() {
    if (this.isReady && this.cropType) {
      const cropData = CROP_DATA[this.cropType];
      const harvestedCrop = this.cropType;
      const amount = cropData.harvestAmount;
      
      this.cropType = null;
      this.plantTime = 0;
      this.growthProgress = 0;
      this.isReady = false;
      
      return { crop: harvestedCrop, amount: amount };
    }
    return null;
  }
  
  render(p) {
    p.push();
    
    // Background
    p.fill(139, 69, 19);
    p.stroke(101, 67, 33);
    p.strokeWeight(2);
    p.rect(this.x, this.y, 60, 60);
    
    if (this.cropType) {
      const cropData = CROP_DATA[this.cropType];
      
      // Draw growing crop
      const size = 10 + (this.growthProgress * 30);
      p.fill(...cropData.color);
      p.noStroke();
      
      // Simple plant representation
      p.ellipse(this.x + 30, this.y + 40, size, size * 1.5);
      
      if (this.growthProgress > 0.3) {
        p.ellipse(this.x + 20, this.y + 35, size * 0.7, size);
        p.ellipse(this.x + 40, this.y + 35, size * 0.7, size);
      }
      
      // Ready indicator
      if (this.isReady) {
        p.fill(255, 255, 0);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(20);
        p.text('!', this.x + 30, this.y + 10);
      }
    }
    
    p.pop();
  }
}

export function initializeFarm(gameState) {
  gameState.farmPlots = [];
  
  // Create 3x3 grid of farm plots
  const startX = 50;
  const startY = 80;
  const spacing = 65;
  
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const plot = new FarmPlot(
        startX + col * spacing,
        startY + row * spacing,
        col,
        row
      );
      gameState.farmPlots.push(plot);
    }
  }
}

export function updateFarm(gameState) {
  const currentTime = gameState.gameTime;
  gameState.farmPlots.forEach(plot => plot.update(currentTime));
}

export function renderFarm(p, gameState) {
  gameState.farmPlots.forEach(plot => plot.render(p));
}