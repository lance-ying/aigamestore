// levels.js - Level data and management
import { gameState, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Door, Item, HidingSpot, ExitZone } from './entities.js';
import { AoOni } from './aooni.js';
import { Player } from './player.js';

export function createLevel1() {
  gameState.walls = [
    // Outer walls
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 20 },
    { x: 0, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 20, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 20, w: CANVAS_WIDTH, h: 20 },
    
    // Interior walls
    { x: 250, y: 50, w: 20, h: 150 },
    { x: 250, y: 250, w: 20, h: 100 },
    { x: 100, y: 200, w: 150, h: 20 }
  ];

  gameState.doors = [
    new Door(250, 200, 20, 50, true, "key1")
  ];

  gameState.items = [
    new Item(450, 100, "key", "key1", false),
    new Item(150, 300, "objective", "obj1_1", true)
  ];

  // Define required items for this level
  gameState.requiredItemIds = ["obj1_1"];

  gameState.hidingSpots = [
    new HidingSpot(80, 80, 40, 30, "closet"),
    new HidingSpot(450, 300, 60, 20, "table")
  ];

  gameState.exitZone = new ExitZone(500, 50, 80, 80);

  gameState.player = new Player(50, 50);

  gameState.aoOnis = [
    new AoOni(350, 150, 1.0, [
      [350, 150],
      [450, 150],
      [450, 250],
      [350, 250]
    ])
  ];
  
  gameState.entities = [gameState.player, ...gameState.aoOnis];
}

export function createLevel2() {
  gameState.walls = [
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 20 },
    { x: 0, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 20, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 20, w: CANVAS_WIDTH, h: 20 },
    
    { x: 200, y: 50, w: 20, h: 150 },
    { x: 400, y: 200, w: 20, h: 150 },
    { x: 200, y: 200, w: 200, h: 20 }
  ];

  gameState.doors = [
    new Door(200, 200, 20, 40, false)
  ];

  gameState.items = [
    new Item(100, 300, "objective", "obj2_1", true),
    new Item(500, 100, "objective", "obj2_2", true)
  ];

  // Define required items for this level
  gameState.requiredItemIds = ["obj2_1", "obj2_2"];

  gameState.hidingSpots = [
    new HidingSpot(50, 250, 40, 30, "closet"),
    new HidingSpot(450, 300, 60, 20, "table"),
    new HidingSpot(500, 250, 40, 30, "closet")
  ];

  gameState.exitZone = new ExitZone(300, 50, 80, 80);

  gameState.player = new Player(50, 50);

  gameState.aoOnis = [
    new AoOni(300, 300, 1.2, [
      [300, 300],
      [300, 100],
      [500, 100],
      [500, 300]
    ])
  ];
  
  gameState.entities = [gameState.player, ...gameState.aoOnis];
}

export function createLevel3() {
  gameState.walls = [
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 20 },
    { x: 0, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 20, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 20, w: CANVAS_WIDTH, h: 20 },
    
    { x: 150, y: 20, w: 20, h: 180 },
    { x: 300, y: 100, w: 20, h: 100 },
    { x: 450, y: 20, w: 20, h: 180 },
    { x: 150, y: 200, w: 150, h: 20 },
    { x: 320, y: 200, w: 130, h: 20 }
  ];

  gameState.doors = [
    new Door(150, 80, 20, 40, true, "key3a"),
    new Door(300, 100, 20, 40, true, "key3b")
  ];

  gameState.items = [
    new Item(100, 100, "key", "key3a", false),
    new Item(500, 300, "key", "key3b", false),
    new Item(220, 250, "objective", "obj3_1", true),
    new Item(380, 280, "objective", "obj3_2", true)
  ];

  // Define required items for this level
  gameState.requiredItemIds = ["obj3_1", "obj3_2"];

  gameState.hidingSpots = [
    new HidingSpot(50, 250, 40, 30, "closet"),
    new HidingSpot(350, 50, 60, 20, "table"),
    new HidingSpot(500, 100, 40, 30, "closet")
  ];

  gameState.exitZone = new ExitZone(200, 250, 80, 80);

  gameState.player = new Player(50, 50);

  gameState.aoOnis = [
    new AoOni(250, 250, 1.3, [
      [250, 250],
      [250, 100],
      [400, 100]
    ]),
    new AoOni(350, 300, 1.0, [
      [350, 300],
      [500, 300],
      [500, 150]
    ])
  ];
  
  gameState.entities = [gameState.player, ...gameState.aoOnis];
}

export function createLevel4() {
  gameState.walls = [
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 20 },
    { x: 0, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 20, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 20, w: CANVAS_WIDTH, h: 20 },
    
    { x: 100, y: 20, w: 20, h: 120 },
    { x: 200, y: 80, w: 20, h: 120 },
    { x: 300, y: 20, w: 20, h: 120 },
    { x: 400, y: 80, w: 20, h: 120 },
    { x: 100, y: 200, w: 120, h: 20 },
    { x: 300, y: 250, w: 120, h: 20 }
  ];

  gameState.doors = [
    new Door(200, 140, 20, 40, false)
  ];

  gameState.items = [
    new Item(50, 300, "flashlight", "flashlight", false),
    new Item(450, 250, "objective", "obj4_1", true),
    new Item(350, 50, "objective", "obj4_2", true),
    new Item(150, 300, "objective", "obj4_3", true)
  ];

  // Define required items for this level (3 objectives)
  gameState.requiredItemIds = ["obj4_1", "obj4_2", "obj4_3"];

  gameState.hidingSpots = [
    new HidingSpot(250, 50, 40, 30, "closet"),
    new HidingSpot(150, 300, 60, 20, "table")
  ];

  gameState.exitZone = new ExitZone(500, 300, 80, 80);

  gameState.player = new Player(50, 50);

  gameState.aoOnis = [
    new AoOni(300, 300, 1.5, [
      [300, 300],
      [150, 300],
      [150, 150],
      [350, 150],
      [350, 300]
    ])
  ];
  
  gameState.entities = [gameState.player, ...gameState.aoOnis];
}

export function createLevel5() {
  gameState.walls = [
    { x: 0, y: 0, w: CANVAS_WIDTH, h: 20 },
    { x: 0, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: CANVAS_WIDTH - 20, y: 0, w: 20, h: CANVAS_HEIGHT },
    { x: 0, y: CANVAS_HEIGHT - 20, w: CANVAS_WIDTH, h: 20 },
    
    { x: 120, y: 20, w: 20, h: 100 },
    { x: 180, y: 80, w: 20, h: 100 },
    { x: 240, y: 20, w: 20, h: 100 },
    { x: 300, y: 80, w: 20, h: 100 },
    { x: 360, y: 20, w: 20, h: 100 },
    { x: 420, y: 80, w: 20, h: 100 },
    { x: 120, y: 200, w: 100, h: 20 },
    { x: 280, y: 240, w: 100, h: 20 },
    { x: 420, y: 200, w: 100, h: 20 }
  ];

  gameState.doors = [
    new Door(240, 120, 20, 40, true, "key5a"),
    new Door(360, 120, 20, 40, true, "key5b")
  ];

  gameState.items = [
    new Item(80, 150, "key", "key5a", false),
    new Item(520, 150, "key", "key5b", false),
    new Item(300, 300, "objective", "obj5_1", true),
    new Item(150, 280, "objective", "obj5_2", true),
    new Item(450, 280, "objective", "obj5_3", true)
  ];

  // Define required items for this level (3 objectives for final level)
  gameState.requiredItemIds = ["obj5_1", "obj5_2", "obj5_3"];

  gameState.hidingSpots = [
    new HidingSpot(50, 250, 40, 30, "closet"),
    new HidingSpot(300, 50, 60, 20, "table"),
    new HidingSpot(500, 250, 40, 30, "closet")
  ];

  gameState.exitZone = new ExitZone(250, 50, 100, 60);

  gameState.player = new Player(50, 50);

  gameState.aoOnis = [
    new AoOni(200, 250, 1.6, [
      [200, 250],
      [200, 150],
      [350, 150],
      [350, 250]
    ]),
    new AoOni(400, 300, 1.4, [
      [400, 300],
      [500, 300],
      [500, 150],
      [400, 150]
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