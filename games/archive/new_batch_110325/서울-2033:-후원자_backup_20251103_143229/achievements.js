// achievements.js - Achievement system

import { gameState } from './globals.js';

export class Achievement {
  constructor(id, name, description, condition) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.condition = condition; // Function that checks if achievement is earned
    this.unlocked = false;
  }
}

export const achievements = [
  new Achievement(
    "first_day",
    "First Day",
    "Survive your first day",
    (gs) => gs.day >= 2
  ),
  new Achievement(
    "week_survivor",
    "Week Survivor",
    "Survive 7 days",
    (gs) => gs.day >= 8
  ),
  new Achievement(
    "two_weeks",
    "Two Week Veteran",
    "Survive 14 days",
    (gs) => gs.day >= 15
  ),
  new Achievement(
    "month_survivor",
    "Month Survivor",
    "Survive 30 days",
    (gs) => gs.day >= 31
  ),
  new Achievement(
    "wealthy",
    "Wealthy Survivor",
    "Accumulate 100 money",
    (gs) => gs.money >= 100
  ),
  new Achievement(
    "strong",
    "Physical Prowess",
    "Reach 10 Strength",
    (gs) => gs.strength >= 10
  ),
  new Achievement(
    "smart",
    "Brilliant Mind",
    "Reach 10 Intelligence",
    (gs) => gs.intelligence >= 10
  ),
  new Achievement(
    "charismatic",
    "Natural Leader",
    "Reach 10 Charisma",
    (gs) => gs.charisma >= 10
  ),
  new Achievement(
    "balanced",
    "Jack of All Trades",
    "Have all stats at 8+",
    (gs) => gs.strength >= 8 && gs.intelligence >= 8 && gs.charisma >= 8
  ),
  new Achievement(
    "stressed",
    "Pressure Point",
    "Reach 90 stress and survive",
    (gs) => gs.stress >= 90 && gs.health > 0
  ),
  new Achievement(
    "resilient",
    "Resilient Soul",
    "Recover from critical health (below 20)",
    (gs) => gs.eventsCompleted > 5 && gs.health > 50 && gameState.eventHistory.some(e => e.healthBefore < 20)
  ),
  new Achievement(
    "explorer",
    "Explorer",
    "Complete 20 events",
    (gs) => gs.eventsCompleted >= 20
  ),
  new Achievement(
    "veteran",
    "Veteran Survivor",
    "Complete 50 events",
    (gs) => gs.eventsCompleted >= 50
  )
];

export function checkAchievements() {
  let newAchievements = [];
  
  for (let achievement of achievements) {
    if (!gameState.achievements.includes(achievement.id) && achievement.condition(gameState)) {
      gameState.achievements.push(achievement.id);
      achievement.unlocked = true;
      newAchievements.push(achievement);
    }
  }
  
  return newAchievements;
}