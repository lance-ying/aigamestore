// fishing.js - Fishing pond mini-game

import { gameState } from './globals.js';

export class FishingSystem {
  constructor() {
    this.castDuration = 120; // frames to complete cast
    this.catchWindowSize = 15; // frames for catch window
    this.catchWindowStart = 0;
    this.fishTypes = ['Small', 'Medium', 'Large', 'Rare'];
    this.lastCatchResult = null;
    this.resultTimer = 0;
  }
  
  startCast() {
    if (gameState.fishingState.casting) return;
    
    gameState.fishingState.casting = true;
    gameState.fishingState.castProgress = 0;
    gameState.fishingState.catchWindowActive = false;
    
    // Calculate catch window position (made easier with skill)
    const skillBonus = gameState.upgrades.fishingSkill * 5;
    this.catchWindowSize = 15 + skillBonus;
    this.catchWindowStart = 40 + Math.floor(Math.random() * 40);
  }
  
  update() {
    if (gameState.fishingState.casting) {
      gameState.fishingState.castProgress++;
      
      // Check if in catch window
      const inWindow = gameState.fishingState.castProgress >= this.catchWindowStart &&
                      gameState.fishingState.castProgress <= this.catchWindowStart + this.catchWindowSize;
      gameState.fishingState.catchWindowActive = inWindow;
      
      // Auto-complete cast
      if (gameState.fishingState.castProgress >= this.castDuration) {
        gameState.fishingState.casting = false;
        this.lastCatchResult = "Missed! Too late.";
        this.resultTimer = 120;
      }
    }
    
    if (this.resultTimer > 0) {
      this.resultTimer--;
    }
  }
  
  attemptCatch() {
    if (!gameState.fishingState.casting) return false;
    
    const success = gameState.fishingState.catchWindowActive;
    gameState.fishingState.casting = false;
    
    if (success) {
      // Determine fish type based on timing precision
      const timingAccuracy = 1 - Math.abs(gameState.fishingState.castProgress - (this.catchWindowStart + this.catchWindowSize/2)) / this.catchWindowSize;
      let fishType = 'Small';
      
      if (timingAccuracy > 0.9) fishType = 'Rare';
      else if (timingAccuracy > 0.7) fishType = 'Large';
      else if (timingAccuracy > 0.4) fishType = 'Medium';
      
      gameState.fish++;
      gameState.score += 10;
      this.lastCatchResult = `Caught ${fishType} Fish!`;
      this.resultTimer = 120;
      return true;
    } else {
      this.lastCatchResult = "Missed! Wrong timing.";
      this.resultTimer = 120;
      return false;
    }
  }
  
  draw(p) {
    p.push();
    
    // Title
    p.fill(100, 180, 255);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(24);
    p.text("FISHING POND", 300, 20);
    
    // Instructions
    p.textSize(12);
    p.fill(200);
    p.text("Space: Cast Line  Z: Catch (when in green zone)", 300, 50);
    
    // Fish count
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(14);
    p.fill(255, 230, 180);
    p.text(`Fish: ${gameState.fish}`, 20, 80);
    
    // Draw pond
    p.fill(50, 100, 150);
    p.ellipse(300, 200, 300, 150);
    
    // Draw water ripples
    for (let i = 0; i < 5; i++) {
      p.noFill();
      p.stroke(70, 120, 170, 100);
      p.strokeWeight(2);
      const rippleSize = (Date.now() / 10 + i * 30) % 150;
      p.circle(300, 200, rippleSize);
    }
    p.noStroke();
    
    // Fishing interface
    if (gameState.fishingState.casting) {
      // Progress bar
      const barWidth = 400;
      const barHeight = 30;
      const barX = 100;
      const barY = 300;
      
      // Background
      p.fill(50);
      p.rect(barX, barY, barWidth, barHeight);
      
      // Catch window
      const windowX = barX + (this.catchWindowStart / this.castDuration) * barWidth;
      const windowWidth = (this.catchWindowSize / this.castDuration) * barWidth;
      p.fill(gameState.fishingState.catchWindowActive ? [100, 255, 100] : [100, 200, 100]);
      p.rect(windowX, barY, windowWidth, barHeight);
      
      // Progress indicator
      const progressX = barX + (gameState.fishingState.castProgress / this.castDuration) * barWidth;
      p.fill(255, 200, 50);
      p.rect(progressX - 3, barY - 5, 6, barHeight + 10);
      
      // Instructions
      p.fill(255);
      p.textAlign(p.CENTER, p.TOP);
      p.textSize(12);
      p.text("Press Z when indicator is in GREEN ZONE!", 300, barY + barHeight + 10);
    } else {
      // Prompt to cast
      p.fill(255, 230, 180);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(16);
      p.text("Press SPACE to cast your line!", 300, 300);
    }
    
    // Show last result
    if (this.resultTimer > 0) {
      p.textAlign(p.CENTER, p.TOP);
      p.textSize(18);
      const isSuccess = this.lastCatchResult.includes('Caught');
      p.fill(isSuccess ? [100, 255, 100] : [255, 100, 100]);
      p.text(this.lastCatchResult, 300, 340);
    }
    
    p.pop();
  }
}