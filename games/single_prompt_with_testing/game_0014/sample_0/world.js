// world.js
import { gameState, WORLD_WIDTH, WORLD_HEIGHT } from './globals.js';
import { MemoryFragment, NPC, Hostile, Portal } from './entities.js';

export function generateWorld(p) {
  // Clear existing entities
  gameState.memoryFragments = [];
  gameState.npcs = [];
  gameState.hostiles = [];

  // Generate memory fragments (20 total)
  const fragmentTypes = ["joy", "sorrow", "mystery"];
  for (let i = 0; i < 20; i++) {
    const x = 100 + Math.random() * (WORLD_WIDTH - 200);
    const y = 100 + Math.random() * (WORLD_HEIGHT - 200);
    const type = fragmentTypes[Math.floor(Math.random() * fragmentTypes.length)];
    gameState.memoryFragments.push(new MemoryFragment(x, y, type));
  }

  // Generate NPCs (8 total)
  const npcTypes = ["friendly", "wise", "troubled"];
  for (let i = 0; i < 8; i++) {
    const x = 150 + Math.random() * (WORLD_WIDTH - 300);
    const y = 150 + Math.random() * (WORLD_HEIGHT - 300);
    const type = npcTypes[Math.floor(Math.random() * npcTypes.length)];
    gameState.npcs.push(new NPC(x, y, type));
  }

  // Generate hostiles (12 total)
  const hostileTypes = ["wanderer", "chaser", "guard"];
  for (let i = 0; i < 12; i++) {
    const x = 200 + Math.random() * (WORLD_WIDTH - 400);
    const y = 200 + Math.random() * (WORLD_HEIGHT - 400);
    const type = hostileTypes[Math.floor(Math.random() * hostileTypes.length)];
    gameState.hostiles.push(new Hostile(x, y, type));
  }

  // Create portal at specific location
  gameState.portal = new Portal(WORLD_WIDTH - 200, WORLD_HEIGHT / 2);
}

export function drawWorld(p, camera) {
  // Draw background layers for depth
  p.push();
  
  // Far background
  const bgGradient1 = p.map(camera.y, 0, WORLD_HEIGHT, 30, 50);
  const bgGradient2 = p.map(camera.y, 0, WORLD_HEIGHT, 20, 40);
  for (let y = 0; y < p.height; y += 2) {
    const inter = y / p.height;
    p.stroke(bgGradient1 + inter * 20, bgGradient2 + inter * 15, 40 + inter * 20);
    p.line(0, y, p.width, y);
  }

  p.pop();

  // Draw world grid
  drawGrid(p, camera);

  // Draw world boundaries
  drawBoundaries(p, camera);
}

function drawGrid(p, camera) {
  p.push();
  p.stroke(60, 60, 80, 100);
  p.strokeWeight(1);

  const gridSize = 100;
  const startX = Math.floor(camera.x / gridSize) * gridSize;
  const startY = Math.floor(camera.y / gridSize) * gridSize;

  for (let x = startX; x < camera.x + p.width; x += gridSize) {
    const screenX = x - camera.x;
    p.line(screenX, 0, screenX, p.height);
  }

  for (let y = startY; y < camera.y + p.height; y += gridSize) {
    const screenY = y - camera.y;
    p.line(0, screenY, p.width, screenY);
  }

  p.pop();
}

function drawBoundaries(p, camera) {
  p.push();
  p.noFill();
  p.stroke(150, 100, 200, 150);
  p.strokeWeight(4);

  // Top
  if (camera.y < 50) {
    p.line(0, -camera.y, p.width, -camera.y);
  }
  // Bottom
  if (camera.y + p.height > WORLD_HEIGHT - 50) {
    const y = WORLD_HEIGHT - camera.y;
    p.line(0, y, p.width, y);
  }
  // Left
  if (camera.x < 50) {
    p.line(-camera.x, 0, -camera.x, p.height);
  }
  // Right
  if (camera.x + p.width > WORLD_WIDTH - 50) {
    const x = WORLD_WIDTH - camera.x;
    p.line(x, 0, x, p.height);
  }

  p.pop();
}

export function drawMinimap(p) {
  const minimapWidth = 120;
  const minimapHeight = 80;
  const minimapX = p.width - minimapWidth - 10;
  const minimapY = 10;

  p.push();
  
  // Background
  p.fill(20, 20, 30, 200);
  p.stroke(100, 100, 150);
  p.strokeWeight(2);
  p.rect(minimapX, minimapY, minimapWidth, minimapHeight);

  // Player position
  const playerMinimapX = minimapX + (gameState.player.x / WORLD_WIDTH) * minimapWidth;
  const playerMinimapY = minimapY + (gameState.player.y / WORLD_HEIGHT) * minimapHeight;
  p.fill(255, 220, 100);
  p.noStroke();
  p.circle(playerMinimapX, playerMinimapY, 5);

  // Portal
  const portalMinimapX = minimapX + (gameState.portal.x / WORLD_WIDTH) * minimapWidth;
  const portalMinimapY = minimapY + (gameState.portal.y / WORLD_HEIGHT) * minimapHeight;
  p.fill(200, 150, 255);
  p.circle(portalMinimapX, portalMinimapY, 6);

  // Memory fragments
  p.fill(255, 200, 50, 150);
  for (const fragment of gameState.memoryFragments) {
    if (!fragment.collected) {
      const fx = minimapX + (fragment.x / WORLD_WIDTH) * minimapWidth;
      const fy = minimapY + (fragment.y / WORLD_HEIGHT) * minimapHeight;
      p.circle(fx, fy, 3);
    }
  }

  p.pop();
}