// levels.js - Level data and management
import { gameState, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Door, Item, HidingSpot, ExitZone } from './entities.js';
import { AoOni } from './aooni.js';
import { Player } from './player.js';

export function createLevel1() {
  // NEW Level 1: Tutorial - Super Easy (No enemies!)
  // Simple single room layout
  // Just collect 1 objective and reach exit
  // Learn basic movement and interaction
  
  gameState.walls = [
    // Outer walls only - simple rectangular room
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 20 },
    { x: 0, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 20, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 20, w: CANVAS_WIDTH, h: 20 },
    
    // One simple obstacle in the middle for minimal navigation
    { x: 280, y: 160, w: 40, h: 80 }
  ];

  // No locked doors - completely open
  gameState.doors = [];

  gameState.items = [
    // Single objective in plain sight
    new Item(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, "objective", "obj1_1", true)
  ];

  // Define required items for this level
  gameState.requiredItemIds = ["obj1_1"];

  gameState.hidingSpots = [
    // One hiding spot for tutorial (not needed but available)
    new HidingSpot(100, 100, 40, 30, "closet")
  ];

  // Exit clearly visible near start
  gameState.exitZone = new ExitZone(450, 300, 100, 70);

  gameState.player = new Player(80, 80);

  // NO ENEMIES - pure tutorial level
  gameState.aoOnis = [];
  
  gameState.entities = [gameState.player];
}

export function createLevel2() {
  // NEW Level 2: Introduction to enemies - Easy
  // Two-room layout with simple navigation
  // 1 very slow enemy with predictable patrol far from player
  // 1 key + 1 objective
  
  gameState.walls = [
    // Outer walls
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 20 },
    { x: 0, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 20, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 20, w: CANVAS_WIDTH, h: 20 },
    
    // Simple vertical divider
    { x: 280, y: 20, w: 20, h: 160 },
    { x: 280, y: 240, w: 20, h: 140 }
  ];

  // One locked door - teaches key mechanics
  gameState.doors = [
    new Door(280, 180, 20, 60, true, "key2_1")
  ];

  gameState.items = [
    // Key in starting area (safe)
    new Item(100, 80, "key", "key2_1", false),
    // Objective in right area (safe from enemy)
    new Item(450, 80, "objective", "obj2_1", true)
  ];

  // Define required items for this level
  gameState.requiredItemIds = ["obj2_1"];

  gameState.hidingSpots = [
    new HidingSpot(50, 250, 40, 30, "closet"),
    new HidingSpot(400, 250, 40, 30, "closet")
  ];

  // Exit in top-right corner
  gameState.exitZone = new ExitZone(480, 40, 80, 60);

  gameState.player = new Player(60, 60);

  // One VERY SLOW enemy with small, predictable patrol in lower-right
  gameState.aoOnis = [
    new AoOni(450, 300, 0.6, [  // 0.6x speed = very slow
      [450, 300],
      [500, 300],
      [500, 250],
      [450, 250]
    ])
  ];
  
  gameState.entities = [gameState.player, ...gameState.aoOnis];
}

export function createLevel3() {
  // NEW Level 3: Basic challenge - Medium-Easy
  // Three-room layout with clearer separation
  // 1 enemy at reduced speed with simple patrol
  // 2 objectives to collect
  
  gameState.walls = [
    // Outer walls
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 20 },
    { x: 0, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 20, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 20, w: CANVAS_WIDTH, h: 20 },
    
    // Two vertical dividers creating three sections
    { x: 200, y: 20, w: 20, h: 160 },
    { x: 200, y: 240, w: 20, h: 140 },
    { x: 400, y: 20, w: 20, h: 160 },
    { x: 400, y: 240, w: 20, h: 140 },
    
    // Small horizontal barrier
    { x: 240, y: 180, w: 140, h: 20 }
  ];

  // Simple unlocked door for passage
  gameState.doors = [
    new Door(200, 180, 20, 60, false)
  ];

  gameState.items = [
    // Two objectives in separate safe areas
    new Item(100, 300, "objective", "obj3_1", true),
    new Item(500, 300, "objective", "obj3_2", true)
  ];

  // Define required items for this level
  gameState.requiredItemIds = ["obj3_1", "obj3_2"];

  gameState.hidingSpots = [
    new HidingSpot(50, 80, 40, 30, "closet"),
    new HidingSpot(280, 80, 60, 20, "table"),
    new HidingSpot(480, 80, 40, 30, "closet")
  ];

  // Exit in center top
  gameState.exitZone = new ExitZone(260, 40, 80, 60);

  gameState.player = new Player(60, 100);

  // One enemy at 0.8x speed with simple center patrol
  gameState.aoOnis = [
    new AoOni(300, 280, 0.8, [  // 0.8x speed = slower than normal
      [300, 280],
      [350, 280],
      [350, 220],
      [250, 220],
      [250, 280]
    ])
  ];
  
  gameState.entities = [gameState.player, ...gameState.aoOnis];
}

export function createLevel4() {
  // OLD Level 1 becomes NEW Level 4: Simple layout with safer item placement
  // Player starts in left room, needs key from top-left corner
  // Door blocks passage to right side where objective is located AWAY from enemy
  // Enemy patrols lower-right area, objective is in upper-right area
  
  gameState.walls = [
    // Outer walls
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 20 },
    { x: 0, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 20, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 20, w: CANVAS_WIDTH, h: 20 },
    
    // Central vertical wall dividing left and right sections
    { x: 280, y: 20, w: 20, h: 140 },
    { x: 280, y: 220, w: 20, h: 160 },
    
    // Horizontal walls creating corridors
    { x: 20, y: 120, w: 160, h: 20 },
    { x: 400, y: 120, w: 180, h: 20 },
    
    // Small barriers for complexity
    { x: 100, y: 240, w: 20, h: 80 },
    { x: 450, y: 240, w: 20, h: 80 }
  ];

  // Door in the central wall - blocks passage until unlocked
  gameState.doors = [
    new Door(280, 160, 20, 60, true, "key4_1")
  ];

  gameState.items = [
    // Key in upper left corner (safe from enemy, accessible from start)
    new Item(60, 50, "key", "key4_1", false),
    // Objective in upper-right corner (away from enemy patrol in lower area)
    new Item(520, 60, "objective", "obj4_1", true)
  ];

  // Define required items for this level
  gameState.requiredItemIds = ["obj4_1"];

  gameState.hidingSpots = [
    new HidingSpot(50, 280, 40, 30, "closet"),
    new HidingSpot(350, 50, 40, 30, "closet")
  ];

  // Exit in upper right (requires getting through door and collecting objective)
  gameState.exitZone = new ExitZone(480, 320, 80, 60);

  gameState.player = new Player(50, 180);

  // Enemy patrols LOWER-RIGHT area, away from objective which is in UPPER-RIGHT
  gameState.aoOnis = [
    new AoOni(380, 300, 1.0, [
      [380, 300],
      [500, 300],
      [500, 200],
      [380, 200]
    ])
  ];
  
  gameState.entities = [gameState.player, ...gameState.aoOnis];
}

export function createLevel5() {
  // OLD Level 2 becomes NEW Level 5: Two-room layout with careful item placement
  // Player starts in bottom-left, 2 objectives to collect
  // Enemy patrols central corridor, objectives in safe corners
  // No locked doors but strategic wall placement
  
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
    new Item(60, 60, "objective", "obj5_1", true),
    // Second objective in bottom-right corner (requires navigation)
    new Item(520, 340, "objective", "obj5_2", true)
  ];

  // Define required items for this level
  gameState.requiredItemIds = ["obj5_1", "obj5_2"];

  gameState.hidingSpots = [
    new HidingSpot(140, 50, 40, 30, "closet"),
    new HidingSpot(300, 320, 60, 20, "table"),
    new HidingSpot(440, 320, 40, 30, "closet")
  ];

  // Exit in top-right area
  gameState.exitZone = new ExitZone(480, 40, 80, 60);

  gameState.player = new Player(50, 340);

  // Enemy patrols CENTRAL corridor area between objectives
  gameState.aoOnis = [
    new AoOni(300, 250, 1.1, [
      [300, 250],
      [450, 250],
      [450, 150],
      [300, 150]
    ])
  ];
  
  gameState.entities = [gameState.player, ...gameState.aoOnis];
}

export function createLevel6() {
  // OLD Level 3 becomes NEW Level 6: Three-room maze with 2 keys and 2 objectives
  // More complex navigation but still clear structure
  // Player starts bottom-left, must navigate to collect keys and objectives
  
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
    new Door(200, 160, 20, 60, true, "key6a"),
    new Door(380, 160, 20, 60, true, "key6b")
  ];

  gameState.items = [
    // Keys in accessible locations
    new Item(60, 60, "key", "key6a", false),
    new Item(520, 340, "key", "key6b", false),
    // Objectives behind locked doors (safe once accessed)
    new Item(280, 280, "objective", "obj6_1", true),
    new Item(460, 60, "objective", "obj6_2", true)
  ];

  // Define required items for this level
  gameState.requiredItemIds = ["obj6_1", "obj6_2"];

  gameState.hidingSpots = [
    new HidingSpot(50, 280, 40, 30, "closet"),
    new HidingSpot(250, 50, 60, 20, "table"),
    new HidingSpot(500, 180, 40, 30, "closet")
  ];

  // Exit in bottom center
  gameState.exitZone = new ExitZone(260, 320, 80, 60);

  gameState.player = new Player(50, 340);

  // Two enemies: one patrols left, one patrols right
  gameState.aoOnis = [
    new AoOni(100, 250, 1.2, [
      [100, 250],
      [100, 100],
      [160, 100],
      [160, 250]
    ]),
    new AoOni(480, 250, 1.2, [
      [480, 250],
      [520, 250],
      [520, 180],
      [420, 180]
    ])
  ];
  
  gameState.entities = [gameState.player, ...gameState.aoOnis];
}

export function createLevel7() {
  // OLD Level 4 becomes NEW Level 7: Dark level with flashlight (3 objectives)
  // Corridor-based layout with strategic hiding spots
  // More complex navigation with darkness mechanic
  
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
    new Item(340, 60, "objective", "obj7_1", true),
    new Item(120, 340, "objective", "obj7_2", true),
    new Item(520, 340, "objective", "obj7_3", true)
  ];

  // Define required items for this level (3 objectives)
  gameState.requiredItemIds = ["obj7_1", "obj7_2", "obj7_3"];

  gameState.hidingSpots = [
    new HidingSpot(220, 50, 40, 30, "closet"),
    new HidingSpot(340, 320, 60, 20, "table"),
    new HidingSpot(480, 50, 40, 30, "closet")
  ];

  // Exit in center-right
  gameState.exitZone = new ExitZone(340, 160, 80, 80);

  gameState.player = new Player(50, 180);

  // Faster enemy with central patrol pattern
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

export function createLevel8() {
  // OLD Level 5 becomes NEW Level 8: Final challenge with 2 keys, 3 objectives, 2 fast enemies
  // Complex but fair layout requiring all skills learned
  // Darkness continues from level 7
  
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
    new Door(160, 140, 20, 60, true, "key8a"),
    new Door(420, 140, 20, 60, true, "key8b")
  ];

  gameState.items = [
    // Keys in outer rooms
    new Item(80, 60, "key", "key8a", false),
    new Item(520, 60, "key", "key8b", false),
    // Three objectives in strategic locations
    new Item(300, 60, "objective", "obj8_1", true),
    new Item(80, 320, "objective", "obj8_2", true),
    new Item(520, 320, "objective", "obj8_3", true)
  ];

  // Define required items for this level (3 objectives for final level)
  gameState.requiredItemIds = ["obj8_1", "obj8_2", "obj8_3"];

  gameState.hidingSpots = [
    new HidingSpot(50, 240, 40, 30, "closet"),
    new HidingSpot(220, 260, 60, 20, "table"),
    new HidingSpot(360, 260, 60, 20, "table"),
    new HidingSpot(500, 240, 40, 30, "closet")
  ];

  // Exit in center top area
  gameState.exitZone = new ExitZone(250, 30, 100, 60);

  gameState.player = new Player(50, 180);

  // Two fast enemies with separate patrol zones
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