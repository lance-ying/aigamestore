// entities.js
import { gameState } from './globals.js';

export class InteractiveObject {
  constructor(id, name, x, y, z, angle, type, roomId) {
    this.id = id;
    this.name = name;
    this.x = x; // position in room space
    this.y = y;
    this.z = z; // depth for 3D effect
    this.angle = angle; // which camera angle to see it from (0-360)
    this.type = type; // "item", "mechanism", "door", "examine"
    this.roomId = roomId;
    this.collected = false;
    this.activated = false;
    this.locked = true;
    this.requiresItem = null;
    this.description = "";
    this.pastState = null; // state in past when using Oculus
    this.presentState = null;
  }
  
  isVisible(cameraAngle) {
    const angleDiff = Math.abs(this.angle - cameraAngle);
    return angleDiff < 45 || angleDiff > 315;
  }
  
  getScreenPosition(p, cameraAngle) {
    // Convert 3D position to 2D screen coordinates based on camera angle
    const relativeAngle = (this.angle - cameraAngle + 360) % 360;
    const isVisible = relativeAngle < 45 || relativeAngle > 315;
    
    if (!isVisible) return null;
    
    // Calculate perspective
    const perspectiveScale = 1 / (1 + this.z * 0.002);
    const screenX = this.x * perspectiveScale + p.width / 2;
    const screenY = this.y * perspectiveScale + p.height / 2;
    
    return { x: screenX, y: screenY, scale: perspectiveScale };
  }
}

export class Item {
  constructor(id, name, description) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.combinable = [];
  }
}

export class Player {
  constructor() {
    this.x = 0;
    this.y = 0;
  }
}

// Room 1 Objects
export function createRoom1Objects() {
  const objects = [];
  
  // Gear on table (item to collect)
  const gear = new InteractiveObject("gear1", "Brass Gear", -100, 50, 100, 0, "item", 1);
  gear.description = "A finely crafted brass gear";
  gear.locked = false;
  objects.push(gear);
  
  // Mechanism on wall (needs gear)
  const mechanism = new InteractiveObject("mech1", "Clock Mechanism", 50, -20, 50, 90, "mechanism", 1);
  mechanism.description = "An incomplete clock mechanism";
  mechanism.requiresItem = "gear1";
  mechanism.locked = true;
  mechanism.pastState = { broken: true };
  mechanism.presentState = { broken: false };
  objects.push(mechanism);
  
  // Door to Room 2
  const door = new InteractiveObject("door1", "Wooden Door", 0, 0, 0, 180, "door", 1);
  door.description = "A sturdy oak door with brass fittings";
  door.locked = true;
  objects.push(door);
  
  // Decorative items for examination
  const painting = new InteractiveObject("paint1", "Portrait", -80, -50, 80, 270, "examine", 1);
  painting.description = "A portrait of a mysterious scholar";
  painting.locked = false;
  objects.push(painting);
  
  return objects;
}

// Room 2 Objects
export function createRoom2Objects() {
  const objects = [];
  
  // Key visible only in past
  const key = new InteractiveObject("key1", "Ornate Key", -120, 30, 120, 45, "item", 2);
  key.description = "An ornate key with intricate engravings";
  key.locked = false;
  key.pastState = { visible: true };
  key.presentState = { visible: false };
  objects.push(key);
  
  // Locked chest
  const chest = new InteractiveObject("chest1", "Wooden Chest", 80, 60, 90, 135, "mechanism", 2);
  chest.description = "A locked wooden chest";
  chest.requiresItem = "key1";
  chest.locked = true;
  objects.push(chest);
  
  // Lens inside chest
  const lens = new InteractiveObject("lens1", "Crystal Lens", 80, 60, 90, 135, "item", 2);
  lens.description = "A perfectly polished crystal lens";
  lens.locked = true;
  lens.collected = true; // Will be added to inventory when chest opens
  objects.push(lens);
  
  // Door to Room 3
  const door = new InteractiveObject("door2", "Iron Door", 0, 10, 0, 270, "door", 2);
  door.description = "A heavy iron door";
  door.locked = true;
  objects.push(door);
  
  return objects;
}

// Room 3 Objects (Final Room)
export function createRoom3Objects() {
  const objects = [];
  
  // Final device (needs gear and lens)
  const device = new InteractiveObject("device1", "Ancient Device", 0, -30, 60, 0, "mechanism", 3);
  device.description = "An ancient astronomical device";
  device.locked = true;
  device.requiresItem = "lens1";
  objects.push(device);
  
  // Pedestal (needs gear placed first)
  const pedestal = new InteractiveObject("pedestal1", "Stone Pedestal", -60, 40, 100, 90, "mechanism", 3);
  pedestal.description = "A stone pedestal with gear slots";
  pedestal.locked = true;
  pedestal.requiresItem = "gear1";
  objects.push(pedestal);
  
  // Ancient book for flavor
  const book = new InteractiveObject("book1", "Ancient Tome", 70, 70, 110, 180, "examine", 3);
  book.description = "Da Vinci's personal journal";
  book.locked = false;
  objects.push(book);
  
  return objects;
}