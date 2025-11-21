// game_data.js - Initialize game data (map, routes, cards)

import { City, Route, DestinationTicket } from './entities.js';
import { TRAIN_COLORS, WILD_COLOR } from './globals.js';

export function createCities() {
  return [
    new City("Vancouver", 50, 80),
    new City("Seattle", 80, 120),
    new City("Portland", 90, 160),
    new City("San Francisco", 70, 240),
    new City("Los Angeles", 100, 300),
    new City("Calgary", 150, 60),
    new City("Helena", 180, 120),
    new City("Salt Lake", 170, 200),
    new City("Denver", 240, 220),
    new City("Phoenix", 180, 300),
    new City("El Paso", 240, 320),
    new City("Winnipeg", 280, 60),
    new City("Duluth", 330, 100),
    new City("Omaha", 320, 180),
    new City("Kansas City", 350, 220),
    new City("Oklahoma", 350, 280),
    new City("Dallas", 360, 320),
    new City("Chicago", 400, 160),
    new City("St Louis", 400, 220),
    new City("Nashville", 430, 240),
    new City("Atlanta", 460, 280),
    new City("Miami", 500, 350),
    new City("Toronto", 470, 120),
    new City("Pittsburgh", 480, 180),
    new City("Washington", 520, 210),
    new City("New York", 540, 160),
    new City("Boston", 560, 120)
  ];
}

export function createRoutes(cities) {
  const routes = [];
  
  // Helper to find city by name
  const findCity = (name) => cities.find(c => c.name === name);
  
  // Define routes with connections
  const routeData = [
    ["Vancouver", "Seattle", "GRAY", 1],
    ["Vancouver", "Calgary", "GRAY", 3],
    ["Seattle", "Portland", "GRAY", 1],
    ["Seattle", "Calgary", "GRAY", 4],
    ["Portland", "San Francisco", "GREEN", 5],
    ["Portland", "Salt Lake", "BLUE", 6],
    ["San Francisco", "Los Angeles", "YELLOW", 3],
    ["San Francisco", "Salt Lake", "ORANGE", 5],
    ["Los Angeles", "Phoenix", "GRAY", 3],
    ["Los Angeles", "El Paso", "BLACK", 6],
    ["Calgary", "Helena", "GRAY", 4],
    ["Calgary", "Winnipeg", "WHITE", 6],
    ["Helena", "Salt Lake", "PURPLE", 3],
    ["Helena", "Duluth", "ORANGE", 6],
    ["Salt Lake", "Denver", "RED", 3],
    ["Salt Lake", "Denver", "YELLOW", 3],
    ["Denver", "Phoenix", "WHITE", 5],
    ["Denver", "Omaha", "PURPLE", 4],
    ["Denver", "Kansas City", "BLACK", 4],
    ["Denver", "Oklahoma", "RED", 4],
    ["Phoenix", "El Paso", "GRAY", 3],
    ["Phoenix", "Oklahoma", "GRAY", 5],
    ["El Paso", "Dallas", "RED", 4],
    ["El Paso", "Oklahoma", "YELLOW", 5],
    ["Winnipeg", "Duluth", "BLACK", 4],
    ["Duluth", "Omaha", "GRAY", 2],
    ["Duluth", "Chicago", "RED", 3],
    ["Omaha", "Kansas City", "GRAY", 1],
    ["Omaha", "Chicago", "BLUE", 4],
    ["Kansas City", "Oklahoma", "GRAY", 2],
    ["Kansas City", "St Louis", "PURPLE", 2],
    ["Oklahoma", "Dallas", "GRAY", 2],
    ["Oklahoma", "Nashville", "GRAY", 4],
    ["Dallas", "Nashville", "GRAY", 5],
    ["Chicago", "St Louis", "GREEN", 2],
    ["Chicago", "Pittsburgh", "ORANGE", 3],
    ["St Louis", "Nashville", "GRAY", 2],
    ["St Louis", "Pittsburgh", "GREEN", 5],
    ["Nashville", "Atlanta", "GRAY", 1],
    ["Nashville", "Pittsburgh", "YELLOW", 4],
    ["Atlanta", "Miami", "BLUE", 5],
    ["Atlanta", "Washington", "GRAY", 4],
    ["Toronto", "Duluth", "PURPLE", 6],
    ["Toronto", "Chicago", "WHITE", 4],
    ["Toronto", "Pittsburgh", "GRAY", 2],
    ["Pittsburgh", "Washington", "GRAY", 2],
    ["Pittsburgh", "New York", "WHITE", 2],
    ["Washington", "New York", "ORANGE", 2],
    ["Washington", "Miami", "GRAY", 6],
    ["New York", "Boston", "YELLOW", 2]
  ];
  
  routeData.forEach(([c1Name, c2Name, color, length]) => {
    const c1 = findCity(c1Name);
    const c2 = findCity(c2Name);
    if (c1 && c2) {
      routes.push(new Route(c1Name, c2Name, color, length, c1.x, c1.y, c2.x, c2.y));
    }
  });
  
  return routes;
}

export function createTrainCardDeck() {
  const deck = [];
  
  // 12 cards of each color
  TRAIN_COLORS.forEach(color => {
    for (let i = 0; i < 12; i++) {
      deck.push(color);
    }
  });
  
  // 14 wild cards
  for (let i = 0; i < 14; i++) {
    deck.push(WILD_COLOR);
  }
  
  return deck;
}

export function createDestinationTickets() {
  return [
    new DestinationTicket("Vancouver", "Montreal", 20),
    new DestinationTicket("Seattle", "New York", 22),
    new DestinationTicket("Portland", "Nashville", 17),
    new DestinationTicket("San Francisco", "Atlanta", 17),
    new DestinationTicket("Los Angeles", "Miami", 20),
    new DestinationTicket("Los Angeles", "Chicago", 16),
    new DestinationTicket("Calgary", "Phoenix", 13),
    new DestinationTicket("Calgary", "Salt Lake", 7),
    new DestinationTicket("Helena", "Los Angeles", 8),
    new DestinationTicket("Denver", "Pittsburgh", 11),
    new DestinationTicket("Denver", "El Paso", 4),
    new DestinationTicket("Winnipeg", "Houston", 12),
    new DestinationTicket("Duluth", "Houston", 8),
    new DestinationTicket("Omaha", "Duluth", 5),
    new DestinationTicket("Kansas City", "Houston", 5),
    new DestinationTicket("Chicago", "New Orleans", 7),
    new DestinationTicket("Chicago", "Santa Fe", 9),
    new DestinationTicket("St Louis", "Nashville", 4),
    new DestinationTicket("Nashville", "Atlanta", 3),
    new DestinationTicket("Toronto", "Miami", 10),
    new DestinationTicket("Boston", "Miami", 12),
    new DestinationTicket("New York", "Atlanta", 6)
  ];
}