// mapGenerator.js
import { Territory } from './territory.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function generateMap() {
  // Create a simple but strategic map with 12 territories
  const territories = [
    // Top row
    new Territory(0, "North A", 100, 80, [1, 3, 4]),
    new Territory(1, "North B", 250, 80, [0, 2, 4, 5]),
    new Territory(2, "North C", 400, 80, [1, 5, 6]),
    new Territory(3, "North D", 500, 80, [0, 4, 7]),
    
    // Middle row
    new Territory(4, "Mid A", 150, 200, [0, 1, 3, 7, 8]),
    new Territory(5, "Mid B", 300, 200, [1, 2, 6, 8, 9]),
    new Territory(6, "Mid C", 450, 200, [2, 3, 7, 9, 10]),
    new Territory(7, "Mid D", 550, 200, [3, 4, 6, 10, 11]),
    
    // Bottom row
    new Territory(8, "South A", 100, 320, [4, 5, 9]),
    new Territory(9, "South B", 250, 320, [5, 6, 8, 10]),
    new Territory(10, "South C", 400, 320, [6, 7, 9, 11]),
    new Territory(11, "South D", 500, 320, [7, 10])
  ];
  
  return territories;
}

export function initializeTerritories(territories, players, p) {
  // Distribute territories alternately between players
  territories.forEach((territory, index) => {
    territory.owner = players[index % 2];
    territory.armies = 3; // Start with 3 armies per territory
  });
  
  return territories;
}