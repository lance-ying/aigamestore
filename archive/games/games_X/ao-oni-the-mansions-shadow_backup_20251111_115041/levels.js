// levels.js - Level data and management
import { gameState, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Door, Item, HidingSpot, ExitZone } from './entities.js';
import { AoOni } from './aooni.js';
import { Player } from './player.js';

export function createLevel1() {
  // Level 1: Simple layout with safer item placement
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
    new Door(280, 160, 20, 60, true, "key1")
  ];

  gameState.items = [
    // Key in upper left corner (safe from enemy, accessible from start)
    new Item(60, 50, "key", "key1", false),
    // Objective in upper-right corner (away from enemy patrol in lower area)
    new Item(520, 60, "objective", "obj1_1", true)
  ];

  // Define required items for this level
  gameState.requiredItemIds = ["obj1_1"];

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

export function createLevel2() {
  // Level 2: Two-room layout with careful item placement
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

export function createLevel3() {
  // Level 3: Three-room maze with 2 keys and 2 objectives
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
    new Door(200, 160, 20, 60, true, "key3a"),
    new Door(380, 160, 20, 60, true, "key3b")
  ];

  gameState.items = [
    // Keys in accessible locations
    new Item(60, 60, "key", "key3a", false),
    new Item(520, 340, "key", "key3b", false),
    // Objectives behind locked doors (safe once accessed)
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

export function createLevel4() {
  // Level 4: Dark level with flashlight (3 objectives)
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

export function createLevel5() {
  // Level 5: Final challenge with 2 keys, 3 objectives, 2 fast enemies
  // Complex but fair layout requiring all skills learned
  // Darkness continues from level 4
  
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

// NEW LEVELS 6-14

export function createLevel6() {
  // Level 6: EASY - Very simple open layout, one slow enemy, 1 objective
  // Large open space with minimal obstacles
  
  gameState.walls = [
    // Outer walls
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 20 },
    { x: 0, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 20, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 20, w: CANVAS_WIDTH, h: 20 },
    
    // Minimal internal walls
    { x: 240, y: 120, w: 20, h: 80 },
    { x: 340, y: 200, w: 20, h: 80 }
  ];

  gameState.doors = [];

  gameState.items = [
    new Item(520, 60, "objective", "obj6_1", true)
  ];

  gameState.requiredItemIds = ["obj6_1"];

  gameState.hidingSpots = [
    new HidingSpot(100, 100, 40, 30, "closet"),
    new HidingSpot(450, 280, 60, 20, "table")
  ];

  gameState.exitZone = new ExitZone(50, 320, 80, 60);
  gameState.player = new Player(50, 60);

  // Very slow enemy in corner
  gameState.aoOnis = [
    new AoOni(300, 340, 0.8, [
      [300, 340],
      [400, 340],
      [400, 260],
      [300, 260]
    ])
  ];
  
  gameState.entities = [gameState.player, ...gameState.aoOnis];
}

export function createLevel7() {
  // Level 7: EASY - Two rooms, one slow enemy, 1 key and 1 objective
  // Simple L-shaped layout
  
  gameState.walls = [
    // Outer walls
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 20 },
    { x: 0, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 20, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 20, w: CANVAS_WIDTH, h: 20 },
    
    // L-shaped divider
    { x: 300, y: 20, w: 20, h: 180 },
    { x: 20, y: 200, w: 300, h: 20 }
  ];

  gameState.doors = [
    new Door(300, 200, 20, 60, true, "key7")
  ];

  gameState.items = [
    new Item(120, 300, "key", "key7", false),
    new Item(480, 80, "objective", "obj7_1", true)
  ];

  gameState.requiredItemIds = ["obj7_1"];

  gameState.hidingSpots = [
    new HidingSpot(60, 80, 40, 30, "closet"),
    new HidingSpot(400, 280, 40, 30, "closet")
  ];

  gameState.exitZone = new ExitZone(500, 320, 60, 60);
  gameState.player = new Player(60, 60);

  // Slow enemy in bottom-left section
  gameState.aoOnis = [
    new AoOni(150, 300, 0.9, [
      [150, 300],
      [250, 300],
      [250, 240],
      [150, 240]
    ])
  ];
  
  gameState.entities = [gameState.player, ...gameState.aoOnis];
}

export function createLevel8() {
  // Level 8: EASY - Simple maze, one enemy, 2 objectives
  // Cross-shaped layout with clear paths
  
  gameState.walls = [
    // Outer walls
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 20 },
    { x: 0, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 20, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 20, w: CANVAS_WIDTH, h: 20 },
    
    // Cross dividers
    { x: 280, y: 20, w: 20, h: 140 },
    { x: 280, y: 240, w: 20, h: 140 },
    { x: 20, y: 180, w: 260, h: 20 },
    { x: 300, y: 180, w: 280, h: 20 }
  ];

  gameState.doors = [];

  gameState.items = [
    new Item(80, 80, "objective", "obj8_1", true),
    new Item(520, 320, "objective", "obj8_2", true)
  ];

  gameState.requiredItemIds = ["obj8_1", "obj8_2"];

  gameState.hidingSpots = [
    new HidingSpot(480, 60, 40, 30, "closet"),
    new HidingSpot(60, 300, 40, 30, "closet"),
    new HidingSpot(340, 100, 60, 20, "table")
  ];

  gameState.exitZone = new ExitZone(500, 80, 60, 60);
  gameState.player = new Player(340, 260);

  // Medium-slow enemy in center
  gameState.aoOnis = [
    new AoOni(340, 100, 1.0, [
      [340, 100],
      [500, 100],
      [500, 260],
      [340, 260]
    ])
  ];
  
  gameState.entities = [gameState.player, ...gameState.aoOnis];
}

export function createLevel9() {
  // Level 9: MEDIUM - More complex layout, 2 objectives, 1 faster enemy
  // Four-room structure with corridors
  
  gameState.walls = [
    // Outer walls
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 20 },
    { x: 0, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 20, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 20, w: CANVAS_WIDTH, h: 20 },
    
    // Vertical divider
    { x: 290, y: 20, w: 20, h: 160 },
    { x: 290, y: 220, w: 20, h: 160 },
    
    // Horizontal barriers
    { x: 20, y: 180, w: 180, h: 20 },
    { x: 400, y: 180, w: 180, h: 20 },
    { x: 140, y: 80, w: 20, h: 80 },
    { x: 440, y: 80, w: 20, h: 80 }
  ];

  gameState.doors = [
    new Door(220, 180, 70, 20, false)
  ];

  gameState.items = [
    new Item(80, 100, "objective", "obj9_1", true),
    new Item(520, 300, "objective", "obj9_2", true)
  ];

  gameState.requiredItemIds = ["obj9_1", "obj9_2"];

  gameState.hidingSpots = [
    new HidingSpot(180, 60, 40, 30, "closet"),
    new HidingSpot(350, 280, 60, 20, "table"),
    new HidingSpot(500, 100, 40, 30, "closet")
  ];

  gameState.exitZone = new ExitZone(340, 50, 80, 60);
  gameState.player = new Player(50, 280);

  // Faster enemy with patrol through corridors
  gameState.aoOnis = [
    new AoOni(350, 230, 1.3, [
      [350, 230],
      [450, 230],
      [450, 300],
      [350, 300],
      [250, 300],
      [250, 230]
    ])
  ];
  
  gameState.entities = [gameState.player, ...gameState.aoOnis];
}

export function createLevel10() {
  // Level 10: MEDIUM - Multi-room with 2 keys, 2 objectives, 1 enemy
  // Requires planning and strategic key collection
  
  gameState.walls = [
    // Outer walls
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 20 },
    { x: 0, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 20, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 20, w: CANVAS_WIDTH, h: 20 },
    
    // Complex room divisions
    { x: 180, y: 20, w: 20, h: 160 },
    { x: 400, y: 20, w: 20, h: 160 },
    { x: 180, y: 220, w: 20, h: 160 },
    { x: 400, y: 220, w: 20, h: 160 },
    { x: 20, y: 180, w: 160, h: 20 },
    { x: 420, y: 180, w: 160, h: 20 }
  ];

  gameState.doors = [
    new Door(180, 180, 20, 40, true, "key10a"),
    new Door(400, 180, 20, 40, true, "key10b")
  ];

  gameState.items = [
    new Item(80, 80, "key", "key10a", false),
    new Item(520, 320, "key", "key10b", false),
    new Item(280, 100, "objective", "obj10_1", true),
    new Item(280, 300, "objective", "obj10_2", true)
  ];

  gameState.requiredItemIds = ["obj10_1", "obj10_2"];

  gameState.hidingSpots = [
    new HidingSpot(60, 260, 40, 30, "closet"),
    new HidingSpot(480, 60, 40, 30, "closet"),
    new HidingSpot(240, 240, 60, 20, "table")
  ];

  gameState.exitZone = new ExitZone(480, 260, 80, 60);
  gameState.player = new Player(80, 340);

  // Enemy patrols center areas
  gameState.aoOnis = [
    new AoOni(280, 250, 1.3, [
      [280, 250],
      [340, 250],
      [340, 130],
      [220, 130],
      [220, 250]
    ])
  ];
  
  gameState.entities = [gameState.player, ...gameState.aoOnis];
}

export function createLevel11() {
  // Level 11: MEDIUM - Dark level returns, 3 objectives, flashlight, 2 enemies
  // Darkness mechanic with multiple threats
  
  gameState.walls = [
    // Outer walls
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 20 },
    { x: 0, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 20, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 20, w: CANVAS_WIDTH, h: 20 },
    
    // Spiral-like layout
    { x: 100, y: 100, w: 20, h: 200 },
    { x: 100, y: 280, w: 380, h: 20 },
    { x: 460, y: 100, w: 20, h: 180 },
    { x: 200, y: 100, w: 260, h: 20 },
    { x: 200, y: 180, w: 20, h: 100 },
    { x: 220, y: 180, w: 160, h: 20 }
  ];

  gameState.doors = [];

  gameState.items = [
    new Item(60, 60, "flashlight", "flashlight11", false),
    new Item(520, 60, "objective", "obj11_1", true),
    new Item(60, 340, "objective", "obj11_2", true),
    new Item(300, 240, "objective", "obj11_3", true)
  ];

  gameState.requiredItemIds = ["obj11_1", "obj11_2", "obj11_3"];

  gameState.hidingSpots = [
    new HidingSpot(140, 50, 40, 30, "closet"),
    new HidingSpot(500, 320, 40, 30, "closet"),
    new HidingSpot(240, 220, 60, 20, "table")
  ];

  gameState.exitZone = new ExitZone(140, 160, 60, 60);
  gameState.player = new Player(300, 60);

  // Two enemies in different zones
  gameState.aoOnis = [
    new AoOni(400, 200, 1.3, [
      [400, 200],
      [500, 200],
      [500, 150],
      [400, 150]
    ]),
    new AoOni(150, 340, 1.3, [
      [150, 340],
      [300, 340],
      [300, 320],
      [150, 320]
    ])
  ];
  
  gameState.entities = [gameState.player, ...gameState.aoOnis];
}

export function createLevel12() {
  // Level 12: HARD - Complex maze, 3 objectives, 2 keys, 2 fast enemies
  // Intricate layout requiring careful navigation
  
  gameState.walls = [
    // Outer walls
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 20 },
    { x: 0, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 20, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 20, w: CANVAS_WIDTH, h: 20 },
    
    // Maze structure
    { x: 120, y: 20, w: 20, h: 100 },
    { x: 240, y: 80, w: 20, h: 120 },
    { x: 360, y: 20, w: 20, h: 140 },
    { x: 480, y: 100, w: 20, h: 100 },
    { x: 120, y: 200, w: 20, h: 120 },
    { x: 240, y: 260, w: 20, h: 120 },
    { x: 360, y: 220, w: 20, h: 100 },
    { x: 480, y: 260, w: 20, h: 120 },
    { x: 20, y: 120, w: 100, h: 20 },
    { x: 160, y: 160, w: 80, h: 20 },
    { x: 300, y: 120, w: 60, h: 20 },
    { x: 420, y: 200, w: 60, h: 20 }
  ];

  gameState.doors = [
    new Door(140, 120, 20, 40, true, "key12a"),
    new Door(380, 160, 20, 40, true, "key12b")
  ];

  gameState.items = [
    new Item(60, 60, "key", "key12a", false),
    new Item(540, 340, "key", "key12b", false),
    new Item(180, 240, "objective", "obj12_1", true),
    new Item(420, 60, "objective", "obj12_2", true),
    new Item(300, 340, "objective", "obj12_3", true)
  ];

  gameState.requiredItemIds = ["obj12_1", "obj12_2", "obj12_3"];

  gameState.hidingSpots = [
    new HidingSpot(280, 60, 40, 30, "closet"),
    new HidingSpot(160, 320, 60, 20, "table"),
    new HidingSpot(420, 280, 40, 30, "closet")
  ];

  gameState.exitZone = new ExitZone(500, 40, 60, 60);
  gameState.player = new Player(60, 340);

  // Two fast enemies with overlapping patrols
  gameState.aoOnis = [
    new AoOni(280, 150, 1.5, [
      [280, 150],
      [320, 150],
      [320, 240],
      [280, 240],
      [180, 240],
      [180, 150]
    ]),
    new AoOni(440, 240, 1.5, [
      [440, 240],
      [520, 240],
      [520, 160],
      [400, 160],
      [400, 240]
    ])
  ];
  
  gameState.entities = [gameState.player, ...gameState.aoOnis];
}

export function createLevel13() {
  // Level 13: HARD - Large dark level, 4 objectives, 3 enemies with overlapping patrols
  // Very challenging with darkness and multiple threats
  
  gameState.walls = [
    // Outer walls
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 20 },
    { x: 0, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 20, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 20, w: CANVAS_WIDTH, h: 20 },
    
    // Complex grid layout
    { x: 140, y: 60, w: 20, h: 80 },
    { x: 280, y: 60, w: 20, h: 140 },
    { x: 420, y: 60, w: 20, h: 80 },
    { x: 140, y: 240, w: 20, h: 140 },
    { x: 280, y: 220, w: 20, h: 100 },
    { x: 420, y: 260, w: 20, h: 120 },
    { x: 60, y: 140, w: 80, h: 20 },
    { x: 200, y: 140, w: 80, h: 20 },
    { x: 340, y: 140, w: 80, h: 20 },
    { x: 480, y: 140, w: 80, h: 20 },
    { x: 60, y: 240, w: 80, h: 20 },
    { x: 340, y: 240, w: 80, h: 20 }
  ];

  gameState.doors = [
    new Door(160, 140, 40, 20, false)
  ];

  gameState.items = [
    new Item(80, 80, "objective", "obj13_1", true),
    new Item(520, 80, "objective", "obj13_2", true),
    new Item(80, 320, "objective", "obj13_3", true),
    new Item(520, 320, "objective", "obj13_4", true)
  ];

  gameState.requiredItemIds = ["obj13_1", "obj13_2", "obj13_3", "obj13_4"];

  gameState.hidingSpots = [
    new HidingSpot(180, 60, 40, 30, "closet"),
    new HidingSpot(360, 60, 40, 30, "closet"),
    new HidingSpot(100, 280, 60, 20, "table"),
    new HidingSpot(460, 280, 60, 20, "table")
  ];

  gameState.exitZone = new ExitZone(260, 170, 60, 60);
  gameState.player = new Player(300, 300);

  // Three enemies with dangerous overlapping patrols
  gameState.aoOnis = [
    new AoOni(220, 200, 1.6, [
      [220, 200],
      [220, 100],
      [180, 100],
      [180, 200]
    ]),
    new AoOni(360, 200, 1.6, [
      [360, 200],
      [460, 200],
      [460, 180],
      [360, 180]
    ]),
    new AoOni(300, 320, 1.6, [
      [300, 320],
      [240, 320],
      [240, 260],
      [360, 260],
      [360, 320]
    ])
  ];
  
  gameState.entities = [gameState.player, ...gameState.aoOnis];
}

export function createLevel14() {
  // Level 14: HARD - Final boss level, 5 objectives, 3 fast enemies, most challenging layout
  // Ultimate test of all skills learned
  
  gameState.walls = [
    // Outer walls
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 20 },
    { x: 0, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 20, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 20, w: CANVAS_WIDTH, h: 20 },
    
    // Very complex maze-like structure
    { x: 100, y: 60, w: 20, h: 60 },
    { x: 180, y: 20, w: 20, h: 140 },
    { x: 260, y: 80, w: 20, h: 80 },
    { x: 340, y: 20, w: 20, h: 140 },
    { x: 420, y: 60, w: 20, h: 100 },
    { x: 500, y: 20, w: 20, h: 120 },
    { x: 100, y: 240, w: 20, h: 140 },
    { x: 180, y: 220, w: 20, h: 100 },
    { x: 260, y: 260, w: 20, h: 120 },
    { x: 340, y: 220, w: 20, h: 120 },
    { x: 420, y: 260, w: 20, h: 120 },
    { x: 500, y: 220, w: 20, h: 100 },
    // Horizontal barriers
    { x: 20, y: 120, w: 80, h: 20 },
    { x: 120, y: 160, w: 60, h: 20 },
    { x: 220, y: 140, w: 40, h: 20 },
    { x: 300, y: 160, w: 40, h: 20 },
    { x: 360, y: 140, w: 60, h: 20 },
    { x: 460, y: 160, w: 60, h: 20 },
    { x: 60, y: 240, w: 40, h: 20 },
    { x: 200, y: 260, w: 60, h: 20 },
    { x: 360, y: 280, w: 60, h: 20 },
    { x: 480, y: 240, w: 60, h: 20 }
  ];

  gameState.doors = [
    new Door(200, 160, 20, 40, false)
  ];

  gameState.items = [
    new Item(60, 60, "objective", "obj14_1", true),
    new Item(540, 60, "objective", "obj14_2", true),
    new Item(300, 300, "objective", "obj14_3", true),
    new Item(60, 340, "objective", "obj14_4", true),
    new Item(540, 340, "objective", "obj14_5", true)
  ];

  gameState.requiredItemIds = ["obj14_1", "obj14_2", "obj14_3", "obj14_4", "obj14_5"];

  gameState.hidingSpots = [
    new HidingSpot(140, 40, 40, 30, "closet"),
    new HidingSpot(380, 40, 40, 30, "closet"),
    new HidingSpot(140, 320, 60, 20, "table"),
    new HidingSpot(380, 320, 60, 20, "table"),
    new HidingSpot(240, 200, 40, 30, "closet")
  ];

  gameState.exitZone = new ExitZone(270, 40, 60, 60);
  gameState.player = new Player(300, 200);

  // Three very fast enemies with strategic patrols covering all areas
  gameState.aoOnis = [
    new AoOni(140, 180, 1.7, [
      [140, 180],
      [140, 100],
      [220, 100],
      [220, 180],
      [140, 180]
    ]),
    new AoOni(380, 180, 1.7, [
      [380, 180],
      [460, 180],
      [460, 100],
      [380, 100]
    ]),
    new AoOni(300, 320, 1.7, [
      [300, 320],
      [200, 320],
      [200, 280],
      [400, 280],
      [400, 320],
      [300, 320]
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
    case 9:
      createLevel9();
      break;
    case 10:
      createLevel10();
      break;
    case 11:
      createLevel11();
      break;
    case 12:
      createLevel12();
      break;
    case 13:
      createLevel13();
      break;
    case 14:
      createLevel14();
      break;
  }
}