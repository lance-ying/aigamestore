// entities.js - Game entity classes

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Player {
  constructor(p, x, y, color) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.z = 0; // height/platform level
    this.color = color;
    this.blocks = 0;
    this.speed = 2.5;
    this.size = 20;
    this.targetX = x;
    this.targetY = y;
    this.isMoving = false;
    this.direction = { x: 0, y: 0 };
    this.finishTime = null;
    this.hasFinished = false;
  }

  moveTowards(targetX, targetY) {
    this.targetX = targetX;
    this.targetY = targetY;
    this.isMoving = true;
  }

  update() {
    // Apply movement
    if (this.isMoving) {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > this.speed) {
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
        this.direction.x = dx / dist;
        this.direction.y = dy / dist;
      } else {
        this.x = this.targetX;
        this.y = this.targetY;
        this.isMoving = false;
        this.direction.x = 0;
        this.direction.y = 0;
      }
    }

    // Constrain to canvas
    this.x = this.p.constrain(this.x, this.size, CANVAS_WIDTH - this.size);
    this.y = this.p.constrain(this.y, this.size, CANVAS_HEIGHT - this.size);
  }

  collectBlock() {
    this.blocks++;
  }

  useBlock() {
    if (this.blocks > 0) {
      this.blocks--;
      return true;
    }
    return false;
  }

  knockBlocks(amount) {
    const knocked = Math.min(amount, this.blocks);
    this.blocks -= knocked;
    return knocked;
  }

  render() {
    this.p.push();
    
    // Shadow
    this.p.fill(0, 0, 0, 50);
    this.p.noStroke();
    this.p.ellipse(this.x, this.y + this.z * 0.3, this.size * 0.8, this.size * 0.4);
    
    // Character body (elevated by z)
    const renderY = this.y - this.z * 0.5;
    
    // Body
    this.p.fill(this.color.r, this.color.g, this.color.b);
    this.p.stroke(255);
    this.p.strokeWeight(2);
    this.p.ellipse(this.x, renderY, this.size, this.size);
    
    // Eyes
    this.p.fill(255);
    this.p.noStroke();
    this.p.ellipse(this.x - 5, renderY - 3, 6, 6);
    this.p.ellipse(this.x + 5, renderY - 3, 6, 6);
    
    // Pupils
    this.p.fill(0);
    const lookX = this.direction.x * 2;
    const lookY = this.direction.y * 2;
    this.p.ellipse(this.x - 5 + lookX, renderY - 3 + lookY, 3, 3);
    this.p.ellipse(this.x + 5 + lookX, renderY - 3 + lookY, 3, 3);
    
    // Block count indicator
    if (this.blocks > 0) {
      this.p.fill(255, 255, 255, 200);
      this.p.noStroke();
      this.p.textAlign(this.p.CENTER, this.p.CENTER);
      this.p.textSize(10);
      this.p.text(this.blocks, this.x, renderY + this.size * 0.8);
    }
    
    this.p.pop();
  }
}

export class AIOpponent extends Player {
  constructor(p, x, y, color, speed) {
    super(p, x, y, color);
    this.speed = speed;
    this.aiState = "COLLECT"; // COLLECT, BUILD, RACE
    this.targetBlock = null;
    this.targetBridge = null;
    this.thinkTimer = 0;
  }

  aiUpdate() {
    this.thinkTimer++;
    
    if (this.thinkTimer % 30 === 0) {
      this.makeDecision();
    }
    
    this.update();
  }

  makeDecision() {
    // Check if need blocks
    const nearbyBridges = gameState.bridges.filter(b => !b.isComplete);
    const needsBlocks = nearbyBridges.some(b => {
      const dist = Math.sqrt((b.x - this.x) ** 2 + (b.y - this.y) ** 2);
      return dist < 150 && this.blocks < b.blocksNeeded;
    });

    if (needsBlocks || this.blocks === 0) {
      this.aiState = "COLLECT";
      this.findNearestBlock();
    } else {
      this.aiState = "BUILD";
      this.findNearestBridge();
    }
  }

  findNearestBlock() {
    const availableBlocks = gameState.blocks.filter(b => 
      !b.collected && 
      b.color.r === this.color.r && 
      b.color.g === this.color.g && 
      b.color.b === this.color.b
    );
    
    if (availableBlocks.length > 0) {
      let nearest = availableBlocks[0];
      let minDist = Math.sqrt((nearest.x - this.x) ** 2 + (nearest.y - this.y) ** 2);
      
      for (let block of availableBlocks) {
        const dist = Math.sqrt((block.x - this.x) ** 2 + (block.y - this.y) ** 2);
        if (dist < minDist) {
          minDist = dist;
          nearest = block;
        }
      }
      
      this.targetBlock = nearest;
      this.moveTowards(nearest.x, nearest.y);
    }
  }

  findNearestBridge() {
    const incompleteBridges = gameState.bridges.filter(b => !b.isComplete);
    
    if (incompleteBridges.length > 0) {
      let nearest = incompleteBridges[0];
      let minDist = Math.sqrt((nearest.x - this.x) ** 2 + (nearest.y - this.y) ** 2);
      
      for (let bridge of incompleteBridges) {
        const dist = Math.sqrt((bridge.x - this.x) ** 2 + (bridge.y - this.y) ** 2);
        if (dist < minDist) {
          minDist = dist;
          nearest = bridge;
        }
      }
      
      this.targetBridge = nearest;
      this.moveTowards(nearest.x, nearest.y);
    } else {
      // Head to finish
      const finish = gameState.platforms.find(p => p.isFinish);
      if (finish) {
        this.moveTowards(finish.x, finish.y);
      }
    }
  }
}

export class Block {
  constructor(p, x, y, color) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = 12;
    this.collected = false;
    this.floatOffset = this.p.random(0, this.p.TWO_PI);
  }

  render(frameCount) {
    if (this.collected) return;
    
    this.p.push();
    
    const bobY = this.y + Math.sin(frameCount * 0.05 + this.floatOffset) * 3;
    
    // Shadow
    this.p.fill(0, 0, 0, 30);
    this.p.noStroke();
    this.p.ellipse(this.x, this.y + 3, this.size * 0.8, this.size * 0.4);
    
    // Block
    this.p.fill(this.color.r, this.color.g, this.color.b);
    this.p.stroke(255);
    this.p.strokeWeight(1);
    this.p.rect(this.x - this.size / 2, bobY - this.size / 2, this.size, this.size);
    
    // Highlight
    this.p.fill(255, 255, 255, 100);
    this.p.noStroke();
    this.p.rect(this.x - this.size / 2, bobY - this.size / 2, this.size / 2, this.size / 2);
    
    this.p.pop();
  }
}

export class Bridge {
  constructor(p, x, y, width, height, blocksNeeded) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.blocksNeeded = blocksNeeded;
    this.blocksPlaced = 0;
    this.isComplete = false;
    this.contributors = new Map(); // Track who built this bridge
  }

  addBlock(character) {
    if (!this.isComplete && this.blocksPlaced < this.blocksNeeded) {
      this.blocksPlaced++;
      
      // Track contributor
      const current = this.contributors.get(character) || 0;
      this.contributors.set(character, current + 1);
      
      if (this.blocksPlaced >= this.blocksNeeded) {
        this.isComplete = true;
      }
      return true;
    }
    return false;
  }

  render() {
    this.p.push();
    
    // Water/gap
    this.p.fill(50, 150, 255);
    this.p.noStroke();
    this.p.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    
    // Water effect
    for (let i = 0; i < 3; i++) {
      this.p.fill(100, 180, 255, 80);
      const waveOffset = (this.p.frameCount * 0.5 + i * 20) % this.width;
      this.p.ellipse(
        this.x - this.width / 2 + waveOffset,
        this.y,
        20,
        10
      );
    }
    
    // Bridge planks
    if (this.blocksPlaced > 0) {
      const progress = this.blocksPlaced / this.blocksNeeded;
      const bridgeWidth = this.width * progress;
      
      this.p.fill(139, 90, 43);
      this.p.stroke(101, 67, 33);
      this.p.strokeWeight(2);
      this.p.rect(
        this.x - this.width / 2,
        this.y - 8,
        bridgeWidth,
        16
      );
      
      // Planks detail
      for (let i = 0; i < bridgeWidth; i += 15) {
        this.p.stroke(101, 67, 33);
        this.p.line(
          this.x - this.width / 2 + i,
          this.y - 8,
          this.x - this.width / 2 + i,
          this.y + 8
        );
      }
    }
    
    // Progress indicator
    if (!this.isComplete) {
      this.p.fill(255);
      this.p.noStroke();
      this.p.textAlign(this.p.CENTER, this.p.CENTER);
      this.p.textSize(12);
      this.p.text(`${this.blocksPlaced}/${this.blocksNeeded}`, this.x, this.y - this.height / 2 - 15);
    }
    
    this.p.pop();
  }
}

export class Platform {
  constructor(p, x, y, width, height, level, isFinish = false) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.level = level;
    this.isFinish = isFinish;
  }

  render() {
    this.p.push();
    
    // Platform shadow/depth
    const depth = this.level * 10;
    this.p.fill(100, 80, 60);
    this.p.noStroke();
    this.p.rect(
      this.x - this.width / 2 + 3,
      this.y - this.height / 2 + 3,
      this.width,
      this.height
    );
    
    // Main platform
    if (this.isFinish) {
      this.p.fill(255, 215, 0);
    } else {
      this.p.fill(150, 120, 90);
    }
    this.p.stroke(120, 90, 60);
    this.p.strokeWeight(2);
    this.p.rect(
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height
    );
    
    // Finish line pattern
    if (this.isFinish) {
      this.p.fill(255, 255, 255, 150);
      this.p.noStroke();
      for (let i = 0; i < this.width; i += 20) {
        this.p.rect(
          this.x - this.width / 2 + i,
          this.y - this.height / 2,
          10,
          this.height
        );
      }
      
      // "FINISH" text
      this.p.fill(0);
      this.p.textAlign(this.p.CENTER, this.p.CENTER);
      this.p.textSize(16);
      this.p.text("FINISH", this.x, this.y);
    }
    
    this.p.pop();
  }
}