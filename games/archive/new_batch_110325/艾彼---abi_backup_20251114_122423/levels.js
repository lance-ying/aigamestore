// levels.js - Level/Chapter definitions
import { Switch, Crate, Door, TightSpace, Terminal, Wall } from './entities.js';

export function createChapter0(p, gameState) {
  // Tutorial chapter - basic movement and interaction
  // Simple linear puzzle to teach mechanics
  
  gameState.walls = [
    new Wall(0, 0, 800, 20, p),           // Top wall
    new Wall(0, 380, 800, 20, p),         // Bottom wall
    new Wall(0, 0, 20, 400, p),           // Left wall
    new Wall(780, 0, 20, 400, p)          // Right wall
  ];
  
  // Simple corridor with one barrier
  gameState.walls.push(new Wall(300, 100, 20, 120, p));
  gameState.walls.push(new Wall(300, 280, 20, 100, p));
  
  // One switch to teach interaction
  gameState.switches = [
    new Switch(150, 200, 0, p)
  ];
  
  // Door that opens when switch is activated
  gameState.doors = [
    new Door(310, 230, 20, 60, [0], p)
  ];
  
  // Terminal to complete chapter
  gameState.terminals = [
    new Terminal(650, 200, 0, "Welcome, Abi. Systems online. Initiating exploration protocol.", p)
  ];
  
  // Start positions
  gameState.abi.x = 80;
  gameState.abi.y = 200;
  gameState.dd.x = 80;
  gameState.dd.y = 250;
}

export function createChapter1(p, gameState) {
  // Introduce character switching: Abi must use tight space, DD opens main path
  
  gameState.walls = [
    new Wall(0, 0, 900, 20, p),
    new Wall(0, 480, 900, 20, p),
    new Wall(0, 0, 20, 500, p),
    new Wall(880, 0, 20, 500, p)
  ];
  
  // Create two parallel paths
  // Upper path has tight space
  gameState.walls.push(new Wall(200, 20, 20, 180, p));
  gameState.walls.push(new Wall(400, 20, 20, 180, p));
  
  // Lower path is wider
  gameState.walls.push(new Wall(200, 300, 20, 180, p));
  gameState.walls.push(new Wall(400, 300, 20, 180, p));
  
  // Central divider
  gameState.walls.push(new Wall(20, 240, 180, 20, p));
  gameState.walls.push(new Wall(420, 240, 280, 20, p));
  
  // Tight space in upper path - only Abi can access
  gameState.tightSpaces = [
    new TightSpace(220, 80, 25, 100, p)
  ];
  
  // Switch 0: Inside tight space (Abi must activate)
  gameState.switches = [
    new Switch(310, 120, 0, p),
    new Switch(550, 360, 1, p)  // Switch 1: In lower path (either character)
  ];
  
  // Door requires both switches
  gameState.doors = [
    new Door(710, 240, 20, 100, [0, 1], p)
  ];
  
  gameState.terminals = [
    new Terminal(800, 250, 1, "Data fragment recovered: Day 347 - Population declining rapidly.", p)
  ];
  
  gameState.abi.x = 80;
  gameState.abi.y = 120;
  gameState.dd.x = 80;
  gameState.dd.y = 360;
}

export function createChapter2(p, gameState) {
  // Introduce crate pushing: DD must push crate to access switch, Abi uses tight space
  
  gameState.walls = [
    new Wall(0, 0, 1000, 20, p),
    new Wall(0, 580, 1000, 20, p),
    new Wall(0, 0, 20, 600, p),
    new Wall(980, 0, 20, 600, p)
  ];
  
  // Upper section
  gameState.walls.push(new Wall(200, 20, 20, 250, p));
  gameState.walls.push(new Wall(500, 20, 20, 250, p));
  
  // Lower section
  gameState.walls.push(new Wall(200, 350, 20, 230, p));
  gameState.walls.push(new Wall(500, 350, 20, 230, p));
  
  // Horizontal divider
  gameState.walls.push(new Wall(20, 300, 180, 20, p));
  gameState.walls.push(new Wall(520, 300, 280, 20, p));
  
  // Crate blocking access to Switch 0 - DD must push it away
  gameState.crates = [
    new Crate(350, 150, p)  // Blocks path to switch
  ];
  
  // Switch 0: Behind crate in upper path (need DD to move crate)
  // Switch 1: In tight space in lower section (need Abi)
  gameState.switches = [
    new Switch(420, 150, 0, p),
    new Switch(350, 480, 1, p)
  ];
  
  // Tight space leading to Switch 1
  gameState.tightSpaces = [
    new TightSpace(220, 420, 30, 100, p)
  ];
  
  // Door requires both switches
  gameState.doors = [
    new Door(710, 300, 20, 100, [0, 1], p)
  ];
  
  gameState.terminals = [
    new Terminal(850, 300, 2, "Log entry: Emergency evacuation protocol activated. Reason unknown.", p)
  ];
  
  gameState.abi.x = 80;
  gameState.abi.y = 450;
  gameState.dd.x = 80;
  gameState.dd.y = 150;
}

export function createChapter3(p, gameState) {
  // Complex puzzle: 3 switches requiring strategic use of both characters
  
  gameState.walls = [
    new Wall(0, 0, 1100, 20, p),
    new Wall(0, 680, 1100, 20, p),
    new Wall(0, 0, 20, 700, p),
    new Wall(1080, 0, 20, 700, p)
  ];
  
  // Create three distinct rooms/areas
  // Left area
  gameState.walls.push(new Wall(250, 100, 20, 500, p));
  
  // Middle area walls
  gameState.walls.push(new Wall(550, 20, 20, 300, p));
  gameState.walls.push(new Wall(550, 380, 20, 300, p));
  
  // Right area wall
  gameState.walls.push(new Wall(850, 100, 20, 500, p));
  
  // Horizontal dividers to create passages
  gameState.walls.push(new Wall(20, 200, 230, 20, p));
  gameState.walls.push(new Wall(20, 480, 230, 20, p));
  gameState.walls.push(new Wall(270, 350, 280, 20, p));
  
  // Crates blocking access to Switch 1
  gameState.crates = [
    new Crate(350, 500, p),  // DD must push to access switch
    new Crate(450, 500, p)
  ];
  
  // Switch 0: In tight space (Abi only)
  // Switch 1: Behind crates (DD must push)
  // Switch 2: In tight space in different area (Abi only)
  gameState.switches = [
    new Switch(150, 350, 0, p),   // In tight space left area
    new Switch(450, 580, 1, p),   // Behind crates middle area
    new Switch(700, 550, 2, p)    // In tight space right area
  ];
  
  // Tight spaces for Abi
  gameState.tightSpaces = [
    new TightSpace(80, 250, 25, 200, p),    // Left area tight space
    new TightSpace(580, 450, 30, 180, p)    // Right area tight space
  ];
  
  // Door requires all 3 switches
  gameState.doors = [
    new Door(860, 340, 20, 80, [0, 1, 2], p)
  ];
  
  gameState.terminals = [
    new Terminal(970, 340, 3, "Final transmission: They came from within. Not external threat.", p)
  ];
  
  gameState.abi.x = 80;
  gameState.abi.y = 100;
  gameState.dd.x = 140;
  gameState.dd.y = 100;
}

export function createChapter4(p, gameState) {
  // Final chapter - most complex puzzle requiring strategic coordination
  
  gameState.walls = [
    new Wall(0, 0, 1200, 20, p),
    new Wall(0, 780, 1200, 20, p),
    new Wall(0, 0, 20, 800, p),
    new Wall(1180, 0, 20, 800, p)
  ];
  
  // Complex maze with 4 distinct areas
  // Vertical dividers
  gameState.walls.push(new Wall(280, 100, 20, 600, p));
  gameState.walls.push(new Wall(580, 20, 20, 350, p));
  gameState.walls.push(new Wall(580, 450, 20, 330, p));
  gameState.walls.push(new Wall(880, 100, 20, 600, p));
  
  // Horizontal dividers creating passages
  gameState.walls.push(new Wall(20, 200, 260, 20, p));
  gameState.walls.push(new Wall(20, 500, 260, 20, p));
  gameState.walls.push(new Wall(300, 400, 280, 20, p));
  gameState.walls.push(new Wall(600, 600, 280, 20, p));
  
  // Strategic crate placement - DD must push these
  gameState.crates = [
    new Crate(400, 250, p),   // Blocks path to Switch 1
    new Crate(460, 250, p),   // Must be moved for access
    new Crate(700, 150, p)    // Blocks another path
  ];
  
  // 4 switches in strategic locations:
  // Switch 0: Deep in tight space (Abi only)
  // Switch 1: Behind crates (DD must clear path)
  // Switch 2: In another tight space (Abi only)
  // Switch 3: Open area but requires navigation
  gameState.switches = [
    new Switch(150, 350, 0, p),   // In tight space, left area
    new Switch(500, 250, 1, p),   // Behind crates, middle area
    new Switch(720, 650, 2, p),   // In tight space, lower right
    new Switch(1000, 350, 3, p)   // Open area, far right
  ];
  
  // Tight spaces that only Abi can navigate
  gameState.tightSpaces = [
    new TightSpace(80, 250, 28, 180, p),    // Left area (access Switch 0)
    new TightSpace(600, 480, 25, 100, p),   // Middle passage
    new TightSpace(900, 640, 30, 100, p)    // Lower right (access Switch 2)
  ];
  
  // Final door requires all 4 switches
  gameState.doors = [
    new Door(1090, 350, 20, 100, [0, 1, 2, 3], p)
  ];
  
  gameState.terminals = [
    new Terminal(1120, 350, 4, "THE TRUTH: Humanity uploaded consciousness. They live on digitally. We are their legacy.", p)
  ];
  
  // Start both characters together
  gameState.abi.x = 100;
  gameState.abi.y = 100;
  gameState.dd.x = 160;
  gameState.dd.y = 100;
}

export function loadChapter(chapterIndex, p, gameState) {
  // Clear previous chapter state
  gameState.switches = [];
  gameState.crates = [];
  gameState.doors = [];
  gameState.tightSpaces = [];
  gameState.terminals = [];
  gameState.walls = [];
  
  // Load new chapter
  switch(chapterIndex) {
    case 0: createChapter0(p, gameState); break;
    case 1: createChapter1(p, gameState); break;
    case 2: createChapter2(p, gameState); break;
    case 3: createChapter3(p, gameState); break;
    case 4: createChapter4(p, gameState); break;
  }
  
  gameState.currentChapter = chapterIndex;
}