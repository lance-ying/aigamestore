// levels.js - Level data and management
import { gameState, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Door, Item, HidingSpot, ExitZone } from './entities.js';
import { AoOni } from './aooni.js';
import { Player } from './player.js';

export function createLevel1() {
  // Level 1: VERY EASY - Open layout, no enemies, 1 objective in clear view
  // Tutorial level to learn basic movement and objective collection
  
  gameState.walls = [
    // Outer walls only
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 20 },
    { x: 0, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 20, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 20, w: CANVAS_WIDTH, h: 20 },
    
    // Just a few small decorative walls that don't block paths
    { x: 150, y: 100, w: 20, h: 40 },
    { x: 400, y: 250, w: 20, h: 40 }
  ];

  gameState.doors = [];

  gameState.items = [
    // Single objective in clear open area
    new Item(450, 150, "objective", "obj1_1", true)
  ];

  gameState.requiredItemIds = ["obj1_1"];

  gameState.hidingSpots = [
    new HidingSpot(250, 200, 40, 30, "closet")
  ];

  // Exit near starting position for easy access once objective is collected
  gameState.exitZone = new ExitZone(500, 320, 80, 60);

  gameState.player = new Player(80, 200);

  // NO enemies in first level
  gameState.aoOnis = [];
  
  gameState.entities = [gameState.player];
}

export function createLevel2() {
  // Level 2: VERY EASY - Simple two-room layout, one very slow enemy, 1 objective
  // Introduces enemy but in a safe, predictable way
  
  gameState.walls = [
    // Outer walls
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 20 },
    { x: 0, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 20, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 20, w: CANVAS_WIDTH, h: 20 },
    
    // One dividing wall with wide opening
    { x: 280, y: 20, w: 20, h: 140 },
    { x: 280, y: 240, w: 20, h: 140 }
  ];

  gameState.doors = [];

  gameState.items = [
    // Objective in right room, far from enemy
    new Item(480, 100, "objective", "obj2_1", true)
  ];

  gameState.requiredItemIds = ["obj2_1"];

  gameState.hidingSpots = [
    new HidingSpot(100, 100, 40, 30, "closet"),
    new HidingSpot(400, 280, 40, 30, "closet")
  ];

  gameState.exitZone = new ExitZone(50, 320, 80, 60);
  gameState.player = new Player(80, 100);

  // Very slow enemy in left room, away from objective
  gameState.aoOnis = [
    new AoOni(120, 300, 0.7, [
      [120, 300],
      [200, 300],
      [200, 250],
      [120, 250]
    ])
  ];
  
  gameState.entities = [gameState.player, ...gameState.aoOnis];
}

export function createLevel3() {
  // Level 3: VERY EASY - Introduces keys, simple unlocked door, 1 key, 1 objective
  // Wide open paths, slow enemy
  
  gameState.walls = [
    // Outer walls
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 20 },
    { x: 0, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 20, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 20, w: CANVAS_WIDTH, h: 20 },
    
    // Simple L-shaped divider
    { x: 260, y: 20, w: 20, h: 160 },
    { x: 20, y: 180, w: 260, h: 20 }
  ];

  // Unlocked door for easy passage (introduces door mechanic)
  gameState.doors = [
    new Door(260, 180, 20, 60, false)
  ];

  gameState.items = [
    // Key in accessible location
    new Item(120, 100, "key", "key3", false),
    // Objective after door
    new Item(450, 250, "objective", "obj3_1", true)
  ];

  gameState.requiredItemIds = ["obj3_1"];

  gameState.hidingSpots = [
    new HidingSpot(350, 100, 40, 30, "closet"),
    new HidingSpot(100, 300, 40, 30, "closet")
  ];

  gameState.exitZone = new ExitZone(480, 50, 80, 60);
  gameState.player = new Player(80, 80);

  // Slow enemy in bottom area
  gameState.aoOnis = [
    new AoOni(150, 300, 0.8, [
      [150, 300],
      [220, 300],
      [220, 240],
      [150, 240]
    ])
  ];
  
  gameState.entities = [gameState.player, ...gameState.aoOnis];
}

export function createLevel4() {
  // Level 4: VERY EASY - Two objectives, no locked doors, one slow enemy
  // Open layout with clear paths to both objectives
  
  gameState.walls = [
    // Outer walls
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 20 },
    { x: 0, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 20, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 20, w: CANVAS_WIDTH, h: 20 },
    
    // Minimal walls creating simple corridors
    { x: 200, y: 120, w: 20, h: 80 },
    { x: 380, y: 180, w: 20, h: 80 }
  ];

  gameState.doors = [];

  gameState.items = [
    // Two objectives in opposite corners, away from enemy
    new Item(100, 80, "objective", "obj4_1", true),
    new Item(500, 320, "objective", "obj4_2", true)
  ];

  gameState.requiredItemIds = ["obj4_1", "obj4_2"];

  gameState.hidingSpots = [
    new HidingSpot(280, 60, 60, 20, "table"),
    new HidingSpot(300, 320, 40, 30, "closet")
  ];

  gameState.exitZone = new ExitZone(260, 160, 80, 80);
  gameState.player = new Player(300, 200);

  // Slow enemy patrolling middle area
  gameState.aoOnis = [
    new AoOni(320, 240, 0.9, [
      [320, 240],
      [420, 240],
      [420, 200],
      [320, 200]
    ])
  ];
  
  gameState.entities = [gameState.player, ...gameState.aoOnis];
}

export function createLevel5() {
  // Level 5: MEDIUM - Original Level 1 design
  // Player starts in left room, needs key from top-left corner
  // Door blocks passage to right side where objective is located AWAY from enemy
  
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

  gameState.doors = [
    new Door(280, 160, 20, 60, true, "key5")
  ];

  gameState.items = [
    new Item(60, 50, "key", "key5", false),
    new Item(520, 60, "objective", "obj5_1", true)
  ];

  gameState.requiredItemIds = ["obj5_1"];

  gameState.hidingSpots = [
    new HidingSpot(50, 280, 40, 30, "closet"),
    new HidingSpot(350, 50, 40, 30, "closet")
  ];

  gameState.exitZone = new ExitZone(480, 320, 80, 60);
  gameState.player = new Player(50, 180);

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

export function createLevel6() {
  // Level 6: MEDIUM - Original Level 2 design
  // Two-room layout with careful item placement
  
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

  gameState.doors = [
    new Door(260, 200, 80, 20, false)
  ];

  gameState.items = [
    new Item(60, 60, "objective", "obj6_1", true),
    new Item(520, 340, "objective", "obj6_2", true)
  ];

  gameState.requiredItemIds = ["obj6_1", "obj6_2"];

  gameState.hidingSpots = [
    new HidingSpot(140, 50, 40, 30, "closet"),
    new HidingSpot(300, 320, 60, 20, "table"),
    new HidingSpot(440, 320, 40, 30, "closet")
  ];

  gameState.exitZone = new ExitZone(480, 40, 80, 60);
  gameState.player = new Player(50, 340);

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

export function createLevel7() {
  // Level 7: MEDIUM - Original Level 3 design
  // Three-room maze with 2 keys and 2 objectives
  
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

  gameState.doors = [
    new Door(200, 160, 20, 60, true, "key7a"),
    new Door(380, 160, 20, 60, true, "key7b")
  ];

  gameState.items = [
    new Item(60, 60, "key", "key7a", false),
    new Item(520, 340, "key", "key7b", false),
    new Item(280, 280, "objective", "obj7_1", true),
    new Item(460, 60, "objective", "obj7_2", true)
  ];

  gameState.requiredItemIds = ["obj7_1", "obj7_2"];

  gameState.hidingSpots = [
    new HidingSpot(50, 280, 40, 30, "closet"),
    new HidingSpot(250, 50, 60, 20, "table"),
    new HidingSpot(500, 180, 40, 30, "closet")
  ];

  gameState.exitZone = new ExitZone(260, 320, 80, 60);
  gameState.player = new Player(50, 340);

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

export function createLevel8() {
  // Level 8: HARD - Original Level 4 design
  // Dark level with flashlight (3 objectives)
  
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
    new Item(80, 60, "flashlight", "flashlight8", false),
    new Item(340, 60, "objective", "obj8_1", true),
    new Item(120, 340, "objective", "obj8_2", true),
    new Item(520, 340, "objective", "obj8_3", true)
  ];

  gameState.requiredItemIds = ["obj8_1", "obj8_2", "obj8_3"];

  gameState.hidingSpots = [
    new HidingSpot(220, 50, 40, 30, "closet"),
    new HidingSpot(340, 320, 60, 20, "table"),
    new HidingSpot(480, 50, 40, 30, "closet")
  ];

  gameState.exitZone = new ExitZone(340, 160, 80, 80);
  gameState.player = new Player(50, 180);

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

export function createLevel9() {
  // Level 9: HARD - Original Level 5 design
  // Final challenge with 2 keys, 3 objectives, 2 fast enemies
  
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

  gameState.doors = [
    new Door(160, 140, 20, 60, true, "key9a"),
    new Door(420, 140, 20, 60, true, "key9b")
  ];

  gameState.items = [
    new Item(80, 60, "key", "key9a", false),
    new Item(520, 60, "key", "key9b", false),
    new Item(300, 60, "objective", "obj9_1", true),
    new Item(80, 320, "objective", "obj9_2", true),
    new Item(520, 320, "objective", "obj9_3", true)
  ];

  gameState.requiredItemIds = ["obj9_1", "obj9_2", "obj9_3"];

  gameState.hidingSpots = [
    new HidingSpot(50, 240, 40, 30, "closet"),
    new HidingSpot(220, 260, 60, 20, "table"),
    new HidingSpot(360, 260, 60, 20, "table"),
    new HidingSpot(500, 240, 40, 30, "closet")
  ];

  gameState.exitZone = new ExitZone(250, 30, 100, 60);
  gameState.player = new Player(50, 180);

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

export function createLevel10() {
  // Level 10: MEDIUM - Original Level 6 design
  // Simple open layout, one slow enemy, 1 objective
  
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
    new Item(520, 60, "objective", "obj10_1", true)
  ];

  gameState.requiredItemIds = ["obj10_1"];

  gameState.hidingSpots = [
    new HidingSpot(100, 100, 40, 30, "closet"),
    new HidingSpot(450, 280, 60, 20, "table")
  ];

  gameState.exitZone = new ExitZone(50, 320, 80, 60);
  gameState.player = new Player(50, 60);

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

export function createLevel11() {
  // Level 11: MEDIUM - Original Level 7 design
  // Two rooms, one slow enemy, 1 key and 1 objective
  
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
    new Door(300, 200, 20, 60, true, "key11")
  ];

  gameState.items = [
    new Item(120, 300, "key", "key11", false),
    new Item(480, 80, "objective", "obj11_1", true)
  ];

  gameState.requiredItemIds = ["obj11_1"];

  gameState.hidingSpots = [
    new HidingSpot(60, 80, 40, 30, "closet"),
    new HidingSpot(400, 280, 40, 30, "closet")
  ];

  gameState.exitZone = new ExitZone(500, 320, 60, 60);
  gameState.player = new Player(60, 60);

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

export function createLevel12() {
  // Level 12: MEDIUM - Original Level 8 design
  // Simple maze, one enemy, 2 objectives
  
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
    new Item(80, 80, "objective", "obj12_1", true),
    new Item(520, 320, "objective", "obj12_2", true)
  ];

  gameState.requiredItemIds = ["obj12_1", "obj12_2"];

  gameState.hidingSpots = [
    new HidingSpot(480, 60, 40, 30, "closet"),
    new HidingSpot(60, 300, 40, 30, "closet"),
    new HidingSpot(340, 100, 60, 20, "table")
  ];

  gameState.exitZone = new ExitZone(500, 80, 60, 60);
  gameState.player = new Player(340, 260);

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

export function createLevel13() {
  // Level 13: HARD - Original Level 9 design
  // More complex layout, 2 objectives, 1 faster enemy
  
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
    new Item(80, 100, "objective", "obj13_1", true),
    new Item(520, 300, "objective", "obj13_2", true)
  ];

  gameState.requiredItemIds = ["obj13_1", "obj13_2"];

  gameState.hidingSpots = [
    new HidingSpot(180, 60, 40, 30, "closet"),
    new HidingSpot(350, 280, 60, 20, "table"),
    new HidingSpot(500, 100, 40, 30, "closet")
  ];

  gameState.exitZone = new ExitZone(340, 50, 80, 60);
  gameState.player = new Player(50, 280);

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

export function createLevel14() {
  // Level 14: HARD - Original Level 10 design (FINAL LEVEL)
  // Multi-room with 2 keys, 2 objectives, 1 enemy
  
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
    new Door(180, 180, 20, 40, true, "key14a"),
    new Door(400, 180, 20, 40, true, "key14b")
  ];

  gameState.items = [
    new Item(80, 80, "key", "key14a", false),
    new Item(520, 320, "key", "key14b", false),
    new Item(280, 100, "objective", "obj14_1", true),
    new Item(280, 300, "objective", "obj14_2", true)
  ];

  gameState.requiredItemIds = ["obj14_1", "obj14_2"];

  gameState.hidingSpots = [
    new HidingSpot(60, 260, 40, 30, "closet"),
    new HidingSpot(480, 60, 40, 30, "closet"),
    new HidingSpot(240, 240, 60, 20, "table")
  ];

  gameState.exitZone = new ExitZone(480, 260, 80, 60);
  gameState.player = new Player(80, 340);

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