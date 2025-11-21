// quest.js - Quest management

import { gameState, QUEST_DEFINITIONS } from './globals.js';

export class Quest {
  constructor(questId) {
    this.id = questId;
    this.data = QUEST_DEFINITIONS[questId];
    this.progress = {};
    
    // Initialize progress tracking
    for (const req in this.data.requirements) {
      this.progress[req] = 0;
    }
  }
  
  updateProgress(type, amount = 1) {
    if (this.progress.hasOwnProperty(type)) {
      this.progress[type] += amount;
    }
  }
  
  isComplete() {
    for (const req in this.data.requirements) {
      if (this.progress[req] < this.data.requirements[req]) {
        return false;
      }
    }
    return true;
  }
  
  getProgressText() {
    const lines = [];
    for (const req in this.data.requirements) {
      const current = this.progress[req];
      const needed = this.data.requirements[req];
      lines.push(`${req}: ${current}/${needed}`);
    }
    return lines.join(", ");
  }
}

export function initializeQuests() {
  // Start with first quest
  const firstQuest = new Quest("FIRST_HARVEST");
  gameState.activeQuests.push(firstQuest);
}

export function updateQuestProgress(type, amount = 1) {
  for (const quest of gameState.activeQuests) {
    quest.updateProgress(type, amount);
  }
}

export function checkCompletedQuests() {
  const completed = [];
  
  for (let i = gameState.activeQuests.length - 1; i >= 0; i--) {
    const quest = gameState.activeQuests[i];
    if (quest.isComplete()) {
      completed.push(quest);
      gameState.activeQuests.splice(i, 1);
      gameState.completedQuests.push(quest.id);
    }
  }
  
  return completed;
}

export function completeQuest(quest) {
  // Award rewards
  if (quest.data.rewards.coins) {
    gameState.coins += quest.data.rewards.coins;
  }
  if (quest.data.rewards.xp) {
    addXP(quest.data.rewards.xp);
  }
  
  // Unlock new content
  for (const unlock of quest.data.unlocks) {
    if (unlock === "CHICKEN" || unlock === "COW") {
      if (!gameState.unlockedAnimals.includes(unlock)) {
        gameState.unlockedAnimals.push(unlock);
      }
    } else if (unlock === "CORN") {
      if (!gameState.unlockedCrops.includes(unlock)) {
        gameState.unlockedCrops.push(unlock);
      }
    } else if (unlock === "BARN" || unlock === "MILL" || unlock === "BAKERY" || unlock === "SAWMILL") {
      if (!gameState.unlockedBuildings.includes(unlock)) {
        gameState.unlockedBuildings.push(unlock);
      }
    } else if (unlock === "FLOUR" || unlock === "BREAD") {
      if (!gameState.unlockedRecipes.includes(unlock)) {
        gameState.unlockedRecipes.push(unlock);
      }
    } else if (unlock === "FOREST_PATH" || unlock === "MOUNTAIN_PASS" || unlock === "GOLD_MINE") {
      if (!gameState.unlockedExpeditions.includes(unlock)) {
        gameState.unlockedExpeditions.push(unlock);
      }
    }
  }
  
  // Trigger next quest
  triggerNextQuest(quest.id);
}

function triggerNextQuest(completedQuestId) {
  const questChain = [
    "FIRST_HARVEST",
    "BUILD_BARN",
    "EXPAND_FARM",
    "BUILD_MILL",
    "CRAFT_FLOUR",
    "BUILD_BAKERY",
    "RESOURCE_GATHERING",
    "BUILD_SAWMILL",
    "PROSPERITY"
  ];
  
  const index = questChain.indexOf(completedQuestId);
  if (index !== -1 && index < questChain.length - 1) {
    const nextQuestId = questChain[index + 1];
    const nextQuest = new Quest(nextQuestId);
    gameState.activeQuests.push(nextQuest);
  }
}

function addXP(amount) {
  gameState.playerXP += amount;
  checkLevelUp();
}

function checkLevelUp() {
  if (gameState.playerXP >= gameState.xpToNextLevel) {
    gameState.playerLevel++;
    gameState.playerXP = 0;
    
    // Calculate next level XP requirement
    const baseXP = 100;
    const multiplier = 1.5;
    gameState.xpToNextLevel = Math.floor(baseXP * Math.pow(multiplier, gameState.playerLevel - 1));
    
    // Award score bonus
    gameState.score += 200;
  }
}