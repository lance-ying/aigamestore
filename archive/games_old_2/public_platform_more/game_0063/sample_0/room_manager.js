// room_manager.js - Manages room creation and progression
import { gameState } from './globals.js';
import { Gear, Lever, HiddenCompartment, Valve } from './puzzle_elements.js';

export class RoomManager {
  constructor() {
    this.rooms = [];
    this.setupRooms();
  }
  
  setupRooms() {
    // Room 0: Tutorial room - simple puzzles
    this.rooms.push({
      id: 0,
      name: "The Apprentice's Workshop",
      description: "A simple workbench with basic mechanisms",
      puzzles: [
        new Lever(200, 150, 100, 'r0_lever1'),
        new Gear(400, 150, 100, 'r0_gear1', 2),
        new Valve(300, 180, 120, 'r0_valve1', 2)
      ],
      backgroundColor: [40, 35, 30],
      ambientLight: 0.6
    });
    
    // Room 1: Intermediate room - interconnected puzzles
    this.rooms.push({
      id: 1,
      name: "The Master's Study",
      description: "Complex mechanisms with hidden secrets",
      puzzles: [
        new Lever(180, 140, 90, 'r1_lever1'),
        new Gear(420, 160, 110, 'r1_gear1', 3),
        (() => {
          const hidden = new HiddenCompartment(300, 200, 100, 'r1_hidden1');
          hidden.dependencies = ['r1_lever1'];
          return hidden;
        })(),
        (() => {
          const valve = new Valve(350, 130, 95, 'r1_valve1', 1);
          valve.dependencies = ['r1_hidden1'];
          return valve;
        })(),
        (() => {
          const gear2 = new Gear(250, 170, 105, 'r1_gear2', 2);
          gear2.dependencies = ['r1_gear1', 'r1_valve1'];
          return gear2;
        })()
      ],
      backgroundColor: [35, 30, 35],
      ambientLight: 0.5
    });
    
    // Room 2: Final room - grand puzzle
    this.rooms.push({
      id: 2,
      name: "The Secret Chamber",
      description: "The master's greatest creation awaits",
      puzzles: [
        new Gear(220, 140, 95, 'r2_gear1', 3),
        new Gear(380, 140, 95, 'r2_gear2', 3),
        (() => {
          const lever = new Lever(300, 120, 85, 'r2_lever1');
          lever.dependencies = ['r2_gear1', 'r2_gear2'];
          return lever;
        })(),
        (() => {
          const hidden = new HiddenCompartment(300, 230, 110, 'r2_hidden1');
          hidden.dependencies = ['r2_lever1'];
          return hidden;
        })(),
        (() => {
          const valve1 = new Valve(240, 180, 100, 'r2_valve1', 2);
          valve1.dependencies = ['r2_hidden1'];
          return valve1;
        })(),
        (() => {
          const valve2 = new Valve(360, 180, 100, 'r2_valve2', 1);
          valve2.dependencies = ['r2_hidden1'];
          return valve2;
        })(),
        (() => {
          const finalGear = new Gear(300, 200, 90, 'r2_final_gear', 4);
          finalGear.dependencies = ['r2_valve1', 'r2_valve2'];
          return finalGear;
        })()
      ],
      backgroundColor: [30, 30, 40],
      ambientLight: 0.4
    });
  }
  
  loadRoom(roomIndex) {
    if (roomIndex >= 0 && roomIndex < this.rooms.length) {
      const room = this.rooms[roomIndex];
      gameState.currentRoom = roomIndex;
      gameState.puzzleElements = [...room.puzzles];
      gameState.puzzlesInRoom = room.puzzles.length;
      gameState.puzzlesSolved = 0;
      return room;
    }
    return null;
  }
  
  checkRoomCompletion() {
    const solved = gameState.puzzleElements.filter(p => p.solved).length;
    gameState.puzzlesSolved = solved;
    
    if (solved === gameState.puzzlesInRoom) {
      return true;
    }
    return false;
  }
  
  getCurrentRoom() {
    return this.rooms[gameState.currentRoom];
  }
  
  progressToNextRoom() {
    if (gameState.currentRoom < this.rooms.length - 1) {
      gameState.roomsCompleted++;
      gameState.score += 100;
      this.loadRoom(gameState.currentRoom + 1);
      return true;
    }
    return false; // No more rooms, game won
  }
}