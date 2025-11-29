// room_data.js - Room and puzzle definitions

export const ROOM_DEFINITIONS = [
  {
    id: 0,
    name: "Entrance Hall",
    description: "A dusty entrance hall with stone walls",
    puzzles: [0, 1],
    hotspots: [
      { id: 0, name: "Old Door", x: 500, y: 200, type: "door", locked: true, requires: "rusty_key", leadsTo: 1 },
      { id: 1, name: "Painting", x: 150, y: 150, type: "examine", clue: "Behind the frame: 4 symbols" },
      { id: 2, name: "Vase", x: 100, y: 300, type: "item", item: "rusty_key" },
      { id: 3, name: "Torch", x: 50, y: 100, type: "examine", clue: "Flickering flame" }
    ]
  },
  {
    id: 1,
    name: "Library",
    description: "Shelves of ancient books line the walls",
    puzzles: [2, 3],
    hotspots: [
      { id: 0, name: "Bookshelf", x: 200, y: 200, type: "puzzle", puzzleId: 2 },
      { id: 1, name: "Desk", x: 400, y: 250, type: "item", item: "torn_page" },
      { id: 2, name: "Window", x: 500, y: 150, type: "examine", clue: "Moonlight streams through" },
      { id: 3, name: "Secret Door", x: 150, y: 350, type: "door", locked: true, requires: "book_code", leadsTo: 2 }
    ]
  },
  {
    id: 2,
    name: "Alchemist Lab",
    description: "Bubbling potions and strange apparatus",
    puzzles: [4, 5, 6],
    hotspots: [
      { id: 0, name: "Cauldron", x: 300, y: 250, type: "combine", requires: ["red_vial", "blue_vial"], gives: "purple_potion" },
      { id: 1, name: "Shelf", x: 150, y: 150, type: "item", item: "red_vial" },
      { id: 2, name: "Cabinet", x: 450, y: 200, type: "item", item: "blue_vial" },
      { id: 3, name: "Locked Chest", x: 500, y: 300, type: "door", locked: true, requires: "purple_potion", leadsTo: 3 }
    ]
  },
  {
    id: 3,
    name: "Armory",
    description: "Weapons and armor from ages past",
    puzzles: [7, 8],
    hotspots: [
      { id: 0, name: "Suit of Armor", x: 200, y: 200, type: "puzzle", puzzleId: 7 },
      { id: 1, name: "Weapon Rack", x: 400, y: 220, type: "item", item: "ancient_sword" },
      { id: 2, name: "Shield", x: 100, y: 280, type: "examine", clue: "Crest shows a griffin" },
      { id: 3, name: "Iron Gate", x: 500, y: 200, type: "door", locked: true, requires: "ancient_sword", leadsTo: 4 }
    ]
  },
  {
    id: 4,
    name: "Courtyard",
    description: "Open air with overgrown garden",
    puzzles: [9, 10, 11],
    hotspots: [
      { id: 0, name: "Fountain", x: 300, y: 250, type: "puzzle", puzzleId: 9 },
      { id: 1, name: "Garden Statue", x: 150, y: 200, type: "item", item: "crystal" },
      { id: 2, name: "Well", x: 450, y: 280, type: "examine", clue: "Dark depths below" },
      { id: 3, name: "Tower Door", x: 500, y: 150, type: "door", locked: true, requires: "crystal", leadsTo: 5 }
    ]
  },
  {
    id: 5,
    name: "Tower Stairs",
    description: "Spiral staircase ascending into darkness",
    puzzles: [12, 13],
    hotspots: [
      { id: 0, name: "Wall Sconce", x: 150, y: 150, type: "item", item: "torch_light" },
      { id: 1, name: "Inscription", x: 300, y: 200, type: "examine", clue: "Only light reveals truth" },
      { id: 2, name: "Dark Passage", x: 450, y: 250, type: "door", locked: true, requires: "torch_light", leadsTo: 6 }
    ]
  },
  {
    id: 6,
    name: "Upper Chamber",
    description: "A circular room with mysterious symbols",
    puzzles: [14, 15, 16],
    hotspots: [
      { id: 0, name: "Symbol Circle", x: 300, y: 200, type: "puzzle", puzzleId: 14 },
      { id: 1, name: "Pedestal", x: 200, y: 280, type: "item", item: "golden_key" },
      { id: 2, name: "Tapestry", x: 450, y: 180, type: "examine", clue: "Griffin spreads wings" },
      { id: 3, name: "Grand Door", x: 500, y: 300, type: "door", locked: true, requires: "golden_key", leadsTo: 7 }
    ]
  },
  {
    id: 7,
    name: "Throne Room",
    description: "Majestic hall with an empty throne",
    puzzles: [17, 18, 19],
    hotspots: [
      { id: 0, name: "Throne", x: 300, y: 180, type: "puzzle", puzzleId: 17 },
      { id: 1, name: "Crown", x: 280, y: 120, type: "item", item: "griffin_crown" },
      { id: 2, name: "Banner", x: 150, y: 150, type: "examine", clue: "Royal griffin emblem" },
      { id: 3, name: "Final Exit", x: 500, y: 200, type: "door", locked: true, requires: "griffin_crown", leadsTo: 8 }
    ]
  },
  {
    id: 8,
    name: "Freedom",
    description: "You escaped the haunted castle!",
    puzzles: [],
    hotspots: []
  }
];

export const PUZZLE_SOLUTIONS = {
  2: { type: "book_order", solution: ["red_book", "blue_book", "green_book"], gives: "book_code" },
  7: { type: "armor_pieces", solution: ["helmet", "chestplate", "gauntlets"], gives: "armor_complete" },
  9: { type: "fountain_gems", solution: ["ruby", "emerald", "sapphire"], gives: "fountain_key" },
  14: { type: "symbol_match", solution: ["moon", "star", "sun"], gives: "symbol_power" },
  17: { type: "throne_test", solution: ["courage", "wisdom", "honor"], gives: "throne_blessing" }
};

export const ITEM_DESCRIPTIONS = {
  rusty_key: "An old rusty key",
  torn_page: "A page with cryptic writing",
  red_vial: "A vial of red liquid",
  blue_vial: "A vial of blue liquid",
  purple_potion: "A combined purple potion",
  ancient_sword: "A legendary sword",
  crystal: "A glowing crystal",
  torch_light: "A lit torch",
  golden_key: "An ornate golden key",
  griffin_crown: "The Crown of the Griffin",
  book_code: "Solution to the bookshelf",
  armor_complete: "Complete set of armor"
};