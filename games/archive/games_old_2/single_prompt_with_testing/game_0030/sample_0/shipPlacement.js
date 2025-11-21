// shipPlacement.js - Ship placement logic

import { GRID_SIZE, SHIP_CONFIGS, gameState } from './globals.js';
import { Ship } from './entities.js';

export function placeShipsRandomly(isPlayer) {
  const ships = [];
  
  for (let config of SHIP_CONFIGS) {
    let placed = false;
    let attempts = 0;
    
    while (!placed && attempts < 100) {
      const horizontal = Math.random() < 0.5;
      const maxX = horizontal ? GRID_SIZE - config.length : GRID_SIZE;
      const maxY = horizontal ? GRID_SIZE : GRID_SIZE - config.length;
      
      const x = Math.floor(Math.random() * maxX);
      const y = Math.floor(Math.random() * maxY);
      
      if (canPlaceShip(ships, x, y, config.length, horizontal)) {
        const ship = new Ship(config.name, config.length, config.color, isPlayer);
        ship.place(x, y, horizontal);
        ships.push(ship);
        placed = true;
      }
      
      attempts++;
    }
  }
  
  return ships;
}

export function canPlaceShip(existingShips, x, y, length, horizontal) {
  // Check bounds
  if (horizontal && x + length > GRID_SIZE) return false;
  if (!horizontal && y + length > GRID_SIZE) return false;
  
  // Check collision with existing ships
  for (let i = 0; i < length; i++) {
    const checkX = horizontal ? x + i : x;
    const checkY = horizontal ? y : y + i;
    
    for (let ship of existingShips) {
      if (ship.occupies(checkX, checkY)) return false;
      
      // Check adjacent cells (ships can't touch)
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (ship.occupies(checkX + dx, checkY + dy)) return false;
        }
      }
    }
  }
  
  return true;
}

export function getShipAtPosition(ships, x, y) {
  for (let ship of ships) {
    if (ship.occupies(x, y)) return ship;
  }
  return null;
}