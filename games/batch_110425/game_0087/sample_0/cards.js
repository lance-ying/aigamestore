// cards.js - Card generation and vision system

import { gameState } from './globals.js';

export class Card {
  constructor(type, index, x, y, width, height) {
    this.type = type; // 'suspect', 'location', 'weapon'
    this.index = index;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    
    // Visual properties
    this.colors = this.generateColors();
    this.shapes = this.generateShapes();
    this.patterns = this.generatePatterns();
  }
  
  generateColors() {
    const colorPalettes = [
      [[180, 100, 150], [120, 80, 180], [90, 120, 200]],
      [[200, 80, 80], [220, 100, 60], [180, 60, 90]],
      [[80, 180, 120], [60, 200, 140], [100, 160, 100]],
      [[200, 180, 60], [220, 200, 80], [180, 160, 90]],
      [[100, 150, 200], [80, 130, 220], [120, 170, 180]],
      [[180, 120, 200], [160, 100, 180], [200, 140, 220]]
    ];
    return colorPalettes[this.index % colorPalettes.length];
  }
  
  generateShapes() {
    const shapeTypes = ['circles', 'squares', 'triangles', 'lines', 'curves', 'mixed'];
    return shapeTypes[this.index % shapeTypes.length];
  }
  
  generatePatterns() {
    const patterns = ['scattered', 'grid', 'concentric', 'diagonal', 'spiral', 'organic'];
    return patterns[this.index % patterns.length];
  }
  
  draw(p, isSelected = false, scale = 1) {
    p.push();
    p.translate(this.x, this.y);
    p.scale(scale);
    
    // Card background
    if (isSelected) {
      p.strokeWeight(4);
      p.stroke(255, 220, 100);
    } else {
      p.strokeWeight(2);
      p.stroke(200);
    }
    p.fill(240, 235, 220);
    p.rect(0, 0, this.width, this.height, 5);
    
    // Draw card content
    this.drawContent(p);
    
    p.pop();
  }
  
  drawContent(p) {
    p.push();
    p.translate(this.width / 2, this.height / 2);
    
    // Use seed based on index for consistency
    const seed = this.index * 1000;
    
    switch (this.shapes) {
      case 'circles':
        this.drawCircles(p, seed);
        break;
      case 'squares':
        this.drawSquares(p, seed);
        break;
      case 'triangles':
        this.drawTriangles(p, seed);
        break;
      case 'lines':
        this.drawLines(p, seed);
        break;
      case 'curves':
        this.drawCurves(p, seed);
        break;
      case 'mixed':
        this.drawMixed(p, seed);
        break;
    }
    
    p.pop();
  }
  
  drawCircles(p, seed) {
    const count = 5 + (seed % 8);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * p.TWO_PI + (seed * 0.1);
      const radius = 20 + ((seed + i * 10) % 30);
      const x = p.cos(angle) * radius;
      const y = p.sin(angle) * radius;
      const size = 8 + ((seed + i * 5) % 15);
      
      p.fill(...this.colors[i % this.colors.length]);
      p.noStroke();
      p.circle(x, y, size);
    }
  }
  
  drawSquares(p, seed) {
    const count = 4 + (seed % 6);
    for (let i = 0; i < count; i++) {
      const x = -30 + ((seed + i * 20) % 60);
      const y = -25 + ((seed + i * 15) % 50);
      const size = 10 + ((seed + i * 7) % 12);
      
      p.fill(...this.colors[i % this.colors.length]);
      p.noStroke();
      p.rectMode(p.CENTER);
      p.rect(x, y, size, size);
    }
    p.rectMode(p.CORNER);
  }
  
  drawTriangles(p, seed) {
    const count = 4 + (seed % 5);
    for (let i = 0; i < count; i++) {
      const x = -25 + ((seed + i * 18) % 50);
      const y = -20 + ((seed + i * 12) % 40);
      const size = 12 + ((seed + i * 6) % 10);
      
      p.fill(...this.colors[i % this.colors.length]);
      p.noStroke();
      p.triangle(x, y - size, x - size, y + size, x + size, y + size);
    }
  }
  
  drawLines(p, seed) {
    const count = 6 + (seed % 8);
    for (let i = 0; i < count; i++) {
      const x1 = -30 + ((seed + i * 15) % 60);
      const y1 = -25 + ((seed + i * 10) % 50);
      const x2 = x1 + (-10 + ((seed + i * 8) % 20));
      const y2 = y1 + (-10 + ((seed + i * 12) % 20));
      
      p.stroke(...this.colors[i % this.colors.length]);
      p.strokeWeight(2 + ((seed + i) % 3));
      p.line(x1, y1, x2, y2);
    }
  }
  
  drawCurves(p, seed) {
    p.noFill();
    const count = 3 + (seed % 4);
    for (let i = 0; i < count; i++) {
      p.stroke(...this.colors[i % this.colors.length]);
      p.strokeWeight(2);
      p.beginShape();
      for (let t = 0; t <= 1; t += 0.1) {
        const x = -25 + t * 50 + p.sin(t * p.PI * 2 + seed * 0.01) * (10 + i * 3);
        const y = -20 + p.sin(t * p.PI + seed * 0.02 + i) * 15;
        p.vertex(x, y);
      }
      p.endShape();
    }
  }
  
  drawMixed(p, seed) {
    // Combination of shapes
    p.fill(...this.colors[0]);
    p.noStroke();
    p.circle(-15, -10, 12);
    
    p.fill(...this.colors[1]);
    p.rectMode(p.CENTER);
    p.rect(15, -10, 12, 12);
    p.rectMode(p.CORNER);
    
    p.fill(...this.colors[2]);
    p.triangle(0, 10, -10, 25, 10, 25);
    
    p.stroke(...this.colors[0]);
    p.strokeWeight(2);
    p.noFill();
    p.arc(0, 0, 40, 40, 0, p.PI);
  }
}

export class VisionCard extends Card {
  constructor(targetCard, x, y, width, height) {
    super('vision', targetCard.index, x, y, width, height);
    // Vision card shares some visual elements with target
    this.targetCard = targetCard;
    this.colors = this.createVisionColors(targetCard);
    this.shapes = targetCard.shapes;
  }
  
  createVisionColors(targetCard) {
    // Mix target colors with slight variations
    return targetCard.colors.map(color => {
      return [
        color[0] + (-10 + (this.index * 7) % 20),
        color[1] + (-10 + (this.index * 5) % 20),
        color[2] + (-10 + (this.index * 9) % 20)
      ];
    });
  }
  
  drawContent(p) {
    p.push();
    p.translate(this.width / 2, this.height / 2);
    
    // Draw abstract vision with hints
    p.fill(...this.colors[0], 150);
    p.noStroke();
    p.circle(0, 0, 50);
    
    p.fill(...this.colors[1], 120);
    p.circle(-10, 10, 35);
    
    p.fill(...this.colors[2], 140);
    p.circle(15, -5, 30);
    
    // Add shape hints from target
    const seed = this.index * 1000;
    p.push();
    p.scale(0.6);
    this.targetCard.drawContent(p);
    p.pop();
    
    p.pop();
  }
}

export function createCards(p) {
  // Create suspect cards
  gameState.suspectCards = [];
  for (let i = 0; i < 4; i++) {
    const card = new Card('suspect', i, 0, 0, 80, 100);
    gameState.suspectCards.push(card);
  }
  
  // Create location cards
  gameState.locationCards = [];
  for (let i = 0; i < 4; i++) {
    const card = new Card('location', i + 4, 0, 0, 80, 100);
    gameState.locationCards.push(card);
  }
  
  // Create weapon cards
  gameState.weaponCards = [];
  for (let i = 0; i < 4; i++) {
    const card = new Card('weapon', i + 8, 0, 0, 80, 100);
    gameState.weaponCards.push(card);
  }
  
  // Set correct answers
  gameState.correctSuspect = p.floor(p.random(4));
  gameState.correctLocation = p.floor(p.random(4));
  gameState.correctWeapon = p.floor(p.random(4));
}

export function createVisionCard(stage, p) {
  let targetCard;
  
  switch (stage) {
    case 'SUSPECT':
      targetCard = gameState.suspectCards[gameState.correctSuspect];
      break;
    case 'LOCATION':
      targetCard = gameState.locationCards[gameState.correctLocation];
      break;
    case 'WEAPON':
      targetCard = gameState.weaponCards[gameState.correctWeapon];
      break;
  }
  
  if (targetCard) {
    gameState.visionCard = new VisionCard(targetCard, 0, 0, 120, 150);
  }
}