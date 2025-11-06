// board.js - Board setup and route generation

import { City, Route, DestinationTicket } from './entities.js';
import { gameState } from './globals.js';

export function initializeBoard(p) {
  // Create a simplified map with cities
  gameState.cities = [
    new City("Portland", 80, 100),
    new City("Seattle", 100, 60),
    new City("San Francisco", 60, 200),
    new City("Los Angeles", 90, 280),
    new City("Phoenix", 180, 300),
    new City("Denver", 280, 180),
    new City("Salt Lake", 200, 140),
    new City("Chicago", 420, 140),
    new City("New York", 540, 100),
    new City("Miami", 500, 320),
    new City("Dallas", 340, 260),
    new City("Kansas City", 360, 180)
  ];
  
  // Create routes between cities
  gameState.routes = [
    new Route(0, 1, "BLUE", 2),      // Portland-Seattle
    new Route(0, 2, "GREEN", 3),     // Portland-SF
    new Route(2, 3, "YELLOW", 3),    // SF-LA
    new Route(3, 4, "RED", 3),       // LA-Phoenix
    new Route(4, 5, "ORANGE", 4),    // Phoenix-Denver
    new Route(5, 6, "RED", 3),       // Denver-Salt Lake
    new Route(6, 0, "PURPLE", 4),    // Salt Lake-Portland
    new Route(5, 7, "BLUE", 4),      // Denver-Chicago
    new Route(7, 8, "GREEN", 5),     // Chicago-NY
    new Route(8, 9, "YELLOW", 6),    // NY-Miami
    new Route(9, 10, "ORANGE", 4),   // Miami-Dallas
    new Route(10, 11, "PURPLE", 2),  // Dallas-Kansas
    new Route(11, 7, "RED", 2),      // Kansas-Chicago
    new Route(5, 11, "BLUE", 3),     // Denver-Kansas
    new Route(4, 10, "GRAY", 3),     // Phoenix-Dallas
    new Route(6, 2, "GRAY", 4)       // Salt Lake-SF
  ];
  
  // Create destination tickets
  const destinationPairs = [
    [1, 8, 12],  // Seattle-NY
    [2, 9, 10],  // SF-Miami
    [3, 7, 9],   // LA-Chicago
    [0, 5, 8],   // Portland-Denver
    [4, 8, 11],  // Phoenix-NY
    [6, 9, 10],  // Salt Lake-Miami
    [1, 3, 7],   // Seattle-LA
    [7, 9, 8],   // Chicago-Miami
    [0, 8, 13],  // Portland-NY
    [2, 10, 7]   // SF-Dallas
  ];
  
  gameState.destinationDeck = destinationPairs.map(
    ([c1, c2, pts]) => new DestinationTicket(c1, c2, pts)
  );
  
  // Shuffle destination deck
  shuffleArray(gameState.destinationDeck, p);
}

export function shuffleArray(array, p) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(p.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}