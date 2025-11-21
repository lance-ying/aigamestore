// livestock.js - Animal management

import { gameState, ANIMAL_DATA } from './globals.js';

export class Animal {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.lastProduceTime = 0;
    this.isReady = false;
    this.animOffset = Math.random() * 100;
  }
  
  update(currentTime) {
    const animalData = ANIMAL_DATA[this.type];
    if (!this.isReady && this.lastProduceTime > 0) {
      const elapsed = currentTime - this.lastProduceTime;
      if (elapsed >= animalData.productionTime) {
        this.isReady = true;
      }
    } else if (this.lastProduceTime === 0) {
      this.lastProduceTime = currentTime;
    }
  }
  
  collect() {
    if (this.isReady) {
      const animalData = ANIMAL_DATA[this.type];
      this.isReady = false;
      this.lastProduceTime = gameState.gameTime;
      return { product: animalData.product, amount: animalData.productAmount };
    }
    return null;
  }
  
  render(p) {
    p.push();
    
    const animalData = ANIMAL_DATA[this.type];
    
    // Body
    p.fill(...animalData.color);
    p.stroke(80);
    p.strokeWeight(2);
    
    const wobble = Math.sin((p.frameCount + this.animOffset) * 0.1) * 2;
    p.ellipse(this.x + 30, this.y + 35 + wobble, 40, 30);
    
    // Head
    p.ellipse(this.x + 35, this.y + 20 + wobble, 25, 25);
    
    // Eyes
    p.fill(0);
    p.noStroke();
    p.ellipse(this.x + 30, this.y + 18 + wobble, 4, 4);
    p.ellipse(this.x + 40, this.y + 18 + wobble, 4, 4);
    
    // Ready indicator
    if (this.isReady) {
      p.fill(255, 255, 0);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(20);
      p.text('!', this.x + 30, this.y + 5);
    }
    
    p.pop();
  }
}

export function updateLivestock(gameState) {
  const currentTime = gameState.gameTime;
  gameState.livestock.forEach(animal => animal.update(currentTime));
}

export function renderLivestock(p, gameState) {
  gameState.livestock.forEach(animal => animal.render(p));
}

export function addAnimal(gameState, type) {
  const animalData = ANIMAL_DATA[type];
  if (gameState.playerGold >= animalData.cost) {
    const x = 350 + (gameState.livestock.length % 3) * 70;
    const y = 80 + Math.floor(gameState.livestock.length / 3) * 70;
    const animal = new Animal(type, x, y);
    gameState.livestock.push(animal);
    gameState.playerGold -= animalData.cost;
    return true;
  }
  return false;
}