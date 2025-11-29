// renderer.js - Main rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE } from './globals.js';
import { isOnScreen } from './camera.js';

export function renderBackground(p) {
  // Dark apartment floor
  p.fill(40, 35, 45);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Tile pattern
  const offsetX = gameState.cameraX % TILE_SIZE;
  const offsetY = gameState.cameraY % TILE_SIZE;
  
  p.stroke(50, 45, 55);
  p.strokeWeight(1);
  
  for (let x = -offsetX; x < CANVAS_WIDTH; x += TILE_SIZE) {
    p.line(x, 0, x, CANVAS_HEIGHT);
  }
  for (let y = -offsetY; y < CANVAS_HEIGHT; y += TILE_SIZE) {
    p.line(0, y, CANVAS_WIDTH, y);
  }
  p.noStroke();
  
  // Wall shadows
  renderWalls(p);
}

function renderWalls(p) {
  const room = gameState.rooms[gameState.currentRoom];
  if (!room) return;
  
  // Room boundaries (walls)
  const walls = [
    { x: 0, y: 0, w: 20, h: room.height }, // Left wall
    { x: room.width - 20, y: 0, w: 20, h: room.height }, // Right wall
    { x: 0, y: 0, w: room.width, h: 20 }, // Top wall
    { x: 0, y: room.height - 20, w: room.width, h: 20 } // Bottom wall
  ];
  
  p.fill(25, 20, 30);
  walls.forEach(wall => {
    if (isOnScreen(wall.x, wall.y, wall.w, wall.h)) {
      const screenX = wall.x - gameState.cameraX;
      const screenY = wall.y - gameState.cameraY;
      p.rect(screenX, screenY, wall.w, wall.h);
    }
  });
}

export function renderEntities(p) {
  // Render furniture
  gameState.furniture.forEach(furniture => {
    if (isOnScreen(furniture.x, furniture.y, furniture.width, furniture.height)) {
      furniture.render(p);
    }
  });
  
  // Render doors
  gameState.doors.forEach(door => {
    if (isOnScreen(door.x, door.y, door.width, door.height)) {
      door.render(p);
    }
  });
  
  // Render clues
  gameState.clues.forEach(clue => {
    if (!clue.collected && isOnScreen(clue.x, clue.y, clue.width, clue.height)) {
      clue.render(p);
    }
  });
  
  // Render enemies
  gameState.enemies.forEach(enemy => {
    if (isOnScreen(enemy.x, enemy.y, enemy.width, enemy.height)) {
      enemy.render(p);
    }
  });
  
  // Render player
  if (gameState.player) {
    gameState.player.render(p);
  }
  
  // Render particles
  gameState.particles.forEach(particle => {
    particle.render(p);
  });
}