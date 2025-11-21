// map.js - Map generation and route management

import { COLORS } from './globals.js';

export function generateMap() {
  // Create a simplified map with cities and routes
  const cities = [
    { name: "Portland", x: 50, y: 80 },
    { name: "Seattle", x: 50, y: 40 },
    { name: "San Francisco", x: 40, y: 180 },
    { name: "Los Angeles", x: 80, y: 240 },
    { name: "Phoenix", x: 150, y: 260 },
    { name: "Denver", x: 250, y: 160 },
    { name: "Salt Lake", x: 170, y: 120 },
    { name: "Chicago", x: 420, y: 120 },
    { name: "New York", x: 540, y: 80 },
    { name: "Miami", x: 500, y: 300 },
    { name: "Dallas", x: 340, y: 240 },
    { name: "Atlanta", x: 440, y: 220 }
  ];
  
  const routes = [
    // West Coast
    { from: 0, to: 1, length: 2, color: COLORS.BLUE },
    { from: 0, to: 2, length: 4, color: COLORS.GREEN },
    { from: 2, to: 3, length: 3, color: COLORS.YELLOW },
    { from: 3, to: 4, length: 3, color: COLORS.RED },
    
    // Mountain region
    { from: 4, to: 5, length: 4, color: COLORS.ORANGE },
    { from: 6, to: 5, length: 3, color: COLORS.BLUE },
    { from: 1, to: 6, length: 4, color: COLORS.GREEN },
    { from: 0, to: 6, length: 4, color: COLORS.RED },
    
    // Central
    { from: 5, to: 7, length: 5, color: COLORS.RED },
    { from: 5, to: 10, length: 4, color: COLORS.YELLOW },
    { from: 10, to: 11, length: 3, color: COLORS.BLUE },
    { from: 10, to: 4, length: 4, color: COLORS.GREEN },
    
    // East
    { from: 7, to: 8, length: 4, color: COLORS.ORANGE },
    { from: 7, to: 11, length: 3, color: COLORS.GREEN },
    { from: 11, to: 9, length: 4, color: COLORS.YELLOW },
    { from: 8, to: 11, length: 5, color: COLORS.BLUE }
  ];
  
  return { cities, routes };
}

export function generateDestinationTickets(cities) {
  // Generate meaningful destination tickets
  const tickets = [
    { from: 1, to: 8, points: 12, completed: false }, // Seattle to New York
    { from: 2, to: 9, points: 11, completed: false }, // San Francisco to Miami
    { from: 0, to: 7, points: 10, completed: false }, // Portland to Chicago
    { from: 3, to: 11, points: 9, completed: false }, // Los Angeles to Atlanta
    { from: 4, to: 8, points: 10, completed: false }, // Phoenix to New York
    { from: 5, to: 9, points: 8, completed: false },  // Denver to Miami
    { from: 6, to: 11, points: 7, completed: false }, // Salt Lake to Atlanta
    { from: 1, to: 3, points: 8, completed: false },  // Seattle to Los Angeles
    { from: 7, to: 9, points: 6, completed: false },  // Chicago to Miami
    { from: 0, to: 5, points: 7, completed: false }   // Portland to Denver
  ];
  
  return tickets;
}

export function checkDestinationTickets(claimedRoutes, routes, tickets) {
  // For each ticket, check if there's a path from 'from' to 'to'
  for (let ticket of tickets) {
    if (ticket.completed) continue;
    
    ticket.completed = hasPath(ticket.from, ticket.to, claimedRoutes, routes);
  }
}

function hasPath(fromCity, toCity, claimedRoutes, routes) {
  // BFS to find path
  const visited = new Set();
  const queue = [fromCity];
  visited.add(fromCity);
  
  while (queue.length > 0) {
    const current = queue.shift();
    
    if (current === toCity) {
      return true;
    }
    
    // Check all claimed routes from current city
    for (let routeIdx of claimedRoutes) {
      const route = routes[routeIdx];
      let neighbor = -1;
      
      if (route.from === current) {
        neighbor = route.to;
      } else if (route.to === current) {
        neighbor = route.from;
      }
      
      if (neighbor !== -1 && !visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  
  return false;
}