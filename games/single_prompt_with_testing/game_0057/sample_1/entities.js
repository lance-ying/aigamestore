// entities.js - Entity classes

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, PLAYER_SPEED, MAX_ENERGY, CROP_TYPES } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 16;
    this.height = 16;
    this.vx = 0;
    this.vy = 0;
    this.speed = PLAYER_SPEED;
    this.facing = 'down'; // 'up', 'down', 'left', 'right'
    this.animationFrame = 0;
    this.animationTimer = 0;
    this.lastPosition = { x: x, y: y };
    
    gameState.player = this;
    gameState.entities.push(this);
  }
  
  update(p) {
    // Store last position for logging
    const lastX = this.x;
    const lastY = this.y;
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Boundary collision
    this.x = p.constrain(this.x, this.width / 2, CANVAS_WIDTH - this.width / 2);
    this.y = p.constrain(this.y, this.height / 2, CANVAS_HEIGHT - this.height / 2);
    
    // Apply friction
    this.vx *= 0.8;
    this.vy *= 0.8;
    
    // Update animation
    if (Math.abs(this.vx) > 0.5 || Math.abs(this.vy) > 0.5) {
      this.animationTimer++;
      if (this.animationTimer > 8) {
        this.animationFrame = (this.animationFrame + 1) % 4;
        this.animationTimer = 0;
      }
      
      // Update facing direction
      if (Math.abs(this.vx) > Math.abs(this.vy)) {
        this.facing = this.vx > 0 ? 'right' : 'left';
      } else if (Math.abs(this.vy) > 0.5) {
        this.facing = this.vy > 0 ? 'down' : 'up';
      }
    }
    
    // Log position changes
    if (Math.abs(this.x - lastX) > 1 || Math.abs(this.y - lastY) > 1) {
      this.logPosition(p);
    }
  }
  
  moveLeft() {
    this.vx = -this.speed;
  }
  
  moveRight() {
    this.vx = this.speed;
  }
  
  moveUp() {
    this.vy = -this.speed;
  }
  
  moveDown() {
    this.vy = this.speed;
  }
  
  getTilePosition() {
    return {
      x: Math.floor(this.x / TILE_SIZE),
      y: Math.floor(this.y / TILE_SIZE)
    };
  }
  
  useEnergy(amount) {
    gameState.energy = Math.max(0, gameState.energy - amount);
    if (gameState.energy === 0) {
      this.setMessage('Out of energy! Go sleep.');
    }
  }
  
  addXP(amount) {
    gameState.farmingXP += amount;
    if (gameState.farmingXP >= gameState.xpToNextLevel) {
      this.levelUp();
    }
  }
  
  levelUp() {
    gameState.farmingLevel++;
    gameState.farmingXP -= gameState.xpToNextLevel;
    gameState.xpToNextLevel = Math.floor(gameState.xpToNextLevel * 1.5);
    this.setMessage(`Level Up! Farming Level ${gameState.farmingLevel}`);
    
    // Restore some energy on level up
    gameState.energy = Math.min(MAX_ENERGY, gameState.energy + 30);
  }
  
  setMessage(msg) {
    gameState.message = msg;
    gameState.messageTimer = 120; // 2 seconds
  }
  
  logPosition(p) {
    if (p.logs && p.logs.player_info) {
      p.logs.player_info.push({
        screen_x: this.x,
        screen_y: this.y,
        game_x: this.x,
        game_y: this.y,
        energy: gameState.energy,
        gold: gameState.gold,
        level: gameState.farmingLevel,
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Draw shadow
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.ellipse(0, 6, 12, 6);
    
    // Draw body
    p.fill(100, 150, 255); // Blue shirt
    p.stroke(50, 100, 200);
    p.strokeWeight(1);
    p.rect(-6, -2, 12, 10);
    
    // Draw head
    p.fill(255, 220, 180); // Skin color
    p.stroke(200, 160, 130);
    p.circle(0, -6, 10);
    
    // Draw hat
    p.fill(150, 100, 50); // Brown hat
    p.noStroke();
    p.arc(0, -8, 12, 8, p.PI, p.TWO_PI);
    p.rect(-6, -8, 12, 2);
    
    // Draw eyes based on direction
    p.fill(0);
    if (this.facing === 'down') {
      p.circle(-2, -6, 2);
      p.circle(2, -6, 2);
    } else if (this.facing === 'up') {
      p.circle(-2, -7, 2);
      p.circle(2, -7, 2);
    } else if (this.facing === 'left') {
      p.circle(-3, -6, 2);
      p.circle(1, -6, 2);
    } else if (this.facing === 'right') {
      p.circle(-1, -6, 2);
      p.circle(3, -6, 2);
    }
    
    // Draw legs (simple animation)
    p.fill(80, 100, 150); // Pants
    p.stroke(50, 70, 100);
    p.strokeWeight(1);
    const legOffset = Math.sin(this.animationFrame * p.PI / 2) * 2;
    p.rect(-4, 8, 3, 6);
    p.rect(1, 8, 3, 6);
    
    p.pop();
  }
}

export class FarmTile {
  constructor(x, y) {
    this.gridX = x;
    this.gridY = y;
    this.x = x * TILE_SIZE;
    this.y = y * TILE_SIZE;
    this.size = TILE_SIZE;
    
    // Tile state
    this.tilled = false;
    this.watered = false;
    this.hasCrop = false;
    
    // Visual variety
    this.grassVariant = Math.floor(Math.random() * 3);
  }
  
  till() {
    if (!this.tilled && !this.hasCrop) {
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
  
  update() {
    // Water dries out over time
    if (this.watered && !this.hasCrop) {
      if (Math.random() < 0.001) { // Small chance each frame
        this.watered = false;
      }
    }
  }
  
  render(p) {
    p.push();
    p.noStroke();
    
    if (this.tilled) {
      // Tilled soil
      if (this.watered) {
        p.fill(80, 50, 30); // Dark brown (wet)
      } else {
        p.fill(120, 80, 50); // Light brown (dry)
      }
      p.rect(this.x, this.y, this.size, this.size);
      
      // Add texture to tilled soil
      p.stroke(100, 60, 40);
      p.strokeWeight(1);
      for (let i = 0; i < 3; i++) {
        p.line(this.x + 2, this.y + 4 + i * 6, this.x + this.size - 2, this.y + 4 + i * 6);
      }
    } else {
      // Grass
      const grassColors = [
        [80, 160, 80],
        [70, 150, 70],
        [90, 170, 90]
      ];
      const grassColor = grassColors[this.grassVariant];
      p.fill(...grassColor);
      p.rect(this.x, this.y, this.size, this.size);
      
      // Add grass texture
      p.stroke(60, 140, 60);
      p.strokeWeight(1);
      for (let i = 0; i < 2; i++) {
        const gx = this.x + 3 + i * 7;
        const gy = this.y + 5 + (this.grassVariant * 3);
        p.line(gx, gy, gx, gy + 3);
        p.line(gx + 3, gy + 1, gx + 3, gy + 4);
      }
    }
    
    p.pop();
  }
}

export class Crop {
  constructor(gridX, gridY, cropType) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.x = gridX * TILE_SIZE + TILE_SIZE / 2;
    this.y = gridY * TILE_SIZE + TILE_SIZE / 2;
    
    this.cropType = cropType;
    this.cropData = CROP_TYPES[cropType];
    
    this.age = 0;
    this.watered = false;
    this.wateredToday = false;
    this.growthTime = this.cropData.growthTime;
    this.mature = false;
    
    // Visual
    this.swayOffset = Math.random() * Math.PI * 2;
    
    gameState.crops.push(this);
    gameState.entities.push(this);
    
    // Update tile
    const tile = gameState.tiles[gridY][gridX];
    if (tile) {
      tile.hasCrop = true;
    }
  }
  
  update(p) {
    // Grow over time
    if (!this.mature) {
      let growthRate = 1;
      
      // Water bonus
      if (this.watered) {
        growthRate *= (1 + this.cropData.waterBonus);
      }
      
      this.age += growthRate;
      
      if (this.age >= this.growthTime) {
        this.mature = true;
        this.age = this.growthTime;
      }
    }
    
    // Reset watered status at end of day
    if (gameState.timeOfDay < 10) {
      this.wateredToday = false;
      this.watered = false;
    }
  }
  
  water() {
    if (!this.wateredToday) {
      this.watered = true;
      this.wateredToday = true;
      
      // Update tile
      const tile = gameState.tiles[this.gridY][this.gridX];
      if (tile) {
        tile.watered = true;
      }
      
      return true;
    }
    return false;
  }
  
  harvest() {
    if (this.mature) {
      // Give gold and XP
      gameState.gold += this.cropData.sellPrice;
      gameState.totalGoldEarned += this.cropData.sellPrice;
      gameState.totalCropsHarvested++;
      gameState.score += this.cropData.sellPrice;
      
      const xpGain = Math.floor(this.cropData.sellPrice / 5);
      if (gameState.player) {
        gameState.player.addXP(xpGain);
        gameState.player.setMessage(`Harvested ${this.cropData.name}! +${this.cropData.sellPrice} gold`);
      }
      
      // Create harvest particles
      this.createHarvestParticles();
      
      // Remove crop
      this.destroy();
      return true;
    }
    return false;
  }
  
  createHarvestParticles() {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const speed = 2 + Math.random() * 2;
      gameState.particles.push(new Particle(
        this.x,
        this.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 2,
        this.cropData.color,
        30
      ));
    }
  }
  
  destroy() {
    const cropIndex = gameState.crops.indexOf(this);
    if (cropIndex > -1) {
      gameState.crops.splice(cropIndex, 1);
    }
    
    const entityIndex = gameState.entities.indexOf(this);
    if (entityIndex > -1) {
      gameState.entities.splice(entityIndex, 1);
    }
    
    // Update tile
    const tile = gameState.tiles[this.gridY][this.gridX];
    if (tile) {
      tile.hasCrop = false;
      tile.tilled = true;
    }
  }
  
  getGrowthStage() {
    const progress = this.age / this.growthTime;
    if (progress < 0.25) return 0;
    if (progress < 0.5) return 1;
    if (progress < 0.75) return 2;
    if (progress < 1.0) return 3;
    return 4; // Mature
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    const stage = this.getGrowthStage();
    const sway = Math.sin(p.frameCount * 0.05 + this.swayOffset) * 1;
    
    p.rotate(sway * 0.05);
    
    // Draw crop based on growth stage
    p.noStroke();
    
    if (stage === 0) {
      // Seedling
      p.fill(150, 220, 150);
      p.circle(0, 0, 4);
    } else if (stage === 1) {
      // Small sprout
      p.fill(100, 200, 100);
      p.rect(-2, -4, 4, 8);
      p.fill(120, 220, 120);
      p.circle(-3, -5, 4);
      p.circle(3, -5, 4);
    } else if (stage === 2) {
      // Growing plant
      p.fill(80, 180, 80);
      p.rect(-3, -8, 6, 12);
      p.fill(100, 200, 100);
      p.circle(-4, -8, 5);
      p.circle(0, -10, 5);
      p.circle(4, -8, 5);
    } else if (stage === 3) {
      // Nearly mature
      p.fill(60, 160, 60);
      p.rect(-4, -10, 8, 14);
      p.fill(...this.cropData.color.map(c => c * 0.7));
      p.circle(-5, -10, 6);
      p.circle(0, -12, 6);
      p.circle(5, -10, 6);
    } else {
      // Mature crop
      p.fill(60, 160, 60);
      p.rect(-4, -10, 8, 14);
      
      // Crop produce
      p.fill(...this.cropData.color);
      p.stroke(this.cropData.color[0] * 0.7, this.cropData.color[1] * 0.7, this.cropData.color[2] * 0.7);
      p.strokeWeight(1);
      p.circle(-5, -10, 7);
      p.circle(0, -12, 8);
      p.circle(5, -10, 7);
      
      // Shine effect
      if (p.frameCount % 60 < 30) {
        p.fill(255, 255, 255, 100);
        p.noStroke();
        p.circle(1, -13, 3);
      }
    }
    
    // Watered indicator
    if (this.watered && stage < 4) {
      p.fill(100, 150, 255, 150);
      p.noStroke();
      p.circle(6, 2, 4);
    }
    
    p.pop();
  }
}

export class Particle {
  constructor(x, y, vx, vy, color, lifetime) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.lifetime = lifetime;
    this.age = 0;
    this.size = 3 + Math.random() * 3;
    
    gameState.particles.push(this);
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // Gravity
    this.age++;
  }
  
  isDead() {
    return this.age >= this.lifetime;
  }
  
  render(p) {
    const alpha = 1 - (this.age / this.lifetime);
    p.push();
    p.noStroke();
    p.fill(this.color[0], this.color[1], this.color[2], alpha * 255);
    p.circle(this.x, this.y, this.size);
    p.pop();
  }
}

export class Farmhouse {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 60;
    this.height = 60;
  }
  
  isPlayerInside() {
    if (!gameState.player) return false;
    
    const p = gameState.player;
    return (
      p.x > this.x &&
      p.x < this.x + this.width &&
      p.y > this.y &&
      p.y < this.y + this.height
    );
  }
  
  render(p) {
    p.push();
    
    // House body
    p.fill(180, 120, 80);
    p.stroke(140, 90, 60);
    p.strokeWeight(2);
    p.rect(this.x, this.y + 20, this.width, this.height - 20);
    
    // Roof
    p.fill(150, 50, 50);
    p.stroke(120, 40, 40);
    p.triangle(
      this.x - 5, this.y + 20,
      this.x + this.width / 2, this.y,
      this.x + this.width + 5, this.y + 20
    );
    
    // Door
    p.fill(100, 60, 40);
    p.stroke(70, 40, 20);
    p.rect(this.x + 20, this.y + 45, 20, 30);
    
    // Door knob
    p.fill(255, 215, 0);
    p.noStroke();
    p.circle(this.x + 35, this.y + 60, 3);
    
    // Windows
    p.fill(200, 230, 255);
    p.stroke(100, 100, 100);
    p.strokeWeight(2);
    p.rect(this.x + 8, this.y + 30, 12, 12);
    p.rect(this.x + 40, this.y + 30, 12, 12);
    
    // Window crosses
    p.stroke(100, 100, 100);
    p.line(this.x + 14, this.y + 30, this.x + 14, this.y + 42);
    p.line(this.x + 8, this.y + 36, this.x + 20, this.y + 36);
    p.line(this.x + 46, this.y + 30, this.x + 46, this.y + 42);
    p.line(this.x + 40, this.y + 36, this.x + 52, this.y + 36);
    
    // Chimney
    p.fill(120, 80, 60);
    p.stroke(90, 60, 40);
    p.strokeWeight(1);
    p.rect(this.x + this.width - 15, this.y + 5, 10, 20);
    
    // Smoke (when player is inside)
    if (this.isPlayerInside()) {
      p.noStroke();
      for (let i = 0; i < 3; i++) {
        const smokeY = this.y + 5 - i * 8 - (p.frameCount % 60);
        const smokeX = this.x + this.width - 10 + Math.sin(p.frameCount * 0.1 + i) * 3;
        p.fill(200, 200, 200, 150 - i * 50);
        p.circle(smokeX, smokeY, 6 + i * 2);
      }
    }
    
    p.pop();
  }
}