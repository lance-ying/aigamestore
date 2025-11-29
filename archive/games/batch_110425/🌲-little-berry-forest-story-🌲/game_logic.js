// game_logic.js - Core game logic functions

import { gameState, RECIPES, CHARACTER_DEFS, INTERACTION_DISTANCE, DISHES_TO_WIN, GAME_PHASES } from './globals.js';
import { Ingredient, CookingStation } from './entities.js';

export function checkInteractions(p, player) {
  if (!player) return null;
  
  // Check character interactions
  for (let char of gameState.characters) {
    const dist = p.dist(player.x, player.y, char.x, char.y);
    if (dist < INTERACTION_DISTANCE && !char.interacted) {
      return { type: 'character', target: char };
    }
  }
  
  // Check ingredient collection
  for (let ingredient of gameState.ingredients) {
    if (ingredient.collected) continue;
    const dist = p.dist(player.x, player.y, ingredient.x, ingredient.y);
    if (dist < INTERACTION_DISTANCE) {
      return { type: 'ingredient', target: ingredient };
    }
  }
  
  // Check cooking station
  if (gameState.cookingStation) {
    const dist = p.dist(player.x, player.y, gameState.cookingStation.x, gameState.cookingStation.y);
    if (dist < INTERACTION_DISTANCE) {
      return { type: 'cooking_station', target: gameState.cookingStation };
    }
  }
  
  return null;
}

export function interactWithCharacter(character) {
  if (character.interacted) return;
  
  character.interact();
  gameState.interactedCharacters++;
  gameState.score += 100;
  
  // Unlock recipe
  const recipe = RECIPES.find(r => r.unlockedBy === character.id);
  if (recipe && !gameState.unlockedRecipes.includes(recipe.id)) {
    gameState.unlockedRecipes.push(recipe.id);
  }
  
  // Store interaction
  gameState.characterInteractions[character.id] = {
    name: character.name,
    story: character.story,
    timestamp: Date.now()
  };
}

export function collectIngredient(ingredient) {
  if (ingredient.collected) return;
  
  ingredient.collect();
  gameState.inventory[ingredient.type]++;
  gameState.score += 10;
}

export function tryToCook(p) {
  // Try to cook the first available recipe that we can make
  for (let recipeId of gameState.unlockedRecipes) {
    const recipe = RECIPES.find(r => r.id === recipeId);
    if (!recipe) continue;
    
    // Check if already cooked
    if (gameState.cookedDishes.includes(recipeId)) continue;
    
    // Check if we have ingredients
    let canCook = true;
    for (let [item, count] of Object.entries(recipe.ingredients)) {
      if (gameState.inventory[item] < count) {
        canCook = false;
        break;
      }
    }
    
    if (canCook) {
      // Consume ingredients
      for (let [item, count] of Object.entries(recipe.ingredients)) {
        gameState.inventory[item] -= count;
      }
      
      // Add to cooked dishes
      gameState.cookedDishes.push(recipeId);
      gameState.score += 200;
      
      return true;
    }
  }
  
  return false;
}

export function checkWinCondition() {
  const allCharactersMet = gameState.interactedCharacters >= gameState.totalCharacters;
  const enoughDishes = gameState.cookedDishes.length >= DISHES_TO_WIN;
  
  return allCharactersMet && enoughDishes;
}

export function initializeGame(p) {
  // Reset game state
  gameState.score = 0;
  gameState.interactedCharacters = 0;
  gameState.inventory = {
    strawberry: 0,
    blueberry: 0,
    mushroom: 0,
    honey: 0,
    flour: 0
  };
  gameState.unlockedRecipes = [];
  gameState.cookedDishes = [];
  gameState.characterInteractions = {};
  gameState.showCookingMenu = false;
  gameState.miniGameActive = false;
  gameState.entities = [];
  gameState.characters = [];
  gameState.ingredients = [];
  gameState.testingPath = [];
  gameState.testingStep = 0;
  
  // Initialize player
  const Player = window.PlayerClass;
  gameState.player = new Player(300, 200);
  gameState.entities.push(gameState.player);
  
  // Initialize characters
  const Character = window.CharacterClass;
  CHARACTER_DEFS.forEach(def => {
    const char = new Character(def.id, def.name, def.x, def.y, def.color, def.story);
    gameState.characters.push(char);
    gameState.entities.push(char);
  });
  gameState.totalCharacters = gameState.characters.length;
  
  // Initialize cooking station
  gameState.cookingStation = new CookingStation(300, 300);
  gameState.entities.push(gameState.cookingStation);
  
  // Spawn ingredients
  spawnIngredients(p);
}

export function spawnIngredients(p) {
  const ingredientTypes = ["strawberry", "blueberry", "mushroom", "honey", "flour"];
  const positions = [
    {x: 100, y: 100}, {x: 500, y: 100}, {x: 100, y: 350}, {x: 500, y: 350},
    {x: 200, y: 150}, {x: 400, y: 150}, {x: 200, y: 280}, {x: 400, y: 280},
    {x: 150, y: 200}, {x: 450, y: 200}, {x: 250, y: 120}, {x: 350, y: 120},
    {x: 250, y: 330}, {x: 350, y: 330}, {x: 120, y: 250}, {x: 480, y: 250},
    {x: 180, y: 180}, {x: 420, y: 180}, {x: 180, y: 320}, {x: 420, y: 320}
  ];
  
  // Clear existing ingredients
  gameState.ingredients = [];
  
  // Spawn ingredients at fixed positions for reproducibility
  for (let i = 0; i < positions.length; i++) {
    const type = ingredientTypes[i % ingredientTypes.length];
    const pos = positions[i];
    const ingredient = new Ingredient(pos.x, pos.y, type);
    gameState.ingredients.push(ingredient);
    gameState.entities.push(ingredient);
  }
}

export function updateMiniGame(p) {
  if (!gameState.miniGameActive || !gameState.miniGameData) return;
  
  const mgData = gameState.miniGameData;
  
  if (gameState.miniGameType === "berry_catch") {
    // Update timer
    mgData.timeLeft--;
    
    // Move berries down
    mgData.berries.forEach(berry => {
      berry.y += berry.speed;
      
      // Check if caught
      if (berry.y > CANVAS_HEIGHT - 50 && berry.y < CANVAS_HEIGHT - 35) {
        if (Math.abs(berry.x - mgData.basketX) < 30) {
          berry.caught = true;
          mgData.caught++;
        }
      }
    });
    
    // Remove caught or missed berries
    mgData.berries = mgData.berries.filter(b => !b.caught && b.y < CANVAS_HEIGHT);
    
    // Spawn new berries
    if (p.frameCount % 40 === 0 && mgData.berries.length < 5) {
      mgData.berries.push({
        x: p.random(50, CANVAS_WIDTH - 50),
        y: 0,
        speed: p.random(2, 4),
        caught: false
      });
    }
    
    // Check win/lose
    if (mgData.caught >= mgData.target) {
      gameState.miniGameActive = false;
      gameState.score += 150;
    } else if (mgData.timeLeft <= 0) {
      gameState.miniGameActive = false;
    }
  }
}

export function startMiniGame(type) {
  gameState.miniGameActive = true;
  gameState.miniGameType = type;
  
  if (type === "berry_catch") {
    gameState.miniGameData = {
      basketX: 300,
      berries: [],
      caught: 0,
      target: 10,
      timeLeft: 600 // 10 seconds at 60 fps
    };
  }
}