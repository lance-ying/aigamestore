// recipe.js - Recipe creation and management

import { gameState } from './globals.js';

let recipeIdCounter = 0;

export function createRecipe(ingredientIds) {
  if (ingredientIds.length === 0) return null;
  
  // Calculate recipe properties
  let totalQuality = 0;
  let totalCost = 0;
  
  for (const id of ingredientIds) {
    const ingredient = gameState.ingredients.find(ing => ing.id === id);
    if (ingredient) {
      totalQuality += ingredient.quality;
      totalCost += ingredient.cost;
    }
  }
  
  const avgQuality = Math.floor(totalQuality / ingredientIds.length);
  const price = Math.floor(totalCost * 2.5);
  
  const recipe = {
    id: `recipe_${recipeIdCounter++}`,
    name: generateRecipeName(ingredientIds),
    ingredients: [...ingredientIds],
    quality: avgQuality,
    price: price,
    cost: totalCost
  };
  
  return recipe;
}

function generateRecipeName(ingredientIds) {
  const names = ingredientIds.map(id => {
    const ingredient = gameState.ingredients.find(ing => ing.id === id);
    return ingredient ? ingredient.name : '';
  });
  
  if (names.length === 1) {
    return names[0];
  } else if (names.length === 2) {
    return `${names[0]} ${names[1]}`;
  } else {
    return `${names[0]} Blend`;
  }
}

export function addRecipe(recipe) {
  if (recipe) {
    gameState.recipes.push(recipe);
    return true;
  }
  return false;
}

export function canAffordRecipe(recipe) {
  return gameState.money >= recipe.cost;
}

export function unlockIngredient(ingredientId) {
  const ingredient = gameState.ingredients.find(ing => ing.id === ingredientId);
  if (ingredient && !ingredient.unlocked && gameState.money >= ingredient.unlockCost) {
    gameState.money -= ingredient.unlockCost;
    ingredient.unlocked = true;
    return true;
  }
  return false;
}