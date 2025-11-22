// location_manager.js - Manages location switching and setup

import { gameState } from './globals.js';
import { TownSquare, Manor, Market, Church, Docks } from './location.js';
import { 
  CrimeSceneMarker, Clock, Knife, Documents, Letter, 
  Photograph, BloodStain, FamilyTree 
} from './interactable.js';
import { Mayor, Doctor, Merchant, Butler } from './suspect.js';

let locations = {};

export function initializeLocations() {
  // Create all locations
  locations["TOWN_SQUARE"] = new TownSquare();
  locations["MANOR"] = new Manor();
  locations["MARKET"] = new Market();
  locations["CHURCH"] = new Church();
  locations["DOCKS"] = new Docks();
  
  // Setup Town Square
  const mayor = new Mayor(150, 200);
  locations["TOWN_SQUARE"].addSuspect(mayor);
  
  const crimeScene = new CrimeSceneMarker(450, 180);
  locations["TOWN_SQUARE"].addObject(crimeScene);
  
  // Setup Manor
  const butler = new Butler(500, 200);
  locations["MANOR"].addSuspect(butler);
  
  const clock = new Clock(200, 150);
  const knife = new Knife(400, 180);
  const familyTree = new FamilyTree(500, 250);
  locations["MANOR"].addObject(clock);
  locations["MANOR"].addObject(knife);
  locations["MANOR"].addObject(familyTree);
  
  // Setup Market
  const merchant = new Merchant(300, 200);
  locations["MARKET"].addSuspect(merchant);
  
  const documents = new Documents(150, 190);
  const letter = new Letter(450, 190);
  locations["MARKET"].addObject(documents);
  locations["MARKET"].addObject(letter);
  
  // Setup Church
  const doctor = new Doctor(300, 200);
  locations["CHURCH"].addSuspect(doctor);
  
  const photo = new Photograph(180, 240);
  locations["CHURCH"].addObject(photo);
  
  // Setup Docks
  const bloodStain = new BloodStain(350, 230);
  locations["DOCKS"].addObject(bloodStain);
}

export function getCurrentLocation() {
  return locations[gameState.currentLocation];
}

export function switchLocation(locationId) {
  if (gameState.unlockedLocations.includes(locationId)) {
    gameState.currentLocation = locationId;
    return true;
  }
  return false;
}

export function getLocationsList() {
  return gameState.unlockedLocations.map(id => ({
    id,
    name: locations[id].name,
    locked: false
  }));
}

export function getAllLocations() {
  return locations;
}