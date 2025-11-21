// room.js - Room and world structure
export class Room {
  constructor(id, name, width, height) {
    this.id = id;
    this.name = name;
    this.width = width;
    this.height = height;
    this.walls = [];
    this.connections = []; // { toRoom, doorId, x, y, locked, keycardType }
  }
  
  addWall(x, y, w, h) {
    this.walls.push({ x, y, w, h });
  }
  
  addConnection(toRoom, doorId, x, y, locked = false, keycardType = null) {
    this.connections.push({ toRoom, doorId, x, y, locked, keycardType });
  }
}

export function createWorldLayout() {
  const rooms = [];
  
  // Room 0: Starting room (small, claustrophobic)
  const room0 = new Room(0, "Storage Room", 300, 250);
  room0.addWall(0, 0, 300, 10); // top
  room0.addWall(0, 240, 300, 10); // bottom
  room0.addWall(0, 0, 10, 250); // left
  room0.addWall(290, 0, 10, 250); // right
  room0.addConnection(1, "door0to1", 145, 240, false, null); // unlocked door
  rooms.push(room0);
  
  // Room 1: Main hallway
  const room1 = new Room(1, "Main Hallway", 400, 300);
  room1.addWall(0, 0, 400, 10);
  room1.addWall(0, 290, 400, 10);
  room1.addWall(0, 0, 10, 300);
  room1.addWall(390, 0, 10, 300);
  room1.addConnection(0, "door1to0", 195, 0, false, null);
  room1.addConnection(2, "door1to2", 390, 145, true, "red"); // locked red
  room1.addConnection(3, "door1to3", 195, 290, false, null);
  rooms.push(room1);
  
  // Room 2: Security office (has blue keycard)
  const room2 = new Room(2, "Security Office", 280, 220);
  room2.addWall(0, 0, 280, 10);
  room2.addWall(0, 210, 280, 10);
  room2.addWall(0, 0, 10, 220);
  room2.addWall(270, 0, 10, 220);
  room2.addConnection(1, "door2to1", 0, 105, true, "red");
  room2.addConnection(4, "door2to4", 135, 210, true, "blue"); // locked blue
  rooms.push(room2);
  
  // Room 3: Research lab (has red keycard)
  const room3 = new Room(3, "Research Lab", 350, 260);
  room3.addWall(0, 0, 350, 10);
  room3.addWall(0, 250, 350, 10);
  room3.addWall(0, 0, 10, 260);
  room3.addWall(340, 0, 10, 260);
  room3.addConnection(1, "door3to1", 170, 0, false, null);
  rooms.push(room3);
  
  // Room 4: Control room (has green keycard)
  const room4 = new Room(4, "Control Room", 320, 240);
  room4.addWall(0, 0, 320, 10);
  room4.addWall(0, 230, 320, 10);
  room4.addWall(0, 0, 10, 240);
  room4.addWall(310, 0, 10, 240);
  room4.addConnection(2, "door4to2", 155, 0, true, "blue");
  room4.addConnection(5, "door4to5", 310, 115, true, "green"); // locked green
  rooms.push(room4);
  
  // Room 5: Exit/Escape room
  const room5 = new Room(5, "Exit", 280, 200);
  room5.addWall(0, 0, 280, 10);
  room5.addWall(0, 190, 280, 10);
  room5.addWall(0, 0, 10, 200);
  room5.addWall(270, 0, 10, 200);
  room5.addConnection(4, "door5to4", 0, 95, true, "green");
  rooms.push(room5);
  
  return rooms;
}