export class Player {
  constructor(id, name, color, isAI = false) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.isAI = isAI;
  }

  getTerritoriesOwned(territories) {
    return territories.filter(t => t.ownerId === this.id);
  }

  getContinentsOwned(territories, continents) {
    const ownedContinents = [];
    for (let continent of continents) {
      const allOwned = continent.territoryIds.every(tid => {
        const territory = territories.find(t => t.id === tid);
        return territory && territory.ownerId === this.id;
      });
      if (allOwned) {
        ownedContinents.push(continent);
      }
    }
    return ownedContinents;
  }

  calculateReinforcements(territories, continents) {
    const territoriesOwned = this.getTerritoriesOwned(territories);
    let reinforcements = Math.max(3, Math.floor(territoriesOwned.length / 3));
    
    const continentsOwned = this.getContinentsOwned(territories, continents);
    for (let continent of continentsOwned) {
      reinforcements += continent.bonusArmies;
    }
    
    return reinforcements;
  }
}