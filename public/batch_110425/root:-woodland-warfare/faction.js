// faction.js - Faction classes and AI
import { FACTIONS, BUILDING_TYPES, gameState } from './globals.js';

export class Faction {
  constructor(name, isPlayer = false) {
    this.name = name;
    this.isPlayer = isPlayer;
    this.victoryPoints = 0;
    this.cards = [];
    this.craftedItems = [];
  }

  addVictoryPoints(points) {
    this.victoryPoints += points;
  }

  hasWon() {
    return this.victoryPoints >= 30;
  }
}

export class MarquiseFaction extends Faction {
  constructor(isPlayer = false) {
    super(FACTIONS.MARQUISE, isPlayer);
    this.sawmills = 0;
    this.workshops = 0;
    this.recruiters = 0;
    this.wood = 0;
  }

  buildBuilding(clearing, buildingType) {
    if (clearing.addBuilding(this.name, buildingType)) {
      if (buildingType === BUILDING_TYPES.WORKSHOP) {
        this.workshops++;
        this.addVictoryPoints(1);
      } else if (buildingType === BUILDING_TYPES.SAWMILL) {
        this.sawmills++;
        this.addVictoryPoints(1);
      } else if (buildingType === BUILDING_TYPES.RECRUITER) {
        this.recruiters++;
        this.addVictoryPoints(1);
      }
      return true;
    }
    return false;
  }

  collectWood() {
    this.wood += this.sawmills;
  }
}

export class AllianceFaction extends Faction {
  constructor(isPlayer = false) {
    super(FACTIONS.ALLIANCE, isPlayer);
    this.sympathyCount = 0;
    this.supporters = 0;
    this.bases = 0;
  }

  spreadSympathy(clearing) {
    if (!clearing.hasSympathy() && this.supporters > 0) {
      clearing.addSympathy();
      this.sympathyCount++;
      this.supporters--;
      this.addVictoryPoints(1);
      return true;
    }
    return false;
  }

  revolt(clearing) {
    if (clearing.hasSympathy() && this.supporters >= 2) {
      clearing.addBuilding(this.name, BUILDING_TYPES.BASE);
      this.bases++;
      this.supporters -= 2;
      clearing.addUnit(this.name, 4);
      this.addVictoryPoints(2);
      return true;
    }
    return false;
  }
}

export class EyrieFaction extends Faction {
  constructor(isPlayer = false) {
    super(FACTIONS.EYRIE, isPlayer);
    this.decree = { recruit: 0, move: 0, battle: 0, build: 0 };
    this.roosts = 0;
  }

  addToDecree(action) {
    this.decree[action]++;
  }

  buildRoost(clearing) {
    if (clearing.addBuilding(this.name, "ROOST")) {
      this.roosts++;
      this.addVictoryPoints(1);
      return true;
    }
    return false;
  }
}

export class VagabondFaction extends Faction {
  constructor(isPlayer = false) {
    super(FACTIONS.VAGABOND, isPlayer);
    this.items = [];
    this.exhaustedItems = [];
    this.relationships = {};
    this.currentClearing = 0;
  }

  addItem(item) {
    this.items.push(item);
  }

  exhaustItem(item) {
    const index = this.items.indexOf(item);
    if (index > -1) {
      this.items.splice(index, 1);
      this.exhaustedItems.push(item);
      return true;
    }
    return false;
  }

  refreshItems() {
    this.items.push(...this.exhaustedItems);
    this.exhaustedItems = [];
  }

  aid(faction) {
    this.relationships[faction] = (this.relationships[faction] || 0) + 1;
    this.addVictoryPoints(1);
  }
}

export function createFactions(playerFaction) {
  const factions = [];
  
  // Player faction
  let player;
  switch (playerFaction) {
    case FACTIONS.MARQUISE:
      player = new MarquiseFaction(true);
      break;
    case FACTIONS.ALLIANCE:
      player = new AllianceFaction(true);
      break;
    case FACTIONS.EYRIE:
      player = new EyrieFaction(true);
      break;
    case FACTIONS.VAGABOND:
      player = new VagabondFaction(true);
      break;
    default:
      player = new MarquiseFaction(true);
  }
  factions.push(player);
  
  // AI factions
  factions.push(new AllianceFaction(false));
  factions.push(new EyrieFaction(false));
  
  return factions;
}

export function executeAITurn(faction, clearings) {
  // Simple AI: move units randomly, build when possible
  const controlledClearings = clearings.filter(c => c.ruler === faction.name);
  
  if (controlledClearings.length === 0) return;
  
  // Try to build
  if (faction instanceof MarquiseFaction) {
    const buildableClearing = controlledClearings.find(c => 
      c.getBuildingCount() < c.slots && c.getUnitCount(faction.name) > 0
    );
    if (buildableClearing && faction.wood >= 1) {
      const buildingType = Math.random() > 0.5 ? BUILDING_TYPES.WORKSHOP : BUILDING_TYPES.SAWMILL;
      faction.buildBuilding(buildableClearing, buildingType);
      faction.wood--;
    }
    faction.collectWood();
  } else if (faction instanceof AllianceFaction) {
    faction.supporters += 1;
    const unsympathizedClearings = clearings.filter(c => !c.hasSympathy());
    if (unsympathizedClearings.length > 0 && faction.supporters > 0) {
      const targetClearing = unsympathizedClearings[Math.floor(Math.random() * unsympathizedClearings.length)];
      faction.spreadSympathy(targetClearing);
    }
  }
  
  // Try to recruit units
  if (controlledClearings.length > 0) {
    const randomClearing = controlledClearings[Math.floor(Math.random() * controlledClearings.length)];
    randomClearing.addUnit(faction.name, 1);
  }
}