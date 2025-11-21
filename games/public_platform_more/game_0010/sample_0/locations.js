// Location and interactable management
import { gameState } from './globals.js';

export class Location {
  constructor(id, name, description, color) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.color = color;
    this.interactables = [];
  }

  addInteractable(interactable) {
    this.interactables.push(interactable);
  }
}

export class Interactable {
  constructor(x, y, name, evidenceId, examined = false) {
    this.x = x;
    this.y = y;
    this.name = name;
    this.evidenceId = evidenceId;
    this.examined = examined;
    this.pulseOffset = Math.random() * Math.PI * 2;
  }

  isNearby(playerX, playerY, threshold = 40) {
    const dx = this.x - playerX;
    const dy = this.y - playerY;
    return Math.sqrt(dx * dx + dy * dy) < threshold;
  }
}

export class Evidence {
  constructor(id, name, description) {
    this.id = id;
    this.name = name;
    this.description = description;
  }
}

export function initializeLocations() {
  const locations = [
    new Location(0, "Beach", "A pristine tropical beach", [240, 220, 150]),
    new Location(1, "Hotel Lobby", "The grand entrance hall", [180, 160, 140]),
    new Location(2, "Restaurant", "The dining area", [200, 180, 160]),
    new Location(3, "Library", "A quiet place to read", [140, 120, 100]),
    new Location(4, "Pool Area", "The resort swimming pool", [150, 200, 220])
  ];

  // Add interactables to locations
  locations[0].addInteractable(new Interactable(150, 200, "Footprints", "footprints"));
  locations[0].addInteractable(new Interactable(400, 180, "Broken Bottle", "bottle"));
  
  locations[1].addInteractable(new Interactable(200, 220, "Guest Book", "guestbook"));
  locations[1].addInteractable(new Interactable(450, 200, "Security Camera", "camera"));
  
  locations[2].addInteractable(new Interactable(180, 210, "Bloody Knife", "knife"));
  locations[2].addInteractable(new Interactable(380, 190, "Poison Bottle", "poison"));
  
  locations[3].addInteractable(new Interactable(220, 200, "Torn Letter", "letter"));
  locations[3].addInteractable(new Interactable(350, 220, "Book on Toxicology", "book"));

  return locations;
}

export const evidenceDatabase = {
  "footprints": new Evidence("footprints", "Footprints", "Size 10 shoe prints in the sand"),
  "bottle": new Evidence("bottle", "Broken Bottle", "Glass bottle broken at the neck"),
  "guestbook": new Evidence("guestbook", "Guest Book", "Shows recent visitor entries"),
  "camera": new Evidence("camera", "Security Footage", "Camera was disabled at 2 AM"),
  "knife": new Evidence("knife", "Bloody Knife", "Kitchen knife with blood stains"),
  "poison": new Evidence("poison", "Poison Bottle", "Empty bottle labeled 'Pesticide'"),
  "letter": new Evidence("letter", "Torn Letter", "Threatening message to victim"),
  "book": new Evidence("book", "Toxicology Book", "Page on poison marked")
};