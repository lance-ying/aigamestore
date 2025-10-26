// board.js - Board generation and rendering

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function generateBoardPath() {
  const path = [];
  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2;
  const squareSize = 18;
  const trackWidth = 6;
  
  // Bottom horizontal (left to right) - Player's section
  for (let i = 0; i < trackWidth; i++) {
    path.push({ 
      x: centerX - (trackWidth * squareSize / 2) + i * squareSize + squareSize / 2, 
      y: centerY + squareSize * 3 
    });
  }
  
  // Right vertical going up
  for (let i = 1; i <= trackWidth; i++) {
    path.push({ 
      x: centerX + squareSize * 3, 
      y: centerY + squareSize * 3 - i * squareSize 
    });
  }
  
  // Top horizontal (right to left) - AI's section
  for (let i = 1; i <= trackWidth; i++) {
    path.push({ 
      x: centerX + squareSize * 3 - i * squareSize, 
      y: centerY - squareSize * 3 
    });
  }
  
  // Left vertical going down
  for (let i = 1; i <= trackWidth; i++) {
    path.push({ 
      x: centerX - squareSize * 3, 
      y: centerY - squareSize * 3 + i * squareSize 
    });
  }
  
  return path;
}

export function generateSafeSpots(count) {
  const spots = [];
  const spacing = Math.floor(24 / count);
  for (let i = 0; i < count; i++) {
    spots.push(i * spacing);
  }
  return spots;
}

export function generateTrapSpots(count) {
  const traps = [];
  if (count > 0) {
    traps.push(2);
  }
  if (count > 1) {
    traps.push(4);
  }
  return traps;
}

export function renderBoard(p, boardPath, safeSpots, trapSpots) {
  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2;
  const squareSize = 18;
  
  // Draw background
  p.fill(40, 120, 80);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Draw track squares
  boardPath.forEach((pos, index) => {
    p.push();
    p.translate(pos.x, pos.y);
    
    if (safeSpots.includes(index)) {
      p.fill(100, 200, 255);
    } else if (trapSpots.includes(index)) {
      p.fill(255, 100, 100);
    } else {
      p.fill(220, 240, 200);
    }
    
    p.stroke(60, 100, 60);
    p.strokeWeight(2);
    p.rect(-squareSize / 2, -squareSize / 2, squareSize, squareSize);
    
    if (safeSpots.includes(index)) {
      p.fill(255);
      p.noStroke();
      p.circle(0, 0, 6);
    }
    
    if (trapSpots.includes(index)) {
      p.stroke(200, 50, 50);
      p.strokeWeight(2);
      p.noFill();
      p.circle(0, 0, 8);
    }
    
    p.pop();
  });
  
  // Draw home bases
  // Player home base (bottom left)
  p.fill(255, 100, 100, 150);
  p.stroke(180, 60, 60);
  p.strokeWeight(2);
  p.rect(centerX - squareSize * 6, centerY + squareSize, squareSize * 3, squareSize * 3);
  
  // AI home base (top right)
  p.fill(100, 100, 255, 150);
  p.stroke(60, 60, 180);
  p.strokeWeight(2);
  p.rect(centerX + squareSize * 3, centerY - squareSize * 4, squareSize * 3, squareSize * 3);
  
  // Draw home columns
  // Player home column (going up from center)
  p.fill(255, 120, 120, 100);
  for (let i = 0; i < 5; i++) {
    p.stroke(200, 80, 80);
    p.strokeWeight(1);
    p.rect(centerX - squareSize / 2, centerY + squareSize * 2 - i * squareSize, squareSize, squareSize);
  }
  
  // AI home column (going down from center)
  p.fill(120, 120, 255, 100);
  for (let i = 0; i < 5; i++) {
    p.stroke(80, 80, 200);
    p.strokeWeight(1);
    p.rect(centerX - squareSize / 2, centerY - squareSize * 3 + i * squareSize, squareSize, squareSize);
  }
  
  // Draw center home square
  p.fill(255, 215, 0);
  p.stroke(200, 170, 0);
  p.strokeWeight(3);
  p.rect(centerX - squareSize / 2, centerY - squareSize / 2, squareSize, squareSize);
}

export function getHomeBasePositions() {
  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2;
  const squareSize = 18;
  const spacing = 15;
  
  return {
    player: [
      { x: centerX - squareSize * 5 - spacing / 2, y: centerY + squareSize * 2 - spacing / 2 },
      { x: centerX - squareSize * 5 + spacing / 2, y: centerY + squareSize * 2 - spacing / 2 },
      { x: centerX - squareSize * 5 - spacing / 2, y: centerY + squareSize * 2 + spacing / 2 },
      { x: centerX - squareSize * 5 + spacing / 2, y: centerY + squareSize * 2 + spacing / 2 }
    ],
    ai: [
      { x: centerX + squareSize * 4 - spacing / 2, y: centerY - squareSize * 3 - spacing / 2 },
      { x: centerX + squareSize * 4 + spacing / 2, y: centerY - squareSize * 3 - spacing / 2 },
      { x: centerX + squareSize * 4 - spacing / 2, y: centerY - squareSize * 3 + spacing / 2 },
      { x: centerX + squareSize * 4 + spacing / 2, y: centerY - squareSize * 3 + spacing / 2 }
    ]
  };
}

export function getHomeColumnPosition(owner, step) {
  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2;
  const squareSize = 18;
  
  if (owner === 'PLAYER') {
    return { x: centerX, y: centerY + squareSize * 2 - (step - 1) * squareSize };
  } else {
    return { x: centerX, y: centerY - squareSize * 3 + (step - 1) * squareSize };
  }
}