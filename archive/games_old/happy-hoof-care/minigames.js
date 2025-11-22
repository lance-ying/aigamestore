// minigames.js - Mini-game implementations
import { gameState, MINIGAME_TYPES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class MiniGameData {
  constructor(type, level) {
    this.type = type;
    this.level = level;
    this.timer = 0;
    this.maxTimer = 0;
    this.completed = false;
    this.success = false;
    this.efficiency = 0;
    this.cursorX = CANVAS_WIDTH / 2;
    this.cursorY = CANVAS_HEIGHT / 2;
  }
}

export class ShavingGame extends MiniGameData {
  constructor(level) {
    super(MINIGAME_TYPES.SHAVING, level);
    
    // Timer based on level
    const timers = [999, 30, 25, 20, 15];
    this.maxTimer = timers[level - 1] * 60;
    this.timer = this.maxTimer;
    
    // Generate dirt patches
    this.dirtPatches = [];
    const patchCounts = [5, 12, 20, 25, 30];
    const patchSizes = [30, 20, 12, 8, 6];
    
    const count = patchCounts[level - 1];
    const size = patchSizes[level - 1];
    
    for (let i = 0; i < count; i++) {
      this.dirtPatches.push({
        x: 200 + Math.random() * 200,
        y: 100 + Math.random() * 200,
        size: size + Math.random() * 10,
        removed: false
      });
    }
    
    this.razorActive = false;
    this.razorSize = 15;
  }

  update(p) {
    if (this.completed) return;
    
    this.timer--;
    if (this.timer <= 0) {
      this.completed = true;
      this.success = false;
      return;
    }
    
    // Check for completion
    const removed = this.dirtPatches.filter(patch => patch.removed).length;
    this.efficiency = (removed / this.dirtPatches.length) * 100;
    
    const requiredPercentages = [50, 70, 80, 85, 90];
    const required = requiredPercentages[this.level - 1];
    
    if (this.efficiency >= required) {
      this.completed = true;
      this.success = true;
    }
    
    // Remove dirt if razor is active
    if (this.razorActive) {
      this.dirtPatches.forEach(patch => {
        if (!patch.removed) {
          const dist = p.dist(this.cursorX, this.cursorY, patch.x, patch.y);
          if (dist < this.razorSize + patch.size / 2) {
            patch.removed = true;
          }
        }
      });
    }
  }

  draw(p) {
    // Draw animal
    p.fill(240, 230, 220);
    p.noStroke();
    p.ellipse(300, 200, 120, 140);
    p.ellipse(300, 150, 90, 100);
    
    // Draw dirt patches
    this.dirtPatches.forEach(patch => {
      if (!patch.removed) {
        p.fill(101, 67, 33, 200);
        p.ellipse(patch.x, patch.y, patch.size, patch.size);
      }
    });
    
    // Draw razor cursor
    p.stroke(this.razorActive ? [255, 100, 100] : [150, 150, 150]);
    p.strokeWeight(3);
    p.noFill();
    p.ellipse(this.cursorX, this.cursorY, this.razorSize * 2, this.razorSize * 2);
    
    // Draw progress
    p.fill(255);
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(14);
    p.text(`Progress: ${Math.floor(this.efficiency)}%`, 20, 60);
  }
}

export class ShoweringGame extends MiniGameData {
  constructor(level) {
    super(MINIGAME_TYPES.SHOWERING, level);
    
    const timers = [30, 25, 20, 20, 15];
    this.maxTimer = timers[level - 1] * 60;
    this.timer = this.maxTimer;
    
    // Generate dirty spots
    this.dirtySpots = [];
    const spotCounts = [8, 15, 20, 25, 30];
    const spotSizes = [20, 15, 12, 10, 8];
    
    const count = spotCounts[level - 1];
    const size = spotSizes[level - 1];
    
    for (let i = 0; i < count; i++) {
      this.dirtySpots.push({
        x: 200 + Math.random() * 200,
        y: 100 + Math.random() * 200,
        size: size + Math.random() * 5,
        cleaned: false,
        visible: level < 5 ? true : Math.random() > 0.3
      });
    }
    
    this.sprayActive = false;
    this.sprayRadius = 25;
    this.particles = [];
  }

  update(p) {
    if (this.completed) return;
    
    this.timer--;
    if (this.timer <= 0) {
      this.completed = true;
      this.success = false;
      return;
    }
    
    // Spots blink in level 4+
    if (this.level >= 4 && p.frameCount % 60 === 0) {
      this.dirtySpots.forEach(spot => {
        if (!spot.cleaned && Math.random() > 0.7) {
          spot.visible = !spot.visible;
        }
      });
    }
    
    // Clean spots if spraying
    if (this.sprayActive) {
      this.dirtySpots.forEach(spot => {
        if (!spot.cleaned && spot.visible) {
          const dist = p.dist(this.cursorX, this.cursorY, spot.x, spot.y);
          if (dist < this.sprayRadius + spot.size / 2) {
            spot.cleaned = true;
          }
        }
      });
      
      // Add water particles
      if (p.frameCount % 3 === 0) {
        this.particles.push({
          x: this.cursorX,
          y: this.cursorY,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          life: 30
        });
      }
    }
    
    // Update particles
    this.particles = this.particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;
      return particle.life > 0;
    });
    
    // Check completion
    const cleaned = this.dirtySpots.filter(spot => spot.cleaned).length;
    this.efficiency = (cleaned / this.dirtySpots.length) * 100;
    
    const requiredPercentages = [70, 80, 85, 90, 95];
    const required = requiredPercentages[this.level - 1];
    
    if (this.efficiency >= required) {
      this.completed = true;
      this.success = true;
    }
  }

  draw(p) {
    // Draw animal
    p.fill(140, 140, 150);
    p.noStroke();
    p.ellipse(300, 200, 140, 120);
    p.ellipse(300, 150, 100, 90);
    
    // Draw dirty spots
    this.dirtySpots.forEach(spot => {
      if (!spot.cleaned && spot.visible) {
        p.fill(101, 67, 33, 180);
        p.ellipse(spot.x, spot.y, spot.size, spot.size);
      }
    });
    
    // Draw particles
    this.particles.forEach(particle => {
      p.fill(100, 150, 255, particle.life * 8);
      p.noStroke();
      p.ellipse(particle.x, particle.y, 6, 6);
    });
    
    // Draw spray cursor
    p.stroke(this.sprayActive ? [100, 150, 255] : [150, 150, 150]);
    p.strokeWeight(3);
    p.noFill();
    p.ellipse(this.cursorX, this.cursorY, this.sprayRadius * 2, this.sprayRadius * 2);
    
    // Draw progress
    p.fill(255);
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(14);
    p.text(`Cleaned: ${Math.floor(this.efficiency)}%`, 20, 60);
  }
}

export class MazeGame extends MiniGameData {
  constructor(level) {
    super(MINIGAME_TYPES.MAZE, level);
    
    const timers = [999, 45, 40, 35, 30];
    this.maxTimer = timers[level - 1] * 60;
    this.timer = this.maxTimer;
    
    // Grid sizes based on level
    const gridSizes = [3, 3, 4, 5, 6];
    this.gridSize = gridSizes[level - 1];
    this.cellSize = 50;
    
    // Animal position
    this.animalX = 0;
    this.animalY = 0;
    this.animalSize = 30;
    this.animalVelX = 0;
    this.animalVelY = 0;
    this.speed = 3;
    
    // Generate maze
    this.generateMaze();
    
    // Obstacles
    this.obstacles = [];
    const obstacleCounts = [0, 0, 2, 3, 4];
    const obstacleCount = obstacleCounts[level - 1];
    
    for (let i = 0; i < obstacleCount; i++) {
      this.obstacles.push({
        x: Math.random() * this.gridSize * this.cellSize,
        y: Math.random() * this.gridSize * this.cellSize,
        size: 20,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2
      });
    }
    
    this.mazeOffsetX = 300 - (this.gridSize * this.cellSize) / 2;
    this.mazeOffsetY = 200 - (this.gridSize * this.cellSize) / 2;
    
    this.goalX = (this.gridSize - 1) * this.cellSize + this.cellSize / 2;
    this.goalY = (this.gridSize - 1) * this.cellSize + this.cellSize / 2;
  }

  generateMaze() {
    // Simple maze generation - create walls
    this.walls = [];
    
    // Border walls
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        // Add some random internal walls based on level
        if (this.level >= 3 && Math.random() > 0.7) {
          this.walls.push({
            x: i * this.cellSize,
            y: j * this.cellSize,
            width: this.cellSize,
            height: this.cellSize
          });
        }
      }
    }
  }

  update(p) {
    if (this.completed) return;
    
    this.timer--;
    if (this.timer <= 0) {
      this.completed = true;
      this.success = false;
      return;
    }
    
    // Move animal
    const newX = this.animalX + this.animalVelX;
    const newY = this.animalY + this.animalVelY;
    
    // Check boundaries
    const maxX = this.gridSize * this.cellSize - this.animalSize / 2;
    const maxY = this.gridSize * this.cellSize - this.animalSize / 2;
    
    if (newX >= -this.animalSize / 2 && newX <= maxX) {
      this.animalX = newX;
    }
    if (newY >= -this.animalSize / 2 && newY <= maxY) {
      this.animalY = newY;
    }
    
    // Check wall collisions
    let collided = false;
    this.walls.forEach(wall => {
      if (this.checkCollision(this.animalX, this.animalY, wall)) {
        collided = true;
        this.animalX -= this.animalVelX;
        this.animalY -= this.animalVelY;
      }
    });
    
    // Update obstacles
    this.obstacles.forEach(obstacle => {
      obstacle.x += obstacle.vx;
      obstacle.y += obstacle.vy;
      
      if (obstacle.x < 0 || obstacle.x > this.gridSize * this.cellSize) {
        obstacle.vx *= -1;
      }
      if (obstacle.y < 0 || obstacle.y > this.gridSize * this.cellSize) {
        obstacle.vy *= -1;
      }
      
      // Check collision with animal
      if (p.dist(this.animalX, this.animalY, obstacle.x, obstacle.y) < this.animalSize / 2 + obstacle.size / 2) {
        this.animalX -= this.animalVelX * 2;
        this.animalY -= this.animalVelY * 2;
      }
    });
    
    // Check if reached goal
    const distToGoal = p.dist(this.animalX, this.animalY, this.goalX, this.goalY);
    if (distToGoal < 30) {
      this.completed = true;
      this.success = true;
      this.efficiency = 100;
    }
  }

  checkCollision(x, y, wall) {
    return x + this.animalSize / 2 > wall.x &&
           x - this.animalSize / 2 < wall.x + wall.width &&
           y + this.animalSize / 2 > wall.y &&
           y - this.animalSize / 2 < wall.y + wall.height;
  }

  draw(p) {
    p.push();
    p.translate(this.mazeOffsetX, this.mazeOffsetY);
    
    // Draw maze background
    p.fill(220);
    p.noStroke();
    p.rect(0, 0, this.gridSize * this.cellSize, this.gridSize * this.cellSize);
    
    // Draw grid
    p.stroke(200);
    p.strokeWeight(1);
    for (let i = 0; i <= this.gridSize; i++) {
      p.line(i * this.cellSize, 0, i * this.cellSize, this.gridSize * this.cellSize);
      p.line(0, i * this.cellSize, this.gridSize * this.cellSize, i * this.cellSize);
    }
    
    // Draw walls
    p.fill(80);
    p.noStroke();
    this.walls.forEach(wall => {
      p.rect(wall.x, wall.y, wall.width, wall.height);
    });
    
    // Draw start
    p.fill(100, 255, 100);
    p.ellipse(this.cellSize / 2, this.cellSize / 2, 30, 30);
    
    // Draw goal
    p.fill(255, 100, 100);
    p.ellipse(this.goalX, this.goalY, 35, 35);
    
    // Draw obstacles
    p.fill(255, 150, 0);
    this.obstacles.forEach(obstacle => {
      p.ellipse(obstacle.x, obstacle.y, obstacle.size, obstacle.size);
    });
    
    // Draw animal
    p.fill(140, 140, 150);
    p.ellipse(this.animalX, this.animalY, this.animalSize, this.animalSize);
    p.fill(50);
    p.ellipse(this.animalX - 5, this.animalY - 5, 4, 4);
    p.ellipse(this.animalX + 5, this.animalY - 5, 4, 4);
    
    p.pop();
  }

  handleInput(keyCode, isPressed) {
    const LEFT_ARROW = 37, UP_ARROW = 38, RIGHT_ARROW = 39, DOWN_ARROW = 40;
    
    if (keyCode === LEFT_ARROW) {
      this.animalVelX = isPressed ? -this.speed : 0;
    } else if (keyCode === RIGHT_ARROW) {
      this.animalVelX = isPressed ? this.speed : 0;
    } else if (keyCode === UP_ARROW) {
      this.animalVelY = isPressed ? -this.speed : 0;
    } else if (keyCode === DOWN_ARROW) {
      this.animalVelY = isPressed ? this.speed : 0;
    }
  }
}

export class FeedingGame extends MiniGameData {
  constructor(level) {
    super(MINIGAME_TYPES.FEEDING, level);
    
    const timers = [35, 30, 30, 25, 25];
    this.maxTimer = timers[level - 1] * 60;
    this.timer = this.maxTimer;
    
    // Food items
    this.foods = [];
    this.goodFoodCount = 0;
    this.requiredFood = [3, 5, 6, 8, 10][level - 1];
    
    this.spawnTimer = 0;
    this.spawnRate = [90, 70, 60, 50, 40][level - 1];
    
    this.grabbedFood = null;
    this.armY = 100;
    
    this.animalMouthX = 300;
    this.animalMouthY = 200;
    this.mouthSize = [30, 25, 20, 18, 15][level - 1];
  }

  update(p) {
    if (this.completed) return;
    
    this.timer--;
    if (this.timer <= 0) {
      this.completed = true;
      this.success = false;
      return;
    }
    
    // Spawn food
    this.spawnTimer++;
    if (this.spawnTimer >= this.spawnRate) {
      this.spawnTimer = 0;
      const isGood = Math.random() > 0.3;
      this.foods.push({
        x: 50 + Math.random() * 100,
        y: 350,
        type: isGood ? 'GOOD' : 'BAD',
        size: 20
      });
    }
    
    // Update grabbed food
    if (this.grabbedFood) {
      this.grabbedFood.x = this.cursorX;
      this.grabbedFood.y = this.armY;
      
      // Check if fed to animal
      const dist = p.dist(this.grabbedFood.x, this.grabbedFood.y, 
                          this.animalMouthX, this.animalMouthY);
      if (dist < this.mouthSize) {
        if (this.grabbedFood.type === 'GOOD') {
          this.goodFoodCount++;
        } else {
          this.goodFoodCount = Math.max(0, this.goodFoodCount - 1);
        }
        this.foods = this.foods.filter(f => f !== this.grabbedFood);
        this.grabbedFood = null;
      }
    }
    
    // Check completion
    this.efficiency = (this.goodFoodCount / this.requiredFood) * 100;
    if (this.goodFoodCount >= this.requiredFood) {
      this.completed = true;
      this.success = true;
    }
  }

  draw(p) {
    // Draw giraffe
    p.fill(230, 200, 120);
    p.noStroke();
    p.ellipse(300, 220, 60, 50);
    p.rect(290, 150, 20, 70);
    p.ellipse(300, 140, 35, 40);
    
    // Draw mouth area
    p.stroke(255, 100, 100);
    p.strokeWeight(2);
    p.noFill();
    p.ellipse(this.animalMouthX, this.animalMouthY, this.mouthSize * 2, this.mouthSize * 2);
    
    // Draw food spawning area
    p.fill(200, 230, 200);
    p.noStroke();
    p.rect(30, 330, 140, 50, 5);
    
    // Draw foods
    this.foods.forEach(food => {
      if (food === this.grabbedFood) return;
      
      if (food.type === 'GOOD') {
        p.fill(255, 150, 50);
      } else {
        p.fill(200, 50, 50);
      }
      p.ellipse(food.x, food.y, food.size, food.size);
    });
    
    // Draw arm
    p.stroke(150, 120, 90);
    p.strokeWeight(4);
    p.line(this.cursorX, 50, this.cursorX, this.armY);
    
    // Draw grabbed food
    if (this.grabbedFood) {
      const food = this.grabbedFood;
      if (food.type === 'GOOD') {
        p.fill(255, 150, 50);
      } else {
        p.fill(200, 50, 50);
      }
      p.noStroke();
      p.ellipse(food.x, food.y, food.size, food.size);
    }
    
    // Draw cursor
    p.fill(150, 120, 90);
    p.ellipse(this.cursorX, this.armY, 15, 15);
    
    // Draw progress
    p.fill(255);
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(14);
    p.text(`Fed: ${this.goodFoodCount}/${this.requiredFood}`, 20, 60);
  }

  handleGrab() {
    if (this.grabbedFood) {
      // Release
      this.grabbedFood = null;
    } else {
      // Try to grab
      this.foods.forEach(food => {
        const dist = Math.sqrt(
          Math.pow(food.x - this.cursorX, 2) + 
          Math.pow(food.y - this.armY, 2)
        );
        if (dist < 30) {
          this.grabbedFood = food;
        }
      });
    }
  }
}

export function createMiniGame(type, level) {
  switch (type) {
    case MINIGAME_TYPES.SHAVING:
      return new ShavingGame(level);
    case MINIGAME_TYPES.SHOWERING:
      return new ShoweringGame(level);
    case MINIGAME_TYPES.MAZE:
      return new MazeGame(level);
    case MINIGAME_TYPES.FEEDING:
      return new FeedingGame(level);
    default:
      return null;
  }
}