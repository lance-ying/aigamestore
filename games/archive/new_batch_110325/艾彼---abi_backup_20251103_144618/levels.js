// levels.js - Level/Chapter definitions
import { Switch, Crate, Door, TightSpace, Terminal } from './entities.js';

export function createChapter0(p, gameState) {
  // Tutorial chapter - basic movement
  gameState.switches = [
    new Switch(200, 150, 0, p)
  ];
  
  gameState.doors = [
    new Door(400, 200, 50, 80, [0], p)
  ];
  
  gameState.terminals = [
    new Terminal(500, 200, 0, "Welcome, Abi. Systems online. Initiating exploration protocol.", p)
  ];
  
  gameState.abi.x = 100;
  gameState.abi.y = 200;
  gameState.dd.x = 100;
  gameState.dd.y = 250;
}

export function createChapter1(p, gameState) {
  // Character switching and tight spaces
  gameState.switches = [
    new Switch(350, 150, 0, p),
    new Switch(550, 300, 1, p)
  ];
  
  gameState.crates = [
    new Crate(300, 250, p)
  ];
  
  gameState.doors = [
    new Door(700, 200, 50, 80, [0, 1], p)
  ];
  
  gameState.tightSpaces = [
    new TightSpace(500, 250, 30, 60, p)
  ];
  
  gameState.terminals = [
    new Terminal(800, 200, 1, "Data fragment recovered: Day 347 - Population declining rapidly.", p)
  ];
  
  gameState.abi.x = 100;
  gameState.abi.y = 200;
  gameState.dd.x = 150;
  gameState.dd.y = 200;
}

export function createChapter2(p, gameState) {
  // Heavy object puzzle
  gameState.switches = [
    new Switch(250, 350, 0, p),
    new Switch(450, 150, 1, p)
  ];
  
  gameState.crates = [
    new Crate(200, 250, p),
    new Crate(400, 250, p),
    new Crate(350, 350, p)
  ];
  
  gameState.doors = [
    new Door(650, 300, 50, 80, [0, 1], p)
  ];
  
  gameState.tightSpaces = [
    new TightSpace(420, 120, 25, 50, p)
  ];
  
  gameState.terminals = [
    new Terminal(750, 300, 2, "Log entry: Emergency evacuation protocol activated. Reason unknown.", p)
  ];
  
  gameState.abi.x = 100;
  gameState.abi.y = 300;
  gameState.dd.x = 100;
  gameState.dd.y = 350;
}

export function createChapter3(p, gameState) {
  // Complex multi-step puzzle
  gameState.switches = [
    new Switch(300, 200, 0, p),
    new Switch(600, 200, 1, p),
    new Switch(450, 400, 2, p)
  ];
  
  gameState.crates = [
    new Crate(250, 300, p),
    new Crate(550, 300, p),
    new Crate(400, 350, p)
  ];
  
  gameState.doors = [
    new Door(900, 250, 50, 80, [0, 1, 2], p)
  ];
  
  gameState.tightSpaces = [
    new TightSpace(570, 170, 25, 50, p),
    new TightSpace(270, 370, 30, 50, p)
  ];
  
  gameState.terminals = [
    new Terminal(1000, 250, 3, "Final transmission: They came from within. Not external threat.", p)
  ];
  
  gameState.abi.x = 100;
  gameState.abi.y = 250;
  gameState.dd.x = 150;
  gameState.dd.y = 300;
}

export function createChapter4(p, gameState) {
  // Final chapter - metropolis
  gameState.switches = [
    new Switch(350, 250, 0, p),
    new Switch(700, 250, 1, p),
    new Switch(500, 450, 2, p),
    new Switch(900, 350, 3, p)
  ];
  
  gameState.crates = [
    new Crate(300, 350, p),
    new Crate(650, 350, p),
    new Crate(550, 500, p),
    new Crate(850, 400, p)
  ];
  
  gameState.doors = [
    new Door(1050, 350, 50, 80, [0, 1, 2, 3], p)
  ];
  
  gameState.tightSpaces = [
    new TightSpace(670, 220, 25, 50, p),
    new TightSpace(470, 420, 28, 55, p)
  ];
  
  gameState.terminals = [
    new Terminal(1100, 350, 4, "THE TRUTH: Humanity uploaded consciousness. They live on digitally. We are their legacy.", p)
  ];
  
  gameState.abi.x = 100;
  gameState.abi.y = 350;
  gameState.dd.x = 150;
  gameState.dd.y = 350;
}

export function loadChapter(chapterIndex, p, gameState) {
  // Clear previous chapter state
  gameState.switches = [];
  gameState.crates = [];
  gameState.doors = [];
  gameState.tightSpaces = [];
  gameState.terminals = [];
  
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