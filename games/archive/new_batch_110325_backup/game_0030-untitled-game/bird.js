// bird.js
import { FOOD_TYPES, HABITATS } from './globals.js';

export class Bird {
  constructor(name, habitat, pointValue, foodCost, eggCapacity, powerType = null) {
    this.name = name;
    this.habitat = habitat;
    this.pointValue = pointValue;
    this.foodCost = foodCost; // Array of food types
    this.eggCapacity = eggCapacity;
    this.eggs = 0;
    this.powerType = powerType; // "WHEN_ACTIVATED", "PASSIVE", "END_ROUND"
    this.powerDescription = this.getPowerDescription();
  }
  
  getPowerDescription() {
    switch(this.powerType) {
      case "GAIN_FOOD":
        return "Gain 1 food";
      case "LAY_EGG":
        return "Lay 1 egg";
      case "DRAW_CARD":
        return "Draw 1 card";
      case "BONUS_POINTS":
        return "+2 points";
      default:
        return "";
    }
  }
  
  addEgg() {
    if (this.eggs < this.eggCapacity) {
      this.eggs++;
      return true;
    }
    return false;
  }
}

export function createBirdDeck() {
  const birds = [];
  
  // Forest birds (seed-focused)
  birds.push(new Bird("Robin", HABITATS.FOREST, 3, [FOOD_TYPES.SEED], 3, "GAIN_FOOD"));
  birds.push(new Bird("Sparrow", HABITATS.FOREST, 2, [FOOD_TYPES.SEED], 4, "LAY_EGG"));
  birds.push(new Bird("Woodpecker", HABITATS.FOREST, 4, [FOOD_TYPES.SEED, FOOD_TYPES.WORM], 2, "BONUS_POINTS"));
  birds.push(new Bird("Owl", HABITATS.FOREST, 5, [FOOD_TYPES.SEED, FOOD_TYPES.BERRY], 3, "DRAW_CARD"));
  birds.push(new Bird("Cardinal", HABITATS.FOREST, 3, [FOOD_TYPES.SEED], 3, "GAIN_FOOD"));
  birds.push(new Bird("Jay", HABITATS.FOREST, 4, [FOOD_TYPES.SEED, FOOD_TYPES.SEED], 2, "LAY_EGG"));
  
  // Grassland birds (worm-focused)
  birds.push(new Bird("Meadowlark", HABITATS.GRASSLAND, 3, [FOOD_TYPES.WORM], 4, "LAY_EGG"));
  birds.push(new Bird("Quail", HABITATS.GRASSLAND, 2, [FOOD_TYPES.WORM], 5, "LAY_EGG"));
  birds.push(new Bird("Hawk", HABITATS.GRASSLAND, 6, [FOOD_TYPES.WORM, FOOD_TYPES.FISH], 2, "BONUS_POINTS"));
  birds.push(new Bird("Crane", HABITATS.GRASSLAND, 4, [FOOD_TYPES.WORM, FOOD_TYPES.SEED], 3, "DRAW_CARD"));
  birds.push(new Bird("Plover", HABITATS.GRASSLAND, 3, [FOOD_TYPES.WORM], 3, "GAIN_FOOD"));
  birds.push(new Bird("Finch", HABITATS.GRASSLAND, 2, [FOOD_TYPES.WORM], 4, "LAY_EGG"));
  
  // Wetland birds (fish-focused)
  birds.push(new Bird("Duck", HABITATS.WETLAND, 3, [FOOD_TYPES.FISH], 3, "DRAW_CARD"));
  birds.push(new Bird("Heron", HABITATS.WETLAND, 5, [FOOD_TYPES.FISH, FOOD_TYPES.FISH], 2, "GAIN_FOOD"));
  birds.push(new Bird("Goose", HABITATS.WETLAND, 4, [FOOD_TYPES.FISH, FOOD_TYPES.BERRY], 4, "LAY_EGG"));
  birds.push(new Bird("Swan", HABITATS.WETLAND, 6, [FOOD_TYPES.FISH, FOOD_TYPES.SEED], 3, "BONUS_POINTS"));
  birds.push(new Bird("Pelican", HABITATS.WETLAND, 5, [FOOD_TYPES.FISH, FOOD_TYPES.FISH], 2, "DRAW_CARD"));
  birds.push(new Bird("Egret", HABITATS.WETLAND, 4, [FOOD_TYPES.FISH], 3, "GAIN_FOOD"));
  
  return birds;
}