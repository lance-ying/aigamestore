// renderer.js - 3D-like rendering for first-person view

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  WALLS,
  FURNITURE,
  FLASHLIGHT_RANGE
} from './globals.js';
import { distance, angleBetween, angleDifference } from './utils.js';

const FOV = Math.PI / 3; // 60 degrees field of view
const WALL_HEIGHT = 100;
const RENDER_DISTANCE = 400;

export function renderFirstPersonView(p) {
  if (!gameState.player) return;
  
  const player = gameState.player;
  
  // Draw floor and ceiling
  p.noStroke();
  p.fill(20, 15, 25);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT / 2); // Ceiling
  p.fill(30, 25, 35);
  p.rect(0, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT / 2); // Floor
  
  // Cast rays for each column of the screen
  const numRays = 60; // Lower for performance
  
  for (let i = 0; i < numRays; i++) {
    const rayAngle = player.angle - FOV / 2 + (i / numRays) * FOV;
    
    // Cast ray and find closest wall
    const hit = castRay(player.x, player.y, rayAngle);
    
    if (hit) {
      // Calculate wall height based on distance
      const distance = hit.distance * Math.cos(angleDifference(rayAngle, player.angle));
      const wallHeight = (WALL_HEIGHT / distance) * 200;
      
      // Calculate column position and width
      const columnX = (i / numRays) * CANVAS_WIDTH;
      const columnWidth = CANVAS_WIDTH / numRays + 1;
      
      // Calculate lighting based on flashlight
      let brightness = 30;
      if (gameState.flashlightOn) {
        const lightDist = distance / FLASHLIGHT_RANGE;
        brightness = Math.max(30, 200 * (1 - lightDist));
      }
      
      // Draw wall column
      p.fill(brightness * 0.4, brightness * 0.3, brightness * 0.5);
      p.noStroke();
      p.rect(
        columnX,
        CANVAS_HEIGHT / 2 - wallHeight / 2,
        columnWidth,
        wallHeight
      );
      
      // Draw darker shade for depth
      p.fill(brightness * 0.2, brightness * 0.15, brightness * 0.25, 50);
      p.rect(
        columnX,
        CANVAS_HEIGHT / 2 - wallHeight / 2,
        columnWidth,
        wallHeight
      );
    }
  }
  
  // Render Tattletail if visible
  if (gameState.tattletail) {
    renderEntity3D(p, gameState.tattletail, [255, 100, 200]);
  }
  
  // Render Mama if active and visible
  if (gameState.mama && gameState.mama.active) {
    renderEntity3D(p, gameState.mama, [150, 0, 0]);
  }
  
  // Apply darkness overlay if flashlight is off
  if (!gameState.flashlightOn) {
    p.fill(0, 0, 0, 180);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }
  
  // Vignette effect
  drawVignette(p);
}

function castRay(startX, startY, angle) {
  const rayDirX = Math.cos(angle);
  const rayDirY = Math.sin(angle);
  
  let closestHit = null;
  let closestDistance = Infinity;
  
  // Check intersection with all walls
  for (const wall of WALLS) {
    const hit = lineIntersection(
      startX, startY,
      startX + rayDirX * RENDER_DISTANCE,
      startY + rayDirY * RENDER_DISTANCE,
      wall.x1, wall.y1, wall.x2, wall.y2
    );
    
    if (hit) {
      const dist = distance(startX, startY, hit.x, hit.y);
      if (dist < closestDistance) {
        closestDistance = dist;
        closestHit = { ...hit, distance: dist };
      }
    }
  }
  
  return closestHit;
}

function lineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 0.001) return null;
  
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
  
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1)
    };
  }
  
  return null;
}

function renderEntity3D(p, entity, color) {
  if (!gameState.player) return;
  
  const player = gameState.player;
  const dx = entity.x - player.x;
  const dy = entity.y - player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist > RENDER_DISTANCE) return;
  
  // Calculate angle to entity relative to player
  const angleToEntity = angleBetween(player.x, player.y, entity.x, entity.y);
  const relativeAngle = angleDifference(player.angle, angleToEntity);
  
  // Check if entity is in FOV
  if (Math.abs(relativeAngle) > FOV / 2) return;
  
  // Calculate screen position
  const screenX = CANVAS_WIDTH / 2 + (relativeAngle / FOV) * CANVAS_WIDTH;
  const size = (entity.radius / dist) * 500;
  
  // Calculate lighting
  let brightness = 100;
  if (gameState.flashlightOn) {
    const lightDist = dist / FLASHLIGHT_RANGE;
    brightness = Math.max(50, 255 * (1 - lightDist));
  }
  
  // Draw entity
  p.push();
  p.fill(color[0] * brightness / 255, color[1] * brightness / 255, color[2] * brightness / 255);
  p.noStroke();
  p.ellipse(screenX, CANVAS_HEIGHT / 2, size, size);
  
  // Draw eyes for Tattletail
  if (entity === gameState.tattletail) {
    p.fill(255);
    const eyeSize = size * 0.15;
    p.ellipse(screenX - size * 0.2, CANVAS_HEIGHT / 2 - size * 0.1, eyeSize, eyeSize);
    p.ellipse(screenX + size * 0.2, CANVAS_HEIGHT / 2 - size * 0.1, eyeSize, eyeSize);
  }
  
  // Draw glowing eyes for Mama
  if (entity === gameState.mama) {
    p.fill(255, 0, 0);
    const eyeSize = size * 0.2;
    p.ellipse(screenX - size * 0.25, CANVAS_HEIGHT / 2 - size * 0.15, eyeSize, eyeSize);
    p.ellipse(screenX + size * 0.25, CANVAS_HEIGHT / 2 - size * 0.15, eyeSize, eyeSize);
    
    // Glow effect
    p.fill(255, 0, 0, 100);
    p.ellipse(screenX - size * 0.25, CANVAS_HEIGHT / 2 - size * 0.15, eyeSize * 1.5, eyeSize * 1.5);
    p.ellipse(screenX + size * 0.25, CANVAS_HEIGHT / 2 - size * 0.15, eyeSize * 1.5, eyeSize * 1.5);
  }
  
  p.pop();
}

function drawVignette(p) {
  const gradient = 80;
  p.noStroke();
  
  // Top
  for (let i = 0; i < gradient; i++) {
    const alpha = (i / gradient) * 150;
    p.fill(0, 0, 0, alpha);
    p.rect(0, i, CANVAS_WIDTH, 1);
  }
  
  // Bottom
  for (let i = 0; i < gradient; i++) {
    const alpha = (i / gradient) * 150;
    p.fill(0, 0, 0, alpha);
    p.rect(0, CANVAS_HEIGHT - i - 1, CANVAS_WIDTH, 1);
  }
  
  // Left
  for (let i = 0; i < gradient; i++) {
    const alpha = (i / gradient) * 150;
    p.fill(0, 0, 0, alpha);
    p.rect(i, 0, 1, CANVAS_HEIGHT);
  }
  
  // Right
  for (let i = 0; i < gradient; i++) {
    const alpha = (i / gradient) * 150;
    p.fill(0, 0, 0, alpha);
    p.rect(CANVAS_WIDTH - i - 1, 0, 1, CANVAS_HEIGHT);
  }
}

export function renderMinimap(p) {
  const mapSize = 120;
  const mapX = CANVAS_WIDTH - mapSize - 10;
  const mapY = 10;
  const scale = 0.15;
  
  // Background
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(mapX, mapY, mapSize, mapSize);
  
  // Draw walls
  p.stroke(100);
  p.strokeWeight(1);
  for (const wall of WALLS) {
    p.line(
      mapX + wall.x1 * scale,
      mapY + wall.y1 * scale,
      mapX + wall.x2 * scale,
      mapY + wall.y2 * scale
    );
  }
  
  // Draw Tattletail
  if (gameState.tattletail) {
    p.fill(255, 100, 200);
    p.noStroke();
    p.circle(
      mapX + gameState.tattletail.x * scale,
      mapY + gameState.tattletail.y * scale,
      5
    );
  }
  
  // Draw Mama if active
  if (gameState.mama && gameState.mama.active && gameState.mama.spawnDelay <= 0) {
    p.fill(200, 0, 0);
    p.noStroke();
    p.circle(
      mapX + gameState.mama.x * scale,
      mapY + gameState.mama.y * scale,
      6
    );
  }
  
  // Draw player
  if (gameState.player) {
    p.fill(0, 255, 0);
    p.noStroke();
    p.circle(
      mapX + gameState.player.x * scale,
      mapY + gameState.player.y * scale,
      4
    );
    
    // Draw view direction
    const dirLen = 15;
    p.stroke(0, 255, 0);
    p.strokeWeight(1);
    p.line(
      mapX + gameState.player.x * scale,
      mapY + gameState.player.y * scale,
      mapX + gameState.player.x * scale + Math.cos(gameState.player.angle) * dirLen,
      mapY + gameState.player.y * scale + Math.sin(gameState.player.angle) * dirLen
    );
  }
}