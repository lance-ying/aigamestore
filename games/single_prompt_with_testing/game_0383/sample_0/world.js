// world.js
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, WALL_THICKNESS } from './globals.js';
import { Player, Guard, NPC, IntelligenceItem, Wall, Door, ExitZone } from './entities.js';

export function createWorld() {
  // Clear existing entities
  gameState.entities = [];
  gameState.npcs = [];
  gameState.guards = [];
  gameState.items = [];
  gameState.walls = [];
  gameState.doors = [];
  
  // Create player
  gameState.player = new Player(100, 200);
  gameState.entities.push(gameState.player);
  
  // Create walls (building layout)
  // Outer walls
  gameState.walls.push(new Wall(0, 0, CANVAS_WIDTH, WALL_THICKNESS)); // top
  gameState.walls.push(new Wall(0, CANVAS_HEIGHT - WALL_THICKNESS, CANVAS_WIDTH, WALL_THICKNESS)); // bottom
  gameState.walls.push(new Wall(0, 0, WALL_THICKNESS, CANVAS_HEIGHT)); // left
  gameState.walls.push(new Wall(CANVAS_WIDTH - WALL_THICKNESS, 0, WALL_THICKNESS, CANVAS_HEIGHT)); // right
  
  // Interior walls creating rooms
  gameState.walls.push(new Wall(200, 0, WALL_THICKNESS, 150)); // vertical wall 1
  gameState.walls.push(new Wall(200, 250, WALL_THICKNESS, 150)); // vertical wall 1 bottom
  gameState.walls.push(new Wall(400, 0, WALL_THICKNESS, 180)); // vertical wall 2
  gameState.walls.push(new Wall(400, 220, WALL_THICKNESS, 180)); // vertical wall 2 bottom
  gameState.walls.push(new Wall(0, 150, 200, WALL_THICKNESS)); // horizontal wall 1
  gameState.walls.push(new Wall(0, 250, 200, WALL_THICKNESS)); // horizontal wall 2
  
  // Doors (gaps in walls)
  gameState.doors.push(new Door(200, 150, WALL_THICKNESS, 40));
  gameState.doors.push(new Door(200, 210, WALL_THICKNESS, 40));
  gameState.doors.push(new Door(400, 180, WALL_THICKNESS, 40));
  
  // Create NPCs with absurd dialog
  gameState.npcs.push(new NPC(320, 80, "Agent Martini", "The martinis are becoming sentient. We need to investigate."));
  gameState.npcs.push(new NPC(500, 300, "Dr. Polygon", "I've counted exactly 360,000 polygons in this building."));
  gameState.npcs.push(new NPC(80, 80, "Secretary", "Corporate espionage is up 400% this quarter. Good for business!"));
  
  for (const npc of gameState.npcs) {
    gameState.entities.push(npc);
  }
  
  // Create intelligence items in various rooms
  gameState.items.push(new IntelligenceItem(150, 50, "document"));
  gameState.items.push(new IntelligenceItem(300, 200, "document"));
  gameState.items.push(new IntelligenceItem(480, 100, "document"));
  gameState.items.push(new IntelligenceItem(500, 350, "document"));
  gameState.items.push(new IntelligenceItem(80, 320, "document"));
  gameState.items.push(new IntelligenceItem(250, 350, "document"));
  gameState.items.push(new IntelligenceItem(350, 50, "document"));
  
  for (const item of gameState.items) {
    gameState.entities.push(item);
  }
  
  // Create guards with patrol routes
  gameState.guards.push(new Guard(300, 300, [
    { x: 300, y: 300 },
    { x: 300, y: 100 },
    { x: 180, y: 100 },
    { x: 180, y: 300 }
  ]));
  
  gameState.guards.push(new Guard(450, 100, [
    { x: 450, y: 100 },
    { x: 550, y: 100 },
    { x: 550, y: 350 },
    { x: 450, y: 350 }
  ]));
  
  for (const guard of gameState.guards) {
    gameState.entities.push(guard);
  }
  
  // Create exit zone
  gameState.exitZone = new ExitZone(540, 20, 40, 40);
}