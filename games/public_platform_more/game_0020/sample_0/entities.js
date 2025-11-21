import { GRID_SIZE, DIRECTIONS } from './globals.js';

export class Robot {
  constructor(x, y, direction = DIRECTIONS.UP) {
    this.gridX = x;
    this.gridY = y;
    this.direction = direction;
    this.health = 3;
    this.maxHealth = 3;
    this.program = [];
    this.currentStep = 0;
    this.isActive = true;
    this.animationProgress = 0;
    this.targetGridX = x;
    this.targetGridY = y;
    this.isMoving = false;
  }

  getScreenX() {
    return this.gridX * GRID_SIZE + GRID_SIZE / 2 + 10;
  }

  getScreenY() {
    return this.gridY * GRID_SIZE + GRID_SIZE / 2 + 50;
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.isActive = false;
    }
  }

  resetPosition(x, y, direction) {
    this.gridX = x;
    this.gridY = y;
    this.direction = direction;
    this.targetGridX = x;
    this.targetGridY = y;
    this.health = this.maxHealth;
    this.isActive = true;
    this.currentStep = 0;
    this.animationProgress = 0;
    this.isMoving = false;
  }
}

export class Enemy {
  constructor(x, y, enemyType = 'basic') {
    this.gridX = x;
    this.gridY = y;
    this.health = enemyType === 'basic' ? 1 : 2;
    this.maxHealth = this.health;
    this.isActive = true;
    this.type = enemyType;
  }

  getScreenX() {
    return this.gridX * GRID_SIZE + GRID_SIZE / 2 + 10;
  }

  getScreenY() {
    return this.gridY * GRID_SIZE + GRID_SIZE / 2 + 50;
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.isActive = false;
    }
  }
}

export class Exit {
  constructor(x, y) {
    this.gridX = x;
    this.gridY = y;
    this.reached = false;
  }

  getScreenX() {
    return this.gridX * GRID_SIZE + GRID_SIZE / 2 + 10;
  }

  getScreenY() {
    return this.gridY * GRID_SIZE + GRID_SIZE / 2 + 50;
  }
}

export class Obstacle {
  constructor(x, y) {
    this.gridX = x;
    this.gridY = y;
  }

  getScreenX() {
    return this.gridX * GRID_SIZE + GRID_SIZE / 2 + 10;
  }

  getScreenY() {
    return this.gridY * GRID_SIZE + GRID_SIZE / 2 + 50;
  }
}