// levels.js - Level data and management
import { gameState, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Door, Item, HidingSpot, ExitZone } from './entities.js';
import { AoOni } from './aooni.js';
import { Player } from './player.js';

export function createLevel1() {
  // Level 1: Tutorial - Super Easy (No enemies!)
  // Scaled to 640x480 canvas
  
  gameState.walls = [
    // Outer walls
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 16 },
    { x: 0, y: 0, w: 16, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 16, y: 0, w: 16, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 16, w: CANVAS_WIDTH, h: 16 },
    
    // One simple obstacle in the middle
    { x: 304, y: 208, w: 32, h: 64 }
  ];

  gameState.doors = [];

  gameState.items = [
    new Item(160, 304, "objective", "obj1_1", true)
  ];

  gameState.requiredItemIds = ["obj1_1"];

  gameState.hidingSpots = [
    new HidingSpot(80, 80, 32, 24, "closet")
  ];

  gameState.exitZone = new ExitZone(480, 360, 80, 56);

  gameState.player = new Player(64, 64);

  gameState.aoOnis = [];
  
  gameState.entities = [gameState.player];
}

export function createLevel2() {
  // Level 2: Introduction to enemies - Easy
  // Scaled to 640x480 canvas
  
  gameState.walls = [
    // Outer walls
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 16 },
    { x: 0, y: 0, w: 16, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 16, y: 0, w: 16, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 16, w: CANVAS_WIDTH, h: 16 },
    
    // Vertical divider
    { x: 304, y: 16, w: 16, h: 208 },
    { x: 304, y: 288, w: 16, h: 176 }
  ];

  gameState.doors = [
    new Door(304, 224, 16, 64, true, "key2_1")
  ];

  gameState.items = [
    new Item(80, 64, "key", "key2_1", false),
    new Item(480, 64, "objective", "obj2_1", true)
  ];

  gameState.requiredItemIds = ["obj2_1"];

  gameState.hidingSpots = [
    new HidingSpot(40, 320, 32, 24, "closet"),
    new HidingSpot(440, 320, 32, 24, "closet")
  ];

  gameState.exitZone = new ExitZone(520, 32, 64, 48);

  gameState.player = new Player(48, 48);

  gameState.aoOnis = [
    new AoOni(480, 360, 0.6, [
      [480, 360],
      [544, 360],
      [544, 304],
      [480, 304]
    ])
  ];
  
  gameState.entities = [gameState.player, ...gameState.aoOnis];
}

export function createLevel3() {
  // Level 3: Basic challenge - Medium-Easy
  // Scaled to 640x480 canvas
  
  gameState.walls = [
    // Outer walls
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 16 },
    { x: 0, y: 0, w: 16, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 16, y: 0, w: 16, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 16, w: CANVAS_WIDTH, h: 16 },
    
    // Two vertical dividers
    { x: 216, y: 16, w: 16, h: 192 },
    { x: 216, y: 288, w: 16, h: 176 },
    { x: 432, y: 16, w: 16, h: 192 },
    { x: 432, y: 288, w: 16, h: 176 }
  ];

  gameState.doors = [
    new Door(216, 208, 16, 80, false)
  ];

  gameState.items = [
    new Item(104, 360, "objective", "obj3_1", true),
    new Item(544, 360, "objective", "obj3_2", true)
  ];

  gameState.requiredItemIds = ["obj3_1", "obj3_2"];

  gameState.hidingSpots = [
    new HidingSpot(40, 64, 32, 24, "closet"),
    new HidingSpot(304, 64, 48, 16, "table"),
    new HidingSpot(520, 64, 32, 24, "closet")
  ];

  gameState.exitZone = new ExitZone(288, 32, 64, 48);

  gameState.player = new Player(48, 360);

  gameState.aoOnis = [
    new AoOni(544, 96, 0.6, [
      [520, 96],
      [576, 96],
      [576, 144],
      [520, 144]
    ], 80)
  ];
  
  gameState.entities = [gameState.player, ...gameState.aoOnis];
}

export function createLevel4() {
  // Level 4: Simple layout with safer item placement
  // Scaled to 640x480 canvas
  
  gameState.walls = [
    // Outer walls
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 16 },
    { x: 0, y: 0, w: 16, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 16, y: 0, w: 16, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 16, w: CANVAS_WIDTH, h: 16 },
    
    // Central vertical wall
    { x: 304, y: 16, w: 16, h: 152 },
    { x: 304, y: 264, w: 16, h: 200 },
    
    // Horizontal walls
    { x: 16, y: 144, w: 176, h: 16 },
    { x: 432, y: 144, w: 192, h: 16 },
    
    // Small barriers
    { x: 104, y: 288, w: 16, h: 96 },
    { x: 488, y: 288, w: 16, h: 96 }
  ];

  gameState.doors = [
    new Door(304, 168, 16, 96, true, "key4_1")
  ];

  gameState.items = [
    new Item(48, 40, "key", "key4_1", false),
    new Item(560, 48, "objective", "obj4_1", true)
  ];

  gameState.requiredItemIds = ["obj4_1"];

  gameState.hidingSpots = [
    new HidingSpot(40, 336, 32, 24, "closet"),
    new HidingSpot(384, 40, 32, 24, "closet")
  ];

  gameState.exitZone = new ExitZone(520, 384, 64, 48);

  gameState.player = new Player(40, 216);

  gameState.aoOnis = [
    new AoOni(416, 360, 1.0, [
      [416, 360],
      [544, 360],
      [544, 240],
      [416, 240]
    ])
  ];
  
  gameState.entities = [gameState.player, ...gameState.aoOnis];
}

export function createLevel5() {
  // Level 5: Two-room layout with careful item placement
  // Monster moved to BOTTOM-LEFT corner, away from exit
  // Scaled to 640x480 canvas
  
  gameState.walls = [
    // Outer walls
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 16 },
    { x: 0, y: 0, w: 16, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 16, y: 0, w: 16, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 16, w: CANVAS_WIDTH, h: 16 },
    
    // Central horizontal wall
    { x: 16, y: 240, w: 272, h: 16 },
    { x: 368, y: 240, w: 256, h: 16 },
    
    // Vertical walls
    { x: 216, y: 16, w: 16, h: 120 },
    { x: 408, y: 336, w: 16, h: 128 },
    
    // Small barriers
    { x: 104, y: 96, w: 16, h: 72 },
    { x: 520, y: 96, w: 16, h: 72 }
  ];

  gameState.doors = [
    new Door(288, 240, 80, 16, false)
  ];

  gameState.items = [
    new Item(48, 48, "objective", "obj5_1", true),
    new Item(560, 408, "objective", "obj5_2", true)
  ];

  gameState.requiredItemIds = ["obj5_1", "obj5_2"];

  gameState.hidingSpots = [
    new HidingSpot(152, 40, 32, 24, "closet"),
    new HidingSpot(328, 384, 48, 16, "table"),
    new HidingSpot(480, 384, 32, 24, "closet")
  ];

  gameState.exitZone = new ExitZone(520, 32, 64, 48);

  gameState.player = new Player(40, 408);

  // Monster moved to BOTTOM-LEFT corner, away from exit in top-right
  gameState.aoOnis = [
    new AoOni(120, 380, 0.9, [
      [120, 380],
      [120, 420],
      [180, 420],
      [180, 380]
    ])
  ];
  
  gameState.entities = [gameState.player, ...gameState.aoOnis];
}

export function createLevel6() {
  // Level 6: Three-room maze with 2 keys and 2 objectives
  // FIXED: key6b moved to accessible middle section
  // Scaled to 640x480 canvas
  
  gameState.walls = [
    // Outer walls
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 16 },
    { x: 0, y: 0, w: 16, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 16, y: 0, w: 16, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 16, w: CANVAS_WIDTH, h: 16 },
    
    // Vertical dividers
    { x: 216, y: 16, w: 16, h: 168 },
    { x: 216, y: 264, w: 16, h: 200 },
    { x: 408, y: 16, w: 16, h: 168 },
    { x: 408, y: 264, w: 16, h: 200 },
    
    // Horizontal barriers
    { x: 16, y: 168, w: 104, h: 16 },
    { x: 328, y: 168, w: 64, h: 16 },
    { x: 496, y: 168, w: 112, h: 16 }
  ];

  gameState.doors = [
    new Door(216, 184, 16, 80, true, "key6a"),
    new Door(408, 184, 16, 80, true, "key6b")
  ];

  gameState.items = [
    new Item(48, 48, "key", "key6a", false),
    // FIXED: key6b moved to middle section (accessible after unlocking first door)
    new Item(328, 336, "key", "key6b", false),
    new Item(304, 336, "objective", "obj6_1", true),
    new Item(496, 48, "objective", "obj6_2", true)
  ];

  gameState.requiredItemIds = ["obj6_1", "obj6_2"];

  gameState.hidingSpots = [
    new HidingSpot(40, 336, 32, 24, "closet"),
    new HidingSpot(272, 40, 48, 16, "table"),
    new HidingSpot(544, 216, 32, 24, "closet")
  ];

  gameState.exitZone = new ExitZone(288, 384, 64, 48);

  gameState.player = new Player(40, 408);

  gameState.aoOnis = [
    new AoOni(104, 304, 1.2, [
      [104, 304],
      [104, 120],
      [176, 120],
      [176, 304]
    ]),
    new AoOni(520, 304, 1.2, [
      [520, 304],
      [560, 304],
      [560, 216],
      [456, 216]
    ])
  ];
  
  gameState.entities = [gameState.player, ...gameState.aoOnis];
}

export function createLevel7() {
  // Level 7: Dark level with flashlight (3 objectives)
  // Scaled to 640x480 canvas
  
  gameState.walls = [
    // Outer walls
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 16 },
    { x: 0, y: 0, w: 16, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 16, y: 0, w: 16, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 16, w: CANVAS_WIDTH, h: 16 },
    
    // Corridor system
    { x: 16, y: 120, w: 176, h: 16 },
    { x: 16, y: 336, w: 176, h: 16 },
    { x: 448, y: 120, w: 176, h: 16 },
    { x: 448, y: 336, w: 176, h: 16 },
    
    // Vertical barriers
    { x: 192, y: 16, w: 16, h: 96 },
    { x: 304, y: 136, w: 16, h: 192 },
    { x: 432, y: 16, w: 16, h: 96 },
    { x: 432, y: 360, w: 16, h: 104 }
  ];

  gameState.doors = [
    new Door(192, 112, 16, 48, false)
  ];

  gameState.items = [
    new Item(80, 48, "flashlight", "flashlight", false),
    new Item(368, 48, "objective", "obj7_1", true),
    new Item(128, 408, "objective", "obj7_2", true),
    new Item(560, 408, "objective", "obj7_3", true)
  ];

  gameState.requiredItemIds = ["obj7_1", "obj7_2", "obj7_3"];

  gameState.hidingSpots = [
    new HidingSpot(240, 40, 32, 24, "closet"),
    new HidingSpot(368, 384, 48, 16, "table"),
    new HidingSpot(520, 40, 32, 24, "closet")
  ];

  gameState.exitZone = new ExitZone(368, 192, 64, 96);

  gameState.player = new Player(40, 216);

  gameState.aoOnis = [
    new AoOni(328, 240, 1.4, [
      [328, 240],
      [216, 240],
      [216, 168],
      [384, 168],
      [384, 312],
      [216, 312]
    ])
  ];
  
  gameState.entities = [gameState.player, ...gameState.aoOnis];
}

export function createLevel8() {
  // Level 8: Final challenge with 2 keys, 3 objectives, 2 fast enemies
  // Scaled to 640x480 canvas
  
  gameState.walls = [
    // Outer walls
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 16 },
    { x: 0, y: 0, w: 16, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 16, y: 0, w: 16, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 16, w: CANVAS_WIDTH, h: 16 },
    
    // Multi-room structure
    { x: 168, y: 16, w: 16, h: 144 },
    { x: 168, y: 240, w: 16, h: 224 },
    { x: 448, y: 16, w: 16, h: 144 },
    { x: 448, y: 240, w: 16, h: 224 },
    
    // Horizontal divisions
    { x: 16, y: 168, w: 152, h: 16 },
    { x: 184, y: 120, w: 264, h: 16 },
    { x: 464, y: 168, w: 160, h: 16 },
    
    // Central barriers
    { x: 280, y: 240, w: 16, h: 120 },
    { x: 344, y: 288, w: 16, h: 176 }
  ];

  gameState.doors = [
    new Door(168, 160, 16, 80, true, "key8a"),
    new Door(448, 160, 16, 80, true, "key8b")
  ];

  gameState.items = [
    new Item(80, 48, "key", "key8a", false),
    new Item(560, 48, "key", "key8b", false),
    new Item(328, 48, "objective", "obj8_1", true),
    new Item(80, 384, "objective", "obj8_2", true),
    new Item(560, 384, "objective", "obj8_3", true)
  ];

  gameState.requiredItemIds = ["obj8_1", "obj8_2", "obj8_3"];

  gameState.hidingSpots = [
    new HidingSpot(40, 288, 32, 24, "closet"),
    new HidingSpot(240, 312, 48, 16, "table"),
    new HidingSpot(392, 312, 48, 16, "table"),
    new HidingSpot(544, 288, 32, 24, "closet")
  ];

  gameState.exitZone = new ExitZone(272, 24, 96, 72);

  gameState.player = new Player(40, 216);

  gameState.aoOnis = [
    new AoOni(216, 312, 1.5, [
      [216, 312],
      [216, 384],
      [128, 384],
      [128, 216],
      [256, 216]
    ]),
    new AoOni(520, 312, 1.5, [
      [520, 312],
      [520, 384],
      [392, 384],
      [392, 216],
      [496, 216]
    ])
  ];
  
  gameState.entities = [gameState.player, ...gameState.aoOnis];
}

export function loadLevel(levelNum) {
  // Reset level-specific state
  gameState.walls = [];
  gameState.doors = [];
  gameState.items = [];
  gameState.hidingSpots = [];
  gameState.aoOnis = [];
  gameState.entities = [];
  gameState.exitZone = null;
  gameState.inventory = [];
  gameState.inChase = false;
  gameState.levelComplete = false;
  gameState.undetectedBonus = true;
  gameState.requiredItemIds = [];
  gameState.collectedRequiredItems = new Set();

  switch (levelNum) {
    case 1:
      createLevel1();
      break;
    case 2:
      createLevel2();
      break;
    case 3:
      createLevel3();
      break;
    case 4:
      createLevel4();
      break;
    case 5:
      createLevel5();
      break;
    case 6:
      createLevel6();
      break;
    case 7:
      createLevel7();
      break;
    case 8:
      createLevel8();
      break;
  }
}