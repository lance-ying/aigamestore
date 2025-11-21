// garden.js - Garden planting and harvesting

import { gameState } from './globals.js';

export class GardenPlot {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.planted = false;
    this.growthProgress = 0;
    this.growthTime = 300; // frames to grow
    this.ready = false;
  }
  
  plant() {
    if (this.planted) return false;
    this.planted = true;
    this.growthProgress = 0;
    this.ready = false;
    return true;
  }
  
  update() {
    if (this.planted && !this.ready) {
      this.growthProgress++;
      if (this.growthProgress >= this.growthTime) {
        this.ready = true;
      }
    }
  }
  
  harvest() {
    if (!this.ready) return false;
    this.planted = false;
    this.ready = false;
    this.growthProgress = 0;
    return true;
  }
  
  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Plot background
    p.fill(100, 70, 40);
    p.rect(-25, -25, 50, 50);
    
    if (this.planted) {
      const growth = this.growthProgress / this.growthTime;
      
      if (this.ready) {
        // Fully grown crop
        p.fill(100, 200, 100);
        p.circle(0, -10, 30);
        p.fill(50, 150, 50);
        p.rect(-3, -10, 6, 20);
      } else {
        // Growing crop
        const size = 10 + growth * 20;
        p.fill(50 + growth * 50, 150 + growth * 50, 50);
        p.circle(0, -5, size);
        p.fill(50, 100, 50);
        p.rect(-2, -5, 4, 5 + growth * 15);
      }
    } else {
      // Empty plot indicator
      p.fill(150, 100, 50);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(10);
      p.text("Empty", 0, 0);
    }
    
    p.pop();
  }
}

export class GardenSystem {
  constructor() {
    this.selectedPlotIndex = 0;
    this.lastActionResult = null;
    this.resultTimer = 0;
  }
  
  update() {
    // Update all plots
    gameState.gardenPlots.forEach(plot => plot.update());
    
    if (this.resultTimer > 0) {
      this.resultTimer--;
    }
  }
  
  plantSeed() {
    const seedCost = 5;
    if (gameState.acorns < seedCost) {
      this.lastActionResult = "Not enough acorns!";
      this.resultTimer = 60;
      return false;
    }
    
    // Find empty plot
    const emptyPlot = gameState.gardenPlots.find(p => !p.planted);
    if (!emptyPlot) {
      this.lastActionResult = "No empty plots!";
      this.resultTimer = 60;
      return false;
    }
    
    gameState.acorns -= seedCost;
    emptyPlot.plant();
    this.lastActionResult = "Planted seed!";
    this.resultTimer = 60;
    return true;
  }
  
  harvestCrop() {
    // Find ready plot
    const readyPlot = gameState.gardenPlots.find(p => p.ready);
    if (!readyPlot) {
      this.lastActionResult = "No crops ready!";
      this.resultTimer = 60;
      return false;
    }
    
    readyPlot.harvest();
    gameState.crops++;
    gameState.score += 5;
    this.lastActionResult = "Harvested crop!";
    this.resultTimer = 60;
    return true;
  }
  
  draw(p) {
    p.push();
    
    // Title
    p.fill(100, 200, 100);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(24);
    p.text("GARDEN", 300, 20);
    
    // Instructions
    p.textSize(12);
    p.fill(200);
    p.text("Space: Plant Seed (5 acorns)  Z: Harvest Ready Crops", 300, 50);
    
    // Resource count
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(14);
    p.fill(255, 230, 180);
    p.text(`Crops: ${gameState.crops}`, 20, 80);
    p.text(`Plots: ${gameState.gardenPlots.length}/${gameState.maxPlots}`, 20, 100);
    
    // Draw plots
    const plotsPerRow = 4;
    const startX = 150;
    const startY = 180;
    const spacing = 80;
    
    gameState.gardenPlots.forEach((plot, index) => {
      const row = Math.floor(index / plotsPerRow);
      const col = index % plotsPerRow;
      plot.x = startX + col * spacing;
      plot.y = startY + row * spacing;
      plot.draw(p);
    });
    
    // Show last result
    if (this.resultTimer > 0) {
      p.textAlign(p.CENTER, p.BOTTOM);
      p.textSize(16);
      const isSuccess = this.lastActionResult.includes('!') && !this.lastActionResult.includes('Not') && !this.lastActionResult.includes('No');
      p.fill(isSuccess ? [100, 255, 100] : [255, 200, 100]);
      p.text(this.lastActionResult, 300, 380);
    }
    
    p.pop();
  }
}