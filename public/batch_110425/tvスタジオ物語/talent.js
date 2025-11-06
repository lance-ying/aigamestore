// talent.js - Talent management
import { gameState } from './globals.js';

export class Talent {
  constructor(id, name, talkSkill, performSkill, appealSkill, tier) {
    this.id = id;
    this.name = name;
    this.talkSkill = talkSkill;
    this.performSkill = performSkill;
    this.appealSkill = appealSkill;
    this.tier = tier;
    this.hired = false;
  }
  
  getAverageSkill() {
    return Math.floor((this.talkSkill + this.performSkill + this.appealSkill) / 3);
  }
}

export function generateNewTalent(count, minTier = 1, maxTier = 3) {
  const firstNames = ["Alex", "Blake", "Casey", "Drew", "Ellis", "Finley", "Gray", "Harper", 
                      "Indigo", "Jordan", "Kai", "Lane", "Morgan", "Nova", "Ocean", "Parker"];
  const lastNames = ["Star", "Moon", "Sky", "River", "Stone", "West", "North", "East"];
  
  const newTalent = [];
  const existingIds = gameState.availableTalent.map(t => t.id);
  let nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 0;
  
  for (let i = 0; i < count; i++) {
    const tier = minTier + Math.floor(Math.random() * (maxTier - minTier + 1));
    const baseSkill = 20 + (tier - 1) * 20;
    const variance = 30;
    
    const talent = new Talent(
      nextId++,
      `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
      baseSkill + Math.floor(Math.random() * variance),
      baseSkill + Math.floor(Math.random() * variance),
      baseSkill + Math.floor(Math.random() * variance),
      tier
    );
    
    newTalent.push(talent);
  }
  
  return newTalent;
}

export function addTalentToPool(talent) {
  if (!gameState.availableTalent.find(t => t.id === talent.id)) {
    gameState.availableTalent.push(talent);
  }
}

export function hireTalent(talentId) {
  const talent = gameState.availableTalent.find(t => t.id === talentId);
  if (talent && !talent.hired) {
    talent.hired = true;
    return true;
  }
  return false;
}

export function getTalentSkillForGenre(talent, genre) {
  if (!talent) return 0;
  
  switch (genre) {
    case "talk":
    case "news":
      return talent.talkSkill;
    case "variety":
    case "quiz":
      return talent.performSkill;
    case "drama":
      return talent.appealSkill;
    default:
      return talent.getAverageSkill();
  }
}