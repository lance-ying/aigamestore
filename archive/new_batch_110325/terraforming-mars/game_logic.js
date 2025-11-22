// game_logic.js - Core game logic

import { gameState, GAME_PHASES, PLAY_PHASES, GLOBAL_TARGETS, INITIAL_VALUES, STANDARD_PROJECTS } from './globals.js';
import { createCardDeck, drawCards } from './cards.js';

let cardDeck = [];

export function initializeGame() {
  gameState.generation = INITIAL_VALUES.GENERATION;
  gameState.mc = INITIAL_VALUES.MC;
  gameState.tr = INITIAL_VALUES.TR;
  gameState.mcProduction = 0;
  gameState.temperature = INITIAL_VALUES.TEMPERATURE;
  gameState.oxygen = INITIAL_VALUES.OXYGEN;
  gameState.oceans = INITIAL_VALUES.OCEANS;
  gameState.hand = [];
  gameState.playedCards = [];
  gameState.selectedCardIndex = -1;
  gameState.menuSelection = 0;
  gameState.actionType = null;
  gameState.cities = 0;
  gameState.forests = 0;
  gameState.milestonesAchieved = [];
  gameState.vp = 0;
  gameState.cardsThisGeneration = 0;
  gameState.maxCardsPerGeneration = 3;
  
  cardDeck = createCardDeck();
  
  // Start research phase
  startResearchPhase();
}

export function startResearchPhase() {
  gameState.playPhase = PLAY_PHASES.RESEARCH;
  gameState.cardsThisGeneration = 0;
  gameState.selectedCardIndex = 0;
  
  // Draw cards for research
  const newCards = drawCards(cardDeck, 4);
  gameState.hand = newCards;
}

export function startActionPhase() {
  gameState.playPhase = PLAY_PHASES.ACTION;
  gameState.actionType = null;
  gameState.menuSelection = 0;
  gameState.selectedCardIndex = 0;
}

export function startProductionPhase() {
  gameState.playPhase = PLAY_PHASES.PRODUCTION;
  
  // Generate resources
  const production = gameState.tr + gameState.mcProduction;
  gameState.mc += production;
}

export function endProduction() {
  gameState.generation++;
  
  // Check win condition
  if (checkWinCondition()) {
    calculateFinalScore();
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
  } else {
    startResearchPhase();
  }
}

export function playCard(cardIndex) {
  if (cardIndex < 0 || cardIndex >= gameState.hand.length) {
    return false;
  }
  
  const card = gameState.hand[cardIndex];
  
  if (gameState.mc < card.cost) {
    return false;
  }
  
  // Pay cost
  gameState.mc -= card.cost;
  
  // Apply effect
  applyCardEffect(card);
  
  // Move card to played
  gameState.playedCards.push(card);
  gameState.hand.splice(cardIndex, 1);
  
  // Reset selection
  gameState.selectedCardIndex = Math.max(0, Math.min(gameState.selectedCardIndex, gameState.hand.length - 1));
  
  return true;
}

function applyCardEffect(card) {
  const effect = card.effect;
  
  if (effect.type === "mcProduction") {
    gameState.mcProduction += effect.value;
  } else if (effect.type === "ocean") {
    for (let i = 0; i < effect.value; i++) {
      placeOcean();
    }
  } else if (effect.type === "forest") {
    for (let i = 0; i < effect.value; i++) {
      placeForest();
    }
  } else if (effect.type === "city") {
    for (let i = 0; i < effect.value; i++) {
      placeCity();
    }
  } else if (effect.type === "temp") {
    increaseTemperature(effect.value);
  } else if (effect.type === "oxygen") {
    increaseOxygen(effect.value);
  } else if (effect.type === "combo") {
    increaseTemperature(effect.value);
    increaseOxygen(effect.value);
  }
  
  // Handle combo effects
  if (effect.temp) {
    increaseTemperature(effect.temp);
  }
  if (effect.forest) {
    placeForest();
  }
  if (effect.city) {
    placeCity();
  }
  if (effect.ocean) {
    for (let i = 0; i < effect.ocean; i++) {
      placeOcean();
    }
  }
}

export function playStandardProject(projectIndex) {
  const projects = ["OCEAN", "FOREST", "CITY", "TEMP", "OXYGEN"];
  const projectKey = projects[projectIndex];
  const project = STANDARD_PROJECTS[projectKey];
  
  if (gameState.mc < project.cost) {
    return false;
  }
  
  gameState.mc -= project.cost;
  
  if (project.type === "ocean") {
    placeOcean();
  } else if (project.type === "forest") {
    placeForest();
  } else if (project.type === "city") {
    placeCity();
  } else if (project.type === "temp") {
    increaseTemperature(2);
  } else if (project.type === "oxygen") {
    increaseOxygen(1);
  }
  
  return true;
}

function placeOcean() {
  if (gameState.oceans < GLOBAL_TARGETS.OCEANS) {
    gameState.oceans++;
    gameState.tr++;
  }
}

function placeForest() {
  gameState.forests++;
  increaseOxygen(1);
}

function placeCity() {
  gameState.cities++;
  checkMilestone("3Cities");
}

function increaseTemperature(amount) {
  const oldTemp = gameState.temperature;
  gameState.temperature = Math.min(GLOBAL_TARGETS.TEMPERATURE, gameState.temperature + amount);
  const increase = gameState.temperature - oldTemp;
  gameState.tr += increase;
}

function increaseOxygen(amount) {
  const oldOxygen = gameState.oxygen;
  gameState.oxygen = Math.min(GLOBAL_TARGETS.OXYGEN, gameState.oxygen + amount);
  const increase = gameState.oxygen - oldOxygen;
  gameState.tr += increase;
}

function checkMilestone(type) {
  if (gameState.milestonesAchieved.includes(type)) {
    return;
  }
  
  if (type === "3Cities" && gameState.cities >= 3) {
    gameState.milestonesAchieved.push(type);
  }
}

export function checkWinCondition() {
  return gameState.temperature >= GLOBAL_TARGETS.TEMPERATURE &&
         gameState.oxygen >= GLOBAL_TARGETS.OXYGEN &&
         gameState.oceans >= GLOBAL_TARGETS.OCEANS;
}

function calculateFinalScore() {
  let vp = 0;
  
  // TR points
  vp += gameState.tr;
  
  // Card VP
  for (const card of gameState.playedCards) {
    vp += card.vp;
  }
  
  // Milestone VP
  vp += gameState.milestonesAchieved.length * 5;
  
  gameState.vp = vp;
  gameState.score = vp;
}

export function handleResearchInput(key) {
  if (key === 'ArrowLeft') {
    gameState.selectedCardIndex = Math.max(0, gameState.selectedCardIndex - 1);
  } else if (key === 'ArrowRight') {
    gameState.selectedCardIndex = Math.min(Math.min(2, gameState.hand.length - 1), gameState.selectedCardIndex + 1);
  } else if (key === ' ') {
    // Keep selected card, remove others
    if (gameState.hand.length > 0 && gameState.selectedCardIndex >= 0 && gameState.selectedCardIndex < gameState.hand.length) {
      const selectedCard = gameState.hand[gameState.selectedCardIndex];
      gameState.hand = [selectedCard];
      gameState.cardsThisGeneration++;
      
      if (gameState.cardsThisGeneration >= gameState.maxCardsPerGeneration || gameState.hand.length === 0) {
        startActionPhase();
      } else {
        // Draw more cards
        const newCards = drawCards(cardDeck, Math.min(3, 4 - gameState.cardsThisGeneration));
        gameState.hand.push(...newCards);
        gameState.selectedCardIndex = 0;
      }
    }
  } else if (key === 'z' || key === 'Z') {
    // Skip card selection
    gameState.hand = [];
    startActionPhase();
  }
}

export function handleActionInput(key) {
  if (!gameState.actionType) {
    handleActionMenuInput(key);
  } else if (gameState.actionType === "card") {
    handleCardSelectionInput(key);
  } else if (gameState.actionType === "standard_project") {
    handleStandardProjectInput(key);
  }
}

function handleActionMenuInput(key) {
  if (key === 'ArrowUp') {
    gameState.menuSelection = Math.max(0, gameState.menuSelection - 1);
  } else if (key === 'ArrowDown') {
    gameState.menuSelection = Math.min(2, gameState.menuSelection + 1);
  } else if (key === ' ') {
    if (gameState.menuSelection === 0 && gameState.hand.length > 0) {
      gameState.actionType = "card";
      gameState.selectedCardIndex = 0;
    } else if (gameState.menuSelection === 1) {
      gameState.actionType = "standard_project";
      gameState.menuSelection = 0;
    } else if (gameState.menuSelection === 2) {
      startProductionPhase();
    }
  }
}

function handleCardSelectionInput(key) {
  const cardsPerRow = 4;
  const totalCards = gameState.hand.length;
  
  if (key === 'ArrowLeft') {
    gameState.selectedCardIndex = Math.max(0, gameState.selectedCardIndex - 1);
  } else if (key === 'ArrowRight') {
    gameState.selectedCardIndex = Math.min(totalCards - 1, gameState.selectedCardIndex + 1);
  } else if (key === 'ArrowUp') {
    gameState.selectedCardIndex = Math.max(0, gameState.selectedCardIndex - cardsPerRow);
  } else if (key === 'ArrowDown') {
    gameState.selectedCardIndex = Math.min(totalCards - 1, gameState.selectedCardIndex + cardsPerRow);
  } else if (key === ' ') {
    if (playCard(gameState.selectedCardIndex)) {
      // Stay in card selection if there are more cards
      if (gameState.hand.length === 0) {
        gameState.actionType = null;
      }
    }
  } else if (key === 'z' || key === 'Z') {
    gameState.actionType = null;
    gameState.menuSelection = 0;
  }
}

function handleStandardProjectInput(key) {
  if (key === 'ArrowUp') {
    gameState.menuSelection = Math.max(0, gameState.menuSelection - 1);
  } else if (key === 'ArrowDown') {
    gameState.menuSelection = Math.min(4, gameState.menuSelection + 1);
  } else if (key === ' ') {
    if (playStandardProject(gameState.menuSelection)) {
      // Stay in standard projects menu
    }
  } else if (key === 'z' || key === 'Z') {
    gameState.actionType = null;
    gameState.menuSelection = 0;
  }
}

export function handleProductionInput(key) {
  if (key === ' ') {
    endProduction();
  }
}