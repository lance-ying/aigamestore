// physics.js
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies, Body } = Matter;

import { gameState, GRID_OFFSET_X, GRID_OFFSET_Y, CELL_SIZE, GRID_SIZE } from './globals.js';

export function initPhysics() {
  const engine = Engine.create();
  const world = engine.world;
  world.gravity.y = 0;
  
  gameState.engine = engine;
  gameState.world = world;
  
  // Create walls (invisible, for collision detection)
  const wallThickness = 10;
  const walls = [
    // Top
    Bodies.rectangle(
      GRID_OFFSET_X + GRID_SIZE * CELL_SIZE / 2,
      GRID_OFFSET_Y - wallThickness / 2,
      GRID_SIZE * CELL_SIZE,
      wallThickness,
      { isStatic: true, label: 'wall', isSensor: true }
    ),
    // Bottom
    Bodies.rectangle(
      GRID_OFFSET_X + GRID_SIZE * CELL_SIZE / 2,
      GRID_OFFSET_Y + GRID_SIZE * CELL_SIZE + wallThickness / 2,
      GRID_SIZE * CELL_SIZE,
      wallThickness,
      { isStatic: true, label: 'wall', isSensor: true }
    ),
    // Left
    Bodies.rectangle(
      GRID_OFFSET_X - wallThickness / 2,
      GRID_OFFSET_Y + GRID_SIZE * CELL_SIZE / 2,
      wallThickness,
      GRID_SIZE * CELL_SIZE,
      { isStatic: true, label: 'wall', isSensor: true }
    ),
    // Right
    Bodies.rectangle(
      GRID_OFFSET_X + GRID_SIZE * CELL_SIZE + wallThickness / 2,
      GRID_OFFSET_Y + GRID_SIZE * CELL_SIZE / 2,
      wallThickness,
      GRID_SIZE * CELL_SIZE,
      { isStatic: true, label: 'wall', isSensor: true }
    )
  ];
  
  World.add(world, walls);
}

export function checkCollision(furball, dx, dy) {
  const newGridX = furball.gridX + dx;
  const newGridY = furball.gridY + dy;
  
  // Check wall collision
  if (newGridX < 0 || newGridX >= GRID_SIZE || newGridY < 0 || newGridY >= GRID_SIZE) {
    return { type: 'wall', gridX: furball.gridX, gridY: furball.gridY };
  }
  
  // Check furball collision
  for (const other of gameState.furballs) {
    if (other.id !== furball.id && !other.isOffScreen) {
      if (other.gridX === newGridX && other.gridY === newGridY) {
        return { type: 'furball', furball: other, gridX: furball.gridX, gridY: furball.gridY };
      }
    }
  }
  
  return null;
}

export function slideFurball(furball, dx, dy, pushedBy = null) {
  let currentGridX = furball.gridX;
  let currentGridY = furball.gridY;
  let moved = false;
  
  while (true) {
    const collision = checkCollision({ gridX: currentGridX, gridY: currentGridY, id: furball.id }, dx, dy);
    
    if (collision) {
      if (collision.type === 'wall') {
        // Stop at wall, but if we moved, stay at current position
        if (moved) {
          furball.setGridPosition(currentGridX, currentGridY);
        }
        return { stopped: true, pushedOff: false };
      } else if (collision.type === 'furball') {
        // Hit another furball - push it
        const otherFurball = collision.furball;
        const pushResult = slideFurball(otherFurball, dx, dy, furball);
        
        // If the other furball moved, we take its place
        if (pushResult.pushedOff || (otherFurball.gridX !== currentGridX + dx || otherFurball.gridY !== currentGridY + dy)) {
          furball.setGridPosition(currentGridX, currentGridY);
          return { stopped: true, pushedOff: false };
        } else {
          // Other furball couldn't move, we stop here
          if (moved) {
            furball.setGridPosition(currentGridX, currentGridY);
          }
          return { stopped: true, pushedOff: false };
        }
      }
    } else {
      // No collision, move to next cell
      currentGridX += dx;
      currentGridY += dy;
      moved = true;
      
      // Check if we went off the edge
      if (currentGridX < 0 || currentGridX >= GRID_SIZE || currentGridY < 0 || currentGridY >= GRID_SIZE) {
        furball.isOffScreen = true;
        // Move body off screen
        const offX = GRID_OFFSET_X + currentGridX * CELL_SIZE + CELL_SIZE / 2;
        const offY = GRID_OFFSET_Y + currentGridY * CELL_SIZE + CELL_SIZE / 2;
        furball.setPosition(offX, offY);
        return { stopped: true, pushedOff: true };
      }
    }
  }
}