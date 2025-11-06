// interactable.js - Interactable objects in the game

export class Interactable {
  constructor(p, x, y, width, height, id, type, scene) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.id = id;
    this.type = type; // "item", "puzzle", "character", "door"
    this.scene = scene;
    this.collected = false;
    this.activated = false;
    this.highlighted = false;
    this.requiredItem = null; // Item needed to activate
    this.puzzleData = null;
  }

  isNear(player) {
    const distance = this.p.abs(player.x - this.x);
    return distance < 60 && !this.collected;
  }

  interact(gameState) {
    // Override in subclasses
  }

  render() {
    // Override in subclasses
  }

  renderHighlight() {
    if (this.highlighted) {
      this.p.push();
      this.p.noFill();
      this.p.stroke(255, 255, 100);
      this.p.strokeWeight(3);
      this.p.rectMode(this.p.CENTER);
      this.p.rect(this.x, this.y, this.width + 10, this.height + 10, 5);
      this.p.pop();
    }
  }
}

export class ItemObject extends Interactable {
  constructor(p, x, y, id, itemName, scene) {
    super(p, x, y, 30, 30, id, "item", scene);
    this.itemName = itemName;
  }

  interact(gameState) {
    if (!this.collected) {
      this.collected = true;
      gameState.inventory.push({
        id: this.id,
        name: this.itemName,
        icon: this.itemName
      });
      gameState.score += 10;
      return true;
    }
    return false;
  }

  render() {
    if (this.collected) return;
    
    this.renderHighlight();
    
    this.p.push();
    this.p.translate(this.x, this.y);
    
    // Draw different items based on name
    if (this.itemName === "gear") {
      this.p.fill(120, 120, 140);
      this.p.stroke(80, 80, 100);
      this.p.strokeWeight(2);
      this.p.circle(0, 0, 25);
      for (let i = 0; i < 8; i++) {
        const angle = i * this.p.PI / 4;
        const x = this.p.cos(angle) * 12;
        const y = this.p.sin(angle) * 12;
        this.p.rect(x - 2, y - 2, 4, 4);
      }
      this.p.fill(60, 60, 80);
      this.p.circle(0, 0, 8);
    } else if (this.itemName === "key") {
      this.p.fill(220, 180, 60);
      this.p.stroke(160, 120, 30);
      this.p.strokeWeight(2);
      this.p.circle(-5, 0, 12);
      this.p.rect(0, -2, 15, 4);
      this.p.rect(10, -6, 3, 6);
      this.p.rect(14, -6, 3, 6);
    } else if (this.itemName === "wrench") {
      this.p.fill(140, 140, 150);
      this.p.stroke(90, 90, 100);
      this.p.strokeWeight(2);
      this.p.rect(-8, -2, 20, 4);
      this.p.circle(-10, 0, 10);
      this.p.rect(8, -8, 6, 16);
    } else if (this.itemName === "fuse") {
      this.p.fill(200, 50, 50);
      this.p.stroke(140, 30, 30);
      this.p.strokeWeight(2);
      this.p.rect(-6, -3, 12, 6, 2);
      this.p.fill(180, 180, 190);
      this.p.rect(-8, -2, 3, 4);
      this.p.rect(5, -2, 3, 4);
    }
    
    // Floating animation
    const bobOffset = this.p.sin(this.p.frameCount * 0.05 + this.x) * 3;
    this.p.translate(0, bobOffset);
    
    this.p.pop();
  }
}

export class PuzzleObject extends Interactable {
  constructor(p, x, y, id, puzzleType, scene) {
    super(p, x, y, 60, 60, id, "puzzle", scene);
    this.puzzleType = puzzleType;
    this.solved = false;
  }

  interact(gameState) {
    if (this.solved) return false;
    
    // Initialize puzzle if not exists
    if (!gameState.puzzleStates[this.id]) {
      gameState.puzzleStates[this.id] = this.initializePuzzle();
    }
    
    return true;
  }

  initializePuzzle() {
    if (this.puzzleType === "gears") {
      return {
        rotation: 0,
        targetRotation: 90,
        solved: false
      };
    } else if (this.puzzleType === "pattern") {
      return {
        sequence: [0, 2, 1, 3],
        userSequence: [],
        solved: false
      };
    }
    return {};
  }

  render() {
    if (this.solved) {
      this.renderSolved();
      return;
    }
    
    this.renderHighlight();
    
    this.p.push();
    this.p.translate(this.x, this.y);
    
    if (this.puzzleType === "gears") {
      // Gear mechanism
      this.p.fill(100, 100, 110);
      this.p.stroke(60, 60, 70);
      this.p.strokeWeight(2);
      this.p.rect(-25, -25, 50, 50, 5);
      
      this.p.fill(140, 140, 160);
      this.p.circle(0, 0, 35);
      for (let i = 0; i < 6; i++) {
        const angle = i * this.p.PI / 3;
        const x = this.p.cos(angle) * 15;
        const y = this.p.sin(angle) * 15;
        this.p.rect(x - 3, y - 3, 6, 6);
      }
    } else if (this.puzzleType === "pattern") {
      // Pattern puzzle
      this.p.fill(80, 80, 100);
      this.p.stroke(50, 50, 60);
      this.p.strokeWeight(2);
      this.p.rect(-25, -25, 50, 50, 5);
      
      const colors = [[255, 100, 100], [100, 255, 100], [100, 100, 255], [255, 255, 100]];
      for (let i = 0; i < 4; i++) {
        this.p.fill(...colors[i]);
        const xPos = (i % 2) * 20 - 10;
        const yPos = this.p.floor(i / 2) * 20 - 10;
        this.p.circle(xPos, yPos, 15);
      }
    }
    
    this.p.pop();
  }

  renderSolved() {
    this.p.push();
    this.p.translate(this.x, this.y);
    
    this.p.fill(100, 200, 100);
    this.p.stroke(50, 150, 50);
    this.p.strokeWeight(2);
    this.p.rect(-25, -25, 50, 50, 5);
    
    // Check mark
    this.p.noFill();
    this.p.stroke(255, 255, 255);
    this.p.strokeWeight(4);
    this.p.line(-10, 0, -2, 8);
    this.p.line(-2, 8, 10, -8);
    
    this.p.pop();
  }
}

export class DoorObject extends Interactable {
  constructor(p, x, y, id, targetScene, requiredItem, scene) {
    super(p, x, y, 40, 70, id, "door", scene);
    this.targetScene = targetScene;
    this.requiredItem = requiredItem;
    this.unlocked = requiredItem === null;
  }

  interact(gameState) {
    if (this.unlocked) {
      gameState.currentScene = this.targetScene;
      gameState.sceneTransition = true;
      gameState.transitionTimer = 30;
      gameState.score += 20;
      return true;
    }
    return false;
  }

  tryUnlock(itemId) {
    if (this.requiredItem === itemId) {
      this.unlocked = true;
      return true;
    }
    return false;
  }

  render() {
    this.renderHighlight();
    
    this.p.push();
    this.p.translate(this.x, this.y);
    
    if (this.unlocked) {
      this.p.fill(120, 180, 120);
      this.p.stroke(80, 140, 80);
    } else {
      this.p.fill(140, 100, 80);
      this.p.stroke(100, 60, 40);
    }
    
    this.p.strokeWeight(3);
    this.p.rect(-20, -35, 40, 70, 5);
    
    // Door handle
    this.p.fill(200, 180, 100);
    this.p.circle(10, 0, 6);
    
    // Lock indicator
    if (!this.unlocked) {
      this.p.fill(220, 180, 60);
      this.p.stroke(160, 120, 30);
      this.p.strokeWeight(2);
      this.p.rect(-8, -5, 6, 10, 2);
      this.p.circle(-5, -8, 8);
    }
    
    this.p.pop();
  }
}