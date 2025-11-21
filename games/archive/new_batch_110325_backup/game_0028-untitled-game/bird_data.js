// bird_data.js - Bird card definitions

import { FOOD_SEED, FOOD_BERRY, FOOD_FISH, FOOD_RODENT } from './globals.js';
import { HABITAT_FOREST, HABITAT_GRASSLAND, HABITAT_WETLAND } from './globals.js';

export class BirdCard {
  constructor(name, habitat, foodCost, eggCost, points, ability, abilityType) {
    this.name = name;
    this.habitat = habitat;
    this.foodCost = foodCost; // Array of food types needed
    this.eggCost = eggCost; // Number of eggs needed from hand
    this.points = points;
    this.ability = ability; // Description
    this.abilityType = abilityType; // "WHEN_ACTIVATED", "PASSIVE", "GAME_END"
    this.eggs = 0; // Eggs on this bird
    this.maxEggs = 3 + Math.floor(points / 2); // Capacity based on value
  }
}

export function createBirdDeck() {
  const deck = [];
  
  // Forest birds (focus on food generation)
  deck.push(new BirdCard("Robin", HABITAT_FOREST, [], 0, 2, "Gain 1 seed", "WHEN_ACTIVATED"));
  deck.push(new BirdCard("Sparrow", HABITAT_FOREST, [FOOD_SEED], 0, 3, "Gain 1 seed", "WHEN_ACTIVATED"));
  deck.push(new BirdCard("Woodpecker", HABITAT_FOREST, [FOOD_SEED], 0, 4, "Gain 1 berry", "WHEN_ACTIVATED"));
  deck.push(new BirdCard("Owl", HABITAT_FOREST, [FOOD_BERRY, FOOD_RODENT], 0, 5, "Gain 1 rodent", "WHEN_ACTIVATED"));
  deck.push(new BirdCard("Cardinal", HABITAT_FOREST, [FOOD_BERRY], 0, 3, "Gain 1 seed", "WHEN_ACTIVATED"));
  deck.push(new BirdCard("Chickadee", HABITAT_FOREST, [FOOD_SEED], 0, 2, "Gain 1 berry", "WHEN_ACTIVATED"));
  deck.push(new BirdCard("Nuthatch", HABITAT_FOREST, [FOOD_SEED, FOOD_BERRY], 0, 4, "Gain 2 seeds", "WHEN_ACTIVATED"));
  deck.push(new BirdCard("Finch", HABITAT_FOREST, [], 0, 2, "Gain 1 seed", "WHEN_ACTIVATED"));
  
  // Grassland birds (focus on eggs)
  deck.push(new BirdCard("Meadowlark", HABITAT_GRASSLAND, [FOOD_SEED], 0, 3, "Lay 1 egg", "WHEN_ACTIVATED"));
  deck.push(new BirdCard("Quail", HABITAT_GRASSLAND, [FOOD_SEED, FOOD_BERRY], 0, 4, "Lay 1 egg", "WHEN_ACTIVATED"));
  deck.push(new BirdCard("Plover", HABITAT_GRASSLAND, [], 0, 2, "Lay 1 egg", "WHEN_ACTIVATED"));
  deck.push(new BirdCard("Starling", HABITAT_GRASSLAND, [FOOD_SEED], 0, 3, "Lay 1 egg", "WHEN_ACTIVATED"));
  deck.push(new BirdCard("Killdeer", HABITAT_GRASSLAND, [FOOD_BERRY], 0, 4, "Lay 2 eggs", "WHEN_ACTIVATED"));
  deck.push(new BirdCard("Prairie Chicken", HABITAT_GRASSLAND, [FOOD_SEED, FOOD_RODENT], 0, 5, "Lay 1 egg", "WHEN_ACTIVATED"));
  deck.push(new BirdCard("Lark", HABITAT_GRASSLAND, [FOOD_SEED], 0, 2, "Lay 1 egg", "WHEN_ACTIVATED"));
  deck.push(new BirdCard("Grouse", HABITAT_GRASSLAND, [FOOD_BERRY, FOOD_SEED], 0, 4, "Lay 1 egg", "WHEN_ACTIVATED"));
  
  // Wetland birds (focus on card draw)
  deck.push(new BirdCard("Heron", HABITAT_WETLAND, [FOOD_FISH], 0, 4, "Draw 1 card", "WHEN_ACTIVATED"));
  deck.push(new BirdCard("Duck", HABITAT_WETLAND, [FOOD_FISH], 0, 3, "Draw 1 card", "WHEN_ACTIVATED"));
  deck.push(new BirdCard("Crane", HABITAT_WETLAND, [FOOD_FISH, FOOD_BERRY], 0, 5, "Draw 1 card", "WHEN_ACTIVATED"));
  deck.push(new BirdCard("Egret", HABITAT_WETLAND, [FOOD_FISH], 0, 3, "Draw 1 card", "WHEN_ACTIVATED"));
  deck.push(new BirdCard("Pelican", HABITAT_WETLAND, [FOOD_FISH, FOOD_FISH], 0, 6, "Draw 2 cards", "WHEN_ACTIVATED"));
  deck.push(new BirdCard("Sandpiper", HABITAT_WETLAND, [], 0, 2, "Draw 1 card", "WHEN_ACTIVATED"));
  deck.push(new BirdCard("Snipe", HABITAT_WETLAND, [FOOD_FISH], 0, 3, "Draw 1 card", "WHEN_ACTIVATED"));
  deck.push(new BirdCard("Kingfisher", HABITAT_WETLAND, [FOOD_FISH, FOOD_BERRY], 0, 5, "Draw 1 card", "WHEN_ACTIVATED"));
  
  // High value birds
  deck.push(new BirdCard("Eagle", HABITAT_FOREST, [FOOD_RODENT, FOOD_RODENT], 0, 7, "Worth bonus points", "PASSIVE"));
  deck.push(new BirdCard("Raven", HABITAT_FOREST, [FOOD_RODENT, FOOD_BERRY], 0, 6, "Versatile bird", "PASSIVE"));
  deck.push(new BirdCard("Falcon", HABITAT_GRASSLAND, [FOOD_RODENT, FOOD_FISH], 0, 7, "Predator bird", "PASSIVE"));
  deck.push(new BirdCard("Swan", HABITAT_WETLAND, [FOOD_FISH, FOOD_FISH], 0, 8, "Majestic bird", "PASSIVE"));
  
  return deck;
}

export function generateRoundGoals() {
  const goals = [
    { description: "Most birds in Forest", habitat: HABITAT_FOREST },
    { description: "Most birds in Grassland", habitat: HABITAT_GRASSLAND },
    { description: "Most birds in Wetland", habitat: HABITAT_WETLAND },
    { description: "Most eggs laid", type: "EGGS" }
  ];
  
  return goals;
}