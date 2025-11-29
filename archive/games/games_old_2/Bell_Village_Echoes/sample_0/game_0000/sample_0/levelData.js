// levelData.js - Level configurations and puzzle definitions

export const LEVEL_DATA = {
  1: {
    name: "The Dilapidated Shrine Entrance",
    timeLimit: 600, // 10 minutes in seconds
    scenes: [
      {
        id: "entrance",
        name: "Shrine Entrance",
        connectedScenes: { right: "courtyard" },
        hotspots: [
          { 
            id: "stone_carving", 
            name: "Stone Carving", 
            x: 150, y: 200, w: 80, h: 80,
            type: "examine",
            description: "An ancient stone carving with weathered symbols",
            revealsPuzzle: "symbol_find"
          },
          {
            id: "overgrown_bush",
            name: "Overgrown Bush",
            x: 400, y: 250, w: 60, h: 60,
            type: "item",
            itemId: "rusty_key_fragment_1",
            description: "Dense foliage hides something metallic"
          }
        ]
      },
      {
        id: "courtyard",
        name: "Small Courtyard",
        connectedScenes: { left: "entrance", right: "main_door" },
        hotspots: [
          {
            id: "stone_tablets",
            name: "Three Stone Tablets",
            x: 300, y: 180, w: 200, h: 100,
            type: "puzzle",
            puzzleId: "tablet_order",
            description: "Three movable stone tablets with moon phases"
          },
          {
            id: "wooden_box",
            name: "Small Wooden Box",
            x: 100, y: 300, w: 60, h: 60,
            type: "puzzle",
            puzzleId: "cipher_box",
            requiresState: "tablet_order_solved",
            description: "A locked box with letter inscriptions"
          }
        ]
      },
      {
        id: "main_door",
        name: "Main Door View",
        connectedScenes: { left: "courtyard" },
        hotspots: [
          {
            id: "shrine_door",
            name: "Shrine Door",
            x: 250, y: 150, w: 100, h: 180,
            type: "door",
            requiresItem: "complete_key",
            description: "The main entrance - heavily locked"
          }
        ]
      }
    ],
    puzzles: {
      symbol_find: {
        type: "observation",
        solution: "symbol_found",
        hint: "Look closely at the stone carving's base"
      },
      tablet_order: {
        type: "sequence",
        solution: [2, 0, 1], // New moon, full moon, crescent
        currentOrder: [0, 1, 2],
        hint: "Follow the phases of the moon from rebirth to fullness to waning"
      },
      cipher_box: {
        type: "cipher",
        solution: "MOON",
        currentInput: "",
        hint: "The tablets spell a word - use the first letter of each phase"
      }
    },
    items: {
      rusty_key_fragment_1: { name: "Key Fragment A", description: "Part of an old key" },
      rusty_key_fragment_2: { name: "Key Fragment B", description: "Another key piece" },
      complete_key: { name: "Shrine Key", description: "A reassembled ancient key" }
    },
    winCondition: "shrine_door_opened"
  },
  2: {
    name: "The Inner Sanctum",
    timeLimit: 720, // 12 minutes
    scenes: [
      {
        id: "altar_room",
        name: "Altar Room",
        connectedScenes: { right: "scroll_corner", down: "effigy_wall" },
        hotspots: [
          {
            id: "altar",
            name: "Ancient Altar",
            x: 250, y: 200, w: 100, h: 80,
            type: "examine",
            description: "A dusty altar with strange markings"
          },
          {
            id: "sealed_scroll",
            name: "Sealed Scroll",
            x: 400, y: 150, w: 50, h: 50,
            type: "item_use",
            requiresItem: "purifying_liquid",
            givesItem: "revealed_scroll",
            description: "A scroll sealed with wax"
          }
        ]
      },
      {
        id: "scroll_corner",
        name: "Scroll Corner",
        connectedScenes: { left: "altar_room", down: "cabinet_area" },
        hotspots: [
          {
            id: "dusty_shelf",
            name: "Dusty Shelf",
            x: 150, y: 180, w: 80, h: 100,
            type: "item",
            itemId: "purifying_liquid",
            description: "Old bottles covered in dust"
          },
          {
            id: "scroll_fragment_1",
            name: "Torn Scroll Piece",
            x: 450, y: 250, w: 40, h: 40,
            type: "item",
            itemId: "scroll_fragment_1",
            description: "A piece of ancient parchment"
          }
        ]
      },
      {
        id: "effigy_wall",
        name: "Wall of Effigies",
        connectedScenes: { up: "altar_room", right: "cabinet_area" },
        hotspots: [
          {
            id: "ancient_chest",
            name: "Ancient Chest",
            x: 300, y: 220, w: 120, h: 90,
            type: "puzzle",
            puzzleId: "slider_puzzle",
            description: "A chest with a sliding tile puzzle lock"
          },
          {
            id: "effigy_symbols",
            name: "Effigy Symbols",
            x: 100, y: 150, w: 150, h: 120,
            type: "examine",
            description: "Strange symbols carved into effigies"
          }
        ]
      },
      {
        id: "cabinet_area",
        name: "Cabinet Area",
        connectedScenes: { up: "scroll_corner", left: "effigy_wall" },
        hotspots: [
          {
            id: "symbol_cabinet",
            name: "Symbol Cabinet",
            x: 250, y: 180, w: 100, h: 100,
            type: "puzzle",
            puzzleId: "symbol_match",
            requiresState: "slider_puzzle_solved",
            description: "A cabinet with four symbol slots"
          },
          {
            id: "ritual_tool",
            name: "Ritual Tool",
            x: 450, y: 280, w: 50, h: 50,
            type: "item",
            itemId: "extraction_tool",
            requiresState: "symbol_match_solved",
            description: "An ancient extraction implement"
          }
        ]
      }
    ],
    puzzles: {
      slider_puzzle: {
        type: "slider",
        size: 3,
        solution: [0,1,2,3,4,5,6,7,8],
        currentState: [1,0,2,3,4,5,6,7,8],
        emptyIndex: 1,
        hint: "Slide tiles to form the image of a crescent moon"
      },
      symbol_match: {
        type: "matching",
        symbols: ["sun", "moon", "star", "spiral"],
        solution: [2, 1, 3, 0], // star, moon, spiral, sun
        currentInput: [-1, -1, -1, -1],
        hint: "Match the symbols from the effigy wall - look at their arrangement"
      }
    },
    items: {
      purifying_liquid: { name: "Purifying Liquid", description: "A vial of clear liquid" },
      revealed_scroll: { name: "Revealed Scroll", description: "Ancient text now readable" },
      scroll_fragment_1: { name: "Scroll Fragment 1", description: "Part of a torn scroll" },
      scroll_fragment_2: { name: "Scroll Fragment 2", description: "Another scroll piece" },
      extraction_tool: { name: "Extraction Tool", description: "Tool for delicate work" },
      hidden_key: { name: "Hidden Key", description: "Key extracted from altar" }
    },
    winCondition: "hidden_key_obtained"
  },
  3: {
    name: "The Crypt of Echoes",
    timeLimit: 900, // 15 minutes
    scenes: [
      {
        id: "crypt_entrance",
        name: "Crypt Entrance",
        connectedScenes: { down: "relic_chamber" },
        hotspots: [
          {
            id: "riddle_inscription",
            name: "Cryptic Inscription",
            x: 300, y: 150, w: 200, h: 80,
            type: "puzzle",
            puzzleId: "riddle_puzzle",
            description: "Ancient text poses a riddle"
          },
          {
            id: "weight_scale",
            name: "Ancient Scale",
            x: 100, y: 250, w: 100, h: 80,
            type: "puzzle",
            puzzleId: "weight_balance",
            requiresState: "riddle_puzzle_solved",
            description: "A precise balance scale"
          }
        ]
      },
      {
        id: "relic_chamber",
        name: "Chamber of Relics",
        connectedScenes: { up: "crypt_entrance", right: "mechanism_room" },
        hotspots: [
          {
            id: "scroll_fragment_3",
            name: "Final Scroll Piece",
            x: 150, y: 200, w: 40, h: 40,
            type: "item",
            itemId: "scroll_fragment_3",
            description: "The last piece of the scroll"
          },
          {
            id: "ancestral_relic",
            name: "Ancestral Relic",
            x: 400, y: 180, w: 60, h: 80,
            type: "item",
            itemId: "ritual_relic",
            requiresState: "weight_balance_solved",
            description: "A sacred ceremonial object"
          }
        ]
      },
      {
        id: "mechanism_room",
        name: "Mechanism Room",
        connectedScenes: { left: "relic_chamber", down: "final_chamber" },
        hotspots: [
          {
            id: "lever_mechanism",
            name: "Complex Mechanism",
            x: 300, y: 200, w: 150, h: 120,
            type: "puzzle",
            puzzleId: "lever_sequence",
            description: "A series of levers and gears"
          }
        ]
      },
      {
        id: "final_chamber",
        name: "Final Chamber",
        connectedScenes: { up: "mechanism_room" },
        hotspots: [
          {
            id: "ritual_altar",
            name: "Ritual Altar",
            x: 250, y: 180, w: 100, h: 100,
            type: "puzzle",
            puzzleId: "final_ritual",
            requiresState: "lever_sequence_solved",
            description: "The altar for the final ritual"
          }
        ]
      }
    ],
    puzzles: {
      riddle_puzzle: {
        type: "riddle",
        question: "I am born of shadow, yet bring light. I echo without sound. What am I?",
        solution: "REFLECTION",
        currentInput: "",
        hint: "Think about what you see in water or glass"
      },
      weight_balance: {
        type: "balance",
        requiredWeight: 5,
        slots: [0, 0, 0],
        itemWeights: { ritual_relic: 2, scroll_fragment_3: 1 },
        hint: "Use items from your inventory - some are heavier than others"
      },
      lever_sequence: {
        type: "sequence_timed",
        solution: [0, 2, 1, 3, 0], // Lever indices
        currentSequence: [],
        leverCount: 4,
        hint: "The gears show the order - follow the teeth marks from smallest to largest"
      },
      final_ritual: {
        type: "multi_item",
        requiredItems: ["ritual_relic", "complete_scroll"],
        requiredOrder: ["complete_scroll", "ritual_relic"],
        currentStep: 0,
        hint: "First read the incantation, then place the relic"
      }
    },
    items: {
      scroll_fragment_3: { name: "Scroll Fragment 3", description: "Final scroll piece" },
      ritual_relic: { name: "Ritual Relic", description: "Sacred ceremonial object" },
      complete_scroll: { name: "Complete Scroll", description: "Fully assembled ancient scroll" }
    },
    winCondition: "final_ritual_completed"
  }
};