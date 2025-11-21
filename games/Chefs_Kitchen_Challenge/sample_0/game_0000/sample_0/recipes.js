import { MINIGAME_TYPES } from './globals.js';

export const RECIPES = {
  level1: [
    {
      name: "Simple Salad",
      steps: [
        { type: MINIGAME_TYPES.CHOP, ingredient: "Lettuce", targetCuts: 5, difficulty: 1 },
        { type: MINIGAME_TYPES.MIX, ingredient: "Dressing", targetRotations: 3, difficulty: 1 }
      ]
    },
    {
      name: "Scrambled Eggs",
      steps: [
        { type: MINIGAME_TYPES.MIX, ingredient: "Eggs", targetRotations: 4, difficulty: 1 },
        { type: MINIGAME_TYPES.COOK, ingredient: "Eggs", flipCount: 2, difficulty: 1 },
        { type: MINIGAME_TYPES.MIX, ingredient: "Scramble", targetRotations: 2, difficulty: 1 }
      ]
    }
  ],
  level2: [
    {
      name: "Miso Ramen",
      steps: [
        { type: MINIGAME_TYPES.CHOP, ingredient: "Veggies", targetCuts: 8, difficulty: 2 },
        { type: MINIGAME_TYPES.COOK, ingredient: "Noodles", flipCount: 1, difficulty: 2 },
        { type: MINIGAME_TYPES.MIX, ingredient: "Broth", targetRotations: 5, difficulty: 2 },
        { type: MINIGAME_TYPES.CHOP, ingredient: "Garnish", targetCuts: 4, difficulty: 2 }
      ]
    }
  ],
  level3: [
    {
      name: "Fluffy Pancakes",
      steps: [
        { type: MINIGAME_TYPES.CHOP, ingredient: "Dry Ingredients", targetCuts: 6, difficulty: 3 },
        { type: MINIGAME_TYPES.MIX, ingredient: "Batter", targetRotations: 6, difficulty: 3 },
        { type: MINIGAME_TYPES.COOK, ingredient: "Pancakes", flipCount: 3, difficulty: 3 },
        { type: MINIGAME_TYPES.MIX, ingredient: "Stack", targetRotations: 2, difficulty: 3 },
        { type: MINIGAME_TYPES.CHOP, ingredient: "Toppings", targetCuts: 5, difficulty: 3 }
      ]
    }
  ],
  level4: [
    {
      name: "Sushi Roll",
      steps: [
        { type: MINIGAME_TYPES.MIX, ingredient: "Rice", targetRotations: 7, difficulty: 4 },
        { type: MINIGAME_TYPES.CHOP, ingredient: "Fish", targetCuts: 10, difficulty: 4 },
        { type: MINIGAME_TYPES.CHOP, ingredient: "Veggies", targetCuts: 8, difficulty: 4 },
        { type: MINIGAME_TYPES.MIX, ingredient: "Assembly", targetRotations: 4, difficulty: 4 },
        { type: MINIGAME_TYPES.CHOP, ingredient: "Slice Roll", targetCuts: 12, difficulty: 4 }
      ]
    }
  ],
  level5: [
    {
      name: "Baked Salmon",
      steps: [
        { type: MINIGAME_TYPES.CHOP, ingredient: "Salmon", targetCuts: 6, difficulty: 5 },
        { type: MINIGAME_TYPES.COOK, ingredient: "Salmon", flipCount: 4, difficulty: 5 },
        { type: MINIGAME_TYPES.MIX, ingredient: "Sauce", targetRotations: 5, difficulty: 5 }
      ]
    },
    {
      name: "Roasted Asparagus",
      steps: [
        { type: MINIGAME_TYPES.CHOP, ingredient: "Asparagus", targetCuts: 8, difficulty: 5 },
        { type: MINIGAME_TYPES.COOK, ingredient: "Asparagus", flipCount: 3, difficulty: 5 }
      ]
    },
    {
      name: "Chocolate Lava Cake",
      steps: [
        { type: MINIGAME_TYPES.CHOP, ingredient: "Chocolate", targetCuts: 7, difficulty: 5 },
        { type: MINIGAME_TYPES.MIX, ingredient: "Batter", targetRotations: 8, difficulty: 5 },
        { type: MINIGAME_TYPES.COOK, ingredient: "Cake", flipCount: 2, difficulty: 5 }
      ]
    }
  ]
};