// levels.js - Level data and management
import { gameState, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Door, Item, HidingSpot, ExitZone } from './entities.js';
import { AoOni } from './aooni.js';
import { Player } from './player.js';

export function createLevel1() {
  // Level 1: BEGINNER-FRIENDLY - Simple layout with slow enemy
  // Player starts in left area, needs key from safe location
  // Enemy is slow and patrols far from objectives
  // Clear path to victory with minimal obstacles
  
  gameState.walls = [
    // Outer walls
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 20 },
    { x: 0, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 20, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 20, w: CANVAS_WIDTH, h: 20 },
    
    // Single central dividing wall with door passage
    { x: 280, y: 20, w: 20, h: 120 },
    { x: 280, y: 220, w: 20, h: 160 },
    
    // Minimal horizontal barriers
    { x: 20, y: 160, w: 120, h: 20 },
    { x: 440, y: 160, w: 120, h: 20 }
  ];

  // Single door in the central wall
  gameState.doors = [
    new Door(280, 140, 20, 80, true, "key1")
  ];

  gameState.items = [
    // Key in safe starting area (upper left)
    new Item(60, 60, "key", "key1", false),
    // Objective in upper-right area (safe from slow enemy)
    new Item(500, 60, "objective", "obj1_1", true)
  ];

  // Define required items for this level
  gameState.requiredItemIds = ["obj1_1"];

  gameState.hidingSpots = [
    new HidingSpot(50, 280, 40, 30, "closet"),
    new HidingSpot(360, 50, 40, 30, "closet")
  ];

  // Exit in upper right
  gameState.exitZone = new ExitZone(480, 320, 80, 60);

  gameState.player = new Player(60, 200);

  // SLOW enemy patrols bottom area only - far from objectives
  // Speed multiplier 0.7 makes it much easier for beginners
  gameState.aoOnis = [
    new AoOni(400, 320, 0.7, [
      [400, 320],
      [500, 320],
      [500, 240],
      [360, 240]
    ])
  ];
  
  gameState.entities = [gameState.player, ...gameState.aoOnis];
}

export function createLevel2() {
  // Level 2: MODERATE - Two-room layout with faster enemy
  // Increased difficulty with normal speed enemy
  
  gameState.walls = [
    // Outer walls
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 20 },
    { x: 0, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 20, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 20, w: CANVAS_WIDTH, h: 20 },
    
    // Central horizontal wall dividing top and bottom
    { x: 20, y: 200, w: 240, h: 20 },
    { x: 340, y: 200, w: 240, h: 20 },
    
    // Vertical walls creating rooms
    { x: 200, y: 20, w: 20, h: 100 },
    { x: 380, y: 280, w: 20, h: 100 },
    
    // Small barriers
    { x: 100, y: 80, w: 20, h: 60 },
    { x: 480, y: 80, w: 20, h: 60 }
  ];

  // Unlocked door for passage
  gameState.doors = [
    new Door(260, 200, 80, 20, false)
  ];

  gameState.items = [
    // First objective in top-left corner (safe)
    new Item(60, 60, "objective", "obj2_1", true),
    // Second objective in bottom-right corner (requires navigation)
    new Item(520, 340, "objective", "obj2_2", true)
  ];

  // Define required items for this level
  gameState.requiredItemIds = ["obj2_1", "obj2_2"];

  gameState.hidingSpots = [
    new HidingSpot(140, 50, 40, 30, "closet"),
    new HidingSpot(300, 320, 60, 20, "table"),
    new HidingSpot(440, 320, 40, 30, "closet")
  ];

  // Exit in top-right area
  gameState.exitZone = new ExitZone(480, 40, 80, 60);

  gameState.player = new Player(50, 340);

  // Normal speed enemy (1.0) - noticeable increase from level 1
  gameState.aoOnis = [
    new AoOni(300, 250, 1.0, [
      [300, 250],
      [450, 250],
      [450, 150],
      [300, 150]
    ])
  ];
  
  gameState.entities = [gameState.player, ...gameState.aoOnis];
}

export function createLevel3() {
  // Level 3: CHALLENGING - Three-room maze with increased speed
  // Progressive difficulty continues
  
  gameState.walls = [
    // Outer walls
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 20 },
    { x: 0, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 20, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 20, w: CANVAS_WIDTH, h: 20 },
    
    // Vertical dividers creating three columns
    { x: 200, y: 20, w: 20, h: 140 },
    { x: 200, y: 220, w: 20, h: 160 },
    { x: 380, y: 20, w: 20, h: 140 },
    { x: 380, y: 220, w: 20, h: 160 },
    
    // Horizontal barriers
    { x: 20, y: 140, w: 100, h: 20 },
    { x: 300, y: 140, w: 60, h: 20 },
    { x: 460, y: 140, w: 100, h: 20 }
  ];

  // Two locked doors blocking access to objectives
  gameState.doors = [
    new Door(200, 160, 20, 60, true, "key3a"),
    new Door(380, 160, 20, 60, true, "key3b")
  ];

  gameState.items = [
    // Keys in accessible locations
    new Item(60, 60, "key", "key3a", false),
    new Item(520, 340, "key", "key3b", false),
    // Objectives behind locked doors
    new Item(280, 280, "objective", "obj3_1", true),
    new Item(460, 60, "objective", "obj3_2", true)
  ];

  // Define required items for this level
  gameState.requiredItemIds = ["obj3_1", "obj3_2"];

  gameState.hidingSpots = [
    new HidingSpot(50, 280, 40, 30, "closet"),
    new HidingSpot(250, 50, 60, 20, "table"),
    new HidingSpot(500, 180, 40, 30, "closet")
  ];

  // Exit in bottom center
  gameState.exitZone = new ExitZone(260, 320, 80, 60);

  gameState.player = new Player(50, 340);

  // Two enemies with increased speed (1.15) - progressive difficulty
  gameState.aoOnis = [
    new AoOni(100, 250, 1.15, [
      [100, 250],
      [100, 100],
      [160, 100],
      [160, 250]
    ]),
    new AoOni(480, 250, 1.15, [
      [480, 250],
      [520, 250],
      [520, 180],
      [420, 180]
    ])
  ];
  
  gameState.entities = [gameState.player, ...gameState.aoOnis];
}

export function createLevel4() {
  // Level 4: HARD - Dark level with flashlight, faster enemy
  
  gameState.walls = [
    // Outer walls
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 20 },
    { x: 0, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 20, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 20, w: CANVAS_WIDTH, h: 20 },
    
    // Create corridor system
    { x: 20, y: 100, w: 160, h: 20 },
    { x: 20, y: 280, w: 160, h: 20 },
    { x: 420, y: 100, w: 160, h: 20 },
    { x: 420, y: 280, w: 160, h: 20 },
    
    // Vertical barriers
    { x: 180, y: 20, w: 20, h: 80 },
    { x: 280, y: 120, w: 20, h: 160 },
    { x: 400, y: 20, w: 20, h: 80 },
    { x: 400, y: 300, w: 20, h: 80 }
  ];

  gameState.doors = [
    new Door(180, 100, 20, 40, false)
  ];

  gameState.items = [
    // Flashlight in starting area (priority pickup)
    new Item(80, 60, "flashlight", "flashlight", false),
    // Three objectives spread across the level
    new Item(340, 60, "objective", "obj4_1", true),
    new Item(120, 340, "objective", "obj4_2", true),
    new Item(520, 340, "objective", "obj4_3", true)
  ];

  // Define required items for this level (3 objectives)
  gameState.requiredItemIds = ["obj4_1", "obj4_2", "obj4_3"];

  gameState.hidingSpots = [
    new HidingSpot(220, 50, 40, 30, "closet"),
    new HidingSpot(340, 320, 60, 20, "table"),
    new HidingSpot(480, 50, 40, 30, "closet")
  ];

  // Exit in center-right
  gameState.exitZone = new ExitZone(340, 160, 80, 80);

  gameState.player = new Player(50, 180);

  // Fast enemy (1.4) with complex patrol
  gameState.aoOnis = [
    new AoOni(300, 200, 1.4, [
      [300, 200],
      [200, 200],
      [200, 140],
      [350, 140],
      [350, 260],
      [200, 260]
    ])
  ];
  
  gameState.entities = [gameState.player, ...gameState.aoOnis];
}

export function createLevel5() {
  // Level 5: EXPERT - Final challenge with fastest enemies
  // Maximum difficulty with multiple fast enemies
  
  gameState.walls = [
    // Outer walls
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 20 },
    { x: 0, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 20, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 20, w: CANVAS_WIDTH, h: 20 },
    
    // Create multi-room structure
    { x: 160, y: 20, w: 20, h: 120 },
    { x: 160, y: 200, w: 20, h: 180 },
    { x: 420, y: 20, w: 20, h: 120 },
    { x: 420, y: 200, w: 20, h: 180 },
    
    // Horizontal divisions
    { x: 20, y: 140, w: 140, h: 20 },
    { x: 180, y: 100, w: 240, h: 20 },
    { x: 440, y: 140, w: 140, h: 20 },
    
    // Central barriers
    { x: 260, y: 200, w: 20, h: 100 },
    { x: 320, y: 240, w: 20, h: 140 }
  ];

  // Two locked doors guarding key areas
  gameState.doors = [
    new Door(160, 140, 20, 60, true, "key5a"),
    new Door(420, 140, 20, 60, true, "key5b")
  ];

  gameState.items = [
    // Keys in outer rooms
    new Item(80, 60, "key", "key5a", false),
    new Item(520, 60, "key", "key5b", false),
    // Three objectives in strategic locations
    new Item(300, 60, "objective", "obj5_1", true),
    new Item(80, 320, "objective", "obj5_2", true),
    new Item(520, 320, "objective", "obj5_3", true)
  ];

  // Define required items for this level (3 objectives for final level)
  gameState.requiredItemIds = ["obj5_1", "obj5_2", "obj5_3"];

  gameState.hidingSpots = [
    new HidingSpot(50, 240, 40, 30, "closet"),
    new HidingSpot(220, 260, 60, 20, "table"),
    new HidingSpot(360, 260, 60, 20, "table"),
    new HidingSpot(500, 240, 40, 30, "closet")
  ];

  // Exit in center top area
  gameState.exitZone = new ExitZone(250, 30, 100, 60);

  gameState.player = new Player(50, 180);

  // Two very fast enemies (1.5) - maximum difficulty for final level
  gameState.aoOnis = [
    new AoOni(200, 260, 1.5, [
      [200, 260],
      [200, 320],
      [120, 320],
      [120, 180],
      [240, 180]
    ]),
    new AoOni(480, 260, 1.5, [
      [480, 260],
      [480, 320],
      [360, 320],
      [360, 180],
      [460, 180]
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
  }
}