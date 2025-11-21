// rooms.js - Room definitions and management

import { ROOM_IDS } from './globals.js';
import { NPC, Interactable } from './entities.js';

export class Room {
  constructor(id, name, bgColor, walls) {
    this.id = id;
    this.name = name;
    this.bgColor = bgColor;
    this.walls = walls;
    this.width = 1200;
    this.height = 800;
  }
  
  drawBackground(p) {
    p.background(...this.bgColor);
    
    // Draw floor pattern
    p.stroke(this.bgColor[0] - 10, this.bgColor[1] - 10, this.bgColor[2] - 10);
    p.strokeWeight(1);
    for (let x = 0; x < this.width; x += 40) {
      for (let y = 0; y < this.height; y += 40) {
        p.point(x, y);
      }
    }
  }
  
  drawWalls(p, cameraX, cameraY) {
    p.fill(60, 60, 80);
    p.stroke(40, 40, 60);
    p.strokeWeight(2);
    
    for (const wall of this.walls) {
      p.rect(wall.x - cameraX, wall.y - cameraY, wall.width, wall.height);
    }
  }
}

export function createRooms() {
  const rooms = {};
  
  // Entrance Hall
  rooms[ROOM_IDS.ENTRANCE] = new Room(
    ROOM_IDS.ENTRANCE,
    "Entrance Hall",
    [80, 80, 100],
    [
      // Outer walls
      { x: 0, y: 0, width: 1200, height: 20 },
      { x: 0, y: 0, width: 20, height: 800 },
      { x: 1180, y: 0, width: 20, height: 800 },
      { x: 0, y: 780, width: 1200, height: 20 },
      // Inner obstacles
      { x: 200, y: 200, width: 100, height: 100 },
      { x: 500, y: 300, width: 150, height: 80 }
    ]
  );
  
  // Lab
  rooms[ROOM_IDS.LAB] = new Room(
    ROOM_IDS.LAB,
    "Research Lab",
    [70, 90, 90],
    [
      { x: 0, y: 0, width: 1200, height: 20 },
      { x: 0, y: 0, width: 20, height: 800 },
      { x: 1180, y: 0, width: 20, height: 800 },
      { x: 0, y: 780, width: 1200, height: 20 },
      { x: 300, y: 150, width: 200, height: 120 },
      { x: 700, y: 400, width: 180, height: 100 }
    ]
  );
  
  // Garden
  rooms[ROOM_IDS.GARDEN] = new Room(
    ROOM_IDS.GARDEN,
    "Digital Garden",
    [60, 100, 80],
    [
      { x: 0, y: 0, width: 1200, height: 20 },
      { x: 0, y: 0, width: 20, height: 800 },
      { x: 1180, y: 0, width: 20, height: 800 },
      { x: 0, y: 780, width: 1200, height: 20 },
      { x: 250, y: 250, width: 120, height: 120 },
      { x: 600, y: 200, width: 100, height: 100 }
    ]
  );
  
  // Archive
  rooms[ROOM_IDS.ARCHIVE] = new Room(
    ROOM_IDS.ARCHIVE,
    "Memory Archive",
    [90, 70, 90],
    [
      { x: 0, y: 0, width: 1200, height: 20 },
      { x: 0, y: 0, width: 20, height: 800 },
      { x: 1180, y: 0, width: 20, height: 800 },
      { x: 0, y: 780, width: 1200, height: 20 },
      { x: 400, y: 300, width: 150, height: 150 }
    ]
  );
  
  return rooms;
}

export function createNPCs(roomId) {
  const npcs = [];
  
  if (roomId === ROOM_IDS.ENTRANCE) {
    npcs.push(new NPC(400, 400, "UNIT-7", [200, 150, 200], [
      {
        text: "Hello, new unit. Welcome to the facility. I detect you're here for self-analysis?",
        choices: [
          { text: "Yes, I want to understand myself.", trait: 'curious' },
          { text: "I'm just exploring.", trait: 'creative' }
        ]
      },
      {
        text: "Interesting choice. The analysis system observes everything. Just be yourself.",
        choices: [
          { text: "What should I do?", trait: 'logical' },
          { text: "Thanks for the advice.", trait: 'empathetic' }
        ]
      },
      {
        text: "Good luck on your journey of self-discovery.",
        choices: []
      }
    ]));
    
    npcs.push(new NPC(800, 300, "GUIDE-3", [255, 200, 100], [
      {
        text: "Greetings! You can explore different rooms here. Each area reveals something new.",
        choices: [
          { text: "Tell me more.", trait: 'curious' },
          { text: "I'll figure it out myself.", trait: 'decisive' }
        ]
      },
      {
        text: "Very well. Remember, there are no wrong paths here.",
        choices: []
      }
    ]));
  } else if (roomId === ROOM_IDS.LAB) {
    npcs.push(new NPC(500, 400, "SCIENTIST-2", [150, 200, 255], [
      {
        text: "Ah, a subject! I mean... a visitor. The lab analyzes behavioral patterns.",
        choices: [
          { text: "How does it work?", trait: 'logical' },
          { text: "Sounds fascinating!", trait: 'curious' }
        ]
      },
      {
        text: "Every action, every choice contributes to your profile. Quite elegant, really.",
        choices: [
          { text: "Can I see my profile?", trait: 'decisive' },
          { text: "That's a bit invasive.", trait: 'empathetic' }
        ]
      }
    ]));
  } else if (roomId === ROOM_IDS.GARDEN) {
    npcs.push(new NPC(450, 500, "GARDENER-5", [100, 255, 150], [
      {
        text: "Welcome to the digital garden. A place of peace and reflection.",
        choices: [
          { text: "It's beautiful here.", trait: 'empathetic' },
          { text: "What's the purpose?", trait: 'logical' }
        ]
      },
      {
        text: "Sometimes the journey matters more than the destination.",
        choices: []
      }
    ]));
  } else if (roomId === ROOM_IDS.ARCHIVE) {
    npcs.push(new NPC(600, 500, "ARCHIVIST-1", [200, 200, 100], [
      {
        text: "The archives hold the profiles of all who came before you.",
        choices: [
          { text: "Can I see them?", trait: 'curious' },
          { text: "What do they reveal?", trait: 'logical' }
        ]
      },
      {
        text: "Each profile is unique. Yours will be too.",
        choices: []
      }
    ]));
  }
  
  return npcs;
}

export function createInteractables(roomId) {
  const interactables = [];
  
  if (roomId === ROOM_IDS.ENTRANCE) {
    interactables.push(new Interactable(
      600, 600, 'terminal', 'Info Terminal',
      'The terminal displays: "Welcome to Refind Self. Explore. Interact. Discover."'
    ));
  } else if (roomId === ROOM_IDS.LAB) {
    interactables.push(new Interactable(
      400, 250, 'puzzle', 'Lab Puzzle',
      'A sequence puzzle. Can you solve it?'
    ));
    interactables.push(new Interactable(
      800, 500, 'terminal', 'Analysis Terminal',
      'Current analysis progress displayed here.'
    ));
  } else if (roomId === ROOM_IDS.GARDEN) {
    interactables.push(new Interactable(
      700, 350, 'object', 'Crystal',
      'A beautiful data crystal. It seems to resonate with your presence.'
    ));
  } else if (roomId === ROOM_IDS.ARCHIVE) {
    interactables.push(new Interactable(
      500, 350, 'terminal', 'Archive Terminal',
      'Browse personality profiles of previous units.'
    ));
  }
  
  return interactables;
}