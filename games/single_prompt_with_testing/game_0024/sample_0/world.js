// world.js - World generation and management

import { Wall, Switch, Door, Lightbulb, SunChamber } from './entities.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function createWorld() {
  const walls = [];
  const switches = [];
  const doors = [];
  
  // Border walls
  walls.push(new Wall(0, 0, CANVAS_WIDTH, 20)); // Top
  walls.push(new Wall(0, CANVAS_HEIGHT - 20, CANVAS_WIDTH, 20)); // Bottom
  walls.push(new Wall(0, 0, 20, CANVAS_HEIGHT)); // Left
  walls.push(new Wall(CANVAS_WIDTH - 20, 0, 20, CANVAS_HEIGHT)); // Right
  
  // Room 1 - Starting room (left side)
  walls.push(new Wall(280, 20, 20, 160)); // Right wall of room 1
  
  // Room 2 - Middle room
  walls.push(new Wall(280, 220, 20, 160)); // Left wall bottom section
  walls.push(new Wall(540, 20, 20, 160)); // Right wall of room 2
  
  // Room 3 - Right room
  walls.push(new Wall(540, 220, 20, 160)); // Right wall bottom section
  
  // Bottom rooms dividers
  walls.push(new Wall(20, 200, 130, 20)); // Bottom left wall
  walls.push(new Wall(300, 200, 110, 20)); // Bottom middle wall
  walls.push(new Wall(450, 200, 130, 20)); // Bottom right wall
  
  // Create switches
  // Switch 1 - Opens door 1 (Room 1)
  const switch1 = new Switch(80, 100, 1);
  switches.push(switch1);
  
  // Switch 2 - Opens door 2 (Room 2)
  const switch2 = new Switch(400, 100, 2);
  switches.push(switch2);
  
  // Switch 3 - Opens door 3 (Bottom left room)
  const switch3 = new Switch(80, 300, 3);
  switches.push(switch3);
  
  // Switch 4 - Opens door 4 (Bottom right room)
  const switch4 = new Switch(500, 300, 4);
  switches.push(switch4);
  
  // Create doors
  // Door 1 - Between room 1 and 2
  const door1 = new Door(290, 120, 'vertical', [1]);
  doors.push(door1);
  
  // Door 2 - Between room 2 and 3
  const door2 = new Door(550, 120, 'vertical', [1, 2]);
  doors.push(door2);
  
  // Door 3 - Bottom left entrance
  const door3 = new Door(100, 210, 'horizontal', [1]);
  doors.push(door3);
  
  // Door 4 - Bottom middle entrance
  const door4 = new Door(360, 210, 'horizontal', [1, 2]);
  doors.push(door4);
  
  // Door 5 - Bottom right entrance (requires all switches)
  const door5 = new Door(500, 210, 'horizontal', [1, 2, 3, 4]);
  doors.push(door5);
  
  // Create lightbulb (in room 3, right side)
  const lightbulb = new Lightbulb(500, 100);
  
  // Create sun chamber (bottom right room)
  const sunChamber = new SunChamber(500, 320);
  
  // Store in gameState
  gameState.entities = [...walls];
  gameState.switches = switches;
  gameState.doors = doors;
  gameState.lightbulb = lightbulb;
  gameState.sunChamber = sunChamber;
  
  return { walls, switches, doors, lightbulb, sunChamber };
}

export function drawWorld(p) {
  // Draw floor with pattern
  p.push();
  p.fill(45, 45, 55);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Floor tiles
  p.stroke(50, 50, 60);
  p.strokeWeight(1);
  for (let x = 0; x < CANVAS_WIDTH; x += 40) {
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
      p.line(x, 0, x, CANVAS_HEIGHT);
      p.line(0, y, CANVAS_WIDTH, y);
    }
  }
  p.pop();
  
  // Draw walls
  gameState.entities.forEach(entity => {
    if (entity instanceof Wall) {
      entity.draw(p);
    }
  });
  
  // Draw doors
  gameState.doors.forEach(door => door.draw(p));
  
  // Draw switches
  gameState.switches.forEach(sw => sw.draw(p));
  
  // Draw lightbulb
  if (gameState.lightbulb) {
    gameState.lightbulb.draw(p);
  }
  
  // Draw sun chamber
  if (gameState.sunChamber) {
    gameState.sunChamber.draw(p);
  }
}