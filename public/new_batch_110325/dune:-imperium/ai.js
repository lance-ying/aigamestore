// ai.js - AI opponent logic
import { gameState } from './globals.js';

export class AIController {
  constructor(player) {
    this.player = player;
  }
  
  chooseCardAndLocation(p, locations, marketCards) {
    // AI strategy: prioritize combat locations, then resources, then influence
    const availableCards = [];
    for (let i = 0; i < this.player.hand.length; i++) {
      availableCards.push(i);
    }
    
    if (availableCards.length === 0 || this.player.agentsAvailable === 0) {
      return null;
    }
    
    // Score each card-location combination
    let bestScore = -1;
    let bestCard = -1;
    let bestLocation = -1;
    
    for (const cardIdx of availableCards) {
      const card = this.player.hand[cardIdx];
      if (!card.agentEffect) continue;
      
      for (let locIdx = 0; locIdx < locations.length; locIdx++) {
        const loc = locations[locIdx];
        if (loc.occupied) continue;
        
        let score = 0;
        
        // Prefer combat locations
        if (loc.isCombat) score += 10;
        
        // Prefer locations that match card faction
        if (card.faction && loc.influenceFaction === card.faction) score += 5;
        
        // Prefer resource locations
        if (loc.type === "resource") score += 7;
        
        // Prefer influence locations for factions we're behind on
        if (loc.type === "influence" && loc.influenceFaction) {
          const influenceLevel = this.player.influence[loc.influenceFaction];
          if (influenceLevel < 4) score += 6;
        }
        
        // Prefer market if we can afford good cards
        if (loc.type === "market" && this.player.resources.SOLARI >= 4) score += 8;
        
        // Add some randomness
        score += p.random(-2, 2);
        
        if (score > bestScore) {
          bestScore = score;
          bestCard = cardIdx;
          bestLocation = locIdx;
        }
      }
    }
    
    return { cardIndex: bestCard, locationIndex: bestLocation };
  }
  
  chooseMarketCard(p, marketCards) {
    // Choose affordable card with highest combat value
    let bestCard = -1;
    let bestValue = -1;
    
    for (let i = 0; i < marketCards.length; i++) {
      const card = marketCards[i];
      if (this.player.canAffordCard(card)) {
        const value = card.combat * 2 + (card.agentEffect ? 3 : 0) + (card.revealEffect ? 2 : 0);
        if (value > bestValue || (value === bestValue && p.random() > 0.5)) {
          bestValue = value;
          bestCard = i;
        }
      }
    }
    
    return bestCard;
  }
}