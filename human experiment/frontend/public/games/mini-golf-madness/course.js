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
  // Hole 1: Simple straight shot
  const hole = new Hole(500, 200, 100, 200, 2);
  
  // Simple corridor
  new Wall(50, 150, 15, 100, hole);
  new Wall(535, 150, 15, 100, hole);
  new Wall(50, 150, 200, 15, hole);
  new Wall(50, 235, 200, 15, hole);
  new Wall(400, 150, 150, 15, hole);
  new Wall(400, 235, 150, 15, hole);
}

function createHole2() {
  // Hole 2: Gentle curve
  const hole = new Hole(500, 200, 100, 200, 3);
  
  // Outer boundary
  new Wall(50, 130, 15, 140, hole);
  new Wall(535, 130, 15, 140, hole);
  new Wall(50, 130, 200, 15, hole);
  new Wall(50, 255, 200, 15, hole);
  new Wall(350, 130, 200, 15, hole);
  new Wall(350, 255, 200, 15, hole);
  
  // Gentle curve obstacles
  new Wall(250, 160, 20, 50, hole);
  new Wall(350, 220, 20, 50, hole);
}

function createHole3() {
  // Hole 3: Wide open with strategic walls
  const hole = new Hole(500, 100, 100, 300, 3);
  
  // Boundary
  new Wall(50, 60, 15, 280, hole);
  new Wall(535, 60, 15, 280, hole);
  new Wall(50, 60, 500, 15, hole);
  new Wall(50, 325, 500, 15, hole);
  
  // Strategic obstacles
  new Wall(200, 150, 60, 15, hole);
  new Wall(340, 225, 60, 15, hole);
}

// MEDIUM HOLES (4-6)

function createHole4() {
  // Hole 4: Zigzag path
  const hole = new Hole(500, 200, 100, 200, 4);
  
  // Outer boundary
  new Wall(50, 110, 15, 180, hole);
  new Wall(535, 110, 15, 180, hole);
  new Wall(50, 110, 500, 15, hole);
  new Wall(50, 275, 500, 15, hole);
  
  // Zigzag obstacles
  new Wall(180, 110, 20, 80, hole);
  new Wall(280, 185, 20, 90, hole);
  new Wall(380, 110, 20, 85, hole);
}

function createHole5() {
  // Hole 5: Water with bridge
  const hole = new Hole(500, 200, 100, 200, 4);
  
  // Boundary
  new Wall(50, 120, 15, 160, hole);
  new Wall(535, 120, 15, 160, hole);
  new Wall(50, 120, 500, 15, hole);
  new Wall(50, 265, 500, 15, hole);
  
  // Water hazards
  new WaterHazard(150, 140, 150, 60, hole);
  new WaterHazard(330, 200, 150, 60, hole);
  
  // Safe paths
  new Wall(180, 185, 100, 20, hole);
}

function createHole6() {
  // Hole 6: L-shaped path
  const hole = new Hole(500, 100, 100, 300, 4);
  
  // Boundary
  new Wall(50, 60, 15, 280, hole);
  new Wall(535, 60, 15, 280, hole);
  new Wall(50, 60, 500, 15, hole);
  new Wall(50, 325, 500, 15, hole);
  
  // L-shape corridor
  new Wall(150, 60, 15, 150, hole);
  new Wall(165, 195, 170, 15, hole);
  new Wall(320, 75, 15, 135, hole);
}

// HARD HOLES (7-9)

function createHole7() {
  // Hole 7: Complex maze
  const hole = new Hole(500, 300, 100, 100, 5);
  
  // Boundary
  new Wall(50, 60, 15, 280, hole);
  new Wall(535, 60, 15, 280, hole);
  new Wall(50, 60, 500, 15, hole);
  new Wall(50, 325, 500, 15, hole);
  
  // Maze walls
  new Wall(150, 60, 15, 100, hole);
  new Wall(150, 200, 15, 140, hole);
  new Wall(250, 120, 15, 90, hole);
  new Wall(250, 250, 15, 90, hole);
  new Wall(350, 60, 15, 130, hole);
  new Wall(350, 230, 15, 110, hole);
  new Wall(450, 100, 15, 100, hole);
  new Wall(450, 240, 15, 100, hole);
}

function createHole8() {
  // Hole 8: Water challenges
  const hole = new Hole(500, 200, 100, 200, 5);
  
  // Boundary
  new Wall(50, 100, 15, 200, hole);
  new Wall(535, 100, 15, 200, hole);
  new Wall(50, 100, 500, 15, hole);
  new Wall(50, 285, 500, 15, hole);
  
  // Water hazards
  new WaterHazard(150, 130, 120, 70, hole);
  new WaterHazard(330, 200, 120, 70, hole);
  
  // Narrow passages
  new Wall(220, 180, 80, 15, hole);
  new Wall(350, 140, 80, 15, hole);
}

function createHole9() {
  // Hole 9: Final challenge
  const hole = new Hole(500, 350, 100, 50, 6);
  
  // Boundary
  new Wall(50, 30, 15, 340, hole);
  new Wall(535, 30, 15, 340, hole);
  new Wall(50, 30, 500, 15, hole);
  new Wall(50, 355, 500, 15, hole);
  
  // Complex obstacles
  new Wall(180, 30, 15, 120, hole);
  new Wall(280, 120, 15, 100, hole);
  new Wall(380, 30, 15, 140, hole);
  new Wall(180, 200, 120, 15, hole);
  new Wall(320, 270, 150, 15, hole);
  
  // Water hazard
  new WaterHazard(220, 240, 80, 80, hole);
  
  // Narrow final passage
  new Wall(460, 310, 15, 45, hole);
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