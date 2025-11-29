// levels.js - Level/Chapter definitions
import { Switch, Crate, Door, TightSpace, Terminal, Wall } from './entities.js';

export function createChapter0(p, gameState) {
  // Tutorial chapter - basic movement and switch puzzle
  // Create a simple corridor with a switch and door
  
  // Outer walls
  gameState.walls = [
    new Wall(0, 0, 800, 20, p),           // Top wall
    new Wall(0, 380, 800, 20, p),         // Bottom wall
    new Wall(0, 0, 20, 400, p),           // Left wall
    new Wall(780, 0, 20, 400, p)          // Right wall
  ];
  
  // Inner walls to create corridor
  gameState.walls.push(new Wall(250, 100, 20, 100, p));
  gameState.walls.push(new Wall(250, 280, 20, 100, p));
  
  gameState.switches = [
    new Switch(150, 200, 0, p)
  ];
  
  gameState.doors = [
    new Door(260, 200, 20, 80, [0], p)
  ];
  
  gameState.terminals = [
    new Terminal(650, 200, 0, "Welcome, Abi. Systems online. Initiating exploration protocol.", p)
  ];
  
  gameState.abi.x = 80;
  gameState.abi.y = 200;
  gameState.dd.x = 80;
  gameState.dd.y = 250;
}

export function createChapter1(p, gameState) {
  // Character switching and tight spaces puzzle
  
  // Create maze-like structure
  gameState.walls = [
    new Wall(0, 0, 900, 20, p),           // Top wall
    new Wall(0, 480, 900, 20, p),         // Bottom wall
    new Wall(0, 0, 20, 500, p),           // Left wall
    new Wall(880, 0, 20, 500, p)          // Right wall
  ];
  
  // Create rooms and corridors
  gameState.walls.push(new Wall(200, 100, 20, 200, p));
  gameState.walls.push(new Wall(400, 200, 20, 280, p));
  gameState.walls.push(new Wall(600, 20, 20, 250, p));
  
  // Horizontal dividers
  gameState.walls.push(new Wall(20, 150, 180, 20, p));
  gameState.walls.push(new Wall(420, 300, 180, 20, p));
  
  gameState.switches = [
    new Switch(120, 250, 0, p),
    new Switch(500, 400, 1, p)
  ];
  
  gameState.crates = [
    new Crate(300, 250, p)
  ];
  
  gameState.doors = [
    new Door(610, 350, 20, 80, [0, 1], p)
  ];
  
  // Tight space that only Abi can access
  gameState.tightSpaces = [
    new TightSpace(420, 350, 30, 60, p)
  ];
  
  gameState.terminals = [
    new Terminal(750, 250, 1, "Data fragment recovered: Day 347 - Population declining rapidly.", p)
  ];
  
  gameState.abi.x = 80;
  gameState.abi.y = 80;
  gameState.dd.x = 120;
  gameState.dd.y = 80;
}

export function createChapter2(p, gameState) {
  // Heavy object puzzle with crate pushing
  
  gameState.walls = [
    new Wall(0, 0, 1000, 20, p),          // Top wall
    new Wall(0, 580, 1000, 20, p),        // Bottom wall
    new Wall(0, 0, 20, 600, p),           // Left wall
    new Wall(980, 0, 20, 600, p)          // Right wall
  ];
  
  // Create puzzle rooms
  gameState.walls.push(new Wall(250, 150, 20, 250, p));
  gameState.walls.push(new Wall(500, 20, 20, 350, p));
  gameState.walls.push(new Wall(750, 250, 20, 330, p));
  
  // Horizontal sections
  gameState.walls.push(new Wall(270, 200, 230, 20, p));
  gameState.walls.push(new Wall(520, 450, 230, 20, p));
  
  gameState.switches = [
    new Switch(350, 300, 0, p),
    new Switch(650, 500, 1, p)
  ];
  
  gameState.crates = [
    new Crate(150, 300, p),
    new Crate(350, 500, p),
    new Crate(600, 150, p)
  ];
  
  gameState.doors = [
    new Door(760, 100, 20, 80, [0, 1], p)
  ];
  
  gameState.tightSpaces = [
    new TightSpace(520, 100, 25, 50, p)
  ];
  
  gameState.terminals = [
    new Terminal(850, 100, 2, "Log entry: Emergency evacuation protocol activated. Reason unknown.", p)
  ];
  
  gameState.abi.x = 80;
  gameState.abi.y = 300;
  gameState.dd.x = 80;
  gameState.dd.y = 350;
}

export function createChapter3(p, gameState) {
  // Complex multi-step puzzle with multiple paths
  
  gameState.walls = [
    new Wall(0, 0, 1100, 20, p),
    new Wall(0, 680, 1100, 20, p),
    new Wall(0, 0, 20, 700, p),
    new Wall(1080, 0, 20, 700, p)
  ];
  
  // Complex maze structure
  gameState.walls.push(new Wall(200, 100, 20, 300, p));
  gameState.walls.push(new Wall(400, 20, 20, 400, p));
  gameState.walls.push(new Wall(600, 300, 20, 380, p));
  gameState.walls.push(new Wall(800, 20, 20, 450, p));
  
  // Horizontal divisions
  gameState.walls.push(new Wall(20, 200, 180, 20, p));
  gameState.walls.push(new Wall(220, 350, 180, 20, p));
  gameState.walls.push(new Wall(420, 150, 180, 20, p));
  gameState.walls.push(new Wall(620, 500, 180, 20, p));
  
  gameState.switches = [
    new Switch(300, 250, 0, p),
    new Switch(700, 200, 1, p),
    new Switch(500, 550, 2, p)
  ];
  
  gameState.crates = [
    new Crate(120, 450, p),
    new Crate(500, 300, p),
    new Crate(700, 600, p)
  ];
  
  gameState.doors = [
    new Door(810, 550, 20, 80, [0, 1, 2], p)
  ];
  
  gameState.tightSpaces = [
    new TightSpace(620, 150, 25, 50, p),
    new TightSpace(220, 450, 30, 50, p)
  ];
  
  gameState.terminals = [
    new Terminal(950, 350, 3, "Final transmission: They came from within. Not external threat.", p)
  ];
  
  gameState.abi.x = 80;
  gameState.abi.y = 100;
  gameState.dd.x = 120;
  gameState.dd.y = 100;
}

export function createChapter4(p, gameState) {
  // Final chapter - metropolis with ultimate puzzle
  
  gameState.walls = [
    new Wall(0, 0, 1200, 20, p),
    new Wall(0, 780, 1200, 20, p),
    new Wall(0, 0, 20, 800, p),
    new Wall(1180, 0, 20, 800, p)
  ];
  
  // Complex final maze
  gameState.walls.push(new Wall(200, 100, 20, 400, p));
  gameState.walls.push(new Wall(400, 20, 20, 500, p));
  gameState.walls.push(new Wall(600, 300, 20, 480, p));
  gameState.walls.push(new Wall(800, 20, 20, 550, p));
  gameState.walls.push(new Wall(1000, 250, 20, 530, p));
  
  // Horizontal sections creating rooms
  gameState.walls.push(new Wall(20, 250, 180, 20, p));
  gameState.walls.push(new Wall(220, 400, 180, 20, p));
  gameState.walls.push(new Wall(420, 200, 180, 20, p));
  gameState.walls.push(new Wall(620, 600, 180, 20, p));
  gameState.walls.push(new Wall(820, 450, 180, 20, p));
  
  gameState.switches = [
    new Switch(300, 300, 0, p),
    new Switch(700, 150, 1, p),
    new Switch(500, 650, 2, p),
    new Switch(900, 550, 3, p)
  ];
  
  gameState.crates = [
    new Crate(120, 500, p),
    new Crate(500, 400, p),
    new Crate(700, 700, p),
    new Crate(900, 300, p)
  ];
  
  gameState.doors = [
    new Door(1010, 100, 20, 80, [0, 1, 2, 3], p)
  ];
  
  gameState.tightSpaces = [
    new TightSpace(620, 100, 25, 50, p),
    new TightSpace(420, 550, 28, 55, p)
  ];
  
  gameState.terminals = [
    new Terminal(1100, 100, 4, "THE TRUTH: Humanity uploaded consciousness. They live on digitally. We are their legacy.", p)
  ];
  
  gameState.abi.x = 80;
  gameState.abi.y = 150;
  gameState.dd.x = 120;
  gameState.dd.y = 150;
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