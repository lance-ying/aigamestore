// rooms.js - Room management and setup

import { 
  gameState,
  ROOM_BED,
  ROOM_BATHROOM,
  ROOM_DINING,
  ROOM_RECREATION,
  ROOM_THERAPY,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  getColorWithSaturation
} from './globals.js';

import {
  Bed,
  Shower,
  Sink,
  DiningTable,
  ExerciseEquipment,
  TherapyChair,
  WhiteDoor
} from './entities.js';

// Room class
export class Room {
  constructor(name, bgColor) {
    this.name = name;
    this.bgColor = bgColor;
    this.objects = [];
    this.decorations = [];
  }
  
  addObject(obj) {
    this.objects.push(obj);
  }
  
  render(p) {
    // Draw background with color restoration
    const bg = getColorWithSaturation(p, this.bgColor[0], this.bgColor[1], this.bgColor[2], 0);
    p.background(bg);
    
    // Draw floor
    const floorColor = getColorWithSaturation(p, 180, 180, 180, 0);
    p.fill(floorColor);
    p.rect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);
    
    // Draw walls with subtle pattern
    p.stroke(100, 100, 100, 30);
    p.strokeWeight(1);
    for (let i = 0; i < CANVAS_WIDTH; i += 20) {
      p.line(i, 0, i, CANVAS_HEIGHT - 50);
    }
    p.noStroke();
    
    // Render decorations
    for (const deco of this.decorations) {
      deco.render(p);
    }
    
    // Render objects
    for (const obj of this.objects) {
      obj.render(p);
    }
  }
}

// Initialize all rooms
export function initializeRooms(p) {
  gameState.rooms = {};
  
  // Bedroom
  const bedroom = new Room(ROOM_BED, [220, 220, 240]);
  bedroom.addObject(new Bed(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 130));
  bedroom.addObject(new WhiteDoor(CANVAS_WIDTH - 80, CANVAS_HEIGHT - 110));
  gameState.rooms[ROOM_BED] = bedroom;
  
  // Bathroom
  const bathroom = new Room(ROOM_BATHROOM, [200, 220, 230]);
  bathroom.addObject(new Shower(150, CANVAS_HEIGHT - 130));
  bathroom.addObject(new Sink(450, CANVAS_HEIGHT - 120));
  gameState.rooms[ROOM_BATHROOM] = bathroom;
  
  // Dining room
  const dining = new Room(ROOM_DINING, [240, 230, 210]);
  dining.addObject(new DiningTable(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 150));
  gameState.rooms[ROOM_DINING] = dining;
  
  // Recreation room
  const recreation = new Room(ROOM_RECREATION, [210, 230, 220]);
  recreation.addObject(new ExerciseEquipment(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 140));
  gameState.rooms[ROOM_RECREATION] = recreation;
  
  // Therapy room
  const therapy = new Room(ROOM_THERAPY, [220, 210, 220]);
  therapy.addObject(new TherapyChair(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 130));
  gameState.rooms[ROOM_THERAPY] = therapy;
}

// Get current room object
export function getCurrentRoom() {
  return gameState.rooms[gameState.currentRoom];
}

// Navigate to room based on current task
export function navigateToTaskRoom(p) {
  const currentTask = gameState.currentTaskIndex;
  const taskRooms = [
    ROOM_BED,       // WAKE
    ROOM_BATHROOM,  // SHOWER
    ROOM_BATHROOM,  // BRUSH
    ROOM_DINING,    // BREAKFAST
    ROOM_RECREATION,// EXERCISE
    ROOM_RECREATION,// PUZZLE
    ROOM_THERAPY,   // THERAPY
    ROOM_BED        // SLEEP
  ];
  
  if (currentTask < taskRooms.length) {
    const targetRoom = taskRooms[currentTask];
    if (gameState.currentRoom !== targetRoom) {
      gameState.currentRoom = targetRoom;
      // Reset player position when changing rooms
      if (gameState.player) {
        gameState.player.x = 100;
        gameState.player.y = CANVAS_HEIGHT - 100;
      }
    }
  }
}