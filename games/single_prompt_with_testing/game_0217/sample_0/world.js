// world.js - World generation and background rendering

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';
import { Platform } from './entities.js';

export function generateWorld() {
  // Create platforms
  gameState.platforms = [];
  
  // Ground is handled by player collision, but add some floating platforms
  gameState.platforms.push(new Platform(80, 280, 120, 15));
  gameState.platforms.push(new Platform(250, 240, 100, 15));
  gameState.platforms.push(new Platform(420, 200, 130, 15));
  gameState.platforms.push(new Platform(150, 160, 90, 15));
  gameState.platforms.push(new Platform(380, 120, 110, 15));
  
  // Create organic background shapes
  gameState.organicShapes = [];
  for (let i = 0; i < 8; i++) {
    gameState.organicShapes.push({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      size: 40 + Math.random() * 80,
      speed: 0.01 + Math.random() * 0.02,
      offset: Math.random() * Math.PI * 2
    });
  }
}

export function renderBackground(p) {
  // Base background color - pulsing pink
  const pulse = Math.sin(gameState.worldPulse) * 10 + 220;
  p.background(pulse, pulse * 0.7, pulse * 0.85);
  
  // Organic background layers
  gameState.organicShapes.forEach((shape, i) => {
    const wobble = Math.sin(gameState.worldPulse * 0.5 + shape.offset) * 30;
    const alpha = 30 + Math.sin(gameState.worldPulse + i) * 20;
    
    p.push();
    p.fill(...COLORS.pinkLight, alpha);
    p.noStroke();
    
    p.beginShape();
    const segments = 8;
    for (let j = 0; j < segments; j++) {
      const angle = (j / segments) * Math.PI * 2;
      const r = shape.size + Math.sin(gameState.worldPulse + j) * 15;
      const x = shape.x + wobble + Math.cos(angle) * r;
      const y = shape.y + Math.sin(angle) * r;
      p.vertex(x, y);
    }
    p.endShape(p.CLOSE);
    
    p.pop();
  });
  
  // Add membrane/vein-like patterns
  renderMembranes(p);
  
  // Ground layer
  renderGround(p);
}

function renderMembranes(p) {
  p.stroke(...COLORS.pinkDark, 40);
  p.strokeWeight(3);
  p.noFill();
  
  for (let i = 0; i < 5; i++) {
    p.beginShape();
    const yBase = (i / 5) * CANVAS_HEIGHT;
    for (let x = 0; x <= CANVAS_WIDTH; x += 20) {
      const wobble = Math.sin(gameState.worldPulse + x * 0.02 + i) * 20;
      p.vertex(x, yBase + wobble);
    }
    p.endShape();
  }
}

function renderGround(p) {
  const groundY = CANVAS_HEIGHT - 40;
  
  // Ground surface with organic texture
  p.fill(...COLORS.organic);
  p.noStroke();
  
  p.beginShape();
  p.vertex(0, groundY);
  for (let x = 0; x <= CANVAS_WIDTH; x += 20) {
    const wobble = Math.sin(gameState.worldPulse + x * 0.05) * 5;
    p.vertex(x, groundY + wobble);
  }
  p.vertex(CANVAS_WIDTH, CANVAS_HEIGHT);
  p.vertex(0, CANVAS_HEIGHT);
  p.endShape(p.CLOSE);
  
  // Add texture spots
  p.fill(...COLORS.pinkDark, 80);
  for (let x = 0; x < CANVAS_WIDTH; x += 40) {
    const wobble = Math.sin(gameState.worldPulse + x * 0.1) * 3;
    p.circle(x + 20, groundY + 10 + wobble, 8);
  }
}