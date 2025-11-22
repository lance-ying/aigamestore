// background.js - Background rendering
import { CANVAS_WIDTH, CANVAS_HEIGHT, LANE_POSITIONS } from './globals.js';

export function renderBackground(p, distanceRun) {
  p.background(30, 40, 60);
  
  // Sky gradient
  for (let i = 0; i < CANVAS_HEIGHT * 0.5; i++) {
    const inter = i / (CANVAS_HEIGHT * 0.5);
    const c = p.lerpColor(p.color(50, 60, 100), p.color(30, 40, 60), inter);
    p.stroke(c);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Distant buildings (parallax)
  p.noStroke();
  const buildingOffset = (distanceRun * 0.1) % 200;
  
  for (let i = -1; i < 5; i++) {
    const x = i * 150 - buildingOffset;
    const height = 80 + (i % 3) * 30;
    p.fill(60, 70, 90);
    p.rect(x, CANVAS_HEIGHT * 0.4 - height, 100, height);
    
    // Windows
    p.fill(100, 120, 150);
    for (let row = 0; row < height / 20; row++) {
      for (let col = 0; col < 4; col++) {
        p.rect(x + 10 + col * 20, CANVAS_HEIGHT * 0.4 - height + 10 + row * 20, 10, 10);
      }
    }
  }
  
  // Ground plane
  p.fill(40, 50, 70);
  p.noStroke();
  p.rect(0, CANVAS_HEIGHT * 0.7, CANVAS_WIDTH, CANVAS_HEIGHT * 0.3);
  
  // Track lines with perspective
  p.stroke(80, 90, 110);
  p.strokeWeight(3);
  
  const horizonY = CANVAS_HEIGHT * 0.4;
  const groundY = CANVAS_HEIGHT * 0.7;
  
  for (let i = 0; i < 3; i++) {
    const laneX = LANE_POSITIONS[i];
    const topX = CANVAS_WIDTH / 2 + (laneX - CANVAS_WIDTH / 2) * 0.3;
    p.line(topX, horizonY, laneX, groundY);
  }
  
  // Track ties
  p.strokeWeight(2);
  for (let i = 0; i < 10; i++) {
    const depth = i / 10;
    const y = p.lerp(horizonY, groundY, depth);
    const scale = 0.3 + depth * 0.7;
    
    for (let j = 0; j < 2; j++) {
      const laneX1 = LANE_POSITIONS[j];
      const laneX2 = LANE_POSITIONS[j + 1];
      const topX1 = CANVAS_WIDTH / 2 + (laneX1 - CANVAS_WIDTH / 2) * (0.3 + depth * 0.7);
      const topX2 = CANVAS_WIDTH / 2 + (laneX2 - CANVAS_WIDTH / 2) * (0.3 + depth * 0.7);
      
      p.stroke(60, 70, 90);
      p.line(topX1, y, topX2, y);
    }
  }
  
  p.noStroke();
}