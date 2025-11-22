import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function generatePath() {
  const path = [];
  // Create a winding path from left to right
  path.push({ x: -20, y: 200 });
  path.push({ x: 100, y: 200 });
  path.push({ x: 150, y: 150 });
  path.push({ x: 200, y: 150 });
  path.push({ x: 250, y: 250 });
  path.push({ x: 350, y: 250 });
  path.push({ x: 400, y: 150 });
  path.push({ x: 500, y: 150 });
  path.push({ x: 550, y: 200 });
  path.push({ x: CANVAS_WIDTH + 20, y: 200 });
  return path;
}

export function drawPath(p, path) {
  p.push();
  p.strokeWeight(40);
  p.stroke(80, 70, 60);
  p.noFill();
  p.beginShape();
  for (let point of path) {
    p.vertex(point.x, point.y);
  }
  p.endShape();
  
  // Draw path border
  p.strokeWeight(44);
  p.stroke(60, 50, 40);
  p.beginShape();
  for (let point of path) {
    p.vertex(point.x, point.y);
  }
  p.endShape();
  p.pop();
}

export function getPathPosition(path, progress) {
  const totalSegments = path.length - 1;
  const segment = Math.floor(progress * totalSegments);
  const segmentProgress = (progress * totalSegments) - segment;
  
  if (segment >= totalSegments) {
    return path[path.length - 1];
  }
  
  const start = path[segment];
  const end = path[segment + 1];
  
  return {
    x: start.x + (end.x - start.x) * segmentProgress,
    y: start.y + (end.y - start.y) * segmentProgress
  };
}

export function getPathDirection(path, progress) {
  const totalSegments = path.length - 1;
  const segment = Math.floor(progress * totalSegments);
  
  if (segment >= totalSegments) {
    segment = totalSegments - 1;
  }
  
  const start = path[segment];
  const end = path[segment + 1];
  
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  return { x: dx / length, y: dy / length };
}