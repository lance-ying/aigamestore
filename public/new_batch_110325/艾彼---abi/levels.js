// levels.js - Level/Chapter definitions
import { Switch, Crate, Door, TightSpace, Terminal, Wall } from './entities.js';
import { CHAR_ABI, CHAR_DD } from './globals.js';

export function createChapter0(p, gameState) {
  // Tutorial chapter - introduce character-specific switches
  
  gameState.walls = [
    new Wall(0, 0, 800, 20, p),           // Top wall
    new Wall(0, 380, 800, 20, p),         // Bottom wall
    new Wall(0, 0, 20, 400, p),           // Left wall
    new Wall(780, 0, 20, 400, p)          // Right wall
  ];
  
  // Vertical divider creating two paths
  gameState.walls.push(new Wall(300, 20, 20, 150, p));
  gameState.walls.push(new Wall(300, 230, 20, 150, p));
  
  // Upper tight space passage (Abi only)
  gameState.tightSpaces = [
    new TightSpace(320, 80, 25, 60, p)
  ];
  
  // Lower open passage
  gameState.walls.push(new Wall(320, 250, 100, 20, p));
  gameState.walls.push(new Wall(320, 330, 100, 20, p));
  
  // Switch 0: Inside tight space (Abi must activate)
  // Switch 1: In lower area accessible by both, but heavy (DD must activate)
  gameState.switches = [
    new Switch(340, 110, 0, p, CHAR_ABI),
    new Switch(370, 290, 1, p, CHAR_DD)
  ];
  
  // Door requires both switches
  gameState.doors = [
    new Door(500, 200, 20, 80, [0, 1], p)
  ];
  
  // Terminal to complete chapter
  gameState.terminals = [
    new Terminal(650, 200, 0, "Welcome, Abi and DD. Both of you are needed. Systems online.", p)
  ];
  
  // Start positions
  gameState.abi.x = 80;
  gameState.abi.y = 100;
  gameState.dd.x = 80;
  gameState.dd.y = 290;
}

export function createChapter1(p, gameState) {
  // Both characters essential - Abi reaches tight space, DD moves crate and activates heavy switch
  
  gameState.walls = [
    new Wall(0, 0, 1000, 20, p),
    new Wall(0, 480, 1000, 20, p),
    new Wall(0, 0, 20, 500, p),
    new Wall(980, 0, 20, 500, p)
  ];
  
  // Upper section with tight space
  gameState.walls.push(new Wall(200, 20, 20, 200, p));
  gameState.walls.push(new Wall(450, 20, 20, 200, p));
  
  // Lower section - requires crate movement
  gameState.walls.push(new Wall(200, 280, 20, 200, p));
  gameState.walls.push(new Wall(600, 280, 20, 200, p));
  
  // Central horizontal wall
  gameState.walls.push(new Wall(20, 250, 180, 20, p));
  gameState.walls.push(new Wall(620, 250, 360, 20, p));
  
  // Tight space passage (Abi only)
  gameState.tightSpaces = [
    new TightSpace(220, 80, 25, 120, p)
  ];
  
  // Crates blocking path to Switch 1 - DD must push them
  gameState.crates = [
    new Crate(300, 360, p),
    new Crate(350, 360, p),
    new Crate(400, 360, p)
  ];
  
  // Switch 0: Inside tight space (Abi only)
  // Switch 1: Behind crates in lower section (accessible only after DD moves crates)
  // Switch 2: Heavy switch (DD only)
  gameState.switches = [
    new Switch(350, 130, 0, p, CHAR_ABI),
    new Switch(500, 380, 1, p, null),  // Any character, but need DD to clear crates
    new Switch(750, 360, 2, p, CHAR_DD)
  ];
  
  // Door requires all switches
  gameState.doors = [
    new Door(810, 250, 20, 100, [0, 1, 2], p)
  ];
  
  gameState.terminals = [
    new Terminal(900, 250, 1, "Data fragment: Day 347 - Both systems required for operation.", p)
  ];
  
  gameState.abi.x = 80;
  gameState.abi.y = 120;
  gameState.dd.x = 80;
  gameState.dd.y = 360;
}

export function createChapter2(p, gameState) {
  // Complex coordination: DD must create path, Abi uses tight spaces
  
  gameState.walls = [
    new Wall(0, 0, 1100, 20, p),
    new Wall(0, 580, 1100, 20, p),
    new Wall(0, 0, 20, 600, p),
    new Wall(1080, 0, 20, 600, p)
  ];
  
  // Create maze-like structure
  gameState.walls.push(new Wall(200, 20, 20, 250, p));
  gameState.walls.push(new Wall(400, 20, 20, 200, p));
  gameState.walls.push(new Wall(600, 100, 20, 400, p));
  
  gameState.walls.push(new Wall(200, 350, 20, 230, p));
  gameState.walls.push(new Wall(400, 300, 20, 280, p));
  
  // Horizontal barriers
  gameState.walls.push(new Wall(20, 300, 180, 20, p));
  gameState.walls.push(new Wall(220, 200, 180, 20, p));
  gameState.walls.push(new Wall(420, 450, 180, 20, p));
  
  // Tight spaces (Abi only)
  gameState.tightSpaces = [
    new TightSpace(220, 100, 25, 80, p),   // Upper tight space
    new TightSpace(420, 350, 25, 80, p)    // Middle tight space
  ];
  
  // Crates that MUST be pushed by DD to create paths
  gameState.crates = [
    new Crate(280, 450, p),  // Blocks path to switch
    new Crate(330, 450, p),
    new Crate(500, 150, p),  // Blocks another critical path
    new Crate(550, 150, p)
  ];
  
  // Switch 0: In tight space (Abi only)
  // Switch 1: Requires DD to push crates away first
  // Switch 2: In another tight space (Abi only)
  // Switch 3: Heavy switch (DD only)
  gameState.switches = [
    new Switch(300, 140, 0, p, CHAR_ABI),
    new Switch(350, 520, 1, p, null),  // Behind crates
    new Switch(440, 390, 2, p, CHAR_ABI),
    new Switch(750, 280, 3, p, CHAR_DD)
  ];
  
  // Door requires all 4 switches
  gameState.doors = [
    new Door(810, 280, 20, 100, [0, 1, 2, 3], p)
  ];
  
  gameState.terminals = [
    new Terminal(950, 280, 2, "Emergency log: Two-factor authentication required. No single entity can proceed.", p)
  ];
  
  gameState.abi.x = 80;
  gameState.abi.y = 120;
  gameState.dd.x = 80;
  gameState.dd.y = 450;
}

export function createChapter3(p, gameState) {
  // Advanced puzzle requiring strategic coordination
  
  gameState.walls = [
    new Wall(0, 0, 1200, 20, p),
    new Wall(0, 680, 1200, 20, p),
    new Wall(0, 0, 20, 700, p),
    new Wall(1180, 0, 20, 700, p)
  ];
  
  // Complex maze structure
  gameState.walls.push(new Wall(250, 100, 20, 500, p));
  gameState.walls.push(new Wall(500, 20, 20, 300, p));
  gameState.walls.push(new Wall(500, 400, 20, 280, p));
  gameState.walls.push(new Wall(750, 150, 20, 450, p));
  
  // Horizontal dividers
  gameState.walls.push(new Wall(20, 200, 230, 20, p));
  gameState.walls.push(new Wall(20, 450, 230, 20, p));
  gameState.walls.push(new Wall(270, 350, 230, 20, p));
  gameState.walls.push(new Wall(520, 550, 230, 20, p));
  
  // Multiple tight spaces (Abi only access)
  gameState.tightSpaces = [
    new TightSpace(80, 230, 28, 200, p),    // Left area
    new TightSpace(270, 120, 25, 210, p),   // Middle upper
    new TightSpace(520, 420, 25, 110, p)    // Middle lower
  ];
  
  // Strategic crate placement - DD must move these
  gameState.crates = [
    new Crate(350, 500, p),
    new Crate(400, 500, p),
    new Crate(450, 500, p),
    new Crate(620, 250, p),
    new Crate(670, 250, p)
  ];
  
  // Switches requiring both characters:
  // 0: Tight space (Abi)
  // 1: Behind crates (need DD to clear)
  // 2: Another tight space (Abi)
  // 3: Heavy switch in open area (DD)
  // 4: Behind more crates (need DD)
  gameState.switches = [
    new Switch(150, 330, 0, p, CHAR_ABI),
    new Switch(400, 580, 1, p, null),  // Behind crates
    new Switch(380, 220, 2, p, CHAR_ABI),
    new Switch(900, 350, 3, p, CHAR_DD),
    new Switch(650, 300, 4, p, null)  // Behind crates
  ];
  
  // Door requires all 5 switches
  gameState.doors = [
    new Door(960, 350, 20, 100, [0, 1, 2, 3, 4], p)
  ];
  
  gameState.terminals = [
    new Terminal(1080, 350, 3, "Transmission: Dual authorization protocol. Fail-safe requires both units.", p)
  ];
  
  gameState.abi.x = 80;
  gameState.abi.y = 100;
  gameState.dd.x = 140;
  gameState.dd.y = 100;
}

export function createChapter4(p, gameState) {
  // Final complex puzzle - maximum coordination required
  
  gameState.walls = [
    new Wall(0, 0, 1200, 20, p),
    new Wall(0, 780, 1200, 20, p),
    new Wall(0, 0, 20, 800, p),
    new Wall(1180, 0, 20, 800, p)
  ];
  
  // Intricate maze requiring both characters
  gameState.walls.push(new Wall(280, 100, 20, 600, p));
  gameState.walls.push(new Wall(560, 20, 20, 350, p));
  gameState.walls.push(new Wall(560, 450, 20, 330, p));
  gameState.walls.push(new Wall(840, 100, 20, 600, p));
  
  // Horizontal barriers creating complex paths
  gameState.walls.push(new Wall(20, 200, 260, 20, p));
  gameState.walls.push(new Wall(20, 500, 260, 20, p));
  gameState.walls.push(new Wall(300, 250, 260, 20, p));
  gameState.walls.push(new Wall(300, 600, 260, 20, p));
  gameState.walls.push(new Wall(580, 400, 260, 20, p));
  
  // Tight spaces for Abi-only access
  gameState.tightSpaces = [
    new TightSpace(80, 230, 28, 250, p),    // Far left
    new TightSpace(300, 100, 25, 130, p),   // Upper middle
    new TightSpace(300, 520, 28, 60, p),    // Lower middle
    new TightSpace(860, 480, 25, 200, p)    // Far right lower
  ];
  
  // Many crates that DD must strategically move
  gameState.crates = [
    new Crate(380, 350, p),
    new Crate(430, 350, p),
    new Crate(480, 350, p),
    new Crate(680, 180, p),
    new Crate(730, 180, p),
    new Crate(680, 650, p),
    new Crate(730, 650, p),
    new Crate(780, 650, p)
  ];
  
  // 6 switches requiring strategic use of both characters:
  gameState.switches = [
    new Switch(150, 340, 0, p, CHAR_ABI),   // Deep in tight space
    new Switch(450, 420, 1, p, null),       // Behind crates
    new Switch(320, 180, 2, p, CHAR_ABI),   // Tight space upper
    new Switch(750, 230, 3, p, null),       // Behind crates
    new Switch(900, 580, 4, p, CHAR_ABI),   // Tight space lower
    new Switch(1000, 350, 5, p, CHAR_DD)    // Heavy switch
  ];
  
  // Final door requires all 6 switches
  gameState.doors = [
    new Door(1050, 350, 20, 120, [0, 1, 2, 3, 4, 5], p)
  ];
  
  gameState.terminals = [
    new Terminal(1120, 350, 4, "THE TRUTH: Humanity uploaded consciousness. Abi and DD - their legacy guardians. Both essential.", p)
  ];
  
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