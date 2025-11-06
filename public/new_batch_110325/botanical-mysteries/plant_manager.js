// plant_manager.js - Manages plant unlocking and encyclopedia
import { gameState, PLANT_DATABASE } from './globals.js';

export function initializePlants(p) {
  // Start with first 6 plants unlocked
  gameState.unlockedPlants = [1, 2, 3, 4, 5, 6];
}

export function unlockPlant(plantId) {
  if (!gameState.unlockedPlants.includes(plantId)) {
    gameState.unlockedPlants.push(plantId);
    gameState.score += 50;
  }
}

export function getPlantById(plantId) {
  return PLANT_DATABASE.find(p => p.id === plantId);
}

export function getUnlockedPlants() {
  return PLANT_DATABASE.filter(p => gameState.unlockedPlants.includes(p.id));
}

export function getTotalPages() {
  return gameState.unlockedPlants.length;
}

export function drawPlantVisual(p, plant, x, y, size) {
  p.push();
  p.translate(x, y);
  
  // Draw plant based on its properties
  const colors = getPlantColors(plant);
  
  switch(plant.name) {
    case "Moonflower":
      drawMoonflower(p, colors, size);
      break;
    case "Crimson Sage":
      drawCrimsonSage(p, colors, size);
      break;
    case "Shadow Fern":
      drawShadowFern(p, colors, size);
      break;
    case "Golden Thistle":
      drawGoldenThistle(p, colors, size);
      break;
    case "Serpent's Tongue":
      drawSerpentsTongue(p, colors, size);
      break;
    case "Frost Lily":
      drawFrostLily(p, colors, size);
      break;
    case "Ember Root":
      drawEmberRoot(p, colors, size);
      break;
    case "Witch's Breath":
      drawWitchsBreath(p, colors, size);
      break;
    case "Memory Moss":
      drawMemoryMoss(p, colors, size);
      break;
    case "Bone Flower":
      drawBoneFlower(p, colors, size);
      break;
    case "Storm Vine":
      drawStormVine(p, colors, size);
      break;
    case "Dream Petal":
      drawDreamPetal(p, colors, size);
      break;
    default:
      drawGenericPlant(p, colors, size);
  }
  
  p.pop();
}

function getPlantColors(plant) {
  const colorMap = {
    "white": [240, 240, 255],
    "red": [200, 40, 40],
    "black": [30, 30, 35],
    "gold": [255, 215, 0],
    "green": [60, 180, 75],
    "blue": [100, 180, 255],
    "orange": [255, 140, 40],
    "purple": [160, 80, 200],
    "pink": [255, 150, 200]
  };
  
  for (let prop of plant.properties) {
    if (colorMap[prop]) {
      return colorMap[prop];
    }
  }
  return [100, 150, 100];
}

function drawMoonflower(p, colors, size) {
  // White glowing flower
  p.fill(colors[0], colors[1], colors[2]);
  for (let i = 0; i < 6; i++) {
    p.push();
    p.rotate(p.TWO_PI * i / 6);
    p.ellipse(0, size * 0.3, size * 0.3, size * 0.5);
    p.pop();
  }
  p.fill(255, 255, 200);
  p.circle(0, 0, size * 0.3);
  // Stem
  p.stroke(60, 120, 60);
  p.strokeWeight(3);
  p.line(0, 0, 0, size * 0.7);
  p.noStroke();
}

function drawCrimsonSage(p, colors, size) {
  // Red leaves with silver veins
  p.fill(colors[0], colors[1], colors[2]);
  for (let i = 0; i < 5; i++) {
    p.push();
    p.rotate(p.TWO_PI * i / 5);
    p.ellipse(0, size * 0.4, size * 0.25, size * 0.6);
    p.pop();
  }
  // Silver veins
  p.stroke(200, 200, 220);
  p.strokeWeight(1);
  for (let i = 0; i < 5; i++) {
    p.push();
    p.rotate(p.TWO_PI * i / 5);
    p.line(0, 0, 0, size * 0.6);
    p.pop();
  }
  p.noStroke();
}

function drawShadowFern(p, colors, size) {
  // Black fronds
  p.fill(colors[0], colors[1], colors[2]);
  for (let i = -2; i <= 2; i++) {
    p.push();
    p.translate(i * size * 0.15, i * size * 0.1);
    p.ellipse(0, 0, size * 0.2, size * 0.8);
    p.pop();
  }
  // Dark stem
  p.fill(20, 20, 25);
  p.rect(-size * 0.05, 0, size * 0.1, size * 0.7);
}

function drawGoldenThistle(p, colors, size) {
  // Gold spiky flower
  p.fill(colors[0], colors[1], colors[2]);
  for (let i = 0; i < 12; i++) {
    p.push();
    p.rotate(p.TWO_PI * i / 12);
    p.triangle(0, 0, -size * 0.1, size * 0.5, size * 0.1, size * 0.5);
    p.pop();
  }
  p.fill(255, 200, 0);
  p.circle(0, 0, size * 0.3);
}

function drawSerpentsTongue(p, colors, size) {
  // Forked leaves
  p.fill(colors[0], colors[1], colors[2]);
  p.push();
  p.rotate(-0.2);
  p.ellipse(-size * 0.15, -size * 0.2, size * 0.2, size * 0.7);
  p.pop();
  p.push();
  p.rotate(0.2);
  p.ellipse(size * 0.15, -size * 0.2, size * 0.2, size * 0.7);
  p.pop();
  // Stem
  p.fill(80, 140, 80);
  p.rect(-size * 0.05, 0, size * 0.1, size * 0.5);
}

function drawFrostLily(p, colors, size) {
  // Ice blue lily
  p.fill(colors[0], colors[1], colors[2]);
  for (let i = 0; i < 6; i++) {
    p.push();
    p.rotate(p.TWO_PI * i / 6);
    p.ellipse(0, size * 0.35, size * 0.25, size * 0.5);
    p.pop();
  }
  p.fill(200, 230, 255);
  p.circle(0, 0, size * 0.25);
  p.stroke(180, 220, 255);
  p.strokeWeight(2);
  p.noFill();
  p.circle(0, 0, size * 0.4);
  p.noStroke();
}

function drawEmberRoot(p, colors, size) {
  // Orange glowing root
  p.fill(colors[0], colors[1], colors[2]);
  p.ellipse(0, size * 0.3, size * 0.5, size * 0.7);
  // Glow effect
  p.fill(255, 200, 100, 100);
  p.circle(0, size * 0.3, size * 0.6);
  // Root tendrils
  p.stroke(200, 100, 40);
  p.strokeWeight(2);
  p.noFill();
  p.bezier(0, size * 0.6, -size * 0.2, size * 0.7, -size * 0.1, size * 0.9, -size * 0.3, size);
  p.bezier(0, size * 0.6, size * 0.2, size * 0.7, size * 0.1, size * 0.9, size * 0.3, size);
  p.noStroke();
}

function drawWitchsBreath(p, colors, size) {
  // Purple flower with smoke
  p.fill(colors[0], colors[1], colors[2]);
  for (let i = 0; i < 5; i++) {
    p.push();
    p.rotate(p.TWO_PI * i / 5);
    p.ellipse(0, size * 0.3, size * 0.3, size * 0.4);
    p.pop();
  }
  // Smoke effect
  p.fill(180, 140, 200, 80);
  p.circle(-size * 0.2, -size * 0.3, size * 0.25);
  p.circle(size * 0.1, -size * 0.4, size * 0.2);
  p.circle(0, -size * 0.5, size * 0.15);
}

function drawMemoryMoss(p, colors, size) {
  // Green glowing moss
  p.fill(colors[0], colors[1], colors[2]);
  for (let i = 0; i < 8; i++) {
    let angle = p.TWO_PI * i / 8;
    let r = size * 0.4;
    p.circle(p.cos(angle) * r * 0.5, p.sin(angle) * r * 0.5, size * 0.3);
  }
  // Glow
  p.fill(120, 255, 120, 60);
  p.circle(0, 0, size * 0.8);
}

function drawBoneFlower(p, colors, size) {
  // Skeletal white flower
  p.fill(colors[0], colors[1], colors[2]);
  for (let i = 0; i < 5; i++) {
    p.push();
    p.rotate(p.TWO_PI * i / 5);
    // Finger-like petals
    p.rect(-size * 0.08, 0, size * 0.16, size * 0.5);
    p.circle(0, size * 0.5, size * 0.16);
    p.pop();
  }
  p.fill(230, 230, 235);
  p.circle(0, 0, size * 0.25);
}

function drawStormVine(p, colors, size) {
  // Crackling vine
  p.stroke(100, 150, 200);
  p.strokeWeight(4);
  p.noFill();
  p.bezier(-size * 0.3, -size * 0.5, -size * 0.2, 0, size * 0.2, 0, size * 0.3, size * 0.5);
  // Lightning
  p.stroke(255, 255, 150);
  p.strokeWeight(2);
  p.line(-size * 0.1, -size * 0.2, 0, 0);
  p.line(0, 0, size * 0.15, size * 0.2);
  p.line(size * 0.15, size * 0.2, size * 0.1, size * 0.4);
  p.noStroke();
  // Leaves
  p.fill(120, 180, 150);
  p.ellipse(-size * 0.2, -size * 0.2, size * 0.2, size * 0.3);
  p.ellipse(size * 0.2, size * 0.3, size * 0.2, size * 0.3);
}

function drawDreamPetal(p, colors, size) {
  // Iridescent shifting petals
  for (let i = 0; i < 6; i++) {
    p.push();
    p.rotate(p.TWO_PI * i / 6);
    let hue = (i * 40 + p.frameCount * 0.5) % 360;
    p.colorMode(p.HSB);
    p.fill(hue, 70, 100);
    p.ellipse(0, size * 0.3, size * 0.3, size * 0.5);
    p.colorMode(p.RGB);
    p.pop();
  }
  p.fill(255, 200, 255);
  p.circle(0, 0, size * 0.3);
}

function drawGenericPlant(p, colors, size) {
  p.fill(colors[0], colors[1], colors[2]);
  p.circle(0, 0, size * 0.6);
  p.fill(80, 140, 80);
  p.rect(-size * 0.05, 0, size * 0.1, size * 0.5);
}