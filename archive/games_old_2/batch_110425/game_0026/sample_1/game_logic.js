// game_logic.js - Core game logic

import { gameState, ATTRACTION_TYPES, RESEARCH_TREE, MASCOTS, GAME_PHASES, GRID_SIZE } from './globals.js';
import { Attraction } from './attraction.js';
import { Guest } from './guest.js';

export function updateGameLogic(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  gameState.framesSinceStart++;
  gameState.timescale = p.keyIsDown(16) ? 3.0 : 1.0; // Shift for fast forward
  
  // Update attractions
  for (const attraction of gameState.attractions) {
    attraction.update(p, p.frameCount);
    
    // Generate income
    const income = attraction.generateIncome(p, p.frameCount, gameState.incomeMultiplier);
    if (income > 0) {
      gameState.money += income;
      gameState.score += income;
    }
  }
  
  // Spawn guests
  const builtAttractions = gameState.attractions.filter(a => a.isBuilt);
  if (builtAttractions.length > 0 && p.frameCount - gameState.lastGuestSpawnFrame > 180 / gameState.timescale) {
    if (gameState.guests.length < builtAttractions.length * 2 + 5) {
      const target = builtAttractions[Math.floor(Math.random() * builtAttractions.length)];
      const guest = new Guest(p, target);
      gameState.guests.push(guest);
      gameState.lastGuestSpawnFrame = p.frameCount;
    }
  }
  
  // Update guests
  for (let i = gameState.guests.length - 1; i >= 0; i--) {
    gameState.guests[i].update(p, gameState);
    if (gameState.guests[i].isDone()) {
      gameState.guests.splice(i, 1);
    }
  }
  
  // Update day/year
  if (p.frameCount % 1800 === 0) {
    gameState.day++;
    if (gameState.day > 365) {
      gameState.day = 1;
      gameState.year++;
      generateSNSMessage(p);
    }
  }
  
  // Update ranking based on satisfaction and popularity
  const totalMetric = gameState.satisfaction + gameState.popularity / 10;
  if (totalMetric > 150) gameState.ranking = 1;
  else if (totalMetric > 120) gameState.ranking = 2;
  else if (totalMetric > 90) gameState.ranking = 3;
  else if (totalMetric > 70) gameState.ranking = 5;
  else if (totalMetric > 50) gameState.ranking = 7;
  else gameState.ranking = 10;
  
  // Decay satisfaction slowly
  if (p.frameCount % 300 === 0 && gameState.satisfaction > 0) {
    gameState.satisfaction = Math.max(0, gameState.satisfaction - 0.5);
  }
  
  // Check win condition
  if (gameState.ranking === 1 && gameState.satisfaction >= 90 && gameState.popularity >= 200) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    logGameInfo(p, { phase: "GAME_OVER_WIN", score: gameState.score });
  }
  
  // Check lose condition (optional - satisfaction too low for too long)
  if (gameState.satisfaction < 10 && gameState.attractions.length > 5 && gameState.year > 2) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    logGameInfo(p, { phase: "GAME_OVER_LOSE", score: gameState.score });
  }
}

export function placeAttraction(p, attractionKey, gridX, gridY) {
  const data = ATTRACTION_TYPES[attractionKey];
  
  if (!gameState.unlockedAttractions.includes(attractionKey)) {
    return false;
  }
  
  if (gameState.money < data.cost) {
    return false;
  }
  
  if (!gameState.grid.canPlace(gridX, gridY, data.size)) {
    return false;
  }
  
  const attraction = new Attraction(attractionKey, gridX, gridY, data);
  gameState.grid.placeAttraction(gridX, gridY, data.size, attraction);
  gameState.attractions.push(attraction);
  gameState.money -= data.cost;
  
  return true;
}

export function removeAttraction(p, gridX, gridY) {
  const attraction = gameState.grid.removeAttraction(gridX, gridY);
  if (attraction) {
    const index = gameState.attractions.indexOf(attraction);
    if (index > -1) {
      gameState.attractions.splice(index, 1);
    }
    // Refund 50% of cost
    const data = ATTRACTION_TYPES[attraction.type];
    gameState.money += Math.floor(data.cost * 0.5);
    return true;
  }
  return false;
}

export function purchaseResearch(p, researchId) {
  const research = RESEARCH_TREE.find(r => r.id === researchId);
  if (!research || gameState.researchedItems.includes(researchId)) {
    return false;
  }
  
  if (gameState.money < research.cost) {
    return false;
  }
  
  gameState.money -= research.cost;
  gameState.researchedItems.push(researchId);
  
  if (research.unlocks) {
    gameState.unlockedAttractions.push(research.unlocks);
  }
  
  if (research.incomeBoost) {
    gameState.incomeMultiplier *= research.incomeBoost;
  }
  
  if (research.expandsLand) {
    const expanded = gameState.grid.expandLand(research.expandsLand);
    gameState.availableLandCells += expanded;
  }
  
  if (research.satisfaction) {
    gameState.satisfaction += research.satisfaction;
  }
  
  return true;
}

export function recruitMascot(p, mascotId) {
  const mascot = MASCOTS.find(m => m.id === mascotId);
  if (!mascot || gameState.mascots.some(m => m.id === mascotId)) {
    return false;
  }
  
  if (gameState.money < mascot.cost) {
    return false;
  }
  
  gameState.money -= mascot.cost;
  gameState.mascots.push(mascot);
  gameState.popularity += mascot.popularity;
  
  return true;
}

export function generateSNSMessage(p) {
  const messages = [
    "Amazing rides! 5 stars!",
    "Love the atmosphere here!",
    "Great family fun!",
    "The mascots are so cute!",
    "Best park experience ever!",
    "Could use more variety...",
    "Lines are a bit long.",
    "Amazing themed zones!"
  ];
  
  const msg = messages[Math.floor(Math.random() * messages.length)];
  gameState.snsMessages.push(msg);
  
  if (gameState.snsMessages.length > 10) {
    gameState.snsMessages.shift();
  }
}

function logGameInfo(p, data) {
  p.logs.game_info.push({
    data: data,
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}