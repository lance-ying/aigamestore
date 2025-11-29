// entities.js - Entity classes for the game

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  getCurrentTask,
  advanceTask,
  getColorWithSaturation,
  ROOM_BED,
  ROOM_BATHROOM,
  ROOM_DINING,
  ROOM_RECREATION,
  ROOM_THERAPY,
  TASK_WAKE,
  TASK_SHOWER,
  TASK_BRUSH,
  TASK_BREAKFAST,
  TASK_EXERCISE,
  TASK_PUZZLE,
  TASK_THERAPY,
  TASK_SLEEP
} from './globals.js';

// Player class - represents Robert Hill
export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 50;
    this.speed = 3;
    
    // Visual properties
    this.facing = 1; // 1 = right, -1 = left
    this.walkCycle = 0;
    this.isWalking = false;
    
    // Game properties
    this.canMove = true;
    
    // Track last logged position
    this.lastLoggedX = x;
    this.lastLoggedY = y;
  }
  
  update(p) {
    // Update walk cycle animation
    if (this.isWalking) {
      this.walkCycle += 0.2;
    } else {
      this.walkCycle = 0;
    }
    
    // Log position if moved significantly
    if (Math.abs(this.x - this.lastLoggedX) > 5 || 
        Math.abs(this.y - this.lastLoggedY) > 5) {
      this.logPosition(p);
      this.lastLoggedX = this.x;
      this.lastLoggedY = this.y;
    }
  }
  
  moveLeft() {
    if (!this.canMove) return;
    this.x = Math.max(this.width / 2, this.x - this.speed);
    this.facing = -1;
    this.isWalking = true;
  }
  
  moveRight() {
    if (!this.canMove) return;
    this.x = Math.min(CANVAS_WIDTH - this.width / 2, this.x + this.speed);
    this.facing = 1;
    this.isWalking = true;
  }
  
  moveUp() {
    if (!this.canMove) return;
    this.y = Math.max(this.height / 2, this.y - this.speed);
    this.isWalking = true;
  }
  
  moveDown() {
    if (!this.canMove) return;
    this.y = Math.min(CANVAS_HEIGHT - this.height / 2, this.y + this.speed);
    this.isWalking = true;
  }
  
  stopWalking() {
    this.isWalking = false;
  }
  
  logPosition(p) {
    if (p.logs && p.logs.player_info) {
      p.logs.player_info.push({
        screen_x: this.x,
        screen_y: this.y,
        game_x: this.x,
        game_y: this.y,
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Flip if facing left
    if (this.facing < 0) {
      p.scale(-1, 1);
    }
    
    // Body - starts grayscale, gains color
    const bodyColor = getColorWithSaturation(p, 100, 100, 180, 0);
    p.fill(bodyColor);
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(0, 5, this.width - 10, this.height - 20, 5);
    
    // Head
    const skinColor = getColorWithSaturation(p, 255, 220, 180, 0);
    p.fill(skinColor);
    p.circle(0, -15, 20);
    
    // Eyes
    p.fill(255);
    p.circle(-4, -17, 6);
    p.circle(4, -17, 6);
    p.fill(0);
    p.circle(-4, -17, 3);
    p.circle(4, -17, 3);
    
    // Legs - simple walking animation
    const legOffset = p.sin(this.walkCycle) * 5;
    p.fill(bodyColor);
    p.rect(-5, this.height / 2 - 5 + legOffset, 6, 15, 3);
    p.rect(5, this.height / 2 - 5 - legOffset, 6, 15, 3);
    
    p.pop();
  }
}

// Interactable object base class
export class Interactable {
  constructor(x, y, width, height, taskType, room) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.taskType = taskType;
    this.room = room;
    this.highlighted = false;
    this.completed = false;
    
    gameState.interactables.push(this);
  }
  
  isPlayerNear() {
    if (!gameState.player) return false;
    
    const dx = gameState.player.x - this.x;
    const dy = gameState.player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance < 60 && gameState.currentRoom === this.room;
  }
  
  canInteract() {
    return this.isPlayerNear() && 
           getCurrentTask() === this.taskType && 
           !gameState.taskInProgress &&
           !this.completed;
  }
  
  interact() {
    if (this.canInteract()) {
      gameState.taskInProgress = true;
      gameState.taskProgress = 0;
      this.startTask();
    }
  }
  
  startTask() {
    // Override in subclasses
  }
  
  updateTask(p) {
    // Override in subclasses
  }
  
  completeTask() {
    this.completed = true;
    advanceTask();
  }
  
  update(p) {
    this.highlighted = this.canInteract();
    
    if (gameState.taskInProgress && getCurrentTask() === this.taskType) {
      this.updateTask(p);
    }
  }
  
  render(p) {
    // Override in subclasses
  }
  
  renderHighlight(p) {
    if (this.highlighted) {
      p.push();
      p.noFill();
      p.stroke(255, 255, 0, 100 + p.sin(p.frameCount * 0.1) * 50);
      p.strokeWeight(3);
      p.rectMode(p.CENTER);
      p.rect(this.x, this.y, this.width + 10, this.height + 10, 5);
      p.pop();
    }
  }
}

// Bed - for waking and sleeping
export class Bed extends Interactable {
  constructor(x, y) {
    super(x, y, 100, 60, TASK_WAKE, ROOM_BED);
    this.sleepTaskType = TASK_SLEEP;
  }
  
  canInteract() {
    const task = getCurrentTask();
    return this.isPlayerNear() && 
           (task === TASK_WAKE || task === TASK_SLEEP) && 
           !gameState.taskInProgress &&
           gameState.currentRoom === ROOM_BED;
  }
  
  startTask() {
    gameState.showTaskPrompt = true;
    const task = getCurrentTask();
    gameState.taskPromptText = task === TASK_WAKE ? "Waking up..." : "Going to sleep...";
  }
  
  updateTask(p) {
    gameState.taskProgress += 1;
    
    if (gameState.taskProgress >= 60) {
      gameState.showTaskPrompt = false;
      this.completeTask();
    }
  }
  
  render(p) {
    p.push();
    
    // Bed frame
    const bedColor = getColorWithSaturation(p, 139, 69, 19, 0);
    p.fill(bedColor);
    p.rectMode(p.CENTER);
    p.rect(this.x, this.y, this.width, this.height, 5);
    
    // Blanket
    const blanketColor = getColorWithSaturation(p, 200, 200, 255, 0);
    p.fill(blanketColor);
    p.rect(this.x, this.y - 5, this.width - 20, this.height - 20, 3);
    
    // Pillow
    const pillowColor = getColorWithSaturation(p, 255, 255, 255, 0);
    p.fill(pillowColor);
    p.rect(this.x - this.width / 4, this.y - this.height / 4, 30, 20, 5);
    
    p.pop();
    
    this.renderHighlight(p);
  }
}

// Shower - for showering task
export class Shower extends Interactable {
  constructor(x, y) {
    super(x, y, 50, 80, TASK_SHOWER, ROOM_BATHROOM);
    this.waterParticles = [];
  }
  
  startTask() {
    gameState.showTaskPrompt = true;
    gameState.taskPromptText = "Taking a shower...";
  }
  
  updateTask(p) {
    gameState.taskProgress += 1;
    
    // Create water particles
    if (p.frameCount % 3 === 0) {
      this.waterParticles.push({
        x: this.x + p.random(-10, 10),
        y: this.y - this.height / 2,
        vy: p.random(2, 4),
        life: 20
      });
    }
    
    // Update water particles
    for (let i = this.waterParticles.length - 1; i >= 0; i--) {
      const particle = this.waterParticles[i];
      particle.y += particle.vy;
      particle.life--;
      
      if (particle.life <= 0) {
        this.waterParticles.splice(i, 1);
      }
    }
    
    if (gameState.taskProgress >= 90) {
      gameState.showTaskPrompt = false;
      this.waterParticles = [];
      this.completeTask();
    }
  }
  
  render(p) {
    p.push();
    
    // Shower stall
    const stallColor = getColorWithSaturation(p, 220, 220, 220, 0);
    p.fill(stallColor);
    p.rectMode(p.CENTER);
    p.rect(this.x, this.y, this.width, this.height, 5);
    
    // Shower head
    const showerColor = getColorWithSaturation(p, 180, 180, 180, 0);
    p.fill(showerColor);
    p.circle(this.x, this.y - this.height / 2 + 10, 15);
    
    // Water particles
    const waterColor = getColorWithSaturation(p, 100, 150, 255, 0);
    p.fill(waterColor);
    p.noStroke();
    for (const particle of this.waterParticles) {
      p.circle(particle.x, particle.y, 3);
    }
    
    p.pop();
    
    this.renderHighlight(p);
  }
}

// Sink - for brushing teeth
export class Sink extends Interactable {
  constructor(x, y) {
    super(x, y, 60, 40, TASK_BRUSH, ROOM_BATHROOM);
  }
  
  startTask() {
    gameState.showTaskPrompt = true;
    gameState.taskPromptText = "Brushing teeth...";
  }
  
  updateTask(p) {
    gameState.taskProgress += 1;
    
    if (gameState.taskProgress >= 60) {
      gameState.showTaskPrompt = false;
      this.completeTask();
    }
  }
  
  render(p) {
    p.push();
    
    // Sink basin
    const sinkColor = getColorWithSaturation(p, 240, 240, 240, 0);
    p.fill(sinkColor);
    p.rectMode(p.CENTER);
    p.rect(this.x, this.y, this.width, this.height, 5);
    
    // Faucet
    const faucetColor = getColorWithSaturation(p, 200, 200, 200, 0);
    p.fill(faucetColor);
    p.rect(this.x, this.y - this.height / 2 - 5, 15, 10, 3);
    
    // Toothbrush
    const brushColor = getColorWithSaturation(p, 100, 200, 100, 0);
    p.fill(brushColor);
    p.rect(this.x + 20, this.y - 5, 3, 20, 2);
    p.fill(255);
    p.rect(this.x + 20, this.y - 15, 5, 5, 2);
    
    p.pop();
    
    this.renderHighlight(p);
  }
}

// Dining Table - for breakfast
export class DiningTable extends Interactable {
  constructor(x, y) {
    super(x, y, 80, 60, TASK_BREAKFAST, ROOM_DINING);
    this.eatProgress = 0;
  }
  
  startTask() {
    gameState.showTaskPrompt = true;
    gameState.taskPromptText = "Eating breakfast...";
    this.eatProgress = 0;
  }
  
  updateTask(p) {
    gameState.taskProgress += 1;
    this.eatProgress = gameState.taskProgress / 80;
    
    if (gameState.taskProgress >= 80) {
      gameState.showTaskPrompt = false;
      this.completeTask();
    }
  }
  
  render(p) {
    p.push();
    
    // Table
    const tableColor = getColorWithSaturation(p, 139, 90, 43, 0);
    p.fill(tableColor);
    p.rectMode(p.CENTER);
    p.rect(this.x, this.y, this.width, this.height, 5);
    
    // Plate
    const plateColor = getColorWithSaturation(p, 255, 255, 255, 0);
    p.fill(plateColor);
    p.circle(this.x, this.y, 40);
    
    // Food (disappears as eaten)
    if (this.eatProgress < 1) {
      const foodColor = getColorWithSaturation(p, 255, 200, 100, 0);
      p.fill(foodColor);
      const foodSize = 30 * (1 - this.eatProgress);
      p.circle(this.x, this.y, foodSize);
    }
    
    // Fork
    const silverColor = getColorWithSaturation(p, 192, 192, 192, 0);
    p.fill(silverColor);
    p.rect(this.x + 25, this.y, 3, 25, 2);
    
    p.pop();
    
    this.renderHighlight(p);
  }
}

// Exercise Equipment
export class ExerciseEquipment extends Interactable {
  constructor(x, y) {
    super(x, y, 70, 70, TASK_EXERCISE, ROOM_RECREATION);
    this.exerciseCycle = 0;
  }
  
  startTask() {
    gameState.showTaskPrompt = true;
    gameState.taskPromptText = "Exercising...";
    this.exerciseCycle = 0;
  }
  
  updateTask(p) {
    gameState.taskProgress += 1;
    this.exerciseCycle += 0.1;
    
    if (gameState.taskProgress >= 100) {
      gameState.showTaskPrompt = false;
      this.completeTask();
    }
  }
  
  render(p) {
    p.push();
    
    // Exercise mat
    const matColor = getColorWithSaturation(p, 100, 150, 200, 0);
    p.fill(matColor);
    p.rectMode(p.CENTER);
    p.rect(this.x, this.y, this.width, this.height, 5);
    
    // Dumbbells
    const weightColor = getColorWithSaturation(p, 80, 80, 80, 0);
    p.fill(weightColor);
    const wobble = p.sin(this.exerciseCycle) * 5;
    p.circle(this.x - 20, this.y + wobble, 15);
    p.circle(this.x + 20, this.y - wobble, 15);
    p.rect(this.x, this.y, 30, 5);
    
    p.pop();
    
    this.renderHighlight(p);
  }
}

// Therapy Chair
export class TherapyChair extends Interactable {
  constructor(x, y) {
    super(x, y, 50, 60, TASK_THERAPY, ROOM_THERAPY);
  }
  
  startTask() {
    gameState.showTaskPrompt = true;
    gameState.taskPromptText = "In therapy session...";
  }
  
  updateTask(p) {
    gameState.taskProgress += 1;
    
    if (gameState.taskProgress >= 120) {
      gameState.showTaskPrompt = false;
      // Trigger dream sequence sometimes
      if (gameState.dreamSequencesCompleted < 3 && p.random() > 0.5) {
        gameState.splitScreenActive = true;
        gameState.currentPuzzle = new MemoryPuzzle(p);
      }
      this.completeTask();
    }
  }
  
  render(p) {
    p.push();
    
    // Chair
    const chairColor = getColorWithSaturation(p, 139, 69, 19, 0);
    p.fill(chairColor);
    p.rectMode(p.CENTER);
    p.rect(this.x, this.y, this.width, this.height - 20, 5);
    p.rect(this.x, this.y - this.height / 2 + 10, this.width, 20, 5);
    
    p.pop();
    
    this.renderHighlight(p);
  }
}

// White Door - the exit
export class WhiteDoor {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 80;
    this.height = 120;
    this.glowIntensity = 0;
  }
  
  update(p) {
    if (gameState.doorUnlocked) {
      this.glowIntensity = p.sin(p.frameCount * 0.05) * 50 + 150;
    }
  }
  
  render(p) {
    p.push();
    
    // Door glow when unlocked
    if (gameState.doorUnlocked) {
      p.fill(255, 255, 255, this.glowIntensity * 0.3);
      p.noStroke();
      p.rectMode(p.CENTER);
      p.rect(this.x, this.y, this.width + 20, this.height + 20, 10);
    }
    
    // Door itself - pure white
    p.fill(255);
    p.stroke(200);
    p.strokeWeight(3);
    p.rectMode(p.CENTER);
    p.rect(this.x, this.y, this.width, this.height, 5);
    
    // Door handle
    const handleColor = getColorWithSaturation(p, 218, 165, 32, 0);
    p.fill(handleColor);
    p.circle(this.x + this.width / 3, this.y, 8);
    
    // Lock indicator
    if (!gameState.doorUnlocked) {
      p.fill(150, 0, 0);
      p.circle(this.x, this.y - this.height / 4, 10);
    } else {
      p.fill(0, 255, 0);
      p.circle(this.x, this.y - this.height / 4, 10);
    }
    
    p.pop();
  }
}

// Memory Puzzle - simple pattern matching
export class MemoryPuzzle {
  constructor(p) {
    this.pattern = [];
    this.playerInput = [];
    this.showingPattern = true;
    this.currentIndex = 0;
    this.patternLength = 4;
    this.flashTimer = 0;
    
    // Generate random pattern
    for (let i = 0; i < this.patternLength; i++) {
      this.pattern.push(Math.floor(p.random(4)));
    }
  }
  
  update(p) {
    if (this.showingPattern) {
      this.flashTimer++;
      if (this.flashTimer >= 30) {
        this.currentIndex++;
        this.flashTimer = 0;
        
        if (this.currentIndex >= this.patternLength) {
          this.showingPattern = false;
          this.currentIndex = 0;
        }
      }
    }
  }
  
  addInput(index) {
    if (this.showingPattern) return false;
    
    this.playerInput.push(index);
    
    // Check if input matches pattern so far
    const currentPos = this.playerInput.length - 1;
    if (this.playerInput[currentPos] !== this.pattern[currentPos]) {
      // Wrong input - reset
      this.playerInput = [];
      gameState.puzzleAttempts++;
      return false;
    }
    
    // Check if complete
    if (this.playerInput.length === this.patternLength) {
      // Success!
      gameState.dreamSequencesCompleted++;
      gameState.memoryFragments.push({
        id: gameState.dreamSequencesCompleted,
        recovered: true
      });
      gameState.splitScreenActive = false;
      gameState.currentPuzzle = null;
      return true;
    }
    
    return false;
  }
  
  render(p) {
    p.push();
    
    // Split screen - left side is reality (dim), right side is puzzle
    p.fill(0, 0, 0, 180);
    p.rect(CANVAS_WIDTH / 2, 0, CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    
    // Draw puzzle on right side
    const startX = CANVAS_WIDTH / 2 + 50;
    const startY = 100;
    const spacing = 70;
    
    // Title
    p.fill(255);
    p.textAlign(p.CENTER);
    p.textSize(16);
    p.text("Memory Puzzle", CANVAS_WIDTH * 0.75, 40);
    p.textSize(12);
    p.text("Watch the pattern, then repeat it", CANVAS_WIDTH * 0.75, 60);
    
    // Draw four buttons
    for (let i = 0; i < 4; i++) {
      const x = startX + (i % 2) * spacing;
      const y = startY + Math.floor(i / 2) * spacing;
      
      // Highlight if showing pattern
      let highlight = false;
      if (this.showingPattern && this.currentIndex < this.patternLength) {
        if (this.pattern[this.currentIndex] === i && this.flashTimer > 15) {
          highlight = true;
        }
      }
      
      // Button colors with restoration
      const colors = [
        getColorWithSaturation(p, 255, 100, 100, 50),
        getColorWithSaturation(p, 100, 255, 100, 50),
        getColorWithSaturation(p, 100, 100, 255, 50),
        getColorWithSaturation(p, 255, 255, 100, 50)
      ];
      
      p.fill(highlight ? p.color(255) : colors[i]);
      p.stroke(255);
      p.strokeWeight(2);
      p.circle(x, y, 50);
      
      // Draw number
      p.fill(0);
      p.noStroke();
      p.textSize(20);
      p.text(i + 1, x, y);
    }
    
    // Show player progress
    p.fill(255);
    p.textSize(14);
    p.text(`Progress: ${this.playerInput.length}/${this.patternLength}`, 
           CANVAS_WIDTH * 0.75, CANVAS_HEIGHT - 40);
    
    if (!this.showingPattern) {
      p.text("Use Arrow Keys + Space to input pattern", 
             CANVAS_WIDTH * 0.75, CANVAS_HEIGHT - 20);
    }
    
    p.pop();
  }
}

// Particle for visual effects
export class Particle {
  constructor(x, y, vx, vy, color, life) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.maxLife = life;
    this.life = life;
    this.size = 4;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // Gravity
    this.life--;
  }
  
  isDead() {
    return this.life <= 0;
  }
  
  render(p) {
    const alpha = (this.life / this.maxLife) * 255;
    p.push();
    p.fill(this.color[0], this.color[1], this.color[2], alpha);
    p.noStroke();
    p.circle(this.x, this.y, this.size);
    p.pop();
  }
}