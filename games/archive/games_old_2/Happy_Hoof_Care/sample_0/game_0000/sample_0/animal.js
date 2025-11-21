// animal.js - Animal class and factory
import { gameState } from './globals.js';

export class Animal {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.happiness = 70;
    this.availableMiniGames = [];
    this.size = 80;
  }

  increaseHappiness(amount) {
    const oldHappiness = this.happiness;
    this.happiness = Math.min(100, this.happiness + amount);
    return this.happiness - oldHappiness;
  }

  decreaseHappiness(amount) {
    this.happiness = Math.max(0, this.happiness - amount);
  }

  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Draw based on type
    if (this.type === 'ALPACA') {
      this.drawAlpaca(p);
    } else if (this.type === 'ELEPHANT') {
      this.drawElephant(p);
    } else if (this.type === 'GIRAFFE') {
      this.drawGiraffe(p);
    }
    
    // Draw happiness indicator
    this.drawHappiness(p);
    
    p.pop();
  }

  drawAlpaca(p) {
    // Body
    p.fill(240, 230, 220);
    p.noStroke();
    p.ellipse(0, 10, 60, 70);
    
    // Head
    p.ellipse(0, -25, 45, 50);
    
    // Ears
    p.ellipse(-15, -45, 12, 20);
    p.ellipse(15, -45, 12, 20);
    
    // Eyes
    p.fill(50);
    p.ellipse(-10, -30, 6, 8);
    p.ellipse(10, -30, 6, 8);
    
    // Snout
    p.fill(200, 180, 170);
    p.ellipse(0, -15, 20, 15);
    
    // Legs
    p.fill(240, 230, 220);
    p.rect(-20, 40, 10, 25);
    p.rect(10, 40, 10, 25);
  }

  drawElephant(p) {
    // Body
    p.fill(140, 140, 150);
    p.noStroke();
    p.ellipse(0, 10, 80, 70);
    
    // Head
    p.ellipse(0, -20, 55, 50);
    
    // Trunk
    p.fill(130, 130, 140);
    p.rect(-5, -5, 10, 40);
    p.ellipse(0, 35, 15, 15);
    
    // Ears
    p.fill(120, 120, 130);
    p.ellipse(-35, -15, 30, 40);
    p.ellipse(35, -15, 30, 40);
    
    // Eyes
    p.fill(50);
    p.ellipse(-12, -25, 6, 8);
    p.ellipse(12, -25, 6, 8);
    
    // Legs
    p.fill(140, 140, 150);
    p.rect(-25, 40, 12, 25);
    p.rect(13, 40, 12, 25);
  }

  drawGiraffe(p) {
    // Body
    p.fill(230, 200, 120);
    p.noStroke();
    p.ellipse(0, 20, 60, 50);
    
    // Neck
    p.fill(230, 200, 120);
    p.rect(-10, -40, 20, 60);
    
    // Head
    p.ellipse(0, -50, 35, 40);
    
    // Horns
    p.fill(180, 150, 90);
    p.rect(-10, -70, 5, 15);
    p.rect(5, -70, 5, 15);
    p.fill(200, 170, 100);
    p.ellipse(-7.5, -72, 8, 8);
    p.ellipse(7.5, -72, 8, 8);
    
    // Eyes
    p.fill(50);
    p.ellipse(-8, -55, 5, 6);
    p.ellipse(8, -55, 5, 6);
    
    // Snout
    p.fill(210, 180, 110);
    p.ellipse(0, -42, 18, 12);
    
    // Spots
    p.fill(180, 120, 60);
    p.ellipse(-15, 15, 12, 12);
    p.ellipse(10, 25, 10, 10);
    p.ellipse(-5, -10, 8, 8);
    p.ellipse(15, -20, 9, 9);
    
    // Legs
    p.fill(230, 200, 120);
    p.rect(-20, 45, 8, 30);
    p.rect(12, 45, 8, 30);
  }

  drawHappiness(p) {
    const barWidth = 60;
    const barHeight = 8;
    const barY = this.size / 2 + 10;
    
    // Background
    p.fill(100);
    p.noStroke();
    p.rect(-barWidth / 2, barY, barWidth, barHeight, 4);
    
    // Happiness bar
    const fillWidth = (this.happiness / 100) * barWidth;
    const happinessColor = this.happiness > 66 ? [100, 200, 100] :
                          this.happiness > 33 ? [230, 200, 80] :
                          [220, 80, 80];
    p.fill(...happinessColor);
    p.rect(-barWidth / 2, barY, fillWidth, barHeight, 4);
    
    // Text
    p.fill(255);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(10);
    p.text(`${Math.floor(this.happiness)}%`, 0, barY + barHeight + 2);
  }
}

export function createAnimals(level) {
  const config = level;
  const animals = [];
  
  const animalTypes = config.animals;
  const spacing = 150;
  const startX = 300 - ((animalTypes.length - 1) * spacing) / 2;
  
  animalTypes.forEach((type, index) => {
    const animal = new Animal(type, startX + index * spacing, 200);
    animal.availableMiniGames = config.minigames[type] || [];
    animals.push(animal);
  });
  
  return animals;
}