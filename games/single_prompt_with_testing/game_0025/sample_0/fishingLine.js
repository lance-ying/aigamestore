// fishingLine.js - Fishing line and mechanics

import { gameState, FISH_TYPES, ROD_UPGRADES } from './globals.js';

export class FishingLine {
  constructor(p, startX, startY, targetX, targetY) {
    this.type = 'fishingLine';
    this.startX = startX;
    this.startY = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.currentX = startX;
    this.currentY = startY;
    this.state = 'casting'; // casting, waiting, biting, reeling, caught
    this.castProgress = 0;
    this.waitTimer = 0;
    this.biteTimer = 0;
    this.biteDuration = 0;
    this.caughtFish = null;
    this.bobberBob = 0;
    this.p = p;
  }

  update(p) {
    this.p = p;
    const currentRod = ROD_UPGRADES[gameState.rodLevel];

    switch(this.state) {
      case 'casting':
        this.castProgress += 0.08;
        if (this.castProgress >= 1) {
          this.castProgress = 1;
          this.state = 'waiting';
          this.waitTimer = p.random(60, 180); // 1-3 seconds
        }
        this.currentX = p.lerp(this.startX, this.targetX, this.castProgress);
        this.currentY = p.lerp(this.startY, this.targetY, this.castProgress);
        break;

      case 'waiting':
        this.bobberBob = p.sin(p.frameCount * 0.15) * 3;
        this.waitTimer--;
        if (this.waitTimer <= 0) {
          this.state = 'biting';
          this.biteDuration = p.random(30, 90); // Bite window
          this.biteTimer = this.biteDuration;
        }
        break;

      case 'biting':
        this.bobberBob = p.sin(p.frameCount * 0.5) * 8;
        this.biteTimer--;
        if (this.biteTimer <= 0) {
          // Missed the fish
          this.state = 'reeling';
        }
        break;

      case 'reeling':
        this.castProgress -= 0.1 * currentRod.catchSpeed;
        if (this.castProgress <= 0) {
          this.castProgress = 0;
          this.state = 'caught';
        }
        this.currentX = p.lerp(this.startX, this.targetX, this.castProgress);
        this.currentY = p.lerp(this.startY, this.targetY, this.castProgress);
        break;

      case 'caught':
        // Line is done, will be cleaned up
        break;
    }
  }

  reel() {
    if (this.state === 'biting') {
      // Success! Catch a fish
      this.caughtFish = this.generateFish();
      gameState.money += this.caughtFish.value;
      gameState.score += this.caughtFish.value;
      gameState.totalFishCaught++;
      gameState.fishJournal.add(this.caughtFish.name);
      gameState.lastCatch = this.caughtFish;
      this.state = 'reeling';
    } else if (this.state === 'waiting') {
      // Reeling in early, no fish
      this.state = 'reeling';
    }
  }

  generateFish() {
    const currentRod = ROD_UPGRADES[gameState.rodLevel];
    
    // Filter fish based on rod level
    const availableFish = FISH_TYPES.filter(f => f.minRodLevel <= currentRod.level);
    
    // Calculate total probability
    const totalProb = availableFish.reduce((sum, f) => sum + f.rarity, 0);
    
    // Random selection based on rarity
    let rand = this.p.random(totalProb);
    for (let fish of availableFish) {
      rand -= fish.rarity;
      if (rand <= 0) {
        return { ...fish };
      }
    }
    
    // Fallback to first fish
    return { ...availableFish[0] };
  }

  draw(p) {
    if (this.state === 'idle' || this.state === 'caught') return;

    // Draw fishing line
    p.stroke(80, 80, 80);
    p.strokeWeight(1);
    p.line(this.startX, this.startY, this.currentX, this.currentY);

    // Draw bobber
    p.push();
    p.translate(this.currentX, this.currentY + this.bobberBob);
    
    // Bobber color changes when biting
    if (this.state === 'biting') {
      p.fill(255, 100, 100);
      p.stroke(200, 50, 50);
    } else {
      p.fill(255, 200, 100);
      p.stroke(200, 150, 50);
    }
    p.strokeWeight(2);
    p.ellipse(0, 0, 12, 12);
    
    // Bobber top
    p.fill(255, 0, 0);
    p.noStroke();
    p.ellipse(0, -3, 8, 6);
    
    p.pop();

    // Draw exclamation when biting
    if (this.state === 'biting') {
      p.push();
      p.translate(this.currentX, this.currentY - 30);
      p.fill(255, 255, 0);
      p.stroke(255, 200, 0);
      p.strokeWeight(2);
      p.textSize(20);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("!", 0, 0);
      p.pop();
    }
  }
}