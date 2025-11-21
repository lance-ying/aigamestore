import { GRID_SIZE, CROP_TYPES, ANIMAL_TYPES, WORKSHOP_TYPES, gameState } from './globals.js';
import { addToInventory, addScore, addCoins, addXP, removeFromInventory, getSpeedModifier } from './utils.js';

export class FarmPlot {
  constructor(x, y, gridX, gridY) {
    this.x = x;
    this.y = y;
    this.gridX = gridX;
    this.gridY = gridY;
    this.state = 'empty';
    this.cropType = null;
    this.growthTimer = 0;
    this.currentStage = 0;
  }

  plant(cropType) {
    if (this.state === 'empty' && CROP_TYPES[cropType]) {
      this.state = 'growing';
      this.cropType = cropType;
      this.growthTimer = 0;
      this.currentStage = 0;
      return true;
    }
    return false;
  }

  update(deltaTime) {
    if (this.state === 'growing') {
      const crop = CROP_TYPES[this.cropType];
      const totalGrowTime = crop.growTime * getSpeedModifier() * 1000;
      this.growthTimer += deltaTime;
      
      const stageTime = totalGrowTime / crop.stages;
      this.currentStage = Math.min(crop.stages - 1, Math.floor(this.growthTimer / stageTime));
      
      if (this.growthTimer >= totalGrowTime) {
        this.state = 'ready';
      }
    }
  }

  harvest() {
    if (this.state === 'ready') {
      const crop = CROP_TYPES[this.cropType];
      addToInventory(this.cropType, 1);
      addScore(crop.value);
      this.state = 'empty';
      this.cropType = null;
      this.growthTimer = 0;
      this.currentStage = 0;
      
      gameState.harvestStreak++;
      if (gameState.harvestStreak === 1) {
        gameState.streakStartTime = Date.now();
      } else if (gameState.harvestStreak >= 10 && Date.now() - gameState.streakStartTime < 15000) {
        addScore(50);
        gameState.harvestStreak = 0;
      }
      
      return true;
    }
    return false;
  }

  display(p) {
    p.push();
    p.translate(this.x, this.y);
    
    if (this.state === 'empty') {
      p.fill(101, 67, 33);
      p.stroke(80, 50, 20);
      p.strokeWeight(2);
      p.rect(2, 2, GRID_SIZE - 4, GRID_SIZE - 4);
      
      for (let i = 0; i < 3; i++) {
        p.stroke(90, 60, 30);
        p.line(5 + i * 10, 10, 15 + i * 10, 12);
      }
    } else if (this.state === 'growing' || this.state === 'ready') {
      p.fill(101, 67, 33);
      p.noStroke();
      p.rect(0, 0, GRID_SIZE, GRID_SIZE);
      
      const crop = CROP_TYPES[this.cropType];
      const stageProgress = this.currentStage / (crop.stages - 1);
      const size = 10 + stageProgress * 20;
      
      p.fill(...crop.color);
      p.stroke(0, 100, 0);
      p.strokeWeight(1);
      
      if (this.cropType === 'WHEAT' || this.cropType === 'CORN') {
        for (let i = -1; i <= 1; i++) {
          p.line(GRID_SIZE / 2 + i * 5, GRID_SIZE / 2 + 5, GRID_SIZE / 2 + i * 5, GRID_SIZE / 2 - size);
        }
        p.ellipse(GRID_SIZE / 2, GRID_SIZE / 2 - size, size / 2);
      } else if (this.cropType === 'CARROT') {
        p.triangle(GRID_SIZE / 2, GRID_SIZE / 2 + 5, GRID_SIZE / 2 - size / 3, GRID_SIZE / 2 - size / 2, GRID_SIZE / 2 + size / 3, GRID_SIZE / 2 - size / 2);
        p.fill(0, 150, 0);
        p.rect(GRID_SIZE / 2 - 2, GRID_SIZE / 2 - size / 2, 4, -5);
      } else {
        p.ellipse(GRID_SIZE / 2, GRID_SIZE / 2, size);
        p.fill(0, 150, 0);
        p.rect(GRID_SIZE / 2 - 2, GRID_SIZE / 2 + size / 2, 4, 5);
      }
      
      if (this.state === 'ready') {
        p.fill(255, 255, 0, 150);
        p.noStroke();
        p.ellipse(GRID_SIZE / 2, GRID_SIZE / 2, size + 5);
      }
    }
    
    p.pop();
  }
}

export class Animal {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.typeData = ANIMAL_TYPES[type];
    this.state = 'hungry';
    this.productTimer = 0;
    this.animFrame = 0;
  }

  feed() {
    if (this.state === 'hungry' && removeFromInventory('Feed', 1)) {
      this.state = 'producing';
      this.productTimer = 0;
      return true;
    }
    return false;
  }

  update(deltaTime) {
    this.animFrame = (this.animFrame + deltaTime / 500) % 2;
    
    if (this.state === 'producing') {
      const totalTime = this.typeData.productTime * getSpeedModifier() * 1000;
      this.productTimer += deltaTime;
      
      if (this.productTimer >= totalTime) {
        this.state = 'ready';
      }
    }
  }

  collect() {
    if (this.state === 'ready') {
      addToInventory(this.typeData.product, 1);
      addScore(this.typeData.value);
      this.state = 'hungry';
      this.productTimer = 0;
      
      gameState.harvestStreak++;
      if (gameState.harvestStreak === 1) {
        gameState.streakStartTime = Date.now();
      } else if (gameState.harvestStreak >= 5 && Date.now() - gameState.streakStartTime < 15000) {
        addScore(50);
        gameState.harvestStreak = 0;
      }
      
      return true;
    }
    return false;
  }

  display(p) {
    p.push();
    p.translate(this.x, this.y);
    
    if (this.type === 'CHICKEN') {
      p.fill(255, 255, 255);
      p.ellipse(0, 5, 25, 20);
      p.ellipse(0, -5, 20, 20);
      
      p.fill(255, 200, 0);
      p.triangle(-3, -3, 3, -3, 0, 0);
      
      p.fill(0);
      p.ellipse(-5, -7, 3);
      p.ellipse(5, -7, 3);
      
      if (this.state === 'ready') {
        p.fill(255, 230, 200);
        p.ellipse(0, 15, 12, 16);
      }
    } else if (this.type === 'COW') {
      p.fill(150, 100, 80);
      p.ellipse(0, 0, 35, 30);
      p.ellipse(-10, -15, 20, 25);
      
      p.fill(255, 200, 200);
      p.ellipse(-10, -10, 10, 12);
      
      p.fill(0);
      p.ellipse(-13, -18, 4);
      p.ellipse(-7, -18, 4);
      
      if (this.state === 'ready') {
        p.fill(255);
        p.ellipse(5, 8, 10, 14);
      }
    }
    
    if (this.state === 'hungry') {
      p.fill(255, 0, 0);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(10);
      p.text('!', 15, -20);
    }
    
    p.pop();
  }
}

export class Workshop {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.typeData = WORKSHOP_TYPES[type];
    this.state = 'idle';
    this.currentRecipe = null;
    this.craftTimer = 0;
  }

  startCrafting(recipeIndex) {
    if (this.state === 'idle') {
      const recipe = this.typeData.recipes[recipeIndex];
      if (recipe) {
        const inputs = Array.isArray(recipe.input) ? recipe.input : [recipe.input];
        let canCraft = true;
        
        for (const input of inputs) {
          if (!removeFromInventory(input, 1)) {
            canCraft = false;
            break;
          }
        }
        
        if (canCraft) {
          this.state = 'crafting';
          this.currentRecipe = recipe;
          this.craftTimer = 0;
          return true;
        }
      }
    }
    return false;
  }

  update(deltaTime) {
    if (this.state === 'crafting' && this.currentRecipe) {
      const totalTime = this.currentRecipe.time * getSpeedModifier() * 1000;
      this.craftTimer += deltaTime;
      
      if (this.craftTimer >= totalTime) {
        this.state = 'ready';
      }
    }
  }

  collect() {
    if (this.state === 'ready' && this.currentRecipe) {
      addToInventory(this.currentRecipe.output, 1);
      addScore(this.currentRecipe.value);
      this.state = 'idle';
      this.currentRecipe = null;
      this.craftTimer = 0;
      return true;
    }
    return false;
  }

  display(p) {
    p.push();
    p.translate(this.x, this.y);
    
    p.fill(120, 80, 60);
    p.stroke(80, 50, 40);
    p.strokeWeight(2);
    p.rect(-30, -25, 60, 50);
    
    p.fill(60, 40, 30);
    p.triangle(-20, -25, 0, -40, 20, -25);
    
    p.fill(200, 200, 220);
    p.rect(-15, -15, 10, 15);
    p.rect(5, -15, 10, 15);
    
    p.fill(100, 60, 40);
    p.rect(-10, 10, 20, 15);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.noStroke();
    p.textSize(8);
    p.text(this.typeData.name.substring(0, 4), 0, -5);
    
    if (this.state === 'crafting') {
      const progress = this.craftTimer / (this.currentRecipe.time * getSpeedModifier() * 1000);
      p.fill(0, 200, 0);
      p.rect(-25, 30, 50 * progress, 5);
    } else if (this.state === 'ready') {
      p.fill(255, 255, 0);
      p.ellipse(20, -20, 10);
    }
    
    p.pop();
  }
}

export class Order {
  constructor(requirements, coinReward, xpReward) {
    this.requirements = requirements;
    this.coinReward = coinReward;
    this.xpReward = xpReward;
    this.timeLimit = 300000;
    this.createdTime = Date.now();
  }

  canFulfill() {
    for (const [item, quantity] of Object.entries(this.requirements)) {
      if (!gameState.inventory[item] || gameState.inventory[item] < quantity) {
        return false;
      }
    }
    return true;
  }

  fulfill() {
    if (this.canFulfill()) {
      for (const [item, quantity] of Object.entries(this.requirements)) {
        removeFromInventory(item, quantity);
      }
      
      addCoins(this.coinReward);
      addXP(this.xpReward);
      
      let itemScore = 0;
      for (const [item, quantity] of Object.entries(this.requirements)) {
        itemScore += quantity * 5;
      }
      addScore(50 + itemScore * 2);
      
      gameState.consecutiveOrders++;
      if (gameState.consecutiveOrders >= 3) {
        addScore(100);
        gameState.consecutiveOrders = 0;
      }
      
      return true;
    }
    return false;
  }

  isExpired() {
    return Date.now() - this.createdTime > this.timeLimit;
  }
}