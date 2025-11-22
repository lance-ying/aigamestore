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
    { x: 380, y: 260, w: 40, h: 80 }
  ];

  // No locked doors - completely open
  gameState.doors = [];

  gameState.items = [
    // Single objective in plain sight - moved to left side to avoid obstacle
    new Item(200, 380, "objective", "obj1_1", true)
  ];

  // Define required items for this level
  gameState.requiredItemIds = ["obj1_1"];

  gameState.hidingSpots = [
    // One hiding spot for tutorial (not needed but available)
    new HidingSpot(100, 100, 40, 30, "closet")
  ];

  // Exit clearly visible near start
  gameState.exitZone = new ExitZone(600, 450, 100, 70);

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
    { x: 380, y: 20, w: 20, h: 260 },
    { x: 380, y: 360, w: 20, h: 220 }
  ];

  // One locked door - teaches key mechanics
  gameState.doors = [
    new Door(380, 280, 20, 80, true, "key2_1")
  ];

  gameState.items = [
    // Key in starting area (safe)
    new Item(100, 80, "key", "key2_1", false),
    // Objective in right area (safe from enemy)
    new Item(600, 80, "objective", "obj2_1", true)
  ];

  // Define required items for this level
  gameState.requiredItemIds = ["obj2_1"];

  gameState.hidingSpots = [
    new HidingSpot(50, 400, 40, 30, "closet"),
    new HidingSpot(550, 400, 40, 30, "closet")
  ];

  // Exit in top-right corner
  gameState.exitZone = new ExitZone(650, 40, 80, 60);

  gameState.player = new Player(60, 60);

  // One VERY SLOW enemy with small, predictable patrol in lower-right
  gameState.aoOnis = [
    new AoOni(600, 450, 0.6, [  // 0.6x speed = very slow
      [600, 450],
      [680, 450],
      [680, 380],
      [600, 380]
    ])
  ];
  
  gameState.entities = [gameState.player, ...gameState.aoOnis];
}

export function createLevel3() {
  // NEW Level 3: Basic challenge - Medium-Easy
  // Three-room layout with clearer separation
  // 1 VERY SLOW enemy with small patrol in FAR RIGHT corner (away from objectives)
  // 2 objectives to collect
  // EASIER: Enemy stays in upper-right corner, reduced sight range
  // FIXED: Removed horizontal barrier to allow passage through middle
  
  gameState.walls = [
    // Outer walls
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 20 },
    { x: 0, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 20, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 20, w: CANVAS_WIDTH, h: 20 },
    
    // Two vertical dividers creating three sections
    { x: 270, y: 20, w: 20, h: 240 },
    { x: 270, y: 360, w: 20, h: 220 },
    { x: 540, y: 20, w: 20, h: 240 },
    { x: 540, y: 360, w: 20, h: 220 }
  ];

  // Simple unlocked door for passage
  gameState.doors = [
    new Door(270, 260, 20, 100, false)
  ];

  gameState.items = [
    // Two objectives in separate safe areas
    new Item(130, 450, "objective", "obj3_1", true),
    new Item(680, 450, "objective", "obj3_2", true)
  ];

  // Define required items for this level
  gameState.requiredItemIds = ["obj3_1", "obj3_2"];

  gameState.hidingSpots = [
    new HidingSpot(50, 80, 40, 30, "closet"),
    new HidingSpot(380, 80, 60, 20, "table"),
    new HidingSpot(650, 80, 40, 30, "closet")
  ];

  // Exit in center top
  gameState.exitZone = new ExitZone(360, 40, 80, 60);

  gameState.player = new Player(60, 450);

  // One VERY SLOW enemy with small patrol in FAR RIGHT (upper-right corner)
  // Reduced sight range from 120 to 80 pixels
  gameState.aoOnis = [
    new AoOni(680, 120, 0.6, [  // 0.6x speed = very slow, moved to far right
      [650, 120],
      [720, 120],
      [720, 180],
      [650, 180]
    ], 80)  // Reduced sight range to 80 pixels
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
    { x: 380, y: 20, w: 20, h: 190 },
    { x: 380, y: 330, w: 20, h: 250 },
    
    // Horizontal walls creating corridors
    { x: 20, y: 180, w: 220, h: 20 },
    { x: 540, y: 180, w: 240, h: 20 },
    
    // Small barriers for complexity
    { x: 130, y: 360, w: 20, h: 120 },
    { x: 610, y: 360, w: 20, h: 120 }
  ];

  // Door in the central wall - blocks passage until unlocked
  gameState.doors = [
    new Door(380, 210, 20, 120, true, "key4_1")
  ];

  gameState.items = [
    // Key in upper left corner (safe from enemy, accessible from start)
    new Item(60, 50, "key", "key4_1", false),
    // Objective in upper-right corner (away from enemy patrol in lower area)
    new Item(700, 60, "objective", "obj4_1", true)
  ];

  // Define required items for this level
  gameState.requiredItemIds = ["obj4_1"];

  gameState.hidingSpots = [
    new HidingSpot(50, 420, 40, 30, "closet"),
    new HidingSpot(480, 50, 40, 30, "closet")
  ];

  // Exit in upper right (requires getting through door and collecting objective)
  gameState.exitZone = new ExitZone(650, 480, 80, 60);

  gameState.player = new Player(50, 270);

  // Enemy patrols LOWER-RIGHT area, away from objective which is in UPPER-RIGHT
  gameState.aoOnis = [
    new AoOni(520, 450, 1.0, [
      [520, 450],
      [680, 450],
      [680, 300],
      [520, 300]
    ])
  ];
  
  gameState.entities = [gameState.player, ...gameState.aoOnis];
}

export function createLevel5() {
  // OLD Level 2 becomes NEW Level 5: Two-room layout with careful item placement
  // Player starts in bottom-left, 2 objectives to collect
  // Enemy patrols upper-right corner (AWAY from objectives and path)
  // No locked doors but strategic wall placement
  
  gameState.walls = [
    // Outer walls
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 20 },
    { x: 0, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 20, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 20, w: CANVAS_WIDTH, h: 20 },
    
    // Central horizontal wall dividing top and bottom
    { x: 20, y: 300, w: 340, h: 20 },
    { x: 460, y: 300, w: 320, h: 20 },
    
    // Vertical walls creating rooms
    { x: 270, y: 20, w: 20, h: 150 },
    { x: 510, y: 420, w: 20, h: 160 },
    
    // Small barriers
    { x: 130, y: 120, w: 20, h: 90 },
    { x: 650, y: 120, w: 20, h: 90 }
  ];

  // Unlocked door for passage
  gameState.doors = [
    new Door(360, 300, 100, 20, false)
  ];

  gameState.items = [
    // First objective in top-left corner (safe)
    new Item(60, 60, "objective", "obj5_1", true),
    // Second objective in bottom-right corner (requires navigation)
    new Item(700, 510, "objective", "obj5_2", true)
  ];

  // Define required items for this level
  gameState.requiredItemIds = ["obj5_1", "obj5_2"];

  gameState.hidingSpots = [
    new HidingSpot(190, 50, 40, 30, "closet"),
    new HidingSpot(410, 480, 60, 20, "table"),
    new HidingSpot(600, 480, 40, 30, "closet")
  ];

  // Exit in top-right area
  gameState.exitZone = new ExitZone(650, 40, 80, 60);

  gameState.player = new Player(50, 510);

  // Enemy patrols UPPER-RIGHT corner, away from both objectives and player start
  // Reduced speed from 1.1 to 0.9 and smaller patrol area
  gameState.aoOnis = [
    new AoOni(650, 100, 0.9, [
      [650, 100],
      [720, 100],
      [720, 150],
      [650, 150]
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
    { x: 270, y: 20, w: 20, h: 210 },
    { x: 270, y: 330, w: 20, h: 250 },
    { x: 510, y: 20, w: 20, h: 210 },
    { x: 510, y: 330, w: 20, h: 250 },
    
    // Horizontal barriers
    { x: 20, y: 210, w: 130, h: 20 },
    { x: 410, y: 210, w: 80, h: 20 },
    { x: 620, y: 210, w: 140, h: 20 }
  ];

  // Two locked doors blocking access to objectives
  gameState.doors = [
    new Door(270, 230, 20, 100, true, "key6a"),
    new Door(510, 230, 20, 100, true, "key6b")
  ];

  gameState.items = [
    // Keys in accessible locations
    new Item(60, 60, "key", "key6a", false),
    new Item(700, 510, "key", "key6b", false),
    // Objectives behind locked doors (safe once accessed)
    new Item(380, 420, "objective", "obj6_1", true),
    new Item(620, 60, "objective", "obj6_2", true)
  ];

  // Define required items for this level
  gameState.requiredItemIds = ["obj6_1", "obj6_2"];

  gameState.hidingSpots = [
    new HidingSpot(50, 420, 40, 30, "closet"),
    new HidingSpot(340, 50, 60, 20, "table"),
    new HidingSpot(680, 270, 40, 30, "closet")
  ];

  // Exit in bottom center
  gameState.exitZone = new ExitZone(360, 480, 80, 60);

  gameState.player = new Player(50, 510);

  // Two enemies: one patrols left, one patrols right
  gameState.aoOnis = [
    new AoOni(130, 380, 1.2, [
      [130, 380],
      [130, 150],
      [220, 150],
      [220, 380]
    ]),
    new AoOni(650, 380, 1.2, [
      [650, 380],
      [700, 380],
      [700, 270],
      [570, 270]
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
    { x: 20, y: 150, w: 220, h: 20 },
    { x: 20, y: 420, w: 220, h: 20 },
    { x: 560, y: 150, w: 220, h: 20 },
    { x: 560, y: 420, w: 220, h: 20 },
    
    // Vertical barriers
    { x: 240, y: 20, w: 20, h: 120 },
    { x: 380, y: 170, w: 20, h: 240 },
    { x: 540, y: 20, w: 20, h: 120 },
    { x: 540, y: 450, w: 20, h: 130 }
  ];

  gameState.doors = [
    new Door(240, 140, 20, 60, false)
  ];

  gameState.items = [
    // Flashlight in starting area (priority pickup)
    new Item(100, 60, "flashlight", "flashlight", false),
    // Three objectives spread across the level
    new Item(460, 60, "objective", "obj7_1", true),
    new Item(160, 510, "objective", "obj7_2", true),
    new Item(700, 510, "objective", "obj7_3", true)
  ];

  // Define required items for this level (3 objectives)
  gameState.requiredItemIds = ["obj7_1", "obj7_2", "obj7_3"];

  gameState.hidingSpots = [
    new HidingSpot(300, 50, 40, 30, "closet"),
    new HidingSpot(460, 480, 60, 20, "table"),
    new HidingSpot(650, 50, 40, 30, "closet")
  ];

  // Exit in center-right
  gameState.exitZone = new ExitZone(460, 240, 80, 120);

  gameState.player = new Player(50, 270);

  // Faster enemy with central patrol pattern
  gameState.aoOnis = [
    new AoOni(410, 300, 1.4, [
      [410, 300],
      [270, 300],
      [270, 210],
      [480, 210],
      [480, 390],
      [270, 390]
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
    { x: 210, y: 20, w: 20, h: 180 },
    { x: 210, y: 300, w: 20, h: 280 },
    { x: 560, y: 20, w: 20, h: 180 },
    { x: 560, y: 300, w: 20, h: 280 },
    
    // Horizontal divisions
    { x: 20, y: 210, w: 190, h: 20 },
    { x: 230, y: 150, w: 330, h: 20 },
    { x: 580, y: 210, w: 200, h: 20 },
    
    // Central barriers
    { x: 350, y: 300, w: 20, h: 150 },
    { x: 430, y: 360, w: 20, h: 220 }
  ];

  // Two locked doors guarding key areas
  gameState.doors = [
    new Door(210, 200, 20, 100, true, "key8a"),
    new Door(560, 200, 20, 100, true, "key8b")
  ];

  gameState.items = [
    // Keys in outer rooms
    new Item(100, 60, "key", "key8a", false),
    new Item(700, 60, "key", "key8b", false),
    // Three objectives in strategic locations
    new Item(410, 60, "objective", "obj8_1", true),
    new Item(100, 480, "objective", "obj8_2", true),
    new Item(700, 480, "objective", "obj8_3", true)
  ];

  // Define required items for this level (3 objectives for final level)
  gameState.requiredItemIds = ["obj8_1", "obj8_2", "obj8_3"];

  gameState.hidingSpots = [
    new HidingSpot(50, 360, 40, 30, "closet"),
    new HidingSpot(300, 390, 60, 20, "table"),
    new HidingSpot(490, 390, 60, 20, "table"),
    new HidingSpot(680, 360, 40, 30, "closet")
  ];

  // Exit in center top area
  gameState.exitZone = new ExitZone(340, 30, 120, 90);

  gameState.player = new Player(50, 270);

  // Two fast enemies with separate patrol zones
  gameState.aoOnis = [
    new AoOni(270, 390, 1.5, [
      [270, 390],
      [270, 480],
      [160, 480],
      [160, 270],
      [320, 270]
    ]),
    new AoOni(650, 390, 1.5, [
      [650, 390],
      [650, 480],
      [490, 480],
      [490, 270],
      [620, 270]
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