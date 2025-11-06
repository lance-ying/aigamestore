// locations.js - Worker placement locations

import { RESOURCE_BERRY, RESOURCE_TWIG, RESOURCE_RESIN, RESOURCE_PEBBLE } from './globals.js';

export class Location {
  constructor(name, reward, slots = 1) {
    this.name = name;
    this.reward = reward; // {BERRY: 2} or {TWIG: 1, BERRY: 1}
    this.slots = slots; // How many workers can be placed here
    this.workers = []; // Workers currently placed
  }
  
  canPlaceWorker() {
    return this.workers.length < this.slots;
  }
  
  placeWorker(worker) {
    this.workers.push(worker);
  }
  
  removeAllWorkers() {
    this.workers = [];
  }
}

export function createLocations() {
  return [
    new Location("Berry Field", {[RESOURCE_BERRY]: 2}, 1),
    new Location("Twig Grove", {[RESOURCE_TWIG]: 2}, 1),
    new Location("Resin Pit", {[RESOURCE_RESIN]: 1}, 1),
    new Location("Pebble Mine", {[RESOURCE_PEBBLE]: 1}, 1),
    new Location("Forest", {[RESOURCE_TWIG]: 1, [RESOURCE_BERRY]: 1}, 2),
    new Location("Meadow", {[RESOURCE_BERRY]: 1, [RESOURCE_RESIN]: 1}, 2),
    new Location("Quarry", {[RESOURCE_PEBBLE]: 1, [RESOURCE_RESIN]: 1}, 1),
    new Location("Trading Post", {[RESOURCE_BERRY]: 1, [RESOURCE_TWIG]: 1, [RESOURCE_RESIN]: 1}, 1)
  ];
}