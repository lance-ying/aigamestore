import { gameState, LEVELS } from './globals.js';

export function createScene(p, levelIndex) {
  const level = LEVELS[levelIndex];
  
  // Background generation
  const sceneBuffer = p.createGraphics(600, 400);
  
  // Draw different background for each level
  if (levelIndex === 0) {
    drawStudyBackground(sceneBuffer);
  } else if (levelIndex === 1) {
    drawConservatoryBackground(sceneBuffer);
  } else {
    drawAtticBackground(sceneBuffer);
  }
  
  return sceneBuffer;
}

function drawStudyBackground(g) {
  // Wooden floor
  g.background(139, 90, 43);
  
  // Wall
  g.fill(200, 180, 150);
  g.noStroke();
  g.rect(0, 0, 600, 300);
  
  // Bookshelf
  g.fill(101, 67, 33);
  g.rect(20, 20, 150, 280);
  
  // Books on shelf
  for (let i = 0; i < 20; i++) {
    const x = 30 + (i % 5) * 28;
    const y = 40 + Math.floor(i / 5) * 65;
    g.fill(150 + i * 5, 50 + i * 3, 50);
    g.rect(x, y, 20, 55);
  }
  
  // Desk
  g.fill(120, 80, 40);
  g.rect(200, 250, 300, 20);
  g.rect(210, 270, 20, 80);
  g.rect(470, 270, 20, 80);
  
  // Window
  g.fill(135, 206, 235);
  g.rect(400, 30, 150, 180);
  g.stroke(101, 67, 33);
  g.strokeWeight(4);
  g.line(475, 30, 475, 210);
  g.line(400, 120, 550, 120);
  g.noStroke();
  
  // Curtains
  g.fill(139, 0, 0);
  g.rect(380, 30, 25, 180);
  g.rect(545, 30, 25, 180);
  
  // Rug
  g.fill(139, 0, 0);
  g.ellipse(100, 330, 120, 80);
  
  // Papers scattered
  g.fill(255, 250, 240);
  g.rect(230, 240, 40, 30);
  g.rect(350, 235, 35, 45);
}

function drawConservatoryBackground(g) {
  // Sky background
  g.background(135, 206, 235);
  
  // Glass roof structure
  for (let i = 0; i < 600; i += 100) {
    g.stroke(100, 100, 100);
    g.strokeWeight(3);
    g.line(i, 0, i, 150);
  }
  g.noStroke();
  
  // Floor
  g.fill(101, 67, 33);
  g.rect(0, 300, 600, 100);
  
  // Garden bed
  g.fill(90, 60, 30);
  g.rect(50, 250, 500, 80);
  
  // Plants
  for (let i = 0; i < 15; i++) {
    const x = 70 + i * 35;
    const y = 270 + (i % 3) * 20;
    g.fill(34, 139, 34);
    g.ellipse(x, y, 40, 60);
    g.ellipse(x - 15, y + 10, 30, 40);
    g.ellipse(x + 15, y + 10, 30, 40);
  }
  
  // Flowers
  for (let i = 0; i < 20; i++) {
    const x = 80 + (i * 27) % 500;
    const y = 260 + (i % 4) * 15;
    g.fill(255, 100 + i * 8, 150);
    g.ellipse(x, y, 12, 12);
  }
  
  // Pots
  g.fill(184, 115, 51);
  g.rect(480, 220, 60, 40);
  g.rect(100, 140, 50, 35);
  
  // Table
  g.fill(139, 90, 43);
  g.rect(250, 200, 120, 15);
  g.rect(260, 215, 10, 85);
  g.rect(350, 215, 10, 85);
}

function drawAtticBackground(g) {
  // Dark wooden walls
  g.background(70, 50, 30);
  
  // Slanted roof
  g.fill(60, 40, 25);
  g.triangle(0, 0, 300, 50, 0, 150);
  g.triangle(600, 0, 300, 50, 600, 150);
  
  // Floor boards
  g.fill(90, 60, 35);
  for (let i = 0; i < 10; i++) {
    g.rect(0, i * 40, 600, 35);
  }
  
  // Boxes stacked
  g.fill(139, 90, 43);
  g.rect(50, 200, 80, 80);
  g.rect(60, 160, 70, 40);
  
  g.fill(120, 80, 40);
  g.rect(400, 220, 90, 90);
  g.rect(410, 180, 70, 40);
  
  // Old trunk
  g.fill(101, 67, 33);
  g.rect(450, 180, 100, 60);
  g.stroke(200, 180, 100);
  g.strokeWeight(2);
  g.line(500, 180, 500, 240);
  g.noStroke();
  
  // Window
  g.fill(40, 40, 60);
  g.rect(500, 90, 70, 90);
  g.stroke(80, 70, 50);
  g.strokeWeight(3);
  g.line(535, 90, 535, 180);
  g.line(500, 135, 570, 135);
  g.noStroke();
  
  // Cobwebs
  g.stroke(200, 200, 200, 100);
  g.strokeWeight(1);
  for (let i = 0; i < 5; i++) {
    const x = 100 + i * 100;
    g.line(x, 0, x + 30, 40);
    g.line(x, 0, x - 20, 35);
  }
  g.noStroke();
  
  // Dusty items scattered
  g.fill(150, 120, 90);
  g.rect(200, 300, 50, 30);
  g.ellipse(350, 315, 60, 40);
}