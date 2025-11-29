// game_logic.js - Core game logic

import { gameState, GAME_PHASES, GAME_END_THRESHOLD } from './globals.js';
import { drawTrainCard, drawDestinationTickets } from './cards.js';

export function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.currentPlayerIndex = 0;
  gameState.turnPhase = "CHOOSE_ACTION";
  gameState.menuSelection = 0;
  gameState.finalRound = false;
  
  // Deal initial cards to all players
  gameState.players.forEach(player => {
    for (let i = 0; i < 4; i++) {
      const card = drawTrainCard(false, -1, p);
      if (card) player.addCard(card);
    }
    
    // Deal initial destination tickets
    const destinations = drawDestinationTickets(3, p);
    // Keep all initially (in real game, player chooses)
    player.destinationTickets.push(...destinations);
  });
  
  p.logs.game_info.push({
    data: { phase: "GAME_START", players: gameState.players.length },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function nextTurn(p) {
  gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
  gameState.turnPhase = "CHOOSE_ACTION";
  gameState.selectedAction = null;
  gameState.selectedRouteIndex = -1;
  gameState.selectedCardIndices = [];
  gameState.cardsDrawnThisTurn = 0;
  gameState.menuSelection = 0;
  
  // Check if this is the final round
  if (gameState.finalRound && gameState.currentPlayerIndex === gameState.finalRoundStartPlayer) {
    endGame(p);
  }
  
  // Check if current player triggered end condition
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  if (currentPlayer.trainPieces <= GAME_END_THRESHOLD && !gameState.finalRound) {
    gameState.finalRound = true;
    gameState.finalRoundStartPlayer = gameState.currentPlayerIndex;
  }
}

export function claimRoute(routeIndex, p) {
  const route = gameState.routes[routeIndex];
  const player = gameState.players[gameState.currentPlayerIndex];
  
  if (route.claimedBy !== -1) return false;
  if (player.trainPieces < route.length) return false;
  
  // Check if player has required cards
  const requiredColor = route.color === "GRAY" ? findBestColorForRoute(player, route.length) : route.color;
  if (!requiredColor) return false;
  
  if (player.getCardCount(requiredColor) >= route.length) {
    player.removeCards(requiredColor, route.length);
    player.trainPieces -= route.length;
    route.claimedBy = gameState.currentPlayerIndex;
    player.claimedRoutes.push(routeIndex);
    player.score += route.points;
    
    p.logs.game_info.push({
      data: { 
        action: "CLAIM_ROUTE", 
        player: gameState.currentPlayerIndex,
        route: routeIndex,
        points: route.points
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    return true;
  }
  
  return false;
}

function findBestColorForRoute(player, length) {
  for (const cardGroup of player.trainCards) {
    if (cardGroup.count >= length) {
      return cardGroup.color;
    }
  }
  return null;
}

export function endGame(p) {
  // Calculate longest route
  calculateLongestRoutes();
  
  // Calculate destination ticket scores
  gameState.players.forEach((player, index) => {
    player.destinationTickets.forEach(ticket => {
      if (checkDestinationCompleted(ticket, player.claimedRoutes)) {
        player.score += ticket.points;
        ticket.completed = true;
      } else {
        player.score -= ticket.points;
      }
    });
  });
  
  // Award longest route bonus
  if (gameState.longestRoutePlayer !== -1) {
    gameState.players[gameState.longestRoutePlayer].score += 10;
  }
  
  // Determine winner
  let maxScore = -1000;
  let winnerIndex = 0;
  gameState.players.forEach((player, index) => {
    if (player.score > maxScore) {
      maxScore = player.score;
      winnerIndex = index;
    }
  });
  
  gameState.gamePhase = winnerIndex === 0 ? GAME_PHASES.GAME_OVER_WIN : GAME_PHASES.GAME_OVER_LOSE;
  
  p.logs.game_info.push({
    data: { 
      phase: "GAME_END",
      winner: winnerIndex,
      scores: gameState.players.map(p => p.score)
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function calculateLongestRoutes() {
  gameState.players.forEach((player, playerIndex) => {
    const longestPath = findLongestPath(player.claimedRoutes);
    if (longestPath > gameState.longestRouteLength) {
      gameState.longestRouteLength = longestPath;
      gameState.longestRoutePlayer = playerIndex;
    }
  });
}

function findLongestPath(claimedRouteIndices) {
  if (claimedRouteIndices.length === 0) return 0;
  
  // Build adjacency list
  const graph = new Map();
  claimedRouteIndices.forEach(routeIndex => {
    const route = gameState.routes[routeIndex];
    if (!graph.has(route.city1Index)) graph.set(route.city1Index, []);
    if (!graph.has(route.city2Index)) graph.set(route.city2Index, []);
    graph.get(route.city1Index).push({ city: route.city2Index, length: route.length });
    graph.get(route.city2Index).push({ city: route.city1Index, length: route.length });
  });
  
  // DFS from each city to find longest path
  let maxLength = 0;
  for (const startCity of graph.keys()) {
    const visited = new Set();
    const length = dfs(startCity, visited, graph);
    maxLength = Math.max(maxLength, length);
  }
  
  return maxLength;
}

function dfs(city, visited, graph) {
  visited.add(city);
  let maxPath = 0;
  
  const neighbors = graph.get(city) || [];
  for (const neighbor of neighbors) {
    if (!visited.has(neighbor.city)) {
      const pathLength = neighbor.length + dfs(neighbor.city, visited, graph);
      maxPath = Math.max(maxPath, pathLength);
    }
  }
  
  visited.delete(city);
  return maxPath;
}

function checkDestinationCompleted(ticket, claimedRouteIndices) {
  // BFS to check if path exists between two cities
  const visited = new Set();
  const queue = [ticket.city1Index];
  visited.add(ticket.city1Index);
  
  while (queue.length > 0) {
    const current = queue.shift();
    if (current === ticket.city2Index) return true;
    
    // Find adjacent cities through claimed routes
    claimedRouteIndices.forEach(routeIndex => {
      const route = gameState.routes[routeIndex];
      if (route.city1Index === current && !visited.has(route.city2Index)) {
        visited.add(route.city2Index);
        queue.push(route.city2Index);
      } else if (route.city2Index === current && !visited.has(route.city1Index)) {
        visited.add(route.city1Index);
        queue.push(route.city1Index);
      }
    });
  }
  
  return false;
}