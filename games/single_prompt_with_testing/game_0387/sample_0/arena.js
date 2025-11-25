// arena.js - Arena rendering and management

import { CANVAS_WIDTH, CANVAS_HEIGHT, ARENA_FLOOR_Y, ARENA_LEFT, ARENA_RIGHT, ARENA_TIERS, gameState } from './globals.js';

export function renderArena(p) {
  // Arena walls
  p.fill(80, 70, 60);
  p.rect(0, 0, ARENA_LEFT, CANVAS_HEIGHT);
  p.rect(ARENA_RIGHT, 0, CANVAS_WIDTH - ARENA_RIGHT, CANVAS_HEIGHT);

  // Floor
  p.fill(100, 90, 70);
  p.rect(ARENA_LEFT, ARENA_FLOOR_Y, ARENA_RIGHT - ARENA_LEFT, CANVAS_HEIGHT - ARENA_FLOOR_Y);

  // Floor details
  p.stroke(90, 80, 60);
  p.strokeWeight(1);
  for (let i = 0; i < 10; i++) {
    const x = ARENA_LEFT + (ARENA_RIGHT - ARENA_LEFT) * (i / 10);
    p.line(x, ARENA_FLOOR_Y, x, CANVAS_HEIGHT);
  }
  p.noStroke();

  // Arena tier decoration
  if (gameState.currentTier === 0) {
    // Pits - torches
    drawTorch(p, ARENA_LEFT + 20, 50);
    drawTorch(p, ARENA_RIGHT - 20, 50);
  } else if (gameState.currentTier === 1) {
    // Arena - banners
    drawBanner(p, ARENA_LEFT + 30, 30, [200, 50, 50]);
    drawBanner(p, ARENA_RIGHT - 30, 30, [50, 50, 200]);
  } else if (gameState.currentTier === 2) {
    // Stadium - pillars
    drawPillar(p, ARENA_LEFT + 15, ARENA_FLOOR_Y);
    drawPillar(p, ARENA_RIGHT - 15, ARENA_FLOOR_Y);
  } else if (gameState.currentTier === 3) {
    // Grand Stadium - gold trim
    p.fill(255, 215, 0);
    p.rect(ARENA_LEFT, 0, 5, CANVAS_HEIGHT);
    p.rect(ARENA_RIGHT - 5, 0, 5, CANVAS_HEIGHT);
    p.rect(ARENA_LEFT, ARENA_FLOOR_Y - 5, ARENA_RIGHT - ARENA_LEFT, 5);
    
    // Crown decoration
    drawCrown(p, CANVAS_WIDTH / 2, 30);
  }
}

function drawTorch(p, x, y) {
  // Torch holder
  p.fill(60, 50, 40);
  p.rect(x - 3, y, 6, 40);
  
  // Flame
  p.fill(255, 150, 0, 200);
  p.ellipse(x, y - 5, 15, 20);
  p.fill(255, 200, 0, 180);
  p.ellipse(x, y - 5, 10, 15);
}

function drawBanner(p, x, y, color) {
  p.fill(color[0], color[1], color[2]);
  p.rect(x - 15, y, 30, 50);
  p.triangle(x - 15, y + 50, x + 15, y + 50, x, y + 65);
}

function drawPillar(p, x, y) {
  p.fill(200, 200, 200);
  p.rect(x - 8, y - 100, 16, 100);
  p.rect(x - 12, y - 110, 24, 10);
  p.rect(x - 10, y, 20, 5);
}

function drawCrown(p, x, y) {
  p.fill(255, 215, 0);
  p.beginShape();
  p.vertex(x - 30, y + 20);
  p.vertex(x - 20, y);
  p.vertex(x - 10, y + 15);
  p.vertex(x, y);
  p.vertex(x + 10, y + 15);
  p.vertex(x + 20, y);
  p.vertex(x + 30, y + 20);
  p.vertex(x + 25, y + 25);
  p.vertex(x - 25, y + 25);
  p.endShape(p.CLOSE);
  
  // Jewels
  p.fill(200, 0, 0);
  p.circle(x - 15, y + 10, 6);
  p.circle(x, y + 8, 6);
  p.circle(x + 15, y + 10, 6);
}

export function getArenaTier(tierIndex) {
  const tiers = Object.values(ARENA_TIERS);
  return tiers[tierIndex] || tiers[0];
}