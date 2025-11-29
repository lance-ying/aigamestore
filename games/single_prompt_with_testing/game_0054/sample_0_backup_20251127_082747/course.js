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
  
  // Create 3 holes with increasing difficulty
  createHole1();
  createHole2();
  createHole3();
  
  // Create ball at first hole's start position
  const firstHole = gameState.holes[0];
  gameState.ball = new Ball(firstHole.startPos.x, firstHole.startPos.y);
  gameState.player = gameState.ball;
}

function createHole1() {
  // Hole 1: Simple straight shot with side walls
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
  // Hole 2: Water hazard and curved path
  const hole = new Hole(500, 100, 100, 300, 3);
  
  // Outer walls
  new Wall(50, 50, 15, 300);
  new Wall(535, 50, 15, 300);
  new Wall(50, 50, 500, 15);
  new Wall(50, 335, 500, 15);
  
  // Water hazard in the middle
  new WaterHazard(200, 150, 200, 150);
  
  // Safe path walls
  new Wall(150, 200, 50, 15);
  new Wall(400, 200, 50, 15);
}

function createHole3() {
  // Hole 3: Ramps and multiple obstacles
  const hole = new Hole(500, 350, 100, 50, 4);
  
  // Course walls
  new Wall(50, 30, 15, 340);
  new Wall(535, 30, 15, 340);
  new Wall(50, 30, 500, 15);
  new Wall(50, 355, 500, 15);
  
  // Central wall maze
  new Wall(200, 100, 15, 150);
  new Wall(350, 150, 15, 150);
  new Wall(200, 100, 150, 15);
  new Wall(350, 285, 150, 15);
  
  // Ramps for style
  new Ramp(150, 250, 50, 30, 1);
  new Ramp(400, 100, 50, 30, -1);
  
  // Small water hazard
  new WaterHazard(250, 200, 80, 60);
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