// locations.js - Board locations
import { RESOURCE_SPICE, RESOURCE_SOLARI, FACTION_EMPEROR, FACTION_BENE_GESSERIT, FACTION_SPACING_GUILD, FACTION_FREMEN } from './globals.js';

export class Location {
  constructor(name, type, reward, influenceFaction, isCombat, vpReward) {
    this.name = name;
    this.type = type; // "resource", "influence", "combat", "market"
    this.reward = reward;
    this.influenceFaction = influenceFaction;
    this.isCombat = isCombat;
    this.vpReward = vpReward || 0;
    this.occupied = null; // null, "player", or "opponent"
  }
  
  reset() {
    this.occupied = null;
  }
}

export function createLocations() {
  return [
    new Location("Arrakeen", "resource", { type: RESOURCE_SOLARI, value: 2 }, null, false, 0),
    new Location("Carthag", "resource", { type: RESOURCE_SPICE, value: 1 }, null, false, 0),
    new Location("Sietch Tabr", "influence", null, FACTION_FREMEN, false, 0),
    new Location("Imperial Basin", "combat", { type: RESOURCE_SPICE, value: 2 }, FACTION_EMPEROR, true, 2),
    new Location("Hagga Basin", "combat", { type: RESOURCE_SOLARI, value: 3 }, null, true, 1),
    new Location("Great Flat", "combat", { type: RESOURCE_SPICE, value: 1 }, FACTION_FREMEN, true, 1),
    new Location("Guild Heighliner", "influence", null, FACTION_SPACING_GUILD, false, 0),
    new Location("Bene Gesserit Temple", "influence", null, FACTION_BENE_GESSERIT, false, 0),
    new Location("Spice Market", "market", null, null, false, 0)
  ];
}