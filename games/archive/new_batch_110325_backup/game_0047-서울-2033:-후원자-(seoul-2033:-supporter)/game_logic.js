// game_logic.js - Core game logic

import { gameState, GAME_PHASES } from './globals.js';
import { getRandomEvent } from './events.js';
import { checkAchievements } from './achievements.js';
import { addMessage, addStatAnimation } from './ui.js';

export function startGame() {
  // Initialize game state
  gameState.health = 100;
  gameState.stress = 0;
  gameState.money = 50;
  gameState.strength = 5;
  gameState.intelligence = 5;
  gameState.charisma = 5;
  gameState.day = 1;
  gameState.score = 0;
  gameState.eventsCompleted = 0;
  gameState.currentEvent = null;
  gameState.selectedChoiceIndex = 0;
  gameState.eventHistory = [];
  gameState.achievements = [];
  gameState.statChangeAnimations = [];
  gameState.messageQueue = [];
  
  gameState.gamePhase = GAME_PHASES.PLAYING;
  
  // Start first event
  loadNextEvent();
  
  addMessage("Welcome to Seoul 2033. Survive.", 120);
}

export function loadNextEvent() {
  const event = getRandomEvent();
  gameState.currentEvent = event;
  gameState.selectedChoiceIndex = 0;
  
  // Record event in history with current stats
  gameState.eventHistory.push({
    eventId: event.id,
    healthBefore: gameState.health,
    stressBefore: gameState.stress
  });
}

export function selectChoice(choiceIndex) {
  const event = gameState.currentEvent;
  if (!event || choiceIndex >= event.choices.length) return;
  
  const choice = event.choices[choiceIndex];
  if (!choice.canChoose()) {
    addMessage("You don't meet the requirements for this choice.", 60);
    return;
  }
  
  // Store pre-choice stats
  const oldHealth = gameState.health;
  const oldStress = gameState.stress;
  const oldMoney = gameState.money;
  const oldStr = gameState.strength;
  const oldInt = gameState.intelligence;
  const oldCha = gameState.charisma;
  
  // Execute choice effects
  const message = choice.effects(gameState);
  
  // Show stat changes
  if (gameState.health !== oldHealth) {
    const change = gameState.health - oldHealth;
    addStatAnimation("HP", Math.round(change), 150, 50);
  }
  if (gameState.stress !== oldStress) {
    const change = gameState.stress - oldStress;
    addStatAnimation("Stress", Math.round(change), 150, 70);
  }
  if (gameState.money !== oldMoney) {
    const change = gameState.money - oldMoney;
    addStatAnimation("Money", Math.round(change), 250, 50);
  }
  if (gameState.strength !== oldStr) {
    const change = gameState.strength - oldStr;
    addStatAnimation("STR", Math.round(change), 250, 70);
  }
  if (gameState.intelligence !== oldInt) {
    const change = gameState.intelligence - oldInt;
    addStatAnimation("INT", Math.round(change), 250, 90);
  }
  if (gameState.charisma !== oldCha) {
    const change = gameState.charisma - oldCha;
    addStatAnimation("CHA", Math.round(change), 250, 110);
  }
  
  // Clamp stats
  gameState.health = Math.max(0, Math.min(gameState.maxHealth, gameState.health));
  gameState.stress = Math.max(0, Math.min(gameState.maxStress, gameState.stress));
  gameState.money = Math.max(0, gameState.money);
  gameState.strength = Math.max(1, gameState.strength);
  gameState.intelligence = Math.max(1, gameState.intelligence);
  gameState.charisma = Math.max(1, gameState.charisma);
  
  // Update score
  gameState.score += 10;
  if (gameState.health > oldHealth) gameState.score += 5;
  if (gameState.stress < oldStress) gameState.score += 5;
  
  // Show message
  addMessage(message, 90);
  
  // Increment events completed
  gameState.eventsCompleted++;
  
  // Check achievements
  const newAchievements = checkAchievements();
  for (let ach of newAchievements) {
    addMessage(`Achievement Unlocked: ${ach.name}`, 120);
    gameState.score += 50;
  }
  
  // Check game over conditions
  if (gameState.health <= 0) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    addMessage("Your health has failed. Game Over.", 180);
    return;
  }
  
  if (gameState.stress >= 100) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    addMessage("The stress was too much. Game Over.", 180);
    return;
  }
  
  // Check win condition (survive 30+ days)
  if (gameState.day >= 30) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    addMessage("You survived a month in Seoul 2033! Victory!", 180);
    return;
  }
  
  // Advance to next day after every 2-3 events
  if (gameState.eventsCompleted % 3 === 0) {
    gameState.day++;
    addMessage(`Day ${gameState.day} begins...`, 90);
  }
  
  // Load next event
  setTimeout(() => {
    loadNextEvent();
  }, 1500);
}

export function navigateChoices(direction) {
  if (!gameState.currentEvent) return;
  
  const numChoices = gameState.currentEvent.choices.length;
  gameState.selectedChoiceIndex = (gameState.selectedChoiceIndex + direction + numChoices) % numChoices;
}