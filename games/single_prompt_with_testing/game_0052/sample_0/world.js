// world.js - World generation and room setup

import { 
  gameState, 
  ROOM_WIDTH, 
  ROOM_HEIGHT,
  CLUE_TYPES 
} from './globals.js';
import { Player, ShadowEnemy, Clue, Door, Furniture } from './entities.js';

export function initializeWorld() {
  // Create the apartment layout
  createApartmentRoom();
  
  // Spawn player
  gameState.player = new Player(150, 200);
  
  // Spawn enemies
  spawnEnemies();
  
  // Place clues
  placeClues();
  
  // Create doors
  createDoors();
  
  // Add furniture
  addFurniture();
}

function createApartmentRoom() {
  gameState.rooms[gameState.currentRoom] = {
    width: ROOM_WIDTH,
    height: ROOM_HEIGHT,
    name: 'Addison Apartments - 4th Floor'
  };
}

function spawnEnemies() {
  // Shadow enemy in hallway
  const enemy1 = new ShadowEnemy(600, 300, [
    { x: 500, y: 300 },
    { x: 700, y: 300 },
    { x: 700, y: 500 },
    { x: 500, y: 500 }
  ]);
  
  // Shadow enemy in apartment
  const enemy2 = new ShadowEnemy(400, 600, [
    { x: 300, y: 600 },
    { x: 500, y: 600 },
    { x: 500, y: 700 },
    { x: 300, y: 700 }
  ]);
  
  // Shadow enemy near evidence room
  const enemy3 = new ShadowEnemy(900, 400, [
    { x: 850, y: 350 },
    { x: 950, y: 350 },
    { x: 950, y: 450 },
    { x: 850, y: 450 }
  ]);
}

function placeClues() {
  // Start with accessible clues
  new Clue(250, 250, CLUE_TYPES.NOTE, 'note1', []);
  new Clue(800, 250, CLUE_TYPES.PHOTO, 'photo1', []);
  
  // Key to unlock first door
  new Clue(350, 550, CLUE_TYPES.KEY, 'key1', []);
  
  // More evidence behind locked areas
  new Clue(950, 250, CLUE_TYPES.EVIDENCE, 'evidence1', ['key1']);
  new Clue(550, 700, CLUE_TYPES.NOTE, 'note2', ['key1']);
  
  // Supernatural clues (only visible with Gear Boy)
  new Clue(700, 600, CLUE_TYPES.SUPERNATURAL, 'ghost1', ['evidence1']);
  new Clue(450, 350, CLUE_TYPES.SUPERNATURAL, 'ghost2', ['note2']);
  
  // Final revelation piece
  new Clue(1050, 650, CLUE_TYPES.EVIDENCE, 'final', ['ghost1', 'ghost2']);
}

function createDoors() {
  // Locked door requiring key1
  new Door(900, 300, 40, 80, ['key1'], null);
  
  // Locked door requiring multiple evidence
  new Door(500, 650, 40, 80, ['evidence1', 'note2'], null);
  
  // Final locked door
  new Door(1000, 600, 40, 80, ['ghost1', 'ghost2'], null);
}

function addFurniture() {
  // Hallway furniture
  new Furniture(300, 150, 80, 40, 'table');
  new Furniture(150, 400, 120, 60, 'couch');
  new Furniture(700, 150, 60, 100, 'bookshelf');
  
  // Apartment furniture
  new Furniture(250, 650, 100, 50, 'table');
  new Furniture(450, 500, 80, 80, 'table');
  new Furniture(600, 700, 140, 70, 'couch');
  
  // Evidence room furniture
  new Furniture(950, 450, 70, 120, 'bookshelf');
  new Furniture(1050, 300, 60, 60, 'table');
  
  // Additional obstacles
  new Furniture(550, 400, 50, 50, 'generic');
  new Furniture(800, 550, 50, 50, 'generic');
}