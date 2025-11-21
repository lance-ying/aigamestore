// locations.js - Location and hotspot definitions

import { gameState } from './globals.js';

export class Location {
  constructor(id, name, description, bgColor) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.bgColor = bgColor;
    this.hotspots = [];
  }

  addHotspot(hotspot) {
    this.hotspots.push(hotspot);
  }
}

export class Hotspot {
  constructor(x, y, width, height, name, type, data) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.name = name;
    this.type = type; // 'examine', 'item', 'use', 'exit', 'dialogue'
    this.data = data;
    this.examined = false;
    this.collected = false;
    this.solved = false;
  }
}

export function createLocations() {
  const locations = [];

  // Location 0: Paris Street
  const loc0 = new Location(0, "Paris Street", "A quiet Parisian street at dusk", [40, 50, 70]);
  loc0.addHotspot(new Hotspot(50, 200, 100, 80, "Newspaper Stand", "examine", {
    description: "Old newspapers with cryptic headlines about mysterious deaths.",
    clue: "newspaper_clue"
  }));
  loc0.addHotspot(new Hotspot(200, 180, 80, 100, "Strange Symbol", "examine", {
    description: "A Templar cross etched into the wall. Ancient and foreboding.",
    clue: "templar_symbol"
  }));
  loc0.addHotspot(new Hotspot(400, 220, 120, 60, "Briefcase", "item", {
    itemId: "briefcase",
    description: "A locked briefcase. Might contain important documents.",
    requires: null
  }));
  loc0.addHotspot(new Hotspot(500, 50, 80, 80, "To Museum", "exit", {
    targetLocation: 1,
    requires: null
  }));
  locations.push(loc0);

  // Location 1: Museum Entrance
  const loc1 = new Location(1, "Museum Entrance", "Grand entrance to the history museum", [60, 40, 50]);
  loc1.addHotspot(new Hotspot(100, 150, 100, 120, "Security Guard", "dialogue", {
    dialogue: [
      { text: "Need a pass to enter.", response: "guard_refuse" },
      { text: "Ask about the Templars", response: "guard_info", requires: "newspaper_clue" }
    ]
  }));
  loc1.addHotspot(new Hotspot(300, 100, 80, 60, "Display Case", "examine", {
    description: "Medieval artifacts behind glass. One looks like a key.",
    clue: "key_location"
  }));
  loc1.addHotspot(new Hotspot(450, 200, 100, 80, "Old Key", "item", {
    itemId: "old_key",
    description: "An ornate medieval key.",
    requires: "guard_info"
  }));
  loc1.addHotspot(new Hotspot(50, 50, 80, 60, "Back to Street", "exit", {
    targetLocation: 0,
    requires: null
  }));
  loc1.addHotspot(new Hotspot(500, 300, 80, 80, "To Archive", "exit", {
    targetLocation: 2,
    requires: "old_key"
  }));
  locations.push(loc1);

  // Location 2: Museum Archive
  const loc2 = new Location(2, "Museum Archive", "Dusty archive filled with ancient texts", [30, 30, 40]);
  loc2.addHotspot(new Hotspot(150, 180, 120, 100, "Ancient Manuscript", "examine", {
    description: "A manuscript detailing Templar rituals and symbols.",
    clue: "ritual_knowledge"
  }));
  loc2.addHotspot(new Hotspot(350, 150, 80, 80, "Cipher Wheel", "item", {
    itemId: "cipher_wheel",
    description: "A circular device for decoding messages.",
    requires: null
  }));
  loc2.addHotspot(new Hotspot(450, 250, 100, 60, "Locked Door", "use", {
    description: "A door with strange symbols. Needs decoding.",
    solution: ["cipher_wheel", "briefcase"],
    targetLocation: 3
  }));
  loc2.addHotspot(new Hotspot(50, 50, 80, 60, "Back to Entrance", "exit", {
    targetLocation: 1,
    requires: null
  }));
  locations.push(loc2);

  // Location 3: Secret Chamber
  const loc3 = new Location(3, "Secret Chamber", "A hidden Templar meeting room", [50, 20, 20]);
  loc3.addHotspot(new Hotspot(200, 150, 150, 120, "Ancient Altar", "examine", {
    description: "The altar bears inscriptions about the conspiracy.",
    clue: "conspiracy_revealed"
  }));
  loc3.addHotspot(new Hotspot(400, 180, 100, 100, "Hidden Documents", "item", {
    itemId: "documents",
    description: "Papers revealing the full extent of the Templar plot.",
    requires: "ritual_knowledge"
  }));
  loc3.addHotspot(new Hotspot(100, 250, 120, 80, "Final Puzzle", "use", {
    description: "A mechanism that needs the right combination.",
    solution: ["documents", "templar_symbol"],
    winCondition: true
  }));
  locations.push(loc3);

  return locations;
}

export function getAvailableHotspots(location) {
  const hotspots = [];
  for (let i = 0; i < location.hotspots.length; i++) {
    const hotspot = location.hotspots[i];
    if (hotspot.type === 'item' && hotspot.collected) continue;
    if (hotspot.type === 'use' && hotspot.solved) continue;
    
    // Check requirements
    if (hotspot.data.requires) {
      const req = hotspot.data.requires;
      if (typeof req === 'string') {
        if (!gameState.puzzlesSolved.includes(req)) continue;
      }
    }
    
    hotspots.push(i);
  }
  return hotspots;
}