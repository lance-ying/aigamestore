// pathGenerator.js - Generate enemy paths

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function generatePath(level) {
  const paths = [];
  
  // Different path patterns based on level
  if (level === 1) {
    // Simple straight path from left to right
    paths.push([
      { x: 0, y: 200 },
      { x: 150, y: 200 },
      { x: 300, y: 200 },
      { x: 450, y: 200 },
      { x: CANVAS_WIDTH, y: 200 }
    ]);
  } else if (level === 2) {
    // Curved path
    paths.push([
      { x: 0, y: 100 },
      { x: 150, y: 100 },
      { x: 300, y: 250 },
      { x: 450, y: 250 },
      { x: CANVAS_WIDTH, y: 250 }
    ]);
  } else {
    // S-curve path
    paths.push([
      { x: 0, y: 150 },
      { x: 150, y: 100 },
      { x: 300, y: 250 },
      { x: 450, y: 150 },
      { x: CANVAS_WIDTH, y: 200 }
    ]);
  }
  
  return paths[0];
}

export function renderPath(p, pathPoints) {
  p.push();
  p.stroke(100, 80, 60);
  p.strokeWeight(40);
  p.noFill();
  
  p.beginShape();
  for (const point of pathPoints) {
    p.vertex(point.x, point.y);
  }
  p.endShape();
  
  // Draw path markers
  p.fill(80, 60, 40);
  p.noStroke();
  for (const point of pathPoints) {
    p.circle(point.x, point.y, 8);
  }
  
  p.pop();
}