// world.js - World generation and management

import { gameState, WORLD_WIDTH, WORLD_HEIGHT } from './globals.js';
import { NPC, Tablet, Building } from './entities.js';

export function generateWorld() {
  // Clear existing entities
  gameState.npcs = [];
  gameState.tablets = [];
  gameState.buildings = [];
  
  // Create city walls
  new Building(50, 50, 30, WORLD_HEIGHT - 100, 'wall'); // Left wall
  new Building(WORLD_WIDTH - 80, 50, 30, WORLD_HEIGHT - 100, 'wall'); // Right wall
  new Building(50, 50, WORLD_WIDTH - 100, 30, 'wall'); // Top wall
  new Building(50, WORLD_HEIGHT - 80, WORLD_WIDTH - 100, 30, 'wall'); // Bottom wall
  
  // Create main temple (center)
  new Building(WORLD_WIDTH / 2 - 100, WORLD_HEIGHT / 2 - 80, 200, 160, 'temple');
  
  // Create houses scattered around
  const housePositions = [
    [150, 150], [350, 180], [150, 400], [350, 450],
    [800, 150], [950, 200], [850, 450], [1000, 400]
  ];
  
  housePositions.forEach(pos => {
    new Building(pos[0], pos[1], 80, 70, 'house');
  });
  
  // Create forum areas
  new Building(200, 600, 150, 100, 'forum');
  new Building(800, 600, 150, 100, 'forum');
  
  // Create NPCs with dialogue and knowledge
  const npcData = [
    { x: 200, y: 250, name: "Marcus", dialogue: "The curse was cast long ago... When one sins, all perish. Only the tablets hold the truth.", knowledge: "curse_origin" },
    { x: 400, y: 300, name: "Julia", dialogue: "I saw strange symbols in the temple. They glow at night. Perhaps they're connected to the tablets?", knowledge: "temple_symbols" },
    { x: 600, y: 200, name: "Lucius", dialogue: "Time itself is broken here. We're trapped in an endless loop. Only breaking the curse can free us.", knowledge: "time_loop" },
    { x: 850, y: 250, name: "Claudia", dialogue: "The magistrate knows more than he admits. But he won't talk unless you have proof from the tablets.", knowledge: "magistrate_secret" },
    { x: 300, y: 500, name: "Gaius", dialogue: "I've seen the tablets scattered across the city. Eight in total. Collect them all to unlock the truth.", knowledge: "tablet_count" },
    { x: 700, y: 550, name: "Drusilla", dialogue: "The curse triggers when someone breaks the Golden Rule. We must be careful with our actions.", knowledge: "golden_rule" },
    { x: 950, y: 450, name: "Titus", dialogue: "Ancient Rome wasn't always like this. The city flourished before the curse. We need to remember who we were.", knowledge: "city_history" },
    { x: 500, y: 650, name: "Flavia", dialogue: "Press Z to reset the time loop once you've learned enough. Use it wisely to change fate.", knowledge: "time_reset" }
  ];
  
  npcData.forEach(data => {
    new NPC(data.x, data.y, data.name, data.dialogue, data.knowledge);
  });
  
  // Place tablets in strategic locations
  const tabletPositions = [
    [180, 120],  // Near Marcus
    [WORLD_WIDTH / 2, WORLD_HEIGHT / 2 - 120], // Temple entrance
    [920, 180],  // Near eastern houses
    [180, 520],  // Southern forum
    [880, 650],  // Eastern forum
    [550, 150],  // Northern area
    [WORLD_WIDTH - 150, WORLD_HEIGHT - 150], // Far corner
    [150, WORLD_HEIGHT - 150]  // Southwest corner
  ];
  
  tabletPositions.forEach((pos, idx) => {
    new Tablet(pos[0], pos[1], idx);
  });
}

export function resetWorld() {
  gameState.entities = [];
  gameState.npcs = [];
  gameState.tablets = [];
  gameState.buildings = [];
  gameState.particles = [];
  gameState.tabletsCollected = 0;
  gameState.score = 0;
  gameState.cluesFound = [];
  gameState.npcKnowledge = {};
  gameState.activeDialogue = null;
  gameState.loopCount = 0;
  gameState.curseTriggered = false;
  
  generateWorld();
}