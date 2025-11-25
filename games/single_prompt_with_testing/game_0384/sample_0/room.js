// room.js
import { ROOMS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Interactable } from './interactable.js';

export class Room {
  constructor(name, description) {
    this.name = name;
    this.description = description;
    this.interactables = [];
    this.exits = {};
    this.backgroundColor = [40, 40, 50];
  }

  addInteractable(interactable) {
    interactable.room = this.name;
    this.interactables.push(interactable);
  }

  addExit(direction, roomName, x, y, width, height) {
    this.exits[direction] = { roomName, x, y, width, height };
  }

  render(p) {
    // Background
    p.background(...this.backgroundColor);
    
    // Floor
    p.fill(60, 50, 45);
    p.noStroke();
    p.rect(0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, 100);
    
    // Walls with texture
    p.fill(70, 65, 60);
    for (let i = 0; i < CANVAS_WIDTH; i += 40) {
      p.rect(i, 0, 38, CANVAS_HEIGHT - 100);
    }
    
    // Room name
    p.fill(200, 200, 180);
    p.textSize(16);
    p.textAlign(p.LEFT, p.TOP);
    p.text(this.description, 10, 10);
    
    // Render exits
    this.renderExits(p);
    
    // Render interactables
    for (const interactable of this.interactables) {
      interactable.render(p);
    }
  }

  renderExits(p) {
    for (const [direction, exit] of Object.entries(this.exits)) {
      p.fill(60, 50, 40);
      p.stroke(40, 30, 20);
      p.strokeWeight(2);
      p.rect(exit.x - exit.width / 2, exit.y - exit.height / 2, exit.width, exit.height);
      
      // Arrow indicator
      p.fill(150, 140, 120);
      p.noStroke();
      p.textSize(12);
      p.textAlign(p.CENTER, p.CENTER);
      const arrow = direction === "up" ? "↑" : direction === "down" ? "↓" : 
                    direction === "left" ? "←" : "→";
      p.text(arrow, exit.x, exit.y);
    }
  }

  getNearestInteractable(playerX, playerY) {
    let nearest = null;
    let minDist = Infinity;
    
    for (const interactable of this.interactables) {
      if (!interactable.visible || interactable.collected) continue;
      
      const dx = interactable.x - playerX;
      const dy = interactable.y - playerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 60 && dist < minDist) {
        minDist = dist;
        nearest = interactable;
      }
    }
    
    return nearest;
  }

  getExitAtPosition(x, y) {
    for (const [direction, exit] of Object.entries(this.exits)) {
      if (Math.abs(x - exit.x) < exit.width / 2 && 
          Math.abs(y - exit.y) < exit.height / 2) {
        return exit.roomName;
      }
    }
    return null;
  }
}

export function createRooms() {
  const rooms = {};
  
  // Main Room
  const mainRoom = new Room(ROOMS.MAIN, "Main Room");
  mainRoom.backgroundColor = [45, 45, 55];
  mainRoom.addInteractable(new Interactable("mainDoor", 300, 80, 60, 80, "door", "Main Door", "The front door - your main vulnerability"));
  mainRoom.addInteractable(new Interactable("window1", 100, 100, 50, 40, "window", "Window", "A large window"));
  mainRoom.addInteractable(new Interactable("window2", 500, 100, 50, 40, "window", "Window", "A large window"));
  mainRoom.addInteractable(new Interactable("planks", 450, 250, 30, 15, "item", "Planks", "Wooden planks for boarding"));
  mainRoom.addExit("right", ROOMS.BEDROOM, 580, 200, 30, 60);
  mainRoom.addExit("down", ROOMS.BASEMENT, 300, 380, 60, 30);
  rooms[ROOMS.MAIN] = mainRoom;
  
  // Bedroom
  const bedroom = new Room(ROOMS.BEDROOM, "Bedroom");
  bedroom.backgroundColor = [50, 45, 50];
  bedroom.addInteractable(new Interactable("bed", 450, 200, 80, 50, "furniture", "Bed", "A small bed"));
  bedroom.addInteractable(new Interactable("nails", 150, 180, 25, 15, "item", "Nails", "A box of nails"));
  bedroom.addInteractable(new Interactable("sedative", 500, 150, 20, 25, "item", "Sedative", "Strong sedative - might help delay transformation"));
  mainRoom.addExit("left", ROOMS.MAIN, 20, 200, 30, 60);
  bedroom.addExit("left", ROOMS.MAIN, 20, 200, 30, 60);
  bedroom.addExit("down", ROOMS.STORAGE, 300, 380, 60, 30);
  rooms[ROOMS.BEDROOM] = bedroom;
  
  // Storage
  const storage = new Room(ROOMS.STORAGE, "Storage Room");
  storage.backgroundColor = [40, 45, 45];
  storage.addInteractable(new Interactable("chain", 200, 200, 35, 15, "item", "Chain", "A heavy chain"));
  storage.addInteractable(new Interactable("lock", 400, 220, 20, 25, "item", "Lock", "A sturdy padlock"));
  storage.addInteractable(new Interactable("hammer", 350, 180, 25, 20, "item", "Hammer", "For driving nails"));
  storage.addExit("up", ROOMS.BEDROOM, 300, 20, 60, 30);
  rooms[ROOMS.STORAGE] = storage;
  
  // Basement
  const basement = new Room(ROOMS.BASEMENT, "Basement");
  basement.backgroundColor = [35, 35, 40];
  basement.addInteractable(new Interactable("basementDoor", 150, 150, 50, 70, "door", "Cellar Door", "Could lock yourself in here"));
  basement.addInteractable(new Interactable("rope", 400, 250, 30, 15, "item", "Rope", "Strong rope"));
  basement.addInteractable(new Interactable("cage", 450, 180, 60, 60, "useable", "Cage", "A sturdy cage - could contain something dangerous"));
  basement.addExit("up", ROOMS.MAIN, 300, 20, 60, 30);
  rooms[ROOMS.BASEMENT] = basement;
  
  return rooms;
}