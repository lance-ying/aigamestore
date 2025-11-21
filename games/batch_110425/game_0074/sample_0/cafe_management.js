// cafe_management.js - Cafe management functions

import { gameState, FURNITURE_TYPES, INGREDIENTS, CAFE_GRID_WIDTH, CAFE_GRID_HEIGHT } from './globals.js';
import { Furniture, Recipe } from './entities.js';

export function canPlaceFurniture(x, y, width, height) {
  if (x < 0 || y < 0 || x + width > CAFE_GRID_WIDTH || y + height > CAFE_GRID_HEIGHT) {
    return false;
  }
  
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      if (gameState.cafeGrid[y + dy][x + dx] !== null) {
        return false;
      }
    }
  }
  
  return true;
}

export function placeFurniture(furnitureType, x, y) {
  if (!canPlaceFurniture(x, y, furnitureType.width, furnitureType.height)) {
    return false;
  }
  
  if (gameState.money < furnitureType.cost) {
    return false;
  }
  
  const furniture = new Furniture(
    furnitureType.name,
    x,
    y,
    furnitureType.width,
    furnitureType.height,
    furnitureType.atmosphere,
    furnitureType.color
  );
  
  // Mark grid cells as occupied
  for (let dy = 0; dy < furnitureType.height; dy++) {
    for (let dx = 0; dx < furnitureType.width; dx++) {
      gameState.cafeGrid[y + dy][x + dx] = furniture;
    }
  }
  
  gameState.furniture.push(furniture);
  gameState.money -= furnitureType.cost;
  gameState.atmosphere += furnitureType.atmosphere;
  
  return true;
}

export function createRecipe(base, additions) {
  // Calculate price based on ingredients
  let price = base.cost;
  let name = base.name;
  
  for (const addition of additions) {
    price += addition.cost;
    name += " " + addition.name;
  }
  
  // Add markup
  price = Math.floor(price * 2.5);
  
  const recipe = new Recipe(name, base, additions, price);
  
  // Check if recipe already exists
  const exists = gameState.menu.some(r => r.name === recipe.name);
  if (!exists) {
    gameState.menu.push(recipe);
    return true;
  }
  
  return false;
}

export function getAvailableIngredients() {
  const availableBases = INGREDIENTS.bases.filter(
    b => b.unlockPopularity <= gameState.popularity
  );
  
  const availableAdditions = INGREDIENTS.additions.filter(
    a => a.unlockPopularity <= gameState.popularity
  );
  
  return { bases: availableBases, additions: availableAdditions };
}

export function getAvailableFurniture() {
  return FURNITURE_TYPES.filter(f => true); // All furniture available from start
}

export function calculateAtmosphere() {
  let total = 0;
  for (const furniture of gameState.furniture) {
    total += furniture.atmosphere;
  }
  gameState.atmosphere = total;
  return total;
}

export function checkWinCondition() {
  return gameState.popularity >= 5000;
}

export function updateCustomerSpawnRate() {
  // Spawn rate increases with atmosphere
  const baseRate = 240;
  const atmosphereBonus = Math.floor(gameState.atmosphere / 10);
  gameState.customerSpawnRate = Math.max(60, baseRate - atmosphereBonus);
}