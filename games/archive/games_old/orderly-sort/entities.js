// entities.js - Game entities

import { ITEM_COLORS, ITEM_SIZE, CONTAINER_SIZE, CELL_WIDTH, CELL_HEIGHT, GRID_COLS, GRID_ROWS } from './globals.js';

export class Item {
  constructor(id, type, gridX, gridY, p) {
    this.id = id;
    this.type = type;
    this.gridX = gridX;
    this.gridY = gridY;
    this.currentX = gridX * CELL_WIDTH + CELL_WIDTH / 2;
    this.currentY = gridY * CELL_HEIGHT + CELL_HEIGHT / 2;
    this.originalX = this.currentX;
    this.originalY = this.currentY;
    this.targetX = this.currentX;
    this.targetY = this.currentY;
    this.width = ITEM_SIZE;
    this.height = ITEM_SIZE;
    this.isSorted = false;
    this.containerId = null;
    this.isBeingHeld = false;
    this.isHighlighted = false;
    this.animationProgress = 0;
    this.p = p;
    this.wobbleOffset = this.p.random(0, this.p.TWO_PI);
  }

  update(deltaTime) {
    // Smooth movement animation
    if (this.p.abs(this.currentX - this.targetX) > 0.5 || this.p.abs(this.currentY - this.targetY) > 0.5) {
      this.currentX = this.p.lerp(this.currentX, this.targetX, 0.2);
      this.currentY = this.p.lerp(this.currentY, this.targetY, 0.2);
    } else {
      this.currentX = this.targetX;
      this.currentY = this.targetY;
    }

    // Animation progress
    if (this.animationProgress < 1) {
      this.animationProgress += deltaTime * 3;
      if (this.animationProgress > 1) this.animationProgress = 1;
    }
  }

  draw() {
    this.p.push();
    this.p.translate(this.currentX, this.currentY);
    
    // Scaling effect when held
    const scale = this.isBeingHeld ? 1.2 : 1.0;
    this.p.scale(scale);

    // Subtle wobble when not held and not sorted
    if (!this.isBeingHeld && !this.isSorted) {
      const wobble = this.p.sin(this.p.frameCount * 0.05 + this.wobbleOffset) * 2;
      this.p.translate(wobble, 0);
    }

    // Shadow
    if (!this.isSorted) {
      this.p.fill(0, 0, 0, 50);
      this.p.noStroke();
      this.drawShape(3, 3);
    }

    // Item shape
    const color = ITEM_COLORS[this.type];
    this.p.fill(...color);
    this.p.stroke(255);
    this.p.strokeWeight(2);
    this.drawShape(0, 0);

    // Highlight when held or highlighted
    if (this.isBeingHeld || this.isHighlighted) {
      this.p.noFill();
      this.p.stroke(255, 255, 100, 200);
      this.p.strokeWeight(3);
      this.drawShape(0, 0);
    }

    this.p.pop();
  }

  drawShape(offsetX, offsetY) {
    this.p.push();
    this.p.translate(offsetX, offsetY);
    
    const size = this.width;
    switch (this.type) {
      case 'RED_CIRCLE':
        this.p.circle(0, 0, size);
        break;
      case 'BLUE_SQUARE':
        this.p.rectMode(this.p.CENTER);
        this.p.rect(0, 0, size, size);
        break;
      case 'GREEN_TRIANGLE':
        this.p.beginShape();
        this.p.vertex(0, -size / 2);
        this.p.vertex(-size / 2, size / 2);
        this.p.vertex(size / 2, size / 2);
        this.p.endShape(this.p.CLOSE);
        break;
      case 'YELLOW_DIAMOND':
        this.p.push();
        this.p.rotate(this.p.PI / 4);
        this.p.rectMode(this.p.CENTER);
        this.p.rect(0, 0, size * 0.7, size * 0.7);
        this.p.pop();
        break;
      case 'PURPLE_HEXAGON':
        this.p.beginShape();
        for (let i = 0; i < 6; i++) {
          const angle = this.p.TWO_PI / 6 * i - this.p.PI / 2;
          const x = this.p.cos(angle) * size / 2;
          const y = this.p.sin(angle) * size / 2;
          this.p.vertex(x, y);
        }
        this.p.endShape(this.p.CLOSE);
        break;
    }
    this.p.pop();
  }

  setTarget(x, y) {
    this.targetX = x;
    this.targetY = y;
  }

  snapTo(x, y) {
    this.currentX = x;
    this.currentY = y;
    this.targetX = x;
    this.targetY = y;
  }

  resetToOriginal() {
    this.setTarget(this.originalX, this.originalY);
  }

  setPosition(x, y) {
    this.currentX = x;
    this.currentY = y;
    this.targetX = x;
    this.targetY = y;
  }

  markAsSorted(containerId) {
    this.isSorted = true;
    this.containerId = containerId;
    this.isBeingHeld = false;
  }
}

export class Container {
  constructor(id, acceptedType, gridX, gridY, p) {
    this.id = id;
    this.acceptedType = acceptedType;
    this.gridX = gridX;
    this.gridY = gridY;
    this.x = gridX * CELL_WIDTH + CELL_WIDTH / 2 - CONTAINER_SIZE / 2;
    this.y = gridY * CELL_HEIGHT + CELL_HEIGHT / 2 - CONTAINER_SIZE / 2;
    this.width = CONTAINER_SIZE;
    this.height = CONTAINER_SIZE;
    this.itemsInside = [];
    this.isHighlighted = false;
    this.p = p;
    this.pulsePhase = this.p.random(0, this.p.TWO_PI);
  }

  draw(isHovered) {
    this.p.push();
    this.p.translate(this.x + this.width / 2, this.y + this.height / 2);

    // Subtle pulse
    const pulse = this.p.sin(this.p.frameCount * 0.03 + this.pulsePhase) * 3;
    
    // Background with depth
    this.p.fill(40, 40, 50);
    this.p.stroke(80, 80, 90);
    this.p.strokeWeight(3);
    this.p.rectMode(this.p.CENTER);
    this.p.rect(0, 0, this.width + pulse, this.height + pulse, 5);

    // Inner shadow
    this.p.fill(25, 25, 35);
    this.p.noStroke();
    this.p.rect(0, 0, this.width - 10, this.height - 10, 3);

    // Type indicator (small version of accepted shape)
    const color = ITEM_COLORS[this.acceptedType];
    this.p.fill(...color, 100);
    this.p.stroke(...color, 150);
    this.p.strokeWeight(1);
    this.drawTypeIndicator();

    // Hover/highlight
    if (isHovered || this.isHighlighted) {
      this.p.noFill();
      this.p.stroke(255, 255, 100, 150);
      this.p.strokeWeight(3);
      this.p.rect(0, 0, this.width + 5, this.height + 5, 5);
    }

    // Fullness indicator
    const capacity = 5;
    const fillLevel = this.itemsInside.length / capacity;
    if (fillLevel > 0) {
      this.p.fill(100, 200, 100, 100);
      this.p.noStroke();
      const barHeight = this.height * 0.8;
      this.p.rect(0, barHeight / 2 - this.height / 2 + 5, this.width - 20, -barHeight * fillLevel);
    }

    this.p.pop();
  }

  drawTypeIndicator() {
    const size = 20;
    this.p.push();
    
    switch (this.acceptedType) {
      case 'RED_CIRCLE':
        this.p.circle(0, -5, size);
        break;
      case 'BLUE_SQUARE':
        this.p.rectMode(this.p.CENTER);
        this.p.rect(0, -5, size, size);
        break;
      case 'GREEN_TRIANGLE':
        this.p.beginShape();
        this.p.vertex(0, -size / 2 - 5);
        this.p.vertex(-size / 2, size / 2 - 5);
        this.p.vertex(size / 2, size / 2 - 5);
        this.p.endShape(this.p.CLOSE);
        break;
      case 'YELLOW_DIAMOND':
        this.p.push();
        this.p.rotate(this.p.PI / 4);
        this.p.rectMode(this.p.CENTER);
        this.p.rect(0, -5, size * 0.7, size * 0.7);
        this.p.pop();
        break;
      case 'PURPLE_HEXAGON':
        this.p.beginShape();
        for (let i = 0; i < 6; i++) {
          const angle = this.p.TWO_PI / 6 * i - this.p.PI / 2;
          const x = this.p.cos(angle) * size / 2;
          const y = this.p.sin(angle) * size / 2 - 5;
          this.p.vertex(x, y);
        }
        this.p.endShape(this.p.CLOSE);
        break;
    }
    this.p.pop();
  }

  addItem(itemId) {
    if (!this.itemsInside.includes(itemId)) {
      this.itemsInside.push(itemId);
    }
  }

  removeItem(itemId) {
    const index = this.itemsInside.indexOf(itemId);
    if (index > -1) {
      this.itemsInside.splice(index, 1);
    }
  }

  isFull() {
    return this.itemsInside.length >= 5;
  }

  canAcceptItem(item) {
    return this.acceptedType === item.type && !this.isFull();
  }
}

export class Selector {
  constructor(p) {
    this.p = p;
    this.gridX = 0;
    this.gridY = 0;
    this.x = CELL_WIDTH / 2;
    this.y = CELL_HEIGHT / 2;
    this.targetX = this.x;
    this.targetY = this.y;
    this.size = 60;
  }

  update() {
    // Smooth movement
    this.x = this.p.lerp(this.x, this.targetX, 0.25);
    this.y = this.p.lerp(this.y, this.targetY, 0.25);
  }

  draw() {
    this.p.push();
    this.p.translate(this.x, this.y);
    
    // Animated corners
    const cornerSize = 15;
    const offset = 5;
    const pulse = this.p.sin(this.p.frameCount * 0.1) * 3;
    
    this.p.stroke(255, 200, 50, 200);
    this.p.strokeWeight(3);
    this.p.noFill();
    
    // Four corners
    const halfSize = this.size / 2 + pulse;
    
    // Top-left
    this.p.line(-halfSize, -halfSize + offset, -halfSize, -halfSize);
    this.p.line(-halfSize + offset, -halfSize, -halfSize, -halfSize);
    
    // Top-right
    this.p.line(halfSize - offset, -halfSize, halfSize, -halfSize);
    this.p.line(halfSize, -halfSize, halfSize, -halfSize + offset);
    
    // Bottom-left
    this.p.line(-halfSize, halfSize - offset, -halfSize, halfSize);
    this.p.line(-halfSize, halfSize, -halfSize + offset, halfSize);
    
    // Bottom-right
    this.p.line(halfSize - offset, halfSize, halfSize, halfSize);
    this.p.line(halfSize, halfSize, halfSize, halfSize - offset);
    
    this.p.pop();
  }

  moveToGrid(gridX, gridY) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.targetX = gridX * CELL_WIDTH + CELL_WIDTH / 2;
    this.targetY = gridY * CELL_HEIGHT + CELL_HEIGHT / 2;
  }

  snapToGrid(gridX, gridY) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.x = gridX * CELL_WIDTH + CELL_WIDTH / 2;
    this.y = gridY * CELL_HEIGHT + CELL_HEIGHT / 2;
    this.targetX = this.x;
    this.targetY = this.y;
  }

  moveLeft() {
    if (this.gridX > 0) {
      this.moveToGrid(this.gridX - 1, this.gridY);
    }
  }

  moveRight() {
    if (this.gridX < GRID_COLS - 1) {
      this.moveToGrid(this.gridX + 1, this.gridY);
    }
  }

  moveUp() {
    if (this.gridY > 0) {
      this.moveToGrid(this.gridX, this.gridY - 1);
    }
  }

  moveDown() {
    if (this.gridY < GRID_ROWS - 1) {
      this.moveToGrid(this.gridX, this.gridY + 1);
    }
  }

  getCurrentPosition() {
    return { x: this.x, y: this.y };
  }
}