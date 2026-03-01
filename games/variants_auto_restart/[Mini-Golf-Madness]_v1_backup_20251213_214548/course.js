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
  // Hole 1: Simple vertical shot
  const hole = new Hole(160, 500, 160, 100, 2);
  
  // Simple vertical corridor
  new Wall(100, 80, 15, 450, hole);
  new Wall(205, 80, 15, 450, hole);
  new Wall(100, 80, 105, 15, hole);
  new Wall(100, 515, 105, 15, hole);
}

function createHole2() {
  // Hole 2: Gentle vertical curve
  const hole = new Hole(160, 520, 160, 80, 3);
  
  // Outer boundary
  new Wall(85, 60, 15, 480, hole);
  new Wall(220, 60, 15, 480, hole);
  new Wall(85, 60, 135, 15, hole);
  new Wall(85, 525, 135, 15, hole);
  
  // Curve obstacles
  new Wall(120, 200, 40, 15, hole);
  new Wall(160, 350, 40, 15, hole);
}

function createHole3() {
  // Hole 3: Vertical path with strategic walls
  const hole = new Hole(160, 520, 160, 80, 3);
  
  // Boundary
  new Wall(75, 60, 15, 490, hole);
  new Wall(230, 60, 15, 490, hole);
  new Wall(75, 60, 155, 15, hole);
  new Wall(75, 535, 155, 15, hole);
  
  // Strategic obstacles
  new Wall(90, 180, 50, 15, hole);
  new Wall(180, 320, 50, 15, hole);
  new Wall(110, 440, 50, 15, hole);
}

// MEDIUM HOLES (4-6)

function createHole4() {
  // Hole 4: Zigzag vertical path
  const hole = new Hole(160, 530, 160, 70, 4);
  
  // Outer boundary
  new Wall(70, 50, 15, 510, hole);
  new Wall(235, 50, 15, 510, hole);
  new Wall(70, 50, 165, 15, hole);
  new Wall(70, 545, 165, 15, hole);
  
  // Zigzag obstacles
  new Wall(85, 150, 80, 15, hole);
  new Wall(155, 280, 80, 15, hole);
  new Wall(85, 410, 80, 15, hole);
}

function createHole5() {
  // Hole 5: Vertical with water hazards
  const hole = new Hole(160, 530, 160, 70, 4);
  
  // Boundary
  new Wall(75, 50, 15, 510, hole);
  new Wall(230, 50, 15, 510, hole);
  new Wall(75, 50, 155, 15, hole);
  new Wall(75, 545, 155, 15, hole);
  
  // Water hazards
  new WaterHazard(100, 150, 120, 70, hole);
  new WaterHazard(100, 340, 120, 70, hole);
  
  // Safe bridges
  new Wall(140, 210, 40, 15, hole);
  new Wall(140, 420, 40, 15, hole);
}

function createHole6() {
  // Hole 6: S-curve vertical path
  const hole = new Hole(160, 530, 160, 70, 4);
  
  // Boundary
  new Wall(70, 50, 15, 510, hole);
  new Wall(235, 50, 15, 510, hole);
  new Wall(70, 50, 165, 15, hole);
  new Wall(70, 545, 165, 15, hole);
  
  // S-curve walls
  new Wall(85, 50, 80, 15, hole);
  new Wall(150, 65, 15, 120, hole);
  new Wall(85, 185, 80, 15, hole);
  new Wall(85, 200, 15, 120, hole);
  new Wall(85, 320, 80, 15, hole);
  new Wall(150, 335, 15, 120, hole);
  new Wall(85, 455, 80, 15, hole);
}

// HARD HOLES (7-9)

function createHole7() {
  // Hole 7: Complex vertical maze
  const hole = new Hole(160, 540, 160, 60, 5);
  
  // Boundary
  new Wall(60, 40, 15, 520, hole);
  new Wall(245, 40, 15, 520, hole);
  new Wall(60, 40, 185, 15, hole);
  new Wall(60, 545, 185, 15, hole);
  
  // Maze walls
  new Wall(95, 40, 15, 100, hole);
  new Wall(95, 180, 15, 100, hole);
  new Wall(95, 320, 15, 100, hole);
  new Wall(95, 460, 15, 100, hole);
  
  new Wall(160, 100, 15, 100, hole);
  new Wall(160, 240, 15, 100, hole);
  new Wall(160, 380, 15, 100, hole);
  
  new Wall(210, 40, 15, 100, hole);
  new Wall(210, 180, 15, 100, hole);
  new Wall(210, 320, 15, 100, hole);
  new Wall(210, 460, 15, 100, hole);
}

function createHole8() {
  // Hole 8: Vertical water gauntlet
  const hole = new Hole(160, 540, 160, 60, 5);
  
  // Boundary
  new Wall(70, 40, 15, 520, hole);
  new Wall(235, 40, 15, 520, hole);
  new Wall(70, 40, 165, 15, hole);
  new Wall(70, 545, 165, 15, hole);
  
  // Water hazards
  new WaterHazard(95, 120, 60, 80, hole);
  new WaterHazard(165, 250, 60, 80, hole);
  new WaterHazard(95, 380, 60, 80, hole);
  
  // Narrow safe paths
  new Wall(110, 200, 50, 15, hole);
  new Wall(150, 330, 50, 15, hole);
  new Wall(110, 460, 50, 15, hole);
}

function createHole9() {
  // Hole 9: Final vertical challenge
  const hole = new Hole(160, 550, 160, 50, 6);
  
  // Boundary
  new Wall(50, 30, 15, 540, hole);
  new Wall(255, 30, 15, 540, hole);
  new Wall(50, 30, 205, 15, hole);
  new Wall(50, 555, 205, 15, hole);
  
  // Complex vertical obstacles
  new Wall(85, 30, 15, 120, hole);
  new Wall(160, 100, 15, 120, hole);
  new Wall(220, 30, 15, 150, hole);
  
  new Wall(100, 220, 60, 15, hole);
  new Wall(160, 320, 60, 15, hole);
  new Wall(100, 420, 60, 15, hole);
  
  // Water hazard
  new WaterHazard(120, 260, 80, 50, hole);
  
  // Final narrow passage
  new Wall(65, 480, 80, 15, hole);
  new Wall(175, 480, 80, 15, hole);
}

export function renderCourse(p) {
  // Render course background
  renderBackground(p);
  
  // Get current hole
  const currentHole = gameState.holes[gameState.currentHole];
  if (!currentHole) return;
  
  // Render ONLY current hole's obstacles
  currentHole.waterHazards.forEach(water => water.render(p));
  currentHole.ramps.forEach(ramp => ramp.render(p));
  currentHole.walls.forEach(wall => wall.render(p));
  
  // Render current hole
  currentHole.render(p);
  
  // Render start position indicator
  const startPos = currentHole.startPos;
  p.noFill();
  p.stroke(255, 255, 255, 100);
  p.strokeWeight(2);
  p.circle(startPos.x, startPos.y, 20);
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