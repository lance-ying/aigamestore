import { gameState } from './globals.js';
import { Checkpoint, Wall } from './entities.js';

export function createTrack(p) {
  // Clear existing track elements
  gameState.checkpoints = [];
  gameState.walls = [];
  
  // Define track path as series of points
  const trackPoints = [
    { x: 300, y: 200 }, // Start/Finish
    { x: 450, y: 150 },
    { x: 550, y: 200 },
    { x: 550, y: 350 },
    { x: 450, y: 450 },
    { x: 300, y: 500 },
    { x: 150, y: 450 },
    { x: 50, y: 350 },
    { x: 50, y: 200 },
    { x: 150, y: 150 }
  ];
  
  gameState.trackPath = trackPoints;
  
  // Create checkpoints
  for (let i = 0; i < trackPoints.length; i++) {
    const point = trackPoints[i];
    const checkpoint = new Checkpoint(p, point.x, point.y, 60, 60, i);
    gameState.checkpoints.push(checkpoint);
    gameState.entities.push(checkpoint);
  }
  
  // Create outer walls
  createWallsAroundTrack(p, trackPoints, 120, true);
  
  // Create inner walls
  createWallsAroundTrack(p, trackPoints, 40, false);
}

function createWallsAroundTrack(p, points, offset, outer) {
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    
    // Calculate perpendicular offset
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const nx = -dy / length;
    const ny = dx / length;
    
    const offsetMult = outer ? 1 : -1;
    const x1 = p1.x + nx * offset * offsetMult;
    const y1 = p1.y + ny * offset * offsetMult;
    const x2 = p2.x + nx * offset * offsetMult;
    const y2 = p2.y + ny * offset * offsetMult;
    
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;
    const wallLength = length;
    const angle = Math.atan2(dy, dx);
    
    const wall = new Wall(p, centerX, centerY, wallLength, 20, angle);
    gameState.walls.push(wall);
    gameState.entities.push(wall);
  }
}

export function renderTrack(p, offsetX, offsetY) {
  // Draw track surface
  p.fill(120, 100, 70);
  p.noStroke();
  
  p.beginShape();
  for (let point of gameState.trackPath) {
    p.vertex(point.x - offsetX, point.y - offsetY);
  }
  p.endShape(p.CLOSE);
  
  // Draw mud texture
  p.fill(100, 80, 50, 50);
  for (let i = 0; i < 100; i++) {
    const point = gameState.trackPath[Math.floor(p.random(gameState.trackPath.length))];
    const rx = point.x + p.random(-80, 80) - offsetX;
    const ry = point.y + p.random(-80, 80) - offsetY;
    p.ellipse(rx, ry, 5, 5);
  }
}