// utils.js - Utility functions

import { gameState } from './globals.js';

export function shuffleArray(array, p) {
  // Fisher-Yates shuffle
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(p.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function drawCard(p) {
  if (gameState.trainCards.length === 0) {
    // Reshuffle discard or create new deck if needed
    return null;
  }
  return gameState.trainCards.pop();
}

export function canClaimRoute(route, hand) {
  if (route.claimed) return false;
  if (gameState.trainsRemaining < route.length) return false;
  
  const colorNeeded = route.color === 'GRAY' ? null : route.color;
  
  // Count cards by color
  const colorCounts = {};
  hand.forEach(card => {
    colorCounts[card] = (colorCounts[card] || 0) + 1;
  });
  
  const wildCount = colorCounts['RAINBOW'] || 0;
  
  if (colorNeeded) {
    // Specific color route
    const specificCount = colorCounts[colorNeeded] || 0;
    return (specificCount + wildCount) >= route.length;
  } else {
    // Gray route - can use any single color
    for (let color in colorCounts) {
      if (color !== 'RAINBOW') {
        if (colorCounts[color] + wildCount >= route.length) {
          return true;
        }
      }
    }
    // All wilds
    return wildCount >= route.length;
  }
}

export function claimRoute(route, hand) {
  const colorNeeded = route.color === 'GRAY' ? null : route.color;
  const cardsToRemove = [];
  
  // Find which color to use for gray routes
  let chosenColor = colorNeeded;
  if (!colorNeeded) {
    const colorCounts = {};
    hand.forEach(card => {
      if (card !== 'RAINBOW') {
        colorCounts[card] = (colorCounts[card] || 0) + 1;
      }
    });
    
    // Pick color with most cards
    let maxCount = 0;
    for (let color in colorCounts) {
      if (colorCounts[color] > maxCount) {
        maxCount = colorCounts[color];
        chosenColor = color;
      }
    }
    if (!chosenColor) chosenColor = 'RAINBOW'; // all wilds
  }
  
  // Remove cards from hand
  let needed = route.length;
  for (let i = hand.length - 1; i >= 0 && needed > 0; i--) {
    if (hand[i] === chosenColor) {
      cardsToRemove.push(i);
      needed--;
    }
  }
  
  // Use wilds if needed
  for (let i = hand.length - 1; i >= 0 && needed > 0; i--) {
    if (hand[i] === 'RAINBOW' && !cardsToRemove.includes(i)) {
      cardsToRemove.push(i);
      needed--;
    }
  }
  
  // Remove cards in reverse order
  cardsToRemove.sort((a, b) => b - a);
  cardsToRemove.forEach(index => {
    hand.splice(index, 1);
  });
  
  route.claimed = true;
  route.claimedBy = 'PLAYER';
  gameState.claimedRoutes.push(route);
  gameState.trainsRemaining -= route.length;
  gameState.score += route.getPoints();
  
  return true;
}

export function checkDestinationCompletion(destination, claimedRoutes, cities) {
  // Simple BFS to check if cities are connected
  const graph = {};
  cities.forEach(city => {
    graph[city.name] = [];
  });
  
  claimedRoutes.forEach(route => {
    graph[route.city1].push(route.city2);
    graph[route.city2].push(route.city1);
  });
  
  const visited = new Set();
  const queue = [destination.city1];
  visited.add(destination.city1);
  
  while (queue.length > 0) {
    const current = queue.shift();
    if (current === destination.city2) {
      return true;
    }
    
    const neighbors = graph[current] || [];
    neighbors.forEach(neighbor => {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    });
  }
  
  return false;
}

export function calculateLongestPath(claimedRoutes, cities) {
  if (claimedRoutes.length === 0) return 0;
  
  // Build adjacency list
  const graph = {};
  cities.forEach(city => {
    graph[city.name] = [];
  });
  
  claimedRoutes.forEach(route => {
    graph[route.city1].push({city: route.city2, length: route.length});
    graph[route.city2].push({city: route.city1, length: route.length});
  });
  
  // DFS from each city to find longest path
  let maxLength = 0;
  
  function dfs(city, visited, length) {
    maxLength = Math.max(maxLength, length);
    
    const neighbors = graph[city] || [];
    neighbors.forEach(neighbor => {
      const edge = `${city}-${neighbor.city}`;
      const edgeRev = `${neighbor.city}-${city}`;
      if (!visited.has(edge) && !visited.has(edgeRev)) {
        visited.add(edge);
        visited.add(edgeRev);
        dfs(neighbor.city, visited, length + neighbor.length);
        visited.delete(edge);
        visited.delete(edgeRev);
      }
    });
  }
  
  cities.forEach(city => {
    dfs(city.name, new Set(), 0);
  });
  
  return maxLength;
}

export function setMessage(message, duration = 120) {
  gameState.message = message;
  gameState.messageTimer = duration;
}