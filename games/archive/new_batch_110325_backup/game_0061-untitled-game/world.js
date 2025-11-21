// world.js - World rendering and environment

import { gameState, ZONES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderWorld(p, player) {
  // Determine current zone
  const zone = getCurrentZone(player.worldX, player.worldY);
  gameState.currentZone = zone.name;
  
  // Draw background gradient
  drawBackground(p, zone);
  
  // Draw floor grid
  drawFloor(p, player, zone);
  
  // Draw walls and boundaries
  drawWalls(p, player);
  
  // Draw ambient particles
  drawParticles(p, player);
}

function getCurrentZone(x, y) {
  for (const [key, zone] of Object.entries(ZONES)) {
    if (x >= zone.bounds.minX && x <= zone.bounds.maxX &&
        y >= zone.bounds.minY && y <= zone.bounds.maxY) {
      return { name: key, ...zone };
    }
  }
  return { name: "void", color: [10, 10, 10], bounds: {} };
}

function drawBackground(p, zone) {
  const [r, g, b] = zone.color;
  
  // Gradient background
  for (let y = 0; y < p.height; y++) {
    const inter = p.map(y, 0, p.height, 0, 1);
    const c = p.lerpColor(
      p.color(r * 0.5, g * 0.5, b * 0.5),
      p.color(r, g, b),
      inter
    );
    p.stroke(c);
    p.line(0, y, p.width, y);
  }
}

function drawFloor(p, player, zone) {
  const gridSize = 100;
  const [r, g, b] = zone.color;
  
  // Draw perspective grid lines
  p.push();
  p.stroke(r + 30, g + 30, b + 30, 100);
  p.strokeWeight(1);
  
  for (let i = -5; i <= 5; i++) {
    // Calculate world position of grid lines
    const worldX1 = player.worldX + i * gridSize;
    const worldY1 = player.worldY - 300;
    const worldX2 = player.worldX + i * gridSize;
    const worldY2 = player.worldY + 300;
    
    // Project to screen
    const screen1 = worldToScreen(p, player, worldX1, worldY1);
    const screen2 = worldToScreen(p, player, worldX2, worldY2);
    
    if (screen1 && screen2) {
      p.line(screen1.x, screen1.y, screen2.x, screen2.y);
    }
  }
  
  for (let i = -3; i <= 3; i++) {
    const worldY = player.worldY + i * gridSize;
    const worldX1 = player.worldX - 500;
    const worldX2 = player.worldX + 500;
    
    const screen1 = worldToScreen(p, player, worldX1, worldY);
    const screen2 = worldToScreen(p, player, worldX2, worldY);
    
    if (screen1 && screen2) {
      p.line(screen1.x, screen1.y, screen2.x, screen2.y);
    }
  }
  
  p.pop();
}

function drawWalls(p, player) {
  // Draw zone boundaries as walls
  p.push();
  p.strokeWeight(3);
  p.stroke(100, 100, 150, 180);
  
  // Draw walls at zone boundaries
  const bounds = getCurrentZone(player.worldX, player.worldY).bounds;
  if (bounds.minX !== undefined) {
    drawWallLine(p, player, bounds.minX, bounds.minY, bounds.minX, bounds.maxY);
    drawWallLine(p, player, bounds.maxX, bounds.minY, bounds.maxX, bounds.maxY);
    drawWallLine(p, player, bounds.minX, bounds.minY, bounds.maxX, bounds.minY);
    drawWallLine(p, player, bounds.minX, bounds.maxY, bounds.maxX, bounds.maxY);
  }
  
  p.pop();
}

function drawWallLine(p, player, x1, y1, x2, y2) {
  const screen1 = worldToScreen(p, player, x1, y1);
  const screen2 = worldToScreen(p, player, x2, y2);
  
  if (screen1 && screen2) {
    p.line(screen1.x, screen1.y, screen2.x, screen2.y);
  }
}

function worldToScreen(p, player, worldX, worldY) {
  const dx = worldX - player.worldX;
  const dy = worldY - player.worldY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance < 1) return null;
  if (distance > 600) return null;
  
  const angleToPoint = Math.atan2(dy, dx);
  let relativeAngle = angleToPoint - player.angle;
  
  while (relativeAngle > Math.PI) relativeAngle -= Math.PI * 2;
  while (relativeAngle < -Math.PI) relativeAngle += Math.PI * 2;
  
  if (Math.abs(relativeAngle) > Math.PI / 2) return null;
  
  const screenX = p.width / 2 + relativeAngle * 300;
  const screenY = p.height / 2 + p.map(distance, 0, 400, 0, 50);
  
  return { x: screenX, y: screenY };
}

function drawParticles(p, player) {
  p.push();
  p.noStroke();
  
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2 + player.angle + gameState.frameCount * 0.01;
    const distance = 200 + Math.sin(gameState.frameCount * 0.02 + i) * 50;
    
    const worldX = player.worldX + Math.cos(angle) * distance;
    const worldY = player.worldY + Math.sin(angle) * distance;
    
    const screen = worldToScreen(p, player, worldX, worldY);
    if (screen) {
      const alpha = p.map(distance, 150, 250, 100, 20);
      p.fill(200, 200, 255, alpha);
      p.circle(screen.x, screen.y, 3);
    }
  }
  
  p.pop();
}