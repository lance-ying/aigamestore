// path.js - Path generation and tower slot management

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export function generatePath() {
  const path = [];
  
  // Create a winding path from left to right
  path.push({ x: 0, y: 200 });
  path.push({ x: 100, y: 200 });
  path.push({ x: 100, y: 120 });
  path.push({ x: 200, y: 120 });
  path.push({ x: 200, y: 280 });
  path.push({ x: 350, y: 280 });
  path.push({ x: 350, y: 150 });
  path.push({ x: 500, y: 150 });
  path.push({ x: 500, y: 250 });
  path.push({ x: CANVAS_WIDTH, y: 250 });
  
  gameState.path = path;
  return path;
}

export function generateTowerSlots() {
  const slots = [];
  
  // Add slots strategically around the path
  const slotPositions = [
    { x: 50, y: 150 }, { x: 50, y: 250 },
    { x: 150, y: 80 }, { x: 150, y: 160 }, { x: 150, y: 240 },
    { x: 250, y: 80 }, { x: 250, y: 200 }, { x: 250, y: 320 },
    { x: 300, y: 150 }, { x: 300, y: 280 },
    { x: 400, y: 120 }, { x: 400, y: 220 }, { x: 400, y: 310 },
    { x: 450, y: 200 }, { x: 450, y: 280 },
    { x: 550, y: 200 }, { x: 550, y: 300 }
  ];
  
  slotPositions.forEach((pos, index) => {
    slots.push({
      id: index,
      x: pos.x,
      y: pos.y,
      tower: null,
      size: 30
    });
  });
  
  gameState.towerSlots = slots;
  return slots;
}

export function drawPath(p) {
  const path = gameState.path;
  
  p.strokeWeight(40);
  p.stroke(80, 70, 60);
  p.noFill();
  p.beginShape();
  for (let point of path) {
    p.vertex(point.x, point.y);
  }
  p.endShape();
  
  // Draw portal at end
  const end = path[path.length - 1];
  p.fill(150, 50, 200, 150);
  p.noStroke();
  p.circle(end.x, end.y, 50);
  p.fill(200, 100, 255, 200);
  p.circle(end.x, end.y, 30);
}

export function drawTowerSlots(p) {
  const slots = gameState.towerSlots;
  
  for (let slot of slots) {
    if (!slot.tower) {
      p.fill(60, 60, 60, 100);
      p.stroke(100, 100, 100);
      p.strokeWeight(2);
      p.rect(slot.x - slot.size / 2, slot.y - slot.size / 2, slot.size, slot.size, 4);
    }
  }
}

export function getSlotAt(x, y) {
  for (let slot of gameState.towerSlots) {
    const dist = Math.sqrt((slot.x - x) ** 2 + (slot.y - y) ** 2);
    if (dist < slot.size) {
      return slot;
    }
  }
  return null;
}