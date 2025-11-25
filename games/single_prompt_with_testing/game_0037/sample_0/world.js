// world.js - World generation and management

import { gameState } from './globals.js';
import { Wall } from './wall.js';
import { Evidence } from './evidence.js';
import { Spirit } from './spirit.js';

export function generateWorld(p) {
  // Clear existing entities
  gameState.walls = [];
  gameState.evidence = [];
  gameState.spirits = [];

  // Create boundary walls
  gameState.walls.push(new Wall(0, 0, gameState.worldWidth, 20)); // Top
  gameState.walls.push(new Wall(0, gameState.worldHeight - 20, gameState.worldWidth, 20)); // Bottom
  gameState.walls.push(new Wall(0, 0, 20, gameState.worldHeight)); // Left
  gameState.walls.push(new Wall(gameState.worldWidth - 20, 0, 20, gameState.worldHeight)); // Right

  // Create interior walls (village layout)
  // Main house structures
  gameState.walls.push(new Wall(150, 100, 200, 20)); // House 1 top
  gameState.walls.push(new Wall(150, 100, 20, 150));
  gameState.walls.push(new Wall(330, 100, 20, 150));
  gameState.walls.push(new Wall(150, 230, 200, 20));

  gameState.walls.push(new Wall(450, 150, 180, 20)); // House 2 top
  gameState.walls.push(new Wall(450, 150, 20, 120));
  gameState.walls.push(new Wall(610, 150, 20, 120));
  gameState.walls.push(new Wall(450, 250, 180, 20));

  gameState.walls.push(new Wall(200, 400, 150, 20)); // House 3 top
  gameState.walls.push(new Wall(200, 400, 20, 130));
  gameState.walls.push(new Wall(330, 400, 20, 130));
  gameState.walls.push(new Wall(200, 510, 150, 20));

  gameState.walls.push(new Wall(700, 350, 200, 20)); // House 4 top
  gameState.walls.push(new Wall(700, 350, 20, 150));
  gameState.walls.push(new Wall(880, 350, 20, 150));
  gameState.walls.push(new Wall(700, 480, 200, 20));

  gameState.walls.push(new Wall(950, 100, 180, 20)); // House 5 top
  gameState.walls.push(new Wall(950, 100, 20, 130));
  gameState.walls.push(new Wall(1110, 100, 20, 130));
  gameState.walls.push(new Wall(950, 210, 180, 20));

  // Corridors and pathways
  gameState.walls.push(new Wall(400, 350, 20, 100));
  gameState.walls.push(new Wall(600, 450, 20, 120));
  gameState.walls.push(new Wall(800, 200, 100, 20));

  // Place evidence in different rooms
  const evidencePositions = [
    { x: 250, y: 160, type: "document" },
    { x: 530, y: 200, type: "photo" },
    { x: 270, y: 460, type: "item" },
    { x: 790, y: 410, type: "document" },
    { x: 1030, y: 155, type: "photo" },
    { x: 100, y: 300, type: "item" },
    { x: 750, y: 650, type: "document" },
    { x: 500, y: 600, type: "photo" }
  ];

  for (const pos of evidencePositions) {
    gameState.evidence.push(new Evidence(pos.x, pos.y, pos.type));
  }

  // Place spirits with patrol routes
  const spiritData = [
    {
      start: { x: 400, y: 300 },
      patrol: [
        { x: 400, y: 300 },
        { x: 500, y: 300 },
        { x: 500, y: 400 },
        { x: 400, y: 400 }
      ]
    },
    {
      start: { x: 700, y: 150 },
      patrol: [
        { x: 700, y: 150 },
        { x: 850, y: 150 },
        { x: 850, y: 280 },
        { x: 700, y: 280 }
      ]
    },
    {
      start: { x: 100, y: 600 },
      patrol: [
        { x: 100, y: 600 },
        { x: 180, y: 600 },
        { x: 180, y: 700 },
        { x: 100, y: 700 }
      ]
    },
    {
      start: { x: 900, y: 550 },
      patrol: [
        { x: 900, y: 550 },
        { x: 1000, y: 550 },
        { x: 1000, y: 650 },
        { x: 900, y: 650 }
      ]
    }
  ];

  for (const data of spiritData) {
    const spirit = new Spirit(data.start.x, data.start.y, data.patrol);
    gameState.spirits.push(spirit);
  }
}

export function updateCamera(p) {
  if (!gameState.player) return;

  // Camera follows player with smooth lerping
  const targetX = gameState.player.x - p.width / 2;
  const targetY = gameState.player.y - p.height / 2;

  gameState.camera.x += (targetX - gameState.camera.x) * 0.1;
  gameState.camera.y += (targetY - gameState.camera.y) * 0.1;

  // Clamp camera to world bounds
  gameState.camera.x = Math.max(0, Math.min(gameState.worldWidth - p.width, gameState.camera.x));
  gameState.camera.y = Math.max(0, Math.min(gameState.worldHeight - p.height, gameState.camera.y));
}

export function renderWorld(p) {
  // Render background with atmospheric effect
  const gradient = p.drawingContext.createLinearGradient(0, 0, 0, p.height);
  gradient.addColorStop(0, '#1a1520');
  gradient.addColorStop(1, '#2d2535');
  p.drawingContext.fillStyle = gradient;
  p.drawingContext.fillRect(0, 0, p.width, p.height);

  // Add some fog/mist effect
  for (let i = 0; i < 5; i++) {
    const offsetX = (p.frameCount * 0.3 + i * 100) % (p.width + 200) - 100;
    const offsetY = 50 + i * 80;
    p.noStroke();
    p.fill(80, 70, 90, 20);
    p.ellipse(offsetX, offsetY, 200, 60);
  }

  // Render walls
  for (const wall of gameState.walls) {
    wall.render(p, gameState.camera);
  }
}