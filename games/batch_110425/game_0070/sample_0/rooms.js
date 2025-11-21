// rooms.js - Room definitions and data

export const rooms = {
  entrance: {
    name: "Castle Entrance",
    description: "A grand stone entrance with towering doors",
    background: { type: "stone", color: [80, 70, 60] },
    hotspots: [
      { id: "door_courtyard", type: "door", x: 300, y: 200, w: 80, h: 120, target: "courtyard", locked: false },
      { id: "torch_left", type: "item", x: 100, y: 150, w: 30, h: 60, item: "torch", collected: false },
      { id: "sign", type: "examine", x: 450, y: 250, w: 50, h: 40, text: "Welcome to Blackthorn Castle" }
    ],
    items: ["torch"]
  },
  
  courtyard: {
    name: "Castle Courtyard",
    description: "An open courtyard with a fountain at the center",
    background: { type: "stone", color: [90, 85, 75] },
    hotspots: [
      { id: "door_entrance", type: "door", x: 100, y: 200, w: 80, h: 120, target: "entrance", locked: false },
      { id: "door_hall", type: "door", x: 500, y: 200, w: 80, h: 120, target: "hall", locked: true, requires: "brass_key" },
      { id: "fountain", type: "examine", x: 300, y: 220, w: 80, h: 80, text: "Ancient fountain with carved symbols" },
      { id: "key_hidden", type: "item", x: 320, y: 280, w: 20, h: 15, item: "brass_key", collected: false, hidden: true, revealPuzzle: "fountain_puzzle" }
    ],
    puzzles: [
      { id: "fountain_puzzle", type: "examine", solved: false }
    ],
    items: ["brass_key"]
  },
  
  hall: {
    name: "Great Hall",
    description: "A vast hall with high ceilings and banners",
    background: { type: "stone", color: [70, 65, 55] },
    hotspots: [
      { id: "door_courtyard", type: "door", x: 50, y: 200, w: 80, h: 120, target: "courtyard", locked: false },
      { id: "door_library", type: "door", x: 300, y: 180, w: 70, h: 100, target: "library", locked: false },
      { id: "door_armory", type: "door", x: 500, y: 200, w: 80, h: 120, target: "armory", locked: true, requires: "iron_key" },
      { id: "banner", type: "examine", x: 400, y: 100, w: 60, h: 80, text: "The Blackthorn family crest" },
      { id: "chest", type: "container", x: 150, y: 280, w: 60, h: 50, locked: true, requires: "small_key", contains: "iron_key" }
    ],
    items: ["iron_key"]
  },
  
  library: {
    name: "Library",
    description: "Shelves of ancient books and scrolls",
    background: { type: "wood", color: [60, 50, 40] },
    hotspots: [
      { id: "door_hall", type: "door", x: 300, y: 200, w: 70, h: 100, target: "hall", locked: false },
      { id: "bookshelf", type: "examine", x: 150, y: 150, w: 100, h: 150, text: "Ancient tomes on castle history" },
      { id: "small_key_item", type: "item", x: 450, y: 200, w: 20, h: 15, item: "small_key", collected: false },
      { id: "scroll", type: "item", x: 200, y: 250, w: 30, h: 20, item: "scroll", collected: false }
    ],
    items: ["small_key", "scroll"]
  },
  
  armory: {
    name: "Armory",
    description: "Weapons and armor line the walls",
    background: { type: "stone", color: [75, 70, 65] },
    hotspots: [
      { id: "door_hall", type: "door", x: 100, y: 200, w: 80, h: 120, target: "hall", locked: false },
      { id: "door_tower", type: "door", x: 500, y: 150, w: 60, h: 100, target: "tower", locked: true, requires: "silver_key" },
      { id: "sword_rack", type: "examine", x: 250, y: 180, w: 80, h: 60, text: "Swords of ancient warriors" },
      { id: "shield", type: "item", x: 400, y: 220, w: 50, h: 50, item: "shield", collected: false },
      { id: "gear_puzzle", type: "puzzle", x: 200, y: 300, w: 60, h: 60, puzzleId: "gear_mechanism", requires: ["gear1", "gear2"] }
    ],
    puzzles: [
      { id: "gear_mechanism", type: "combination", solved: false, rewards: "silver_key" }
    ],
    items: ["shield", "silver_key"]
  },
  
  tower: {
    name: "Tower Room",
    description: "A circular tower room with narrow windows",
    background: { type: "stone", color: [85, 80, 70] },
    hotspots: [
      { id: "door_armory", type: "door", x: 300, y: 250, w: 60, h: 100, target: "armory", locked: false },
      { id: "door_throne", type: "door", x: 400, y: 150, w: 70, h: 110, target: "throne", locked: true, requires: "golden_key" },
      { id: "window", type: "examine", x: 150, y: 120, w: 60, h: 80, text: "View of the castle grounds" },
      { id: "gear1", type: "item", x: 250, y: 300, w: 30, h: 30, item: "gear1", collected: false },
      { id: "gear2", type: "item", x: 450, y: 280, w: 30, h: 30, item: "gear2", collected: false }
    ],
    items: ["gear1", "gear2", "golden_key"]
  },
  
  throne: {
    name: "Throne Room",
    description: "The majestic throne room - heart of the castle",
    background: { type: "royal", color: [60, 50, 70] },
    hotspots: [
      { id: "door_tower", type: "door", x: 100, y: 180, w: 70, h: 110, target: "tower", locked: false },
      { id: "throne", type: "examine", x: 350, y: 200, w: 100, h: 120, text: "The ancient throne of Blackthorn" },
      { id: "final_puzzle", type: "puzzle", x: 300, y: 150, w: 80, h: 80, puzzleId: "throne_secret", requires: ["scroll", "shield"] }
    ],
    puzzles: [
      { id: "throne_secret", type: "combination", solved: false, isWinCondition: true }
    ],
    items: []
  }
};

export function getRoomData(roomId) {
  return rooms[roomId] || rooms.entrance;
}

export function getHotspotById(roomId, hotspotId) {
  const room = getRoomData(roomId);
  return room.hotspots.find(h => h.id === hotspotId);
}