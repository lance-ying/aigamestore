// player.js - Player management

export class Player {
  constructor(index, isAI = false) {
    this.index = index;
    this.isAI = isAI;
    this.score = 0;
    this.activeRace = null;
    this.declinedRace = null;
    this.availableTokens = 0;
  }
  
  selectRaceCombo(raceCombo) {
    this.activeRace = {
      race: raceCombo.race,
      ability: raceCombo.ability,
      tokens: raceCombo.race.tokens
    };
    this.availableTokens = raceCombo.race.tokens;
  }
  
  putIntoDecline() {
    if (this.activeRace) {
      this.declinedRace = this.activeRace;
      this.activeRace = null;
      this.availableTokens = 0;
    }
  }
  
  scorePoints(territories) {
    let points = 0;
    
    // Score from active race territories
    territories.forEach(territory => {
      if (territory.owner === this.index && !territory.isDeclined) {
        points += 1 + territory.bonusPoints;
        
        // Ability bonuses
        if (this.activeRace) {
          if (this.activeRace.ability.name === "Wealthy") {
            points += 2;
          }
        }
      }
      
      // Score from declined race (half points)
      if (territory.owner === this.index && territory.isDeclined) {
        points += Math.floor((1 + territory.bonusPoints) / 2);
      }
    });
    
    this.score += points;
    return points;
  }
  
  getTerritories(territories) {
    return territories.filter(t => t.owner === this.index);
  }
  
  getActiveTerritoriesCount(territories) {
    return territories.filter(t => t.owner === this.index && !t.isDeclined).length;
  }
}