// course.js - Course generation and management

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Ball, Hole, Wall, WaterHazard, Ramp } from './entities.js';

export function initializeCourse(p) {
  // Clear existing course elements
  gameState.holes = [];
  gameState.walls = [];
  gameState.waterHazards = [];
  gameState.ramps = [];
  gameState.entities = [];
  
  // Create 9 holes: 3 easy, 3 medium, 3 hard
  // Easy holes (1-3)
  createHole1();
  createHole2();
  createHole3();
  
  // Medium holes (4-6)
  createHole4();
  createHole5();
  createHole6();
  
  // Hard holes (7-9)
  createHole7();
  createHole8();
  createHole9();
  
  // Create ball at first hole's start position
  const firstHole = gameState.holes[0];
  gameState.ball = new Ball(firstHole.startPos.x, firstHole.startPos.y);
  gameState.player = gameState.ball;
}

// EASY HOLES (1-3)

function createHole1() {
  // Hole 1: Simple straight shot with side obstacles
  const hole = new Hole(500, 200, 100, 200, 2);
  
  // Side walls
  new Wall(50, 100, 15, 200);
  new Wall(535, 100, 15, 200);
  
  // Top and bottom walls
  new Wall(50, 100, 500, 15);
  new Wall(50, 285, 500, 15);
  
  // Small obstacles
  new Wall(250, 150, 20, 100);
  new Wall(350, 150, 20, 100);
}

function createHole2() {
  // Hole 2: Simple curved path around water (FIXED - now playable!)
  const hole = new Hole(500, 200, 100, 200, 3);
  
  // Outer walls
  new Wall(50, 80, 15, 240);
  new Wall(535, 80, 15, 240);
  new Wall(50, 80, 500, 15);
  new Wall(50, 305, 500, 15);
  
  // Water hazard in center - leaves clear paths above and below
  new WaterHazard(220, 150, 160, 100);
  
  // Guiding walls to create curved path
  new Wall(180, 120, 80, 15);  // Top guide
  new Wall(180, 265, 80, 15);  // Bottom guide
  new Wall(340, 120, 80, 15);  // Top guide
  new Wall(340, 265, 80, 15);  // Bottom guide
}

function createHole3() {
  // Hole 3: Gentle S-curve
  const hole = new Hole(500, 100, 100, 300, 3);
  
  // Outer walls
  new Wall(50, 60, 15, 280);
  new Wall(535, 60, 15, 280);
  new Wall(50, 60, 500, 15);
  new Wall(50, 325, 500, 15);
  
  // S-curve walls
  new Wall(200, 60, 15, 120);   // Left upper vertical
  new Wall(200, 180, 120, 15);  // Middle horizontal
  new Wall(320, 195, 15, 130);  // Right lower vertical
}

// MEDIUM HOLES (4-6)

function createHole4() {
  // Hole 4: Multiple narrow passages
  const hole = new Hole(500, 200, 100, 200, 4);
  
  // Outer walls
  new Wall(50, 80, 15, 240);
  new Wall(535, 80, 15, 240);
  new Wall(50, 80, 500, 15);
  new Wall(50, 305, 500, 15);
  
  // Narrow passage obstacles
  new Wall(180, 80, 20, 100);
  new Wall(180, 220, 20, 100);
  new Wall(280, 120, 20, 80);
  new Wall(280, 240, 20, 80);
  new Wall(380, 80, 20, 110);
  new Wall(380, 230, 20, 90);
}

function createHole5() {
  // Hole 5: Island in water
  const hole = new Hole(500, 200, 100, 200, 4);
  
  // Outer walls
  new Wall(50, 80, 15, 240);
  new Wall(535, 80, 15, 240);
  new Wall(50, 80, 500, 15);
  new Wall(50, 305, 500, 15);
  
  // Large water hazard
  new WaterHazard(150, 120, 350, 160);
  
  // Island in middle with safe paths
  new Wall(270, 180, 60, 40);  // Island platform
  
  // Bridge walls (narrow safe paths through water)
  new Wall(150, 190, 120, 20);  // Left bridge
  new Wall(330, 190, 170, 20);  // Right bridge
}

function createHole6() {
  // Hole 6: L-shaped path
  const hole = new Hole(500, 100, 100, 300, 4);
  
  // Outer walls
  new Wall(50, 60, 15, 280);
  new Wall(535, 60, 15, 280);
  new Wall(50, 60, 500, 15);
  new Wall(50, 325, 500, 15);
  
  // L-shape corridor walls
  new Wall(150, 60, 15, 180);   // Left vertical
  new Wall(165, 225, 200, 15);  // Horizontal connector
  new Wall(350, 75, 15, 165);   // Right vertical
  
  // Small obstacles in path
  new Wall(200, 270, 30, 15);
  new Wall(420, 130, 30, 15);
}

// HARD HOLES (7-9)

function createHole7() {
  // Hole 7: Complex maze
  const hole = new Hole(500, 300, 100, 100, 5);
  
  // Outer walls
  new Wall(50, 60, 15, 280);
  new Wall(535, 60, 15, 280);
  new Wall(50, 60, 500, 15);
  new Wall(50, 325, 500, 15);
  
  // Maze walls
  new Wall(150, 60, 15, 100);
  new Wall(150, 200, 15, 140);
  new Wall(250, 120, 15, 110);
  new Wall(250, 270, 15, 70);
  new Wall(350, 60, 15, 150);
  new Wall(350, 250, 15, 90);
  new Wall(450, 100, 15, 120);
  new Wall(450, 260, 15, 80);
  
  // Horizontal maze segments
  new Wall(165, 140, 85, 15);
  new Wall(265, 200, 85, 15);
  new Wall(165, 260, 85, 15);
}

function createHole8() {
  // Hole 8: Large water with narrow bridges
  const hole = new Hole(500, 200, 100, 200, 5);
  
  // Outer walls
  new Wall(50, 70, 15, 260);
  new Wall(535, 70, 15, 260);
  new Wall(50, 70, 500, 15);
  new Wall(50, 315, 500, 15);
  
  // Large water hazards
  new WaterHazard(120, 110, 180, 90);   // Left water
  new WaterHazard(320, 200, 180, 90);   // Right water
  
  // Narrow bridge paths
  new Wall(180, 180, 100, 18);  // Bridge 1
  new Wall(330, 120, 100, 18);  // Bridge 2
  
  // Small obstacles on bridges
  new Wall(220, 180, 15, 18);
  new Wall(370, 120, 15, 18);
}

function createHole9() {
  // Hole 9: Final challenge with everything
  const hole = new Hole(500, 350, 100, 50, 6);
  
  // Outer walls
  new Wall(50, 30, 15, 340);
  new Wall(535, 30, 15, 340);
  new Wall(50, 30, 500, 15);
  new Wall(50, 355, 500, 15);
  
  // Complex obstacle course
  new Wall(180, 30, 15, 140);
  new Wall(320, 120, 15, 150);
  new Wall(180, 230, 140, 15);
  new Wall(350, 285, 150, 15);
  
  // Water hazards
  new WaterHazard(220, 100, 80, 100);
  new WaterHazard(380, 180, 100, 80);
  
  // Ramps for challenge
  new Ramp(150, 280, 50, 30, 1);
  new Ramp(420, 100, 50, 30, -1);
  
  // Final narrow passage
  new Wall(460, 300, 15, 55);
}

export function renderCourse(p) {
  // Render course background
  renderBackground(p);
  
  // Render course elements in order
  gameState.waterHazards.forEach(water => water.render(p));
  gameState.ramps.forEach(ramp => ramp.render(p));
  gameState.walls.forEach(wall => wall.render(p));
  
  // Render current hole
  if (gameState.holes[gameState.currentHole]) {
    gameState.holes[gameState.currentHole].render(p);
    
    // Render start position indicator
    const startPos = gameState.holes[gameState.currentHole].startPos;
    p.noFill();
    p.stroke(255, 255, 255, 100);
    p.strokeWeight(2);
    p.circle(startPos.x, startPos.y, 20);
  }
}

function renderBackground(p) {
  // Grass background with gradient
  for (let y = 0; y < CANVAS_HEIGHT; y += 2) {
    const greenValue = p.map(y, 0, CANVAS_HEIGHT, 100, 70);
    p.stroke(50, greenValue, 40);
    p.strokeWeight(2);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Add grass texture
  p.stroke(60, 110, 50, 50);
  p.strokeWeight(1);
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * CANVAS_WIDTH;
    const y = Math.random() * CANVAS_HEIGHT;
    p.line(x, y, x, y + 3);
  }
}