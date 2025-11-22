// player.js
import { CATEGORIES } from './globals.js';

export class Player {
  constructor(name, isAI = false, difficulty = 'medium') {
    this.name = name;
    this.isAI = isAI;
    this.difficulty = difficulty;
    this.scores = {};
    
    // Initialize all categories as null (not used)
    CATEGORIES.forEach(cat => {
      this.scores[cat.id] = null;
    });
    
    this.upperSectionScore = 0;
    this.upperBonus = 0;
    this.lowerSectionScore = 0;
    this.totalScore = 0;
  }
  
  calculateTotalScore() {
    this.upperSectionScore = 0;
    this.lowerSectionScore = 0;
    
    CATEGORIES.forEach(cat => {
      const score = this.scores[cat.id];
      if (score !== null) {
        if (cat.upper) {
          this.upperSectionScore += score;
        } else {
          this.lowerSectionScore += score;
        }
      }
    });
    
    // Bonus if upper section >= 63
    this.upperBonus = this.upperSectionScore >= 63 ? 35 : 0;
    this.totalScore = this.upperSectionScore + this.upperBonus + this.lowerSectionScore;
    
    return this.totalScore;
  }
  
  hasUsedCategory(categoryId) {
    return this.scores[categoryId] !== null;
  }
  
  getAvailableCategories() {
    return CATEGORIES.filter(cat => !this.hasUsedCategory(cat.id));
  }
  
  allCategoriesUsed() {
    return this.getAvailableCategories().length === 0;
  }
}