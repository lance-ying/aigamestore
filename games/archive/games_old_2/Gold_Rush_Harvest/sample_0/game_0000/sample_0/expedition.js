// expedition.js - Expedition mini-games

import { gameState } from './globals.js';

export class Expedition {
  constructor(type) {
    this.type = type;
    this.timeLimit = 15000; // 15 seconds
    this.timeLeft = this.timeLimit;
    this.collected = {};
    this.targets = [];
    this.completed = false;
    this.failed = false;
    
    this.initializeExpedition();
  }
  
  initializeExpedition() {
    // Create clickable targets based on expedition type
    switch (this.type) {
      case 'forest':
        this.createForestTargets();
        break;
      case 'mining':
        this.createMiningTargets();
        break;
      case 'panning':
        this.createPanningTargets();
        break;
      case 'mountain':
        this.createMountainTargets();
        break;
    }
  }
  
  createForestTargets() {
    this.collected = { wood: 0, stone: 0 };
    this.goal = { wood: 10, stone: 5 };
    
    for (let i = 0; i < 20; i++) {
      this.targets.push({
        x: 100 + Math.random() * 400,
        y: 100 + Math.random() * 250,
        type: Math.random() > 0.3 ? 'wood' : 'stone',
        collected: false,
        size: 15
      });
    }
  }
  
  createMiningTargets() {
    this.collected = { ore: 0 };
    this.goal = { ore: 8 };
    this.timeLimit = 10000; // 10 seconds (harder)
    this.timeLeft = this.timeLimit;
    
    for (let i = 0; i < 15; i++) {
      this.targets.push({
        x: 100 + Math.random() * 400,
        y: 100 + Math.random() * 250,
        type: 'ore',
        collected: false,
        size: 20
      });
    }
  }
  
  createPanningTargets() {
    this.collected = { gold_nugget: 0 };
    this.goal = { gold_nugget: 10 };
    this.timeLimit = 12000;
    this.timeLeft = this.timeLimit;
    
    for (let i = 0; i < 25; i++) {
      this.targets.push({
        x: 100 + Math.random() * 400,
        y: 100 + Math.random() * 250,
        type: Math.random() > 0.6 ? 'gold_nugget' : 'fake',
        collected: false,
        size: 12
      });
    }
  }
  
  createMountainTargets() {
    this.collected = { gem: 0 };
    this.goal = { gem: 5 };
    this.timeLimit = 18000;
    this.timeLeft = this.timeLimit;
    
    for (let i = 0; i < 12; i++) {
      this.targets.push({
        x: 100 + Math.random() * 400,
        y: 100 + Math.random() * 250,
        type: 'gem',
        collected: false,
        size: 18
      });
    }
  }
  
  update(deltaTime) {
    if (!this.completed && !this.failed) {
      this.timeLeft -= deltaTime;
      
      if (this.timeLeft <= 0) {
        this.failed = true;
      }
      
      // Check if goal is met
      let goalMet = true;
      for (const [resource, amount] of Object.entries(this.goal)) {
        if (this.collected[resource] < amount) {
          goalMet = false;
          break;
        }
      }
      
      if (goalMet) {
        this.completed = true;
      }
    }
  }
  
  clickTarget(x, y) {
    for (const target of this.targets) {
      if (!target.collected) {
        const dist = Math.sqrt((target.x - x) ** 2 + (target.y - y) ** 2);
        if (dist < target.size) {
          target.collected = true;
          
          if (target.type !== 'fake') {
            if (!this.collected[target.type]) {
              this.collected[target.type] = 0;
            }
            this.collected[target.type]++;
          }
          
          return true;
        }
      }
    }
    return false;
  }
  
  render(p) {
    // Background
    p.background(100, 150, 100);
    
    // Title
    p.fill(255);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(16);
    p.text(`Expedition: ${this.type.toUpperCase()}`, 300, 10);
    
    // Timer
    p.textSize(14);
    p.text(`Time: ${Math.ceil(this.timeLeft / 1000)}s`, 300, 30);
    
    // Goal
    let goalText = 'Collect: ';
    for (const [resource, amount] of Object.entries(this.goal)) {
      goalText += `${resource}: ${this.collected[resource] || 0}/${amount} `;
    }
    p.text(goalText, 300, 50);
    
    // Render targets
    for (const target of this.targets) {
      if (!target.collected) {
        p.push();
        
        switch (target.type) {
          case 'wood':
            p.fill(139, 69, 19);
            break;
          case 'stone':
            p.fill(128, 128, 128);
            break;
          case 'ore':
            p.fill(192, 192, 192);
            break;
          case 'gold_nugget':
            p.fill(255, 215, 0);
            break;
          case 'gem':
            p.fill(0, 191, 255);
            break;
          case 'fake':
            p.fill(100, 100, 100);
            break;
        }
        
        p.stroke(0);
        p.strokeWeight(1);
        p.ellipse(target.x, target.y, target.size * 2, target.size * 2);
        p.pop();
      }
    }
    
    // Status messages
    if (this.completed) {
      p.fill(0, 255, 0);
      p.textSize(24);
      p.text('SUCCESS!', 300, 200);
      p.textSize(16);
      p.text('Press SPACE to return', 300, 230);
    } else if (this.failed) {
      p.fill(255, 0, 0);
      p.textSize(24);
      p.text('FAILED!', 300, 200);
      p.textSize(16);
      p.text('Press SPACE to return', 300, 230);
    }
  }
}

export function startExpedition(gameState, type) {
  gameState.inExpedition = true;
  gameState.expeditionType = type;
  const expedition = new Expedition(type);
  gameState.currentExpedition = expedition;
}

export function updateExpedition(gameState, deltaTime) {
  if (gameState.currentExpedition) {
    gameState.currentExpedition.update(deltaTime);
  }
}

export function endExpedition(gameState) {
  if (gameState.currentExpedition) {
    const expedition = gameState.currentExpedition;
    
    if (expedition.completed) {
      // Add collected resources
      for (const [resource, amount] of Object.entries(expedition.collected)) {
        if (gameState.resources[resource] !== undefined) {
          gameState.resources[resource] += amount;
        }
      }
      
      // Add score
      let expeditionScore = 100;
      for (const amount of Object.values(expedition.collected)) {
        expeditionScore += amount * 2;
      }
      
      // Time bonus
      if (expedition.timeLeft > expedition.timeLimit * 0.5) {
        expeditionScore += 50;
      }
      
      gameState.score += expeditionScore;
    } else if (expedition.failed) {
      // Check if it's a critical expedition
      if (gameState.currentLevel === 2 && expedition.type === 'mining') {
        // Critical failure - game over
        return 'LOSE';
      }
    }
    
    gameState.inExpedition = false;
    gameState.currentExpedition = null;
  }
  
  return null;
}